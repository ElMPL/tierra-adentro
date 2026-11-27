// La vida del campo, en tu pantalla: animales sueltos, baguales para domar, tu caballo, la gente que anda por el pueblo y sus perros.
// Nada de esto pasa por la red: cada pantalla tiene sus propios animales (solo se comparte si vas a caballo).
import {TAU, clamp, lerp, rnd, FX} from '../lib/gfx.js';
import {audio} from '../lib/audio.js';
import {CHARS} from '../shared/reglas.js';
import {chocar, agua, dentro, enPueblo, regionEn, PUEBLOS, FIJOS, CAMPOS, SALA} from '../shared/mapa.js';
import {esNoche} from '../shared/sim.js';

const FAUNA = {pampa: [['vaca', 3], ['caballo', 2.4], ['oveja', 2]], ibera: [['vaca', 2], ['caballo', 1]], monte: [['vaca', 1], ['perro', 1]], ingenio: [['caballo', 1.4], ['vaca', 1]],
  selva: [['perro', .4]], cuyo: [['caballo', 2], ['vicuna', 2], ['oveja', 1]], puna: [['vicuna', 4], ['oveja', 1.2]], sur: [['oveja', 4], ['vicuna', 2], ['caballo', 1.4]], salamanca: []};
const MOD = {vaca: 'm_vaca', caballo: 'm_caballo', oveja: 'm_oveja', vicuna: 'm_vicuna', perro: 'o_perro'};
const VEL = {vaca: 5, caballo: 10, oveja: 5.5, vicuna: 9, perro: 7.5};
const MIEDO = {vaca: 4.5, caballo: 6.5, oveja: 5.5, vicuna: 9, perro: 0};
const NOMBRES = ['Malacara', 'Tostado', 'Overo', 'Zaino', 'Moro', 'Picazo', 'Tobiano', 'Gateado', 'Lobuno', 'Bayo', 'Alazán', 'Rosillo'];
const GENTE = ['gaucho', 'paisana', 'payador', 'curandera', 'boleador', 'malambista', 'asador', 'carpincho', 'domadora', 'chamamecero', 'zafrera', 'pujllay', 'machi'];
export const RUMORES = [
  'De noche, si ve una luz que se mueve sola, sígala: la Luz Mala marca dónde hay plata enterrada.',
  'Por el campo andan baguales. Si se anima a domar uno, después lo llama con un silbido.',
  'Cuando se nubla no se quede quieto: los rayos le pegan a cualquiera… también a los bichos.',
  'En las noches claras bajan luces del cielo y se llevan a la gente a pasear. Yo no le creo, pero mi compadre volvió con un amuleto.',
  'Las tinajas viejas guardan cosas. A veces sale un duende que le roba la plata: si lo alcanza, se la devuelve doble.',
  'Cuando caen estrellas, agárrelas y pida un deseo.',
  'Si ve la carreta del mercachifle por el camino, párela: trae amuletos que no se consiguen en ningún lado.',
  'Cada tanto las leyendas atacan los pueblos. Si nos defiende, el pueblo le va a estar agradecido.',
  'El Gauchito Gil cuida al que le prende una vela en los santuarios del camino.',
  'Entre las cortaderas y las cañas a veces hay patacones perdidos. Pase el facón, nomás.',
  'Los tornados levantan todo lo que tocan. Dicen que un gaucho voló hasta el otro lado del río.',
  'El agua del aljibe está fresquita. Tome, que le hace bien.',
  'Los campeones dorados dejan siempre algo bueno. Y pegan fuerte, eh.',
  'A caballo se cruza el país en un rato. Y si salta con el caballo, pasa por arriba de los troncos.',
  'Mi abuelo decía que el que mira el mundo con sus propios ojos ve cosas que los demás no ven.',
  'De noche los bichos son más bravos y ven más lejos. Pero de noche también salen las cosas lindas.',
];
const libre = (x, z) => dentro(x, z, 6) && agua(x, z) < .05 && !enPueblo(x, z, 6) && regionEn(x, z) !== 'salamanca' && !CAMPOS.some(c => Math.abs(c.x - x) < 14 && Math.abs(c.z - z) < 14);
const ang = (a, b) => { let d = a - b; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };

