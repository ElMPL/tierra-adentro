// Lo que hace que el mundo parezca vivo, en tu pantalla: gente que va y viene por los caminos, bandadas de pájaros,
// mariposas, la neblina de las cataratas, carteles en los cruces y los vecinos que te comentan algo al pasar.
import {TAU, rnd, FX} from '../lib/gfx.js';
import {audio} from '../lib/audio.js';
import {CAMINOS, CARTELES, REG, PUEBLOS, SALTO, regionEn, alto, agua, empinado} from '../shared/mapa.js';
import {esNoche} from '../shared/sim.js';
import {RUMORES} from './vida.js';

// quién anda por los caminos de cada territorio
const VIAJEROS = {
  pampa: ['jinete', 'tropa', 'carreta', 'paisana', 'chasqui'], ibera: ['jinete', 'paisana', 'chasqui', 'carreta'], monte: ['hachero', 'jinete', 'carreta'], ingenio: ['zafrera', 'carreta', 'jinete'],
  selva: ['paisana', 'mensu', 'chasqui'], cuyo: ['tropa', 'jinete', 'arriero'], puna: ['pastora', 'arriero', 'jinete'], sur: ['ovejero', 'jinete', 'chasqui'], salamanca: [],
};
const TIPO = {
  jinete: {h: 'h_gaucho', mont: 'm_caballo', vel: 7}, paisana: {h: 'h_paisana', vel: 2.4}, chasqui: {h: 'h_boleador', vel: 5.5}, carreta: {m: 'm_carreta', h: 'h_gaucho', vel: 2},
  tropa: {h: 'h_gaucho', mont: 'm_caballo', vel: 3.2, sig: 'm_vaca', n: 3}, hachero: {h: 'h_carpincho', vel: 2.6}, zafrera: {h: 'h_zafrera', vel: 2.5}, mensu: {h: 'h_boleador', vel: 2.8},
  arriero: {h: 'h_gaucho', vel: 2.6, sig: 'm_caballo', n: 2}, pastora: {h: 'h_machi', vel: 2.2, sig: 'm_vicuna', n: 3}, ovejero: {h: 'h_boleador', vel: 2.6, sig: 'm_oveja', n: 4},
};
const SALUDOS = ['¡Buenas!', 'Buen día, paisano.', '¡Adiós, che!', 'Ande con cuidado, que el camino está bravo.', '¿Va para el pueblo? Yo vengo de allá.', 'Lindo día pa’ andar.', 'Dicen que anoche se vio la Luz Mala.', '¡Salud!', 'Por acá no pasa nadie… salvo usted.', 'Qué calor, ¿no?'];
const SALUDOS_N = ['Buenas noches… ¿no le da miedo andar a esta hora?', 'Rápido, que de noche salen los bichos.', 'Shh… ¿escuchó eso?'];
// pájaros de cada lugar: [color, tamaño, alto, velocidad, aleteo, cuántos]
const PAJAROS = {
  pampa: [[[.12, .1, .1], .55, 7, 8, 13, 7], [[.95, .95, .95], .5, 6, 7, 11, 5]], ibera: [[[.95, .95, .92], .75, 8, 6, 8, 6], [[.95, .55, .6], .8, 6, 5, 7, 8]],
  monte: [[[.15, .12, .1], .5, 9, 8, 13, 6]], ingenio: [[[.12, .1, .1], .5, 9, 8, 13, 8]], selva: [[[.2, .75, .3], .55, 10, 9, 16, 6], [[.9, .3, .2], .5, 11, 9, 15, 4]],
  cuyo: [[[.08, .08, .08], 1.9, 24, 4.5, 1.8, 2]], puna: [[[.08, .08, .08], 2.1, 26, 4, 1.6, 2], [[.95, .5, .55], .7, 7, 6, 8, 6]], sur: [[[.4, .35, .3], .65, 9, 7, 9, 7], [[.08, .08, .08], 2, 25, 4, 1.6, 1]], salamanca: [[[.05, .02, .03], .6, 9, 9, 18, 9]],
};
const LINEAS = {
  pampa: ['¿Vio el resplandor de la Salamanca? De noche se ve desde acá.', 'El ombú es el único árbol que da sombra en todo el pago.', 'Mañana hay yerra en lo de Arrieta.'],
  ibera: ['Ojo con los yacarés, que están mansos pero no tanto.', 'Esta noche hay chamamé en el puerto.', 'El agua está alta este año.'],
  monte: ['El quebracho es tan duro que el hacha rebota.', 'No hachee de más, que el monte se enoja.', 'Vinchucas: ni las mire.'],
  ingenio: ['La zafra empieza en mayo y termina cuando termina.', 'El humo del ingenio se ve desde lejos.', 'Al patrón no lo vio nadie desde hace años.'],
  selva: ['A la siesta no se sale, que anda el Yasy.', 'La tierra colorada no sale ni con lavandina.', 'Desde la cascada se ve el arcoíris.'],
  cuyo: ['Este año la uva viene dulce.', 'El zonda baja caliente y pone a todos de mal humor.', 'Al Aconcagua no lo subió nadie de acá.'],
  puna: ['Acá arriba falta el aire, camine despacio.', 'Los cerros se pintan solos cuando sale el sol.', 'La Pachamama tiene sed en agosto.'],
  sur: ['El viento acá no para nunca.', 'En el lago grande vive algo, eso es seguro.', 'Las lengas se ponen coloradas en otoño.'],
};

