// Lo que pasa en el mundo, visto desde tu pantalla: tormentas, la Luz Mala, estrellas que caen, el ovni, malones y la carreta del mercachifle.
// El mundo (el anfitrión) decide cuándo y dónde; acá se dibuja y se ve si tu jugador lo toca.
import {TAU, clamp, lerp, rnd, FX} from '../lib/gfx.js';
import {audio} from '../lib/audio.js';
import {AMULETOS, OBJETOS} from '../shared/reglas.js';
import {PUEBLOS, dentro, agua, regionEn, barranco} from '../shared/mapa.js';
import {mul} from '../shared/azar.js';

const now = () => performance.now() / 1000;
const NOMBRE = {luz: 'La Luz Mala', tesoro: 'El entierro', estrella: 'Estrellas', ovni: 'Luces raras', carreta: 'La carreta', malon: 'Malón', tormenta: 'Tormenta', tornado: 'Tornado'};
const SON = {luz: 'wail', estrellas: 'gem', ovni: 'ufo', tormenta: 'thunder', malon: 'warn', carreta: 'whistle', ola: 'warn', tesoro: 'gem', fin: 'lose'};

export class Eventos {
  constructor(j) { this.j = j; this.e = new Map(); this.abd = null; this.torCd = 0; }
  limpiar() { this.e.clear(); this.abd = null; }
  // lo que viene en cada foto del mundo: [id, tipo, x, z, a, b]
  snap(arr) {
    const vis = new Set();
    for (const [id, k, x, z, a, b] of arr) { vis.add(id); let e = this.e.get(id); if (!e) { e = {id, k, x, z, dx: x, dz: z, a, b, t0: now()}; this.e.set(id, e); } if (e.k !== k) { e.k = k; e.t0 = now(); } e.x = x; e.z = z; e.a = a; e.b = b; }
    for (const [id, e] of this.e) if (!vis.has(id)) { if (e.k === 'estrella' && e.pedida) this.j.parts.burst(e.dx, .8, e.dz, 24, [1, .95, .6], {sp: 6, size: .4, type: 3, life: .8}); this.e.delete(id); }
  }
  mensaje(m) {
    const J = this.j, ui = J.ui, p = J.p;
    if (m.t === 'ev') {
      if (['ola', 'tesoro', 'fin'].includes(m.k)) ui.toast(`${m.n}. ${m.d}`, m.k === 'tesoro' ? 'gema' : m.k === 'fin' ? null : 'mano', 3.5);
      else { ui.cartel(m.n, m.d); ui.toast(m.d, {luz: 'vela', estrellas: 'gema3', ovni: 'gema2', tormenta: 'rayo', malon: 'mano', carreta: 'plata'}[m.k] || null, 5); }
      audio.play(SON[m.k] || 'warn'); if (m.k === 'malon') J.cam.sh = .3;
      return;
    }
    if (m.t === 'regalo') {
      const y = J.yo; if (m.oro) { p.oro += m.oro; J.num(y.x, y.z, '+' + m.oro + ' $', '#f2c14a', 1.1, 2.8); }
      for (const [k, n] of m.it || []) if (OBJETOS[k]) p.inv[k] = (p.inv[k] || 0) + n;
      if (m.am && AMULETOS[m.am]) { p.amuletos[m.am] = (p.amuletos[m.am] || 0) + 1; setTimeout(() => ui.toast(`Y además: ${AMULETOS[m.am].n}`, AMULETOS[m.am].ic, 4), 700); }
      if (m.deseo) { const t = J.t; if (m.deseo === 'vel') y.buff.velK = t + 90; if (m.deseo === 'dmg') y.buff.cana = Math.max(y.buff.cana || 0, t + 90); if (m.deseo === 'suerte') y.buff.apacheta = Math.max(y.buff.apacheta || 0, t + 180); if (m.deseo === 'cura') { J.curar(1); y.buff.difunta = t + 90; } }
      if (m.txt) { if (m.cartel) { const i = m.txt.search(/[.!…](\s|$)/); ui.cartel(i > 0 ? m.txt.slice(0, i + 1) : m.txt, i > 0 ? m.txt.slice(i + 1).trim() : ''); } ui.toast(m.txt, m.ic || null, 5); }
      if (m.son) audio.play(m.son);
      if (m.ev) ui.misiones.alEvento(m.ev);
      if (m.xp) J.xp(m.xp); ui.guardar();
    }
  }
  malonEn() { for (const e of this.e.values()) if (e.k === 'malon') { const pu = PUEBLOS.find(p => Math.abs(p.x - e.x) < 2 && Math.abs(p.z - e.z) < 2); if (pu) return pu.id; } return null; }
  // ---------- cada cuadro ----------
  update(dt) {
    const J = this.j, y = J.yo, t = now(); let lluvia = 0;
    for (const e of this.e.values()) {
      e.dx = lerp(e.dx, e.x, Math.min(1, dt * 6)); e.dz = lerp(e.dz, e.z, Math.min(1, dt * 6));
      const d = Math.hypot(e.dx - y.x, e.dz - y.z);
      if (e.k === 'tormenta' && d < e.a) lluvia = Math.max(lluvia, clamp((e.a - d) / 15, 0, 1) * clamp(e.b / 4, 0, 1));
      if (!y.vivo || this.abd) continue;
      if (e.k === 'tornado' && d < 3.4 && J.t > this.torCd && !y.dash) { // te levanta y te tira lejos
        this.torCd = J.t + 2.5; const a = Math.random() * TAU; if (y.montado) J.vida.silbar();
        y.dash = {dx: Math.sin(a), dz: Math.cos(a), dist: 12, dur: .8, t: 0, vuela: 1}; J.dano(Math.round(J.stats().vida * .07)); J.cam.sh = .6; audio.play('wave');
        J.ui.toast('¡Te levantó el tornado!', 'rayo', 2); J.parts.burst(y.x, 1, y.z, 30, [.75, .7, .6], {type: 2, sp: 6, size: 1, life: .8, grow: 1});
      }
      if (e.k === 'estrella' && e.a <= 0 && d < 1.9 && !e.pedida) { e.pedida = 1; J.enviar(true); J.red.manda({t: 'agarra', e: e.id}); }
      if (e.k === 'ovni' && e.a < .5 && d < 2.8 && !e.pedida) { e.pedida = 1; J.enviar(true); J.red.manda({t: 'abduce', e: e.id}); this.abd = {t: 0, e, x: y.x, z: y.z}; if (y.montado) J.vida.silbar(); audio.play('ufo'); J.ui.toast('¡Una luz te está levantando!', 'gema2', 3); }
    }
    J.mundo.lluvia = lerp(J.mundo.lluvia || 0, lluvia, Math.min(1, dt * .8));
    // te llevaron: subís despacito y aparecés en otro lado
    if (this.abd) {
      const A = this.abd; A.t += dt; y.x = lerp(y.x, A.e.dx, Math.min(1, dt * 3)); y.z = lerp(y.z, A.e.dz, Math.min(1, dt * 3)); y.inv = J.t + 1; y.mv = 0;
      if (A.t > 3.2) {
        let x = y.x, z = y.z; for (let i = 0; i < 40; i++) { const a = Math.random() * TAU, r = rnd(80, 170); x = A.x + Math.sin(a) * r; z = A.z + Math.cos(a) * r; if (dentro(x, z, 12) && agua(x, z) < .05 && regionEn(x, z) !== 'salamanca' && !barranco(x, z, 3)) break; x = A.x; z = A.z; }
        y.x = x; y.z = z; J.cam.x = x; J.cam.z = z; this.abd = null; J.parts.burst(x, 2, z, 40, [.6, 1, .7], {sp: 6, size: .5, type: 3, life: 1}); J.mundo.decorar(x, z, true); J.enviar(true); J.region = null;
      }
    }
  }
  // F: cavar o comprar
  candidatos(cand) {
    const y = this.j.yo;
    for (const e of this.e.values()) { const d = Math.hypot(e.dx - y.x, e.dz - y.z); if (e.k === 'tesoro') cand('tesoro', e, d - 1); if (e.k === 'carreta') cand('carreta', e, d - 2.2); }
  }
  usar(c) {
    const J = this.j;
    if (c.tipo === 'tesoro') { if (c.ref.cavado) return; c.ref.cavado = 1; J.enviar(true); J.red.manda({t: 'cava', e: c.ref.id}); audio.play('pick'); J.parts.burst(c.ref.dx, .3, c.ref.dz, 30, [.55, .4, .25], {type: 2, sp: 5, size: .8, life: .7, grow: 1}); J.yo.atk = 1; }
    if (c.tipo === 'carreta') J.ui.tienda('carreta', this.stock(c.ref.id));
  }
  // lo que trae la carreta (siempre lo mismo para la misma carreta)
  stock(id) {
    const q = mul(id * 7919 + 13), ks = Object.keys(AMULETOS), am = [];
    while (am.length < 3) { const k = ks[Math.floor(q() * ks.length)]; if (!am.includes(k)) am.push(k); }
    return {am: am.map(k => ({k, precio: 160 + Math.floor(q() * 8) * 15})), it: [{k: 'asado', precio: 30}, {k: 'cana', precio: 40}, {k: 'retazo', precio: 25}]};
  }
  // ---------- qué mostrar arriba y a dónde apunta la flecha azul ----------
  objetivo() {
    const y = this.j.yo; let best = null, bd = 160;
    for (const e of this.e.values()) { if (!['luz', 'tesoro', 'ovni', 'carreta', 'malon', 'estrella'].includes(e.k)) continue; const d = Math.hypot(e.dx - y.x, e.dz - y.z); if (e.k === 'malon' && d < 30) continue; if (d < bd) { bd = d; best = {x: e.dx, z: e.dz, n: NOMBRE[e.k], d}; } }
    return best;
  }
  banner() {
    const y = this.j.yo;
    for (const e of this.e.values()) { const d = Math.hypot(e.dx - y.x, e.dz - y.z); if (e.k === 'malon' && d < 110) { const pu = PUEBLOS.find(p => Math.abs(p.x - e.x) < 2 && Math.abs(p.z - e.z) < 2); return e.a > 0 ? `Malón en ${pu?.n || 'el pueblo'} · oleada ${e.a} de ${e.b}` : `Se viene un malón a ${pu?.n || 'el pueblo'}…`; } }
    for (const e of this.e.values()) { const d = Math.hypot(e.dx - y.x, e.dz - y.z); if (e.k === 'tormenta' && d < e.a) return 'Tormenta: cuidado con los rayos'; if (e.k === 'luz' && d < 60) return 'Seguí a la Luz Mala hasta que se hunda'; if (e.k === 'tesoro' && d < 40) return 'La luz se hundió: cavá el entierro'; }
    return '';
  }
  // ---------- dibujar ----------
  dibujar(dt) {
    const J = this.j, y = J.yo, T = now(), P = J.parts;
    for (const e of this.e.values()) {
      if (Math.abs(e.dx - y.x) > 120 || Math.abs(e.dz - y.z) > 120) continue; const x = e.dx, z = e.dz;
      switch (e.k) {
        case 'luz': { const h = 1.5 + Math.sin(T * 2.3) * .35; for (let i = 0; i < 2; i++) P.emit(x + rnd(-.15, .15), h + rnd(-.1, .1), z + rnd(-.15, .15), rnd(-.3, .3), rnd(.1, .6), rnd(-.3, .3), .55, 1, .6, rnd(.5, .9), .35, 1, 0, 1); J.fx.draw(FX.GLOW, x, .06, z, 0, 3.2, 3.2, [.45, 1, .55], .5, .5); J.mundo.lightAt(x, z, [.4, 1, .5], 3); break; }
        case 'tesoro': J.fx.draw(FX.RUNE, x, .07, z, T * 2, 1.6, 1.6, [1, .85, .3], .8, .5); J.fx.draw(FX.GLOW, x, .06, z, 0, 2.6, 2.6, [1, .8, .3], .5, .5); if (Math.random() < dt * 8) P.emit(x + rnd(-.8, .8), .2, z + rnd(-.8, .8), 0, rnd(1.5, 3), 0, 1, .85, .4, .3, .9, 3, 0, 1); break;
        case 'estrella': {
          if (e.a > 0) { const k = e.a / 1.6, h = .6 + k * 38, ox = k * 14; P.emit(x + ox, h, z - ox * .4, 0, 0, 0, 1, .95, .7, 1.2, .5, 1, 0, 1); P.emit(x + ox + rnd(-.3, .3), h + 1, z - ox * .4, 0, 0, 0, 1, .7, .3, .6, .7, 0, 0, 1); if (e.a < .06 && !e.cayo) { e.cayo = 1; P.burst(x, .5, z, 20, [1, .9, .5], {sp: 6, size: .4, type: 3, life: .7}); audio.play('crit'); } }
          else { J.bt('o_gema3', 48).push(x, .7 + Math.sin(T * 3 + e.id) * .15, z, T * 2, 1.1, 0, 0, 0, .9, 1, .9, .4); J.fx.draw(FX.GLOW, x, .06, z, 0, 1.8, 1.8, [1, .9, .4], .6, .5); }
          break;
        }
        case 'ovni': { const sube = e.a > .5 ? (T - e.t0) * 14 : 0, h = 11 + Math.sin(T * 1.3) * .6 + sube; J.bt('m_ovni', 4).push(x, h, z, T * .8, 1.6, 0, 0, 0, .3, .4, 1, .6); if (!sube) { J.fx.draw(FX.GLOW, x, .06, z, 0, 3, 3, [.5, 1, .7], .7, .5); J.fx.draw(FX.RING, x, .07, z, 0, 2.8, 2.8, [.6, 1, .8], .5, (T * .8) % 1); for (let i = 0; i < 2; i++) P.emit(x + rnd(-1.6, 1.6), rnd(0, 9), z + rnd(-1.6, 1.6), 0, 2.5, 0, .6, 1, .75, .5, .6, 0, 0, 0); J.mundo.lightAt(x, z, [.5, 1, .7], 4); } break; }
        case 'tornado': { J.bt('m_tornado', 4).push(x, 0, z, T * 7, 1.5, T * 3, 1, 0, .15); for (let i = 0; i < 3; i++) { const a = rnd(TAU), r = rnd(.5, 2.5); P.emit(x + Math.sin(a) * r, rnd(0, 5), z + Math.cos(a) * r, Math.cos(a) * 4, rnd(1, 4), -Math.sin(a) * 4, .7, .65, .55, rnd(.4, .9), .7, 2, 0, 1); } J.fx.draw(FX.SHADOW, x, .05, z, 0, 3, 3, [0, 0, 0], .5); break; }
        case 'carreta': { const a = e.a, hx = x + Math.sin(a) * 3.2, hz = z + Math.cos(a) * 3.2, anda = Math.hypot(e.x - e.dx, e.z - e.dz) > .02 ? 1 : 0; J.bt('m_carreta', 4).push(x, 0, z, a, 1, 0, 0); J.bt('m_caballo', 40).push(hx, 0, hz, a, 1, T * 3.2 * anda, anda); J.bt('m_mercachifle', 4).push(x - Math.sin(a) * .2, .55, z - Math.cos(a) * .2, a, 1, T, 0, 0); J.fx.draw(FX.SHADOW, x, .05, z, 0, 2.2, 2.2, [0, 0, 0], .4); if (Math.hypot(x - y.x, z - y.z) < 12) J.fx.draw(FX.GLOW, x, .06, z, 0, 3.4, 3.4, [1, .85, .4], .25, .5); break; }
      }
    }
    // la luz que te lleva
    if (this.abd) { const A = this.abd; J.fx.draw(FX.GLOW, A.e.dx, .06, A.e.dz, 0, 3, 3, [.6, 1, .8], .9, .5); }
  }
  // altura a la que dibujar a tu jugador (cuando te levanta el ovni)
  altura() { return this.abd ? Math.min(10, this.abd.t * this.abd.t * 1.2) : 0; }
}