export class Vida {
  constructor(j) { this.j = j; this.anim = []; this.spawnT = 0; this.doma = null; this.mio = null; this.gente = []; this.perros = []; this.rumor = 0; this.mooT = 0; }
  get y() { return this.j.yo; }
  get p() { return this.j.p; }
  empezar() {
    this.anim = []; this.doma = null; this.mio = null; this.rumor = Math.random() * RUMORES.length | 0;
    // en cada pueblo: tres vecinos que pasean y un perro
    this.gente = []; this.perros = [];
    for (const pu of PUEBLOS) {
      const casas = FIJOS.filter(o => (o.t === 'rancho' || o.t === 'galpon') && Math.hypot(o.x - pu.x, o.z - pu.z) < 30);
      const pts = [...casas.map(o => [pu.x + (o.x - pu.x) * .78, pu.z + (o.z - pu.z) * .78]), ...[0, 1, 2, 3, 4].map(i => [pu.x + Math.sin(i * 1.3 + 2) * 9, pu.z + Math.cos(i * 1.3 + 2) * 9])];
      const lista = GENTE.filter(c => c !== this.p.ch);
      for (let i = 0; i < 3; i++) { const q = pts[(i * 3) % pts.length]; this.gente.push({pu, pts, casas, ch: lista[(pu.x * 7 + pu.z * 3 + i * 5 & 0xffff) % lista.length], x: q[0], z: q[1], ry: 0, ph: 0, mv: 0, t: rnd(1, 5), tx: q[0], tz: q[1], i, dentro: false}); }
      this.perros.push({pu, x: pu.x + 6, z: pu.z + 3, ry: 0, ph: 0, mv: 0, t: 2, tx: pu.x + 6, tz: pu.z + 3, sigue: 0, ladra: 0});
    }
    if (this.p.caballo && this.p.montado) this.y.montado = true;
  }
  // ---------- animales sueltos ----------
  poblar() {
    const y = this.y, rg = regionEn(y.x, y.z), F = FAUNA[rg]; if (!F || !F.length) return;
    if (this.anim.filter(a => Math.abs(a.x - y.x) < 90 && Math.abs(a.z - y.z) < 90).length >= 14) return;
    const tot = F.reduce((s, f) => s + f[1], 0); let r = Math.random() * tot, k = F[0][0]; for (const [t, w] of F) { r -= w; if (r <= 0) { k = t; break; } }
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * TAU, d = 48 + Math.random() * 28, x = y.x + Math.sin(a) * d, z = y.z + Math.cos(a) * d; if (!libre(x, z)) continue;
      const n = k === 'perro' ? 1 + (Math.random() < .5) : k === 'caballo' ? 2 + (Math.random() * 3 | 0) : 2 + (Math.random() * 3 | 0);
      for (let m = 0; m < n; m++) { const ax = x + rnd(-4, 4), az = z + rnd(-4, 4); if (!libre(ax, az)) continue; this.anim.push({k, x: ax, z: az, hx: x, hz: z, ry: rnd(TAU), ph: rnd(9), mv: 0, st: 'pasta', t: rnd(1, 6), s: k === 'oveja' ? rnd(.9, 1.1) : rnd(.92, 1.06), bagual: k === 'caballo', miedo: 0}); }
      return;
    }
  }
  animales(dt) {
    const y = this.y, J = this.j, rapido = y.mv > .5 && (y.montado || y.dash);
    for (let i = this.anim.length - 1; i >= 0; i--) {
      const a = this.anim[i], dx = a.x - y.x, dz = a.z - y.z, d = Math.hypot(dx, dz);
      if (d > 115) { this.anim.splice(i, 1); continue; }
      if (this.doma?.a === a) continue;
      // se asustan si llegás corriendo, si peleás cerca o si hay bichos
      let susto = MIEDO[a.k] && (d < MIEDO[a.k] * (rapido ? 1.6 : 1) || (y.atk > .5 && d < 9)); let ox = y.x, oz = y.z;
      if (!susto && MIEDO[a.k]) for (const b of J.bichos.values()) if (!b.muere && Math.abs(b.x - a.x) < 7 && Math.abs(b.z - a.z) < 7) { susto = true; ox = b.x; oz = b.z; break; }
      if (susto && a.st !== 'huye') { a.st = 'huye'; a.t = rnd(2.2, 3.4); const l = Math.hypot(a.x - ox, a.z - oz) || 1; a.fx = (a.x - ox) / l; a.fz = (a.z - oz) / l; if (a.k === 'vaca' && J.t > this.mooT) { this.mooT = J.t + 4; audio.play('moo'); } if (a.k === 'perro' && J.t > this.mooT) { this.mooT = J.t + 2; audio.play('bark'); } }
      a.t -= dt; let sp = 0;
      if (a.st === 'huye') { sp = VEL[a.k]; a.ry = lerpA(a.ry, Math.atan2(a.fx, a.fz), dt * 6); if (a.t <= 0) { a.st = 'pasta'; a.t = rnd(2, 5); a.hx = a.x; a.hz = a.z; } }
      else if (a.st === 'camina') { const ex = a.tx - a.x, ez = a.tz - a.z, l = Math.hypot(ex, ez); sp = 1.1; a.ry = lerpA(a.ry, Math.atan2(ex, ez), dt * 3); if (l < .5 || a.t <= 0) { a.st = 'pasta'; a.t = rnd(3, 8); } }
      else if (a.t <= 0) { a.st = 'camina'; a.t = 7; const b = Math.random() * TAU, r = rnd(1, 7); a.tx = a.hx + Math.sin(b) * r; a.tz = a.hz + Math.cos(b) * r; }
      if (a.k === 'perro' && a.st !== 'huye' && d < 14 && d > 2.5) { sp = Math.min(6, d); a.ry = lerpA(a.ry, Math.atan2(-dx, -dz), dt * 5); if (J.t > this.mooT && Math.random() < dt * .3) { this.mooT = J.t + 3; audio.play('bark'); } }
      if (sp) { const ox2 = a.x, oz2 = a.z; a.x += Math.sin(a.ry) * sp * dt; a.z += Math.cos(a.ry) * sp * dt; if (agua(a.x, a.z) > .25 || !dentro(a.x, a.z, 4) || enPueblo(a.x, a.z, 2) && a.k !== 'perro') { a.x = ox2; a.z = oz2; a.ry += Math.PI * .6; a.fx = Math.sin(a.ry); a.fz = Math.cos(a.ry); } else chocar(a, .7); }
      a.mv = lerp(a.mv, sp > .2 ? 1 : 0, Math.min(1, dt * 6)); a.ph += dt * sp * (a.k === 'caballo' ? 1.5 : 2.2);
    }
  }
  // ---------- la doma ----------
  domar(a) {
    const y = this.y; if (this.doma || y.montado || this.p.caballo) return;
    this.doma = {a, t: 0, dur: 9, eq: 0, v: 0, sig: .4, buck: 0}; a.st = 'doma'; y.x = a.x; y.z = a.z; y.ry = a.ry; y.dash = null; audio.play('whistle');
    this.j.ui.doma(true, 0, 0); this.j.ui.toast('¡Agarrate fuerte! Usá ← → (A y D, o el joystick) para no caerte.', 'herradura', 4);
  }
  domaUpd(dt, c) {
    const D = this.doma, a = D.a, y = this.y; D.t += dt; D.sig -= dt;
    if (D.sig <= 0) { D.sig = rnd(.35, .75) * (1 - D.t / D.dur * .35); D.v += (Math.random() < .5 ? -1 : 1) * rnd(.6, 1) * (1 + D.t / D.dur * .35); D.buck = 1; this.j.cam.sh = Math.max(this.j.cam.sh, .22); if (Math.random() < .4) audio.play('stomp'); }
    D.v += (c.mx || 0) * 4 * dt; D.v -= D.eq * 1.2 * dt; D.v *= Math.max(0, 1 - dt * 1.4); D.eq += D.v * dt; D.buck = Math.max(0, D.buck - dt * 3);
    a.ph += dt * 9; a.ry += Math.sin(D.t * 2.3) * dt * 1.5; y.x = a.x; y.z = a.z; y.ry = a.ry; y.mv = 0;
    this.j.ui.doma(true, D.eq, D.t / D.dur);
    if (Math.abs(D.eq) > 1) { // te volteó
      this.doma = null; this.j.ui.doma(false); a.st = 'huye'; a.t = 4; a.fx = Math.sin(a.ry); a.fz = Math.cos(a.ry);
      const s = D.eq > 0 ? 1 : -1, side = a.ry + s * Math.PI / 2; y.dash = {dx: Math.sin(side), dz: Math.cos(side), dist: 3.5, dur: .35, t: 0}; this.j.dano(Math.round(this.j.stats().vida * .06));
      this.j.ui.toast('¡Te volteó el bagual! Probá de nuevo, que ya casi.', 'herradura', 3); return;
    }
    if (D.t >= D.dur) { // domado
      this.doma = null; this.j.ui.doma(false); this.anim.splice(this.anim.indexOf(a), 1);
      const n = NOMBRES[Math.random() * NOMBRES.length | 0]; this.p.caballo = {n}; y.montado = true; this.p.montado = 1;
      audio.play('win'); this.j.parts.burst(y.x, 1.5, y.z, 40, [1, .85, .4], {sp: 7, size: .45, life: 1, type: 3});
      this.j.ui.cartel(`¡Domaste a ${n}!`, 'Ahora es tu caballo. Con G (o el botón de la herradura) te bajás y lo llamás con un silbido.'); this.j.ui.armarHud(); this.j.ui.misiones.alEvento('doma'); this.j.ui.guardar();
    }
  }
  // ---------- tu caballo ----------
  silbar() {
    const y = this.y, J = this.j; if (!y.vivo || this.doma || J.eventos.abd) return;
    if (!this.p.caballo) { J.ui.toast('No tenés caballo. Por el campo andan baguales: acercate a uno y apretá F para domarlo.', 'herradura', 4); return; }
    if (y.montado) { // bajarse
      y.montado = false; this.p.montado = 0; const s = y.ry + Math.PI / 2; this.mio = {x: y.x + Math.sin(s) * 1.4, z: y.z + Math.cos(s) * 1.4, ry: y.ry, ph: 0, mv: 0, st: 'pasta', t: 3}; chocar(this.mio, .6); J.enviar(true); return;
    }
    if (regionEn(y.x, y.z) === 'salamanca' && Math.hypot(y.x - SALA.x, y.z - SALA.z) < SALA.r) { J.ui.toast(`${this.p.caballo.n} no se anima a entrar a la Salamanca.`, 'herradura', 3); return; }
    const m = this.mio; if (m && Math.hypot(m.x - y.x, m.z - y.z) < 3.5) return this.montar();
    audio.play('whistle');
    if (!m || Math.hypot(m.x - y.x, m.z - y.z) > 60) { let x = y.x, z = y.z; for (let i = 0; i < 12; i++) { const a = Math.random() * TAU; x = y.x + Math.sin(a) * 30; z = y.z + Math.cos(a) * 30; if (dentro(x, z, 4) && agua(x, z) < .3) break; } this.mio = {x, z, ry: 0, ph: 0, mv: 0}; }
    this.mio.st = 'viene'; this.mio.t = 12; J.ui.toast(`${this.p.caballo.n} viene al galope.`, 'herradura', 2);
  }
  montar() { const y = this.y; y.montado = true; this.p.montado = 1; this.mio = null; audio.play('dash'); this.j.parts.burst(y.x, .4, y.z, 10, [.8, .7, .55], {type: 2, sp: 2, size: .8, life: .5, grow: 1}); this.j.enviar(true); }
  caballoUpd(dt) {
    const m = this.mio, y = this.y; if (!m) return; let sp = 0;
    if (m.st === 'viene') { const dx = y.x - m.x, dz = y.z - m.z, d = Math.hypot(dx, dz); m.t -= dt; sp = Math.min(12, d * 2); m.ry = lerpA(m.ry, Math.atan2(dx, dz), dt * 6); if (d < 1.8 && y.vivo && !this.doma) { this.montar(); return; } if (m.t <= 0) { m.x = y.x - Math.sin(m.ry) * 2; m.z = y.z - Math.cos(m.ry) * 2; } }
    else { m.t -= dt; if (m.t <= 0) { m.t = rnd(3, 7); m.ry += rnd(-1, 1); } if (m.t > 5.5) sp = .9; }
    if (sp) { m.x += Math.sin(m.ry) * sp * dt; m.z += Math.cos(m.ry) * sp * dt; chocar(m, .6); }
    m.mv = lerp(m.mv, sp > .2 ? 1 : 0, Math.min(1, dt * 6)); m.ph += dt * sp * 1.5;
  }
  // ---------- el pueblo ----------
  pueblo(dt) {
    const y = this.y, J = this.j, noche = esNoche(J.horaAhora()), malon = J.eventos.malonEn();
    for (const g of this.gente) {
      if (Math.abs(g.pu.x - y.x) > 80 || Math.abs(g.pu.z - y.z) > 80) continue;
      const escondido = malon === g.pu.id || (noche && g.i === 2); g.dentro = escondido && Math.hypot(g.x - g.tx, g.z - g.tz) < .8;
      g.t -= dt;
      if (escondido) { const c = g.casas[g.i % Math.max(1, g.casas.length)]; if (c) { g.tx = g.pu.x + (c.x - g.pu.x) * .82; g.tz = g.pu.z + (c.z - g.pu.z) * .82; } }
      else if (noche) { const a = g.i * 2.1 + 1; g.tx = g.pu.x + Math.sin(a) * 4.6; g.tz = g.pu.z + Math.cos(a) * 4.6; }
      else if (g.t <= 0) { g.t = rnd(4, 10); const q = g.pts[Math.random() * g.pts.length | 0]; g.tx = q[0] + rnd(-1.5, 1.5); g.tz = q[1] + rnd(-1.5, 1.5); }
      const dx = g.tx - g.x, dz = g.tz - g.z, d = Math.hypot(dx, dz), habla = Math.hypot(y.x - g.x, y.z - g.z) < 3.2;
      const sp = d > .4 && !habla ? (escondido ? 3.2 : 1.4) : 0; if (sp) { g.x += dx / d * sp * dt; g.z += dz / d * sp * dt; g.ry = lerpA(g.ry, Math.atan2(dx, dz), dt * 6); }
      else g.ry = lerpA(g.ry, habla ? Math.atan2(y.x - g.x, y.z - g.z) : noche ? Math.atan2(g.pu.x - g.x, g.pu.z - g.z) : g.ry, dt * 4);
      g.mv = lerp(g.mv, sp ? 1 : 0, Math.min(1, dt * 8)); g.ph += dt * 11 * g.mv * sp / 6;
    }
    // de noche los que dan misiones se juntan alrededor del fogón
    for (const n of J.npcs) {
      if (n.x0 == null) { n.x0 = n.x; n.z0 = n.z; n.ry0 = n.ry; } if (!['vecino', 'baqueano', 'cantor'].includes(n.rol)) continue;
      const pu = PUEBLOS.find(p => p.id === n.reg), a = {vecino: 0, baqueano: 2.2, cantor: 4.2}[n.rol]; const tx = noche ? pu.x + Math.sin(a) * 3.4 : n.x0, tz = noche ? pu.z + Math.cos(a) * 3.4 : n.z0;
      const dx = tx - n.x, dz = tz - n.z, d = Math.hypot(dx, dz); if (d > .05) { const k = Math.min(d, 1.3 * dt); n.x += dx / d * k; n.z += dz / d * k; n.anda = d > .2; } else n.anda = false;
      if (n.anda) n.ry = Math.atan2(dx, dz); else n.ry = noche ? Math.atan2(pu.x - n.x, pu.z - n.z) : n.ry0;
    }
    for (const g of this.perros) {
      if (Math.abs(g.pu.x - y.x) > 80 || Math.abs(g.pu.z - y.z) > 80) continue;
      const d = Math.hypot(y.x - g.x, y.z - g.z); g.t -= dt; let tx = g.tx, tz = g.tz, sp = 0;
      if (d < 9 && y.vivo) g.sigue = 6; g.sigue -= dt;
      if (g.sigue > 0 && Math.hypot(y.x - g.pu.x, y.z - g.pu.z) < 45) { tx = y.x - Math.sin(y.ry) * 1.8; tz = y.z - Math.cos(y.ry) * 1.8; if (y.mv > .5 && J.t > g.ladra) { g.ladra = J.t + rnd(3, 7); audio.play('bark'); } }
      else if (g.t <= 0) { g.t = rnd(3, 8); const a = Math.random() * TAU, r = rnd(3, 20); g.tx = g.pu.x + Math.sin(a) * r; g.tz = g.pu.z + Math.cos(a) * r; tx = g.tx; tz = g.tz; }
      const dx = tx - g.x, dz = tz - g.z, l = Math.hypot(dx, dz); if (l > .6) { sp = Math.min(g.sigue > 0 ? 8 : 2.2, l * 3); g.x += dx / l * sp * dt; g.z += dz / l * sp * dt; g.ry = lerpA(g.ry, Math.atan2(dx, dz), dt * 7); }
      g.mv = lerp(g.mv, sp > .3 ? 1 : 0, Math.min(1, dt * 8)); g.ph += dt * sp * 2.4;
    }
  }
  // ---------- cada cuadro ----------
  update(dt, c) {
    this.spawnT -= dt; if (this.spawnT <= 0) { this.spawnT = 1.2; this.poblar(); }
    this.animales(dt); this.caballoUpd(dt); this.pueblo(dt);
    if (this.doma) this.domaUpd(dt, c);
  }
  // cosas con las que se puede hacer algo (F)
  candidatos(cand) {
    const y = this.y, J = this.j;
    if (!this.p.caballo && !y.montado) for (const a of this.anim) if (a.bagual && a.st !== 'huye') cand('bagual', a, Math.hypot(a.x - y.x, a.z - y.z) - .8);
    if (this.mio && !y.montado) cand('caballo', this.mio, Math.hypot(this.mio.x - y.x, this.mio.z - y.z) - .8);
    for (const g of this.gente) if (!g.dentro && Math.abs(g.x - y.x) < 4 && Math.abs(g.z - y.z) < 4) cand('gente', g, Math.hypot(g.x - y.x, g.z - y.z));
    for (const g of this.perros) if (Math.abs(g.x - y.x) < 3 && Math.abs(g.z - y.z) < 3) cand('perro', g, Math.hypot(g.x - y.x, g.z - y.z) - .2);
    for (const a of this.anim) if (a.k === 'perro' && a.st !== 'huye' && Math.abs(a.x - y.x) < 3 && Math.abs(a.z - y.z) < 3) cand('perro', a, Math.hypot(a.x - y.x, a.z - y.z) - .2);
  }
  usar(c) {
    const J = this.j, y = this.y;
    if (c.tipo === 'bagual') return this.domar(c.ref);
    if (c.tipo === 'caballo') return this.montar();
    if (c.tipo === 'gente') { const r = RUMORES[this.rumor++ % RUMORES.length]; J.ui.toast(`${CHARS[c.ref.ch]?.n || 'Un vecino'}: “${r}”`, 'h_' + c.ref.ch, 7); return; }
    if (c.tipo === 'perro') { const g = c.ref; if ((g.mimo || 0) > J.t) { audio.play('bark'); return; } g.mimo = J.t + 20; g.sigue = 20; audio.play('bark'); J.parts.burst(g.x, 1, g.z, 8, [1, .45, .55], {sp: 2, grav: 1.5, type: 5, size: .5, life: 1.1, up: 2}); J.curar(.05); J.ui.toast('El perro te mueve la cola. Ahora te sigue a todos lados.', 'perro', 3); }
  }
  // ---------- dibujar ----------
  dibujar() {
    const J = this.j, y = J.yo, t = J.t;
    for (const a of this.anim) {
      if (Math.abs(a.x - y.x) > 75 || Math.abs(a.z - y.z) > 75) continue;
      const D = this.doma?.a === a ? this.doma : null, rx = D ? -Math.abs(Math.sin(D.t * 7)) * .35 * (.5 + D.buck) : 0, rz = D ? D.eq * .45 : 0;
      J.bt(MOD[a.k], 40).push(a.x, D ? Math.abs(Math.sin(D.t * 7)) * .25 : 0, a.z, a.ry, a.s, a.ph, a.mv, 0, 0, 0, 0, 0, 0, rx, rz);
      J.fx.draw(FX.SHADOW, a.x, .05, a.z, 0, a.k === 'oveja' || a.k === 'perro' ? .8 : 1.3, a.k === 'oveja' || a.k === 'perro' ? .8 : 1.3, [0, 0, 0], .4);
      if (D) J.bt('h_' + this.p.ch).push(a.x, .62 + Math.abs(Math.sin(D.t * 7)) * .25, a.z, a.ry, 1, 0, 0, .4, 0, 0, 0, 0, 0, rx * 1.2, rz * 1.4);
    }
    const m = this.mio; if (m && Math.abs(m.x - y.x) < 75 && Math.abs(m.z - y.z) < 75) { J.bt('m_caballo', 40).push(m.x, 0, m.z, m.ry, 1, m.ph, m.mv); J.fx.draw(FX.SHADOW, m.x, .05, m.z, 0, 1.3, 1.3, [0, 0, 0], .4); }
    for (const g of this.gente) { if (g.dentro || Math.abs(g.x - y.x) > 60 || Math.abs(g.z - y.z) > 60) continue; J.bt('h_' + g.ch, 24).push(g.x, 0, g.z, g.ry, .96, g.ph, g.mv, 0); J.fx.draw(FX.SHADOW, g.x, .05, g.z, 0, .8, .8, [0, 0, 0], .4); }
    for (const g of this.perros) { if (Math.abs(g.x - y.x) > 60 || Math.abs(g.z - y.z) > 60) continue; J.bt('o_perro', 40).push(g.x, 0, g.z, g.ry, 1, g.ph, g.mv); J.fx.draw(FX.SHADOW, g.x, .05, g.z, 0, .7, .7, [0, 0, 0], .4); }
  }
}
function lerpA(a, b, k) { return a + ang(b, a) * Math.min(1, k); }
