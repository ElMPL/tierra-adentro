// Pescar en ríos y lagunas: tirás la línea, esperás que pique y la peleás manteniendo la caña encima del pez.
import {TAU, rnd, FX} from '../lib/gfx.js';
import {audio} from '../lib/audio.js';
import {AMULETOS, xpSig} from '../shared/reglas.js';
import {agua, regionEn} from '../shared/mapa.js';

// [nombre, qué tan seguido sale, qué tan bravo es]
export const PECES = {
  pampa: [['Pejerrey', 1, 1], ['Bagre', 1, 1.2], ['Tararira', .3, 1.8]],
  ibera: [['Boga', 1, 1.1], ['Pacú', .7, 1.4], ['Dorado', .25, 2.2], ['Surubí', .2, 2]],
  monte: [['Bagre', 1, 1.2], ['Sábalo', 1, 1.1], ['Surubí', .25, 2]],
  ingenio: [['Sábalo', 1, 1.1], ['Mojarra', 1, .9], ['Bagre', .8, 1.2]],
  selva: [['Pacú', 1, 1.4], ['Dorado', .4, 2.2], ['Surubí', .3, 2]],
  cuyo: [['Trucha arcoíris', 1, 1.5], ['Perca', 1, 1.1]],
  puna: [['Trucha arcoíris', 1, 1.5], ['Suche', .3, 1.9]],
  sur: [['Trucha marrón', 1, 1.6], ['Perca', .8, 1.1], ['Salmón', .25, 2.3]],
};
export const TODOS_PECES = [...new Set(Object.values(PECES).flat().map(p => p[0]))];