export class Ambiente {
  constructor(j) { this.j = j; this.v = []; this.vT = 2; this.pT = 6; this.mT = 0; this.bT = {}; this.nahuel = null; this.salT = 0; }
  get y() { return this.j.yo; }
  empezar() { this.v = []; this.vT = 2; this.pT = 6; this.nahuel = null; this.bT = {}; }
  // un punto del camino a una distancia s del principio
  punto(c, s) { let L = 0; for (let i = 0; i < c.p.length - 1; i++) { const [ax, az] = c.p[i], [bx, bz] = c.p[i + 1], l = Math.hypot(bx - ax, bz - az); if (s <= L + l) { const t = (s - L) / l; return [ax + (bx - ax) * t, az + (bz - az) * t, Math.atan2(bx - ax, bz - az)]; } L += l; } const n = c.p.length - 1; return [c.p[n][0], c.p[n][1], 0]; }
  largo(c) { return c.L ??= c.p.reduce((a, q, i) => i ? a + Math.hypot(q[0] - c.p[i - 1][0], q[1] - c.p[i - 1][1]) : 0, 0); }
  nuevoViajero() {
    const y = this.y, ops = [];
    for (const c of CAMINOS) { if (c.b === 'salamanca') continue; const L = this.largo(c); for (let s = 0; s < L; s += 8) { const [x, z] = this.punto(c, s), d = Math.hypot(x - y.x, z - y.z); if (d > 45 && d < 95) ops.push([c, s]); } }
    if (!ops.length) return; const [c, s] = ops[Math.random() * ops.length | 0], [x, z] = this.punto(c, s), reg = regionEn(x, z), L = VIAJEROS[reg] || []; if (!L.length) return;
    const k = L[Math.random() * L.length | 0], T = TIPO[k], dir = Math.random() < .5 ? 1 : -1;
    this.v.push({k, T, c, s, dir, x, z, ry: 0, ph: Math.random() * 9, hab: 0, cola: Array.from({length: T.n || 0}, () => ({x, z, ry: 0, ph: Math.random() * 9}))});
  }
  update(dt) {
    const J = this.j, y = this.y; if (!y) return; const reg = J.region || 'pampa', noche = esNoche(J.horaAhora());
    // gente por los caminos
    this.vT -= dt; if (this.vT <= 0) { this.vT = 4 + Math.random() * 5; if (this.v.length < (noche ? 2 : 4)) this.nuevoViajero(); }
    for (let i = this.v.length - 1; i >= 0; i--) {
      const v = this.v[i], L = this.largo(v.c), d = Math.hypot(v.x - y.x, v.z - y.z);
      const para = d < 3.5; if (!para) v.s += v.dir * v.T.vel * dt;
      if (v.s < 0 || v.s > L || d > 130) { this.v.splice(i, 1); continue; }
      const [x, z, a] = this.punto(v.c, v.s), off = 1.3; v.x = x - Math.cos(a) * off * v.dir; v.z = z + Math.sin(a) * off * v.dir; v.ry = v.dir > 0 ? a : a + Math.PI; v.mv = para ? 0 : 1; v.ph += dt * (v.T.mont ? 7 : 9) * (para ? 0 : 1);
      let px = v.x, pz = v.z; for (const q of v.cola) { const dx = px - q.x, dz = pz - q.z, e = Math.hypot(dx, dz); if (e > 2.4) { q.x += dx / e * (e - 2.4); q.z += dz / e * (e - 2.4); q.ry = Math.atan2(dx, dz); q.ph += dt * 8; } px = q.x; pz = q.z; }
      v.hab -= dt; if (d < 7 && v.hab <= 0) { v.hab = 40; const S = noche ? SALUDOS_N : SALUDOS; J.burbuja(v, S[Math.random() * S.length | 0]); }
    }
    // los vecinos te comentan algo cuando pasás
    for (const n of J.npcs) { if (!n.reg || n.rol === 'campo') continue; const d = Math.hypot(n.x - y.x, n.z - y.z); if (d > 6 || d < 2.2) continue; const k = n.id; if ((this.bT[k] || -1e9) > J.t) continue; this.bT[k] = J.t + 50 + Math.random() * 40; const L = LINEAS[n.reg] || LINEAS.pampa, txt = Math.random() < .35 ? RUMORES[Math.random() * RUMORES.length | 0] : L[Math.random() * L.length | 0]; if (txt.length < 90) J.burbuja(n, txt); }
    // bandadas
    this.pT -= dt; if (this.pT <= 0) { this.pT = 9 + Math.random() * 14; const B = PAJAROS[reg]; if (B && !(noche && reg !== 'salamanca')) this.bandada(B[Math.random() * B.length | 0]); }
    // mariposas y panaderos
    this.mT -= dt; if (this.mT <= 0 && !noche) { this.mT = .35; this.bichitos(reg); }
    // las cataratas: neblina y ruido
    if (SALTO) { const d = Math.hypot(SALTO.x - y.x, SALTO.z - y.z); if (d < 90) { const P = J.parts, px = -SALTO.dz, pz = SALTO.dx; if (Math.random() < (d < 50 ? .9 : .35)) { const u = rnd(-1, 1) * SALTO.w * .6, bx = SALTO.x + SALTO.dx * rnd(1, 3) + px * u, bz = SALTO.z + SALTO.dz * rnd(1, 3) + pz * u; P.emit(bx, SALTO.bajo - alto(bx, bz) + .4, bz, rnd(-.4, .4) + SALTO.dx * .6, rnd(.8, 2), rnd(-.4, .4) + SALTO.dz * .6, .55, .6, .64, rnd(.9, 1.4), rnd(1.4, 2.2), 2, 0, .4, 0, 1); } this.salT -= dt; if (this.salT <= 0 && d < 60) { this.salT = 1.7; audio.play('cascada'); } } }
    // el Nahuelito, si lo llamaron
    if (this.nahuel) { const N = this.nahuel; N.t += dt; if (N.t > 9) this.nahuel = null; }
  }
  bandada([col, s, h, vel, aleteo, n]) {
    const y = this.y, a = Math.random() * TAU, d = 55, x0 = y.x - Math.sin(a) * d + rnd(-15, 15), z0 = y.z - Math.cos(a) * d + rnd(-15, 15), vx = Math.sin(a) * vel, vz = Math.cos(a) * vel, H = alto(y.x, y.z) - alto(x0, z0);
    for (let i = 0; i < n; i++) { const fx = x0 + rnd(-3, 3) - Math.sin(a) * i * .9, fz = z0 + rnd(-3, 3) - Math.cos(a) * i * .9; this.j.parts.emit(fx, h + H + rnd(-1, 1.5), fz, vx * rnd(.92, 1.08), rnd(-.2, .2), vz * rnd(.92, 1.08), col[0], col[1], col[2], s * rnd(.85, 1.15), 2 * d / vel, 8, 0, 0, aleteo * rnd(.9, 1.1), 0); }
  }
  bichitos(reg) {
    const y = this.y, P = this.j.parts, x = y.x + rnd(-14, 14), z = y.z + rnd(-14, 14); if (agua(x, z) > .1) return;
    if (reg === 'selva' || reg === 'ibera' || reg === 'monte') { const c = [[.2, .5, 1], [1, .85, .2], [1, .5, .15], [.95, .95, .9]][Math.random() * 4 | 0]; P.emit(x, rnd(.6, 1.6), z, rnd(-1.2, 1.2), rnd(-.2, .4), rnd(-1.2, 1.2), c[0], c[1], c[2], .32, 5, 4, 0, .1, 9, 0); }
    else if (reg === 'pampa' || reg === 'sur') { if (Math.random() < .5) P.emit(x, rnd(.4, 2), z, rnd(.6, 1.4), rnd(.05, .3), rnd(-.3, .3), 1, 1, .96, .2, 6, 1, 0, 0, 0, 0); }
    else if (reg === 'puna' || reg === 'cuyo') { if (Math.random() < .3) P.emit(x, rnd(.2, .6), z, rnd(1.5, 3), rnd(0, .3), rnd(-.5, .5), .85, .78, .65, .9, 2, 2, 0, .3, 0, 1); }
  }
  nahuelito(x, z) { this.nahuel = {x: -165, z: 235, t: 0}; audio.play('splash'); }
  dibujar() {
    const J = this.j;
    for (const v of this.v) {
      const T = v.T; if (T.mont) J.bt(T.mont, 12).push(v.x, 0, v.z, v.ry, 1, v.ph, v.mv); if (T.m) J.bt(T.m, 6).push(v.x, 0, v.z, v.ry, 1, v.ph, v.mv);
      if (T.h) { const ox = T.m ? Math.cos(v.ry) * 1.6 : 0, oz = T.m ? -Math.sin(v.ry) * 1.6 : 0; J.bt(T.h, 16).push(v.x + ox, T.mont ? .62 : 0, v.z + oz, v.ry, 1, T.mont ? 0 : v.ph, T.mont ? 0 : v.mv, 0); }
      for (const q of v.cola) J.bt(T.sig, 16).push(q.x, 0, q.z, q.ry, 1, q.ph, v.mv);
      J.fx.draw(FX.SHADOW, v.x, .05, v.z, 0, T.m ? 2 : 1, T.m ? 2 : 1, [0, 0, 0], .4);
    }
    if (this.nahuel) { const N = this.nahuel, k = Math.sin(Math.min(1, N.t / 9) * Math.PI); J.bt('f_nahuelito', 2).push(N.x, -3.2 + k * 3, N.z, N.t * .3, 2.2, N.t, 1, 0, 0); if (Math.random() < .3) J.parts.burst(N.x, .2, N.z, 3, [.8, .9, 1], {sp: 2, size: .4, life: .8}); }
  }
  // el cartel más cercano, para mostrar a dónde va cada camino
  cartel() {
    const y = this.y; for (const k of CARTELES) { if (Math.abs(k.x - y.x) > 9 || Math.abs(k.z - y.z) > 9) continue; if (Math.hypot(k.x - y.x, k.z - y.z) > 8) continue;
      const A = PUEBLOS.find(p => p.id === k.c.a), B = PUEBLOS.find(p => p.id === k.c.b); const d = p => Math.round(Math.hypot(p.x - y.x, p.z - y.z) / 5) * 5;
      return {k, txt: `${REG[k.a].n} ↔ ${REG[k.de].n}`, sub: `${A.n} ${d(A)} m · ${B.n} ${d(B)} m`}; }
    return null;
  }
}