export class Pesca {
  constructor(j) { this.j = j; this.e = null; this.punto = null; this.busT = 0; this.ant = false; }
  get p() { return this.j.p; }
  candidatos(cand) {
    const y = this.j.yo; this.busT -= 1 / 60;
    if (this.busT <= 0) { this.busT = .3; this.punto = null; if (!y.montado && agua(y.x, y.z) < .15) for (const r of [2, 3.2, 4.6]) { for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, x = y.x + Math.sin(a) * r, z = y.z + Math.cos(a) * r; if (agua(x, z) > .35) { this.punto = {x, z}; break; } } if (this.punto) break; } }
    if (this.punto && !this.e) cand('pesca', this.punto, 1.3);
  }
  empezar(pt) {
    const y = this.j.yo; if (this.e || y.montado) return;
    this.e = {fase: 'espera', t: rnd(2, 5), x: pt.x, z: pt.z, x0: y.x, z0: y.z}; y.ry = Math.atan2(pt.x - y.x, pt.z - y.z); y.atk = 1; audio.play('throw');
    this.j.parts.burst(pt.x, .2, pt.z, 8, [.7, .85, 1], {sp: 2, size: .25, life: .5}); this.j.ui.pesca('Esperá que pique…');
  }
  cortar(txt) { this.e = null; this.j.ui.pesca(null); if (txt) this.j.ui.toast(txt, null, 2); }
  update(dt, c) {
    const E = this.e; if (!E) return; const y = this.j.yo, s = this.j.stats(), pulsa = (c.atk || c.usar) && !this.ant; this.ant = !!(c.atk || c.usar);
    if (!y.vivo || Math.hypot(c.mx, c.mz) > .5 || c.esq || Math.hypot(y.x - E.x0, y.z - E.z0) > 1) return this.cortar('Recogiste la línea.');
    E.t -= dt;
    if (E.fase === 'espera') { if (Math.random() < dt * 1.5) this.j.parts.emit(E.x + rnd(-.3, .3), .1, E.z + rnd(-.3, .3), 0, .4, 0, .7, .85, 1, .3, .4, 6, 0, 0, 0, 2); if (E.t <= 0) { E.fase = 'pica'; E.t = .95 + s.pesca * .3; audio.play('reel'); this.j.ui.pesca('¡Pica! Tirá ahora (clic, F o el botón de ataque)'); this.j.parts.burst(E.x, .2, E.z, 14, [.7, .85, 1], {sp: 3, size: .3, life: .5}); } return; }
    if (E.fase === 'pica') {
      if (pulsa) { const pez = this.elegir(); Object.assign(E, {fase: 'tira', pez, zona: .5, v: 0, pos: .5, meta: .5, cambia: 0, prog: .3}); audio.play('reelstop'); return; }
      if (E.t <= 0) this.cortar('Se escapó… Probá de nuevo.'); return;
    }
    // la pelea: mantené apretado para subir la caña, soltá para bajarla
    const P = E.pez, dif = P.dif, half = .17 * (1 + s.pesca) / (.75 + dif * .25);
    E.cambia -= dt; if (E.cambia <= 0) { E.cambia = rnd(.35, 1.1) / dif; E.meta = Math.random(); }
    E.pos += Math.sign(E.meta - E.pos) * Math.min(Math.abs(E.meta - E.pos), .38 * dif * dt);
    E.v += (c.atk ? 2.2 : -1.9) * dt; E.v *= Math.max(0, 1 - dt * 3); E.zona += E.v * dt; if (E.zona < half) { E.zona = half; E.v = Math.max(0, E.v) * .3; } if (E.zona > 1 - half) { E.zona = 1 - half; E.v = Math.min(0, E.v) * .3; }
    const en = Math.abs(E.pos - E.zona) < half; E.prog += en ? .32 * dt : -.15 * dt * Math.sqrt(dif); if (en && Math.random() < dt * 6) audio.play('reel');
    this.j.ui.pesca(P.raro ? '¡Es algo raro! Mantené la caña encima' : 'Mantené apretado para llevar la caña a la derecha y soltá para que vuelva', {zona: E.zona, half, pos: E.pos, prog: E.prog});
    if (E.prog >= 1) return this.sacar(P);
    if (E.prog <= 0) this.cortar('Se cortó la línea. ¡Era grande!');
  }
  elegir() {
    const s = this.j.stats(), r = Math.random();
    if (r < .025 + s.pesca * .02) return {n: 'cofre', dif: 1.6, raro: 1};
    if (r < .07) return {n: 'bota', dif: .7};
    const L = PECES[regionEn(this.e.x, this.e.z)] || PECES.pampa, tot = L.reduce((a, p) => a + p[1] * (p[2] > 1.7 ? 1 + s.pesca * 2 : 1), 0); let q = Math.random() * tot;
    for (const [n, w, dif] of L) { q -= w * (dif > 1.7 ? 1 + s.pesca * 2 : 1); if (q <= 0) return {n, dif, raro: dif > 1.7}; }
    return {n: L[0][0], dif: L[0][2]};
  }
  sacar(P) {
    const J = this.j, p = this.p, ui = J.ui, y = J.yo, lv = p.lv; this.cortar(); y.atk = 1; J.parts.burst(this.e?.x ?? y.x, .5, this.e?.z ?? y.z, 16, [.7, .85, 1], {sp: 4, size: .3, life: .6});
    if (P.n === 'bota') { ui.toast('Sacaste una bota vieja. Por lo menos no es un yacaré.', 'bota', 3); audio.play('back'); p.fama = (p.fama || 0) + 1; return; }
    if (P.n === 'cofre') { const v = 60 + lv * 25; p.oro += v; J.num(y.x, y.z, '+' + v + ' $', '#f2c14a', 1.1, 2.6); audio.play('jackpot'); ui.cartel('¡Un cofre en el fondo del río!', `${v} patacones`); if (Math.random() < .45) { const ks = Object.keys(AMULETOS), a = ks[Math.random() * ks.length | 0]; p.amuletos[a] = (p.amuletos[a] || 0) + 1; ui.toast(`Y adentro: ${AMULETOS[a].n}`, AMULETOS[a].ic, 4); } J.fama(8); ui.guardar(); return; }
    const pe = (p.pesca ||= {}), nuevo = !pe[P.n]; pe[P.n] = (pe[P.n] || 0) + 1;
    const oro = Math.round(6 * P.dif * P.dif * (1 + lv * .12)); p.oro += oro; p.inv.pescado = (p.inv.pescado || 0) + 1;
    J.num(y.x, y.z, `+${oro} $ · ${P.n}`, '#9cd6ff', 1, 2.6); audio.play(P.raro ? 'gem' : 'coin');
    ui.toast(nuevo ? `¡Un pez nuevo: ${P.n}! Lo anotás en tu libreta de pesca.` : `Sacaste: ${P.n}. Te lo guardás para asar.`, 'asado', 3);
    if (nuevo) J.fama(P.raro ? 6 : 2); if (P.raro) J.xp(Math.round(xpSig(lv) * .06)); else J.xp(Math.round(xpSig(lv) * .02));
    const todos = Object.keys(pe).length; if (!p.pescaHito && todos >= 12) { p.pescaHito = 1; ui.cartel('¡Pescador de ley!', 'Sacaste doce peces distintos: ganaste una maña'); audio.play('win'); }
    ui.guardar();
  }
  dibujar() { const E = this.e; if (!E) return; const J = this.j, h = E.fase === 'pica' ? -.08 : E.fase === 'tira' ? (Math.sin(J.t * 20) * .05) : Math.sin(J.t * 3) * .03; J.fx.draw(FX.GLOW, E.x, .06, E.z, 0, .6, .6, E.fase === 'espera' ? [1, .3, .2] : [1, .9, .4], .8, .5); J.bt('o_piedrita', 8).push(E.x, .08 + h, E.z, 0, .6, 0, 0, 0, .6, 1, .2, .1); }
}
