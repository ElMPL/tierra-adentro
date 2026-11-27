// El mundo: una Argentina dibujada a mano con los 9 territorios de Noche de Salamanca.
// x crece hacia el este y z hacia el sur (el norte queda arriba en la pantalla).
// Todo sale de semillas fijas: el servidor y cada pantalla calculan el mismo mapa sin mandarlo por la red.
import {mul, hash, fbm, ruido, clamp, lerp, dLinea} from './azar.js';
import {KITR} from './kit.js';

// el mapa es chico a propósito: todo queda a menos de un minuto de caminata y siempre hay algo pasando cerca
export const NORTE = -300, SUR = 300, CH = 32, MAPA_V = 2;
export const SALA = {x: -30, z: -70, r: 50, puerta: {x: -30, z: -20}};

// ---------- territorios ----------
// bichos: de más débil a más fuerte. deco: [modelo, cantidad cada 1000 m², opciones]
export const REG = {
  pampa: {n: 'La Pampa', sub: 'Llanura sin fin', c: [20, 75], w: 1.3, lv: [1, 5], tr: 'a0', jefe: 'lobizon',
    pueblo: {n: 'Pueblo Ombú', x: 32, z: 95}, guarida: {x: 75, z: 192, n: 'El rancho del séptimo hijo'},
    deco: [['cortadera', 1.1], ['ombu', .045], ['parva', .16], ['tapera', .08], ['molino', .025], ['tronco', .1], ['tranquera', .05], ['tinaja', .07], ['barril', .05]],
    bichos: ['anima', 'luzmala', 'chancha', 'jinete', 'viuda'], campeones: {chancha: 'La Chancha con Cadenas', viuda: 'La Viuda del Andén', jinete: 'El Matrero sin Nombre'}},
  ibera: {n: 'Esteros del Iberá', sub: 'Agua que brilla, agua que traga', c: [138, -68], w: 1, lv: [5, 9], tr: 'a2', jefe: 'mboitui',
    pueblo: {n: 'Puerto Irupé', x: 125, z: -20}, guarida: {x: 165, z: -110, n: 'El embalsado de Mbói Tu’ĩ'},
    deco: [['palmera', .8], ['junco', 1.4], ['irupeD', 1.2, {wet: 1}], ['canoa', .12, {wet: 1}], ['tronco', .15], ['tinaja', .07], ['barril', .05]],
    bichos: ['mbarigui', 'carau', 'irupe', 'llorona', 'yacare'], campeones: {yacare: 'El Yacaré Viejo', llorona: 'La Madre Llorona', carau: 'El Carau Enlutado'}},
  monte: {n: 'El Impenetrable', sub: 'El monte te mira', c: [30, -198], w: 1, lv: [8, 12], tr: 'a1', jefe: 'almamula',
    pueblo: {n: 'Paraje Quebrachal', x: 85, z: -200}, guarida: {x: 25, z: -268, n: 'El camino de la Alma Mula'},
    deco: [['quebracho', 1.4], ['vinal', .55], ['paloB', .4], ['tacuru', .4], ['tronco', .5], ['helecho', 1.1], ['hongo', .8], ['tinaja', .07], ['barril', .05]],
    bichos: ['vinchuca', 'duende', 'kakuy', 'pombero', 'telesita', 'sachayoj'], campeones: {sachayoj: 'Sachayoj, dueño del monte', telesita: 'La Telesita', kakuy: 'La Kakuy'}},
  ingenio: {n: 'El Ingenio', sub: 'Azúcar, humo y pacto', c: [-88, -145], w: .95, lv: [11, 15], tr: 'ing', jefe: 'elfamiliar',
    pueblo: {n: 'Villa Zafra', x: -125, z: -150}, guarida: {x: -185, z: -125, n: 'El galpón del Familiar'},
    deco: [['cana', 1.3], ['bagazo', .3], ['vagon', .12], ['chimenea', .03], ['galpon', .025], ['tinaja', .08], ['barril', .08]],
    bichos: ['zafrero', 'mikilo', 'familiar', 'uturunco', 'capataz'], campeones: {capataz: 'El Capataz sin Sombra', uturunco: 'El Runa Uturunco'}},
  selva: {n: 'Selva Misionera', sub: 'Tierra colorada', c: [180, -222], w: .9, lv: [13, 17], tr: 'sel', jefe: 'teyu',
    pueblo: {n: 'Misión de las Ruinas', x: 175, z: -195}, guarida: {x: 190, z: -262, n: 'La cueva del Teyú Yaguá'},
    deco: [['arbolote', .6], ['tacuara', .7], ['helecho', 1.6], ['ruina', .25], ['columna', .08], ['tronco', .3], ['pena', .12], ['tinaja', .07]],
    bichos: ['aoao', 'kurupi', 'yasy', 'yaguarete', 'caapora'], campeones: {kurupi: 'Kurupí el Viejo', yasy: 'Yasy Yateré', caapora: 'Caá Porá'}},
  cuyo: {n: 'Cuyo y la Cordillera', sub: 'Viento blanco y uva', c: [-168, 0], w: 1, lv: [15, 19], tr: 'cuy', jefe: 'futre',
    pueblo: {n: 'Posta del Arriero', x: -142, z: 12}, guarida: {x: -190, z: -45, n: 'El paso del Futre'},
    deco: [['vid', .45], ['alamo', .3], ['penasco', .35], ['pirca', .2], ['tonel', .15], ['tapera', .08], ['pena', .25], ['tinaja', .06], ['barril', .06]],
    bichos: ['arriero', 'remolino', 'minero', 'condor', 'pericana'], campeones: {pericana: 'La Pericana', condor: 'El Cóndor Viejo', minero: 'El Minero Enterrado'}},
  puna: {n: 'La Puna y la Quebrada', sub: 'Cerros de siete colores', c: [-145, -250], w: .95, lv: [17, 21], tr: 'a3', jefe: 'huayrapuca',
    pueblo: {n: 'Abra de las Apachetas', x: -115, z: -220}, guarida: {x: -170, z: -268, n: 'El nido de la Huayrapuca'},
    deco: [['cardon', .7], ['pena', .55], ['pirca', .35], ['apachetaD', .12], ['tinaja', .07], ['barril', .04]],
    bichos: ['diablito', 'umita', 'ucumar', 'huaca'], campeones: {ucumar: 'El Ucumar de las Yungas', huaca: 'La Huaca Despierta', umita: 'La Umita Mayor'}},
  sur: {n: 'La Patagonia', sub: 'Viento, piedra y lago', c: [-82, 225], w: 1.2, lv: [19, 23], tr: 'sur', jefe: 'elengassen',
    pueblo: {n: 'Fortín del Viento', x: -58, z: 210}, guarida: {x: -120, z: 258, n: 'La meseta de Elëngásëm'},
    deco: [['coiron', 1.1], ['basalto', .3], ['lenga', .35], ['arrayan', .25], ['troncoP', .25], ['chenque', .08], ['hieloB', .15, {sur: 1}], ['helecho', .3], ['tinaja', .06]],
    bichos: ['chonchon', 'anchimallen', 'gualicho', 'cuero', 'kalku'], campeones: {kalku: 'El Kalku', cuero: 'El Cuero Uñudo', gualicho: 'El Gualicho'}},
  salamanca: {n: 'La Salamanca', sub: 'La cueva de Mandinga', c: [SALA.x, SALA.z], w: 0, lv: [24, 26], tr: 'a4', jefe: 'mandinga',
    pueblo: null, guarida: {x: SALA.x, z: SALA.z - 12, n: 'El trono de Mandinga'},
    deco: [['estal', .9], ['pilarH', .5], ['losa', .3], ['caldero', .25], ['craneo', .06]],
    bichos: ['condenado', 'bruja', 'chivo', 'basilisco', 'culebron'], campeones: {chivo: 'El Chivo Hediondo', culebron: 'El Culebrón', basilisco: 'El Basilisco Ciego'}},
};
export const ORDEN = ['pampa', 'ibera', 'monte', 'ingenio', 'selva', 'cuyo', 'puna', 'sur', 'salamanca'];
export const RELIQUIAS = ORDEN.filter(r => r !== 'salamanca');

// ---------- bordes del mundo ----------
// oeste: la cordillera. este: la selva del lado de Brasil y, más abajo, el mar.
export function bordeX(z) {
  const o = -234 + 15 * (fbm(z * .024, 3, 1) - .5) + (z > 140 ? (z - 140) * .12 : 0);
  let e; if (z < -35) e = 234 + 10 * (fbm(z * .03, 9, 2) - .5);
  else { const t = clamp((z + 35) / 335, 0, 1); e = lerp(226, 20, t * t * .9 + t * .1) + 13 * (fbm(z * .024, 5, 2) - .5); }
  return [o, e];
}
export function dentro(x, z, m = 0) { if (z < NORTE + m || z > SUR - m) return false; const [o, e] = bordeX(z); return x > o + m && x < e - m; }

// ---------- agua ----------
const RIOS = [
  {n: 'Río Paraná', w: 4.4, p: [[159, -300], [146, -240], [129, -165], [100, -95], [80, -30], [98, 25], [150, 54], [210, 60]]},
  {n: 'Río Bermejo', w: 2.9, p: [[-55, -300], [-30, -250], [20, -215], [60, -150], [100, -95]]},
  {n: 'Río Salado', w: 2.4, p: [[-100, -20], [-65, 30], [-20, 60], [5, 125], [45, 155], [100, 145]]},
  {n: 'Río Mendoza', w: 2.4, p: [[-235, -10], [-190, 10], [-160, 40], [-130, 70]]},
  {n: 'Río Negro', w: 3.7, p: [[-220, 165], [-160, 172], [-90, 165], [-20, 175], [40, 185]]},
  {n: 'Río Dulce', w: 2.4, p: [[-70, -240], [-72, -175], [-88, -110], [-95, -45], [-100, -20]]},
];
for (const r of RIOS) { const xs = r.p.map(p => p[0]), zs = r.p.map(p => p[1]); r.bb = [Math.min(...xs) - 20, Math.max(...xs) + 20, Math.min(...zs) - 20, Math.max(...zs) + 20]; }
const LAGOS = [
  {x: 142, z: -62, r: 15}, {x: 125, z: -80, r: 9}, {x: 156, z: -85, r: 8}, {x: 150, z: -47, r: 7}, {x: 120, z: -60, r: 6},
  {x: 182, z: -122, r: 12, hondo: 1}, {x: -5, z: 30, r: 8}, {x: 78, z: 125, r: 7}, {x: -165, z: 235, r: 20, hondo: 1},
  {x: -125, z: -260, r: 7}, {x: -190, z: 130, r: 9, hondo: 1}, {x: -10, z: 235, r: 8},
];
export function agua(x, z) {
  const [, e] = bordeX(z); if (x > e - 1) return 1.5;
  let d = 0; const n = (ruido(x * .08, z * .08, 41) - .5) * 1.6;
  for (const r of RIOS) { if (x < r.bb[0] || x > r.bb[1] || z < r.bb[2] || z > r.bb[3]) continue; const k = dLinea(x, z, r.p) + n; const v = clamp((r.w - k) / (r.w * .55), 0, 1); if (v > d) d = v; }
  for (const l of LAGOS) { const dx = x - l.x, dz = z - l.z; if (dx > l.r + 6 || dx < -l.r - 6 || dz > l.r + 6 || dz < -l.r - 6) continue; const k = Math.sqrt(dx * dx + dz * dz) + n * 3 * (fbm(x * .05, z * .05, 3) - .3); const v = clamp((l.r - k) / 4, 0, 1) * (l.hondo ? 1.5 : 1); if (v > d) d = v; }
  return d;
}
// el agua frena; la honda (más de 1) no se puede cruzar
export const velAgua = a => a > 1.05 ? 0 : 1 - .45 * Math.min(1, a);

// ---------- territorio en cada punto ----------
const RL = ORDEN.filter(k => k !== 'salamanca').map(k => ({k, x: REG[k].c[0], z: REG[k].c[1], w: REG[k].w}));
export function regionEn(x, z) {
  const dx = x - SALA.x, dz = z - SALA.z; if (dx * dx + dz * dz < SALA.r * SALA.r) return 'salamanca';
  const wx = x + (fbm(x * .012, z * .012, 11) - .5) * 60, wz = z + (fbm(x * .012, z * .012, 23) - .5) * 60;
  let b = 'pampa', bd = 1e12; for (const r of RL) { const d = ((wx - r.x) ** 2 + (wz - r.z) ** 2) / (r.w * r.w); if (d < bd) { bd = d; b = r.k; } }
  return b;
}
// nivel de los bichos: suben a medida que te alejás del pueblo
export function nivelEn(x, z, rg = regionEn(x, z)) {
  const R = REG[rg], p = R.pueblo || SALA; const d = Math.hypot(x - p.x, z - p.z);
  return Math.round(lerp(R.lv[0], R.lv[1], clamp((d - 25) / 115, 0, 1)));
}

// ---------- caminos ----------
const P = k => [REG[k].pueblo.x, REG[k].pueblo.z];
const TRAMOS = [['pampa', 'ibera'], ['pampa', 'cuyo'], ['pampa', 'sur'], ['ibera', 'selva'], ['ibera', 'monte'], ['monte', 'ingenio'], ['ingenio', 'puna'], ['cuyo', 'ingenio'], ['cuyo', 'sur']];
export const CAMINOS = TRAMOS.map(([a, b], i) => {
  const A = P(a), Bp = P(b), q = mul(hash(i, 3, 99)), pts = [A];
  const n = Math.max(2, Math.round(Math.hypot(Bp[0] - A[0], Bp[1] - A[1]) / 40));
  for (let k = 1; k < n; k++) { const t = k / n, nx = -(Bp[1] - A[1]), nz = Bp[0] - A[0], l = Math.hypot(nx, nz); const o = (q() - .5) * 24; pts.push([lerp(A[0], Bp[0], t) + nx / l * o, lerp(A[1], Bp[1], t) + nz / l * o]); }
  pts.push(Bp); return {a, b, p: pts};
});
CAMINOS.push({a: 'pampa', b: 'salamanca', p: [P('pampa'), [0, 45], [-22, 5], [SALA.puerta.x, SALA.puerta.z + 4]]});
for (const c of CAMINOS) { const xs = c.p.map(p => p[0]), zs = c.p.map(p => p[1]); c.bb = [Math.min(...xs) - 12, Math.max(...xs) + 12, Math.min(...zs) - 12, Math.max(...zs) + 12]; }
export function camino(x, z) { let d = 99; for (const c of CAMINOS) { if (x < c.bb[0] || x > c.bb[1] || z < c.bb[2] || z > c.bb[3]) continue; const k = dLinea(x, z, c.p); if (k < d) d = k; } return d; }

// ---------- pueblos, guaridas y lugares ----------
// en cada pueblo: fogón (se guarda y se viaja), pulpería, herrería y gente con misiones
const ESTILO = {
  pampa: {casa: 'rancho', extra: [['molino', 1], ['aljibe', 1], ['ombu', 1], ['parva', 2], ['horno', 1]]},
  ibera: {casa: 'rancho', extra: [['palmera', 4], ['canoa', 2], ['aljibe', 1]]},
  monte: {casa: 'rancho', extra: [['quebracho', 3], ['horno', 1], ['tacuru', 1]]},
  ingenio: {casa: 'galpon', extra: [['chimenea', 1], ['vagon', 2], ['bagazo', 2]]},
  selva: {casa: 'rancho', extra: [['ruina', 2], ['columna', 3], ['arbolote', 2]]},
  cuyo: {casa: 'rancho', extra: [['tonel', 3], ['alamo', 4], ['difunta', 1]]},
  puna: {casa: 'rancho', extra: [['capilla', 1], ['cardon', 3], ['apachetaD', 1]]},
  sur: {casa: 'rancho', extra: [['lenga', 3], ['rehue', 1], ['kultrunD', 1]]},
};
export const PUEBLOS = [], FIJOS = [], NPCS = [], LUGARES = [];
const fijo = (t, x, z, ry = 0, s = 1, o = {}) => FIJOS.push({t, x, z, ry, s, ...o});
for (const k of ORDEN) {
  const R = REG[k]; if (!R.pueblo) continue; const p = R.pueblo, E = ESTILO[k], q = mul(hash(p.x, p.z, 7));
  PUEBLOS.push({id: k, n: p.n, x: p.x, z: p.z, r: 30});
  fijo('fogon', p.x, p.z); fijo('llama', p.x, p.z);
  // casas alrededor, mirando al fogón
  const casas = k === 'ingenio' ? 3 : 4;
  for (let i = 0; i < casas; i++) { const a = i / casas * Math.PI * 2 + .5; const r = 19 + q() * 3; fijo(i === 0 ? 'rancho' : E.casa, p.x + Math.sin(a) * r, p.z + Math.cos(a) * r, a + Math.PI); }
  fijo('hereria', p.x + 10, p.z - 6, .4);
  let j = 0; for (const [t, n] of E.extra) for (let i = 0; i < n; i++) { const a = (j++ * 2.399) + 1.1, r = 25 + q() * 5; fijo(t, p.x + Math.sin(a) * r, p.z + Math.cos(a) * r, q() * 6.28); }
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; if (i % 7 === 3) continue; fijo('poste', p.x + Math.sin(a) * 31, p.z + Math.cos(a) * 31, a); }
  // gente: en cada pueblo los mismos oficios, en la misma ubicación
  const a0 = .5, gen = (rol, a, r) => NPCS.push({id: k + ':' + rol, reg: k, rol, x: p.x + Math.sin(a) * r, z: p.z + Math.cos(a) * r, ry: a + Math.PI});
  gen('pulpero', a0, 14.5); gen('herrero', .95, 10.5); gen('vecino', a0 + Math.PI / 2, 14.5); gen('baqueano', a0 + Math.PI, 14.5); gen('cantor', a0 + Math.PI * 1.5, 14.5); gen('posta', -2.6, 4.2);
}
export const GUARIDAS = ORDEN.map(k => ({reg: k, jefe: REG[k].jefe, x: REG[k].guarida.x, z: REG[k].guarida.z, n: REG[k].guarida.n, r: 20}));

// ---------- relieve ----------
// La altura del piso sale de una grilla de 2 m que se arma una sola vez, igual en el servidor y en cada pantalla.
// Llanura en la pampa, esteros bajos, la puna alta, mesetas escalonadas en la Patagonia y sierras entre territorios,
// con abras donde pasan los caminos. Los ríos van por el fondo de sus valles. Lo muy empinado no se sube caminando.
export const GR = {x0: -262, z0: NORTE - 30, res: 2, w: 262, h: 330};
const BASE = {pampa: 0, ibera: -.4, monte: .8, ingenio: 2.8, selva: 4.8, cuyo: 5.6, puna: 10.5, sur: 3.4};
const RUGA = {pampa: .9, ibera: .2, monte: .5, ingenio: 1.6, selva: 4, cuyo: 2.2, puna: 2.4, sur: 2.6};
const CRESTA = {pampa: 0, ibera: 0, monte: 0, ingenio: .4, selva: .5, cuyo: 1.8, puna: 2.6, sur: .4};
// qué tan alta es la sierra en el límite entre dos territorios
const SIERRA = {'cuyo|pampa': 8, 'pampa|sur': 7.5, 'ingenio|puna': 9, 'cuyo|puna': 11, 'cuyo|ingenio': 8, 'cuyo|sur': 7, 'monte|selva': 6, 'ibera|selva': 4.5,
  'ingenio|monte': 4, 'monte|puna': 8, 'ingenio|selva': 6, 'ibera|monte': 1.5, 'ibera|pampa': 2, 'monte|pampa': 2.5, 'ingenio|pampa': 3};
// cerros que se ven de lejos
export const CERROS = [
  {id: 'colores', n: 'Cerro de los Siete Colores', x: -88, z: -262, r: 20, h: 10},
  {id: 'ventana', n: 'Sierra de la Ventana', x: -58, z: 124, r: 13, h: 9},
  {id: 'uritorco', n: 'Cerro Uritorco', x: -95, z: 52, r: 15, h: 8},
  {id: 'champaqui', n: 'Cerro Champaquí', x: -205, z: -88, r: 18, h: 9},
];
export const SALAR = {x: -200, z: -226, r: 26};
export let SALTO = null; // las cataratas, donde el Paraná baja de la selva
let ALT = null, RIS = null, RGI = null, CAMG = null, AGUG = null, PEN = null;
const sst = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
function baseEn(x, z, D) {
  const wx = x + (fbm(x * .012, z * .012, 11) - .5) * 60, wz = z + (fbm(x * .012, z * .012, 23) - .5) * 60; let d1 = 1e9;
  for (let i = 0; i < RL.length; i++) { const r = RL[i]; D[i] = Math.sqrt((wx - r.x) ** 2 + (wz - r.z) ** 2) / r.w; if (D[i] < d1) d1 = D[i]; }
  let sw = 0, b = 0; for (let i = 0; i < RL.length; i++) { const e = Math.exp(-(D[i] - d1) / 14); sw += e; b += e * BASE[RL[i].k]; } return b / sw;
}
// distancia a lo largo de una línea (para saber qué está aguas arriba del salto)
function largo(px, pz, pts) { let d = 1e9, L = 0, Lb = 0; for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1], dx = bx - ax, dz = bz - az, l = Math.hypot(dx, dz); let t = ((px - ax) * dx + (pz - az) * dz) / (l * l); t = clamp(t, 0, 1); const e = Math.hypot(ax + dx * t - px, az + dz * t - pz); if (e < d) { d = e; Lb = L + t * l; } L += l; } return Lb; }
function buscarSalto() {
  const R = RIOS[0], p = R.p; let L = 0, antes = null;
  for (let i = 0; i < p.length - 1; i++) { const [ax, az] = p[i], [bx, bz] = p[i + 1], l = Math.hypot(bx - ax, bz - az); for (let s = 0; s < l; s += 2) { const x = ax + (bx - ax) * s / l, z = az + (bz - az) * s / l, r = regionEn(x, z); if (antes === 'selva' && r !== 'selva') { const k = Math.max(0, s - 14); return {x: ax + (bx - ax) * k / l, z: az + (bz - az) * k / l, dx: (bx - ax) / l, dz: (bz - az) / l, t: L + k, alto: 5, w: R.w * 2.6}; } antes = r; } L += l; }
  return null;
}
function crudo(x, z, D, O) {
  const wx = x + (fbm(x * .012, z * .012, 11) - .5) * 60, wz = z + (fbm(x * .012, z * .012, 23) - .5) * 60;
  let d1 = 1e9, d2 = 1e9, i1 = 0, i2 = 0;
  for (let i = 0; i < RL.length; i++) { const r = RL[i], d = Math.sqrt((wx - r.x) ** 2 + (wz - r.z) ** 2) / r.w; D[i] = d; if (d < d1) { d2 = d1; i2 = i1; d1 = d; i1 = i; } else if (d < d2) { d2 = d; i2 = i; } }
  let sw = 0, b = 0, ru = 0, cr = 0, ws = 0;
  for (let i = 0; i < RL.length; i++) { const e = Math.exp(-(D[i] - d1) / 14), k = RL[i].k; sw += e; b += e * BASE[k]; ru += e * RUGA[k]; cr += e * CRESTA[k]; if (k === 'sur') ws = e; }
  b /= sw; ru /= sw; cr /= sw; ws /= sw;
  const cam = camino(x, z), kc = sst(2, 12, cam); if (O) { O.cam = cam; O.reg = RL[i1].k; }
  const n1 = fbm(x * .028, z * .028, 51) - .5, n2 = 1 - Math.abs(fbm(x * .05, z * .05, 61, 3) * 2 - 1);
  let hn = ru * n1 * 4 + cr * n2 * n2 * n2 * 3;
  // mesetas: la Patagonia sube en escalones
  if (ws > .01) { const st = 1.7, v = hn + 3, f = v / st - Math.floor(v / st); hn = lerp(hn, st * (Math.floor(v / st) + sst(.7, 1, f)) - 3, ws); }
  hn *= .35 + .65 * kc;
  // sierras en los límites, con abras
  const m = (d2 - d1) * .5 * (RL[i1].w + RL[i2].w); let rid = 0;
  if (m < 22) { const a = RL[i1].k, c = RL[i2].k, H = SIERRA[a < c ? a + '|' + c : c + '|' + a] ?? 3, s = 1 - m / 22, pr = s * s * (3 - 2 * s);
    rid = H * pr * sst(.36, .5, fbm(x * .016, z * .016, 71, 3)) * (.6 + .8 * fbm(x * .045, z * .045, 73, 3)) * sst(5, 16, cam); }
  let h = b + hn + rid;
  for (const C of CERROS) { const dx = x - C.x, dz = z - C.z, q = (dx * dx + dz * dz) / (C.r * C.r); if (q < 9) h += C.h * Math.exp(-q * 1.6) * (.6 + .9 * n2 * n2 + .25 * fbm(x * .2, z * .2, 81, 2)); }
  { const dx = x - SALAR.x, dz = z - SALAR.z, d = Math.hypot(dx, dz); if (d < SALAR.r + 14) h = lerp(h, b - .2, sst(SALAR.r + 14, SALAR.r, d)); }
  // los ríos van por el fondo de su valle; el agua honda, más abajo
  const nn = (ruido(x * .08, z * .08, 41) - .5) * 1.6; let v = 0, bed = 0;
  for (let ri = 0; ri < RIOS.length; ri++) { const r = RIOS[ri]; if (x < r.bb[0] || x > r.bb[1] || z < r.bb[2] || z > r.bb[3]) continue; const k = dLinea(x, z, r.p) + nn; const q = clamp((r.w + 10 - k) / 9.5, 0, 1), vv = q * q * (3 - 2 * q);
    if (vv > v) { v = vv; bed = b - 1.1; if (ri === 0 && SALTO) { const t = largo(x, z, r.p), piso = SALTO.bajo + (SALTO.bed - SALTO.bajo) * sst(SALTO.t + 30, SALTO.t + 150, t); bed = lerp(bed, Math.min(bed, piso), sst(SALTO.t - .8, SALTO.t + .8, t)); } } }
  for (const l of LAGOS) { const dx = x - l.x, dz = z - l.z; if (Math.abs(dx) > l.r + 12 || Math.abs(dz) > l.r + 12) continue; const k = Math.sqrt(dx * dx + dz * dz) + nn * 3 * (fbm(x * .05, z * .05, 3) - .3); const q = clamp((l.r + 9 - k) / 8.5, 0, 1), vv = q * q * (3 - 2 * q); if (vv > v) { v = vv; bed = b - (l.hondo ? 1.8 : 1.1); } }
  if (v > 0) h = lerp(h, bed, v);
  // el mar al este, la cordillera al oeste y al norte
  const [o, e] = bordeX(z); if (x > e - 14) h = lerp(h, -1.4, sst(e - 14, e - 1, x)); if (x < o) h += Math.min(26, (o - x) * .7); if (z < NORTE) h += Math.min(26, (NORTE - z) * .6);
  return h;
}
function armarRelieve() {
  const G = GR, N = G.w * G.h, D = new Float64Array(RL.length), O = {};
  ALT = new Float32Array(N); RIS = new Uint8Array(N); PEN = new Uint8Array(N); RGI = new Uint8Array(N); CAMG = new Float32Array(N); AGUG = new Float32Array(N);
  SALTO = buscarSalto(); if (SALTO) { SALTO.bed = baseEn(SALTO.x, SALTO.z, D) - 1.1; SALTO.bajo = SALTO.bed - SALTO.alto; }
  // la altura de los pueblos, las guaridas y la Salamanca, para emparejar el piso alrededor
  const llano = [...PUEBLOS.map(p => ({x: p.x, z: p.z, a: 32, b: 46})), ...GUARIDAS.filter(g => g.reg !== 'salamanca').map(g => ({x: g.x, z: g.z, a: 20, b: 30}))]; for (const l of llano) l.h = crudo(l.x, l.z, D);
  const idx = Object.fromEntries(ORDEN.map((k, i) => [k, i]));
  for (let j = 0; j < G.h; j++) for (let i = 0; i < G.w; i++) {
    const x = G.x0 + (i + .5) * G.res, z = G.z0 + (j + .5) * G.res, k = j * G.w + i;
    let h = crudo(x, z, D, O);
    for (const l of llano) { const dx = x - l.x, dz = z - l.z; if (Math.abs(dx) > l.b || Math.abs(dz) > l.b) continue; const d = Math.hypot(dx, dz); if (d < l.b) h = lerp(h, l.h, sst(l.b, l.a, d)); }
    // la Salamanca: un cráter con una sola entrada al sur
    const sx = x - SALA.x, sz = z - SALA.z, ds = Math.hypot(sx, sz);
    if (ds < SALA.r + 14) { const R = SALA.r; if (ds < R) h = lerp(-1.6, h, sst(R - 15, R, ds)); const t = (ds - R) / 7; let rim = t > -1 && t < 1 ? 8.5 * (1 - t * t) ** 2 : 0; if (sz > 25) rim *= sst(4, 10, Math.abs(sx)); h += rim * (.85 + .3 * fbm(x * .15, z * .15, 91, 2)); }
    ALT[k] = h; CAMG[k] = O.cam; AGUG[k] = agua(x, z);
    RGI[k] = idx[!dentro(x, z, -40) ? (z > 0 ? 'sur' : x < 0 ? 'puna' : 'selva') : ds < SALA.r ? 'salamanca' : O.reg];
  }
  for (let j = 1; j < G.h - 1; j++) for (let i = 1; i < G.w - 1; i++) { const k = j * G.w + i, gx = (ALT[k + 1] - ALT[k - 1]) / (2 * G.res), gz = (ALT[k + G.w] - ALT[k - G.w]) / (2 * G.res); const g2 = gx * gx + gz * gz; RIS[k] = g2 > 1.05 ? 1 : 0; PEN[k] = Math.min(255, Math.sqrt(g2) * 100); }
}
export function relieve() { if (!ALT) armarRelieve(); return {ALT, RIS, RGI, CAMG, AGUG, PEN}; }
// pendiente del piso (0 = llano, 1 = 45 grados)
export function pendiente(x, z) { if (!ALT) armarRelieve(); const G = GR, i = clamp(Math.floor((x - G.x0) / G.res), 0, G.w - 1), j = clamp(Math.floor((z - G.z0) / G.res), 0, G.h - 1); return PEN[j * G.w + i] / 100; }
// altura del piso en cualquier punto (entre las cuatro celdas más cercanas)
export function alto(x, z) {
  if (!ALT) armarRelieve(); const G = GR; let fx = (x - G.x0) / G.res - .5, fz = (z - G.z0) / G.res - .5;
  fx = fx < 0 ? 0 : fx > G.w - 1.001 ? G.w - 1.001 : fx; fz = fz < 0 ? 0 : fz > G.h - 1.001 ? G.h - 1.001 : fz;
  const i = fx | 0, j = fz | 0, tx = fx - i, tz = fz - j, k = j * G.w + i, A = ALT;
  return (A[k] + (A[k + 1] - A[k]) * tx) * (1 - tz) + (A[k + G.w] + (A[k + G.w + 1] - A[k + G.w]) * tx) * tz;
}
// muy empinado para subir caminando
export function empinado(x, z) { if (!ALT) armarRelieve(); const G = GR, i = Math.floor((x - G.x0) / G.res), j = Math.floor((z - G.z0) / G.res); if (i < 1 || j < 1 || i >= G.w - 1 || j >= G.h - 1) return false; return RIS[j * G.w + i] === 1; }
// hay algo empinado cerca (para no poner cosas al pie de un barranco)
export function barranco(x, z, r) { for (let a = 0; a < 8; a++) if (empinado(x + Math.sin(a * .785) * r, z + Math.cos(a * .785) * r)) return true; return empinado(x, z); }
// adornos alrededor de cada guarida
const ANILLO = {pampa: 'tapera', ibera: 'junco', monte: 'tronco', ingenio: 'bagazo', selva: 'columna', cuyo: 'penasco', puna: 'apachetaD', sur: 'chenque', salamanca: 'caldero'};
for (const g of GUARIDAS) { const n = 9; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; fijo(ANILLO[g.reg], g.x + Math.sin(a) * 23, g.z + Math.cos(a) * 23, a + Math.PI / 2); } fijo('craneo', g.x + 6, g.z - 26, 3.1); }
// el cerco de la Salamanca: piedras en redondo con una sola entrada al sur
for (let i = 0; i < 64; i++) { const a = i / 64 * Math.PI * 2; if (Math.abs(a - Math.PI * 2) < .13 || a < .13) continue; const x = SALA.x + Math.sin(a) * SALA.r, z = SALA.z + Math.cos(a) * SALA.r; fijo(i % 3 ? 'estal' : 'penasco', x, z, a, 1 + (i % 4) * .08); }
fijo('antorcha', SALA.puerta.x - 6, SALA.puerta.z); fijo('antorcha', SALA.puerta.x + 6, SALA.puerta.z); fijo('cara', SALA.puerta.x, SALA.puerta.z - 4);
// lugares: santuarios (curan), entierros (plata de noche) y apachetas (suerte)
{
  const q = mul(1234); let id = 0;
  for (const c of CAMINOS) for (let i = 1; i < c.p.length - 1; i++) { const [x, z] = c.p[i]; const ox = (q() > .5 ? 1 : -1) * 6; LUGARES.push({id: id++, tipo: regionEn(x, z) === 'cuyo' ? 'difunta' : 'santuario', x: x + ox, z: z + 3}); }
  for (const k of RELIQUIAS) { const R = REG[k]; for (let i = 0; i < 3; i++) { let x, z, t = 0; do { const a = q() * 6.28, r = 30 + q() * 75; x = R.c[0] + Math.sin(a) * r; z = R.c[1] + Math.cos(a) * r; } while ((t++ < 40) && (!dentro(x, z, 15) || regionEn(x, z) !== k || agua(x, z) > 0 || camino(x, z) < 8 || barranco(x, z, 3))); LUGARES.push({id: id++, tipo: 'entierro', x, z}); } }
  for (let i = 0; i < 5; i++) { const R = REG.puna; const a = i * 1.3, r = 25 + i * 12; LUGARES.push({id: id++, tipo: 'apacheta', x: R.c[0] + Math.sin(a) * r, z: R.c[1] + Math.cos(a) * r}); }
  for (const l of LUGARES) { if (l.tipo === 'santuario') fijo('santuario', l.x, l.z, 0, 1, {misc: 1}); else if (l.tipo === 'difunta') fijo('difunta', l.x, l.z); else if (l.tipo === 'apacheta') fijo('apachetaP', l.x, l.z); else fijo('entierro', l.x, l.z, l.id); }
}

// ---------- carteles: donde un camino entra a otro territorio, un poste con flechas ----------
export const CARTELES = [];
for (const c of CAMINOS) {
  if (c.b === 'salamanca') continue; let antes = regionEn(...c.p[0]);
  for (let i = 0; i < c.p.length - 1; i++) { const [ax, az] = c.p[i], [bx, bz] = c.p[i + 1], l = Math.hypot(bx - ax, bz - az);
    for (let s = 0; s < l; s += 3) { const x = ax + (bx - ax) * s / l, z = az + (bz - az) * s / l, r = regionEn(x, z); if (r !== antes && r !== 'salamanca' && antes !== 'salamanca') { const nx = -(bz - az) / l, nz = (bx - ax) / l; CARTELES.push({x: x + nx * 4, z: z + nz * 4, de: antes, a: r, c, ry: Math.atan2(bx - ax, bz - az) + Math.PI / 2}); } antes = r; } }
}
for (const k of CARTELES) fijo('cartel', k.x, k.z, k.ry);

// ---------- campamentos de bichos ----------
export const CAMPOS = [];
{
  // más juntos en los territorios chicos del norte y más sueltos en la pampa y la Patagonia
  const G = 26, K = {pampa: .5, sur: .55, cuyo: .75}; let id = 0;
  for (let gz = Math.floor(NORTE / G); gz <= Math.ceil(SUR / G); gz++) for (let gx = -10; gx <= 10; gx++) {
    const q = mul(hash(gx, gz, 5)); const x = gx * G + (q() - .5) * G * .8, z = gz * G + (q() - .5) * G * .8;
    if (!dentro(x, z, 10) || agua(x, z) > .2 || camino(x, z) < 7 || barranco(x, z, 5)) continue;
    if (q() > (K[regionEn(x, z)] ?? 1)) continue;
    if (PUEBLOS.some(p => Math.hypot(p.x - x, p.z - z) < p.r + 18)) continue;
    if (GUARIDAS.some(g => Math.hypot(g.x - x, g.z - z) < 42)) continue;
    const ds = Math.hypot(x - SALA.x, z - SALA.z); if (ds > SALA.r - 14 && ds < SALA.r + 16) continue;
    const reg = regionEn(x, z), R = REG[reg], lv = nivelEn(x, z, reg), t = (lv - R.lv[0]) / Math.max(1, R.lv[1] - R.lv[0]);
    const B = R.bichos, i = clamp(Math.floor(t * B.length + (q() - .5) * 2), 0, B.length - 1);
    const tipos = [B[i]]; if (q() < .45 && i > 0) tipos.push(B[Math.floor(q() * i)]);
    const camp = q() < .12 && R.campeones[B[i]] ? B[i] : null;
    CAMPOS.push({id: id++, x, z, reg, lv, tipos, camp, q: hash(gx, gz, 6)});
  }
  // adentro de la Salamanca, una ronda de campamentos alrededor del trono
  const B = REG.salamanca.bichos;
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + .4, x = SALA.x + Math.sin(a) * 34, z = SALA.z + Math.cos(a) * 34; if (Math.abs(a - Math.PI * 2) < .5 || Math.hypot(x - SALA.x, z - SALA.z + 12) < 30) continue;
    CAMPOS.push({id: id++, x, z, reg: 'salamanca', lv: 24 + (i % 2), tipos: [B[i % B.length], B[(i + 2) % B.length]], camp: i % 3 === 0 ? B[2 + i % 3] : null, q: hash(i, 0, 66)}); }
}

// ---------- obstáculos por pedazos de 32 m ----------
const DENS = .8;
const fijosCh = new Map();
for (const o of FIJOS) { const k = Math.floor(o.x / CH) + ',' + Math.floor(o.z / CH); (fijosCh.get(k) || fijosCh.set(k, []).get(k)).push(prep(o)); }
function prep(o) { const d = KITR[o.t] || [0, 0, 0, 0]; return {...o, r: d[0] * o.s, len: d[1] * o.s, low: d[2], tall: d[3], cx: Math.cos(o.ry), cz: -Math.sin(o.ry)}; }
const cache = new Map();
function libre(x, z, r, wet) {
  if (!dentro(x, z, 3 + r)) return false;
  const a = agua(x, z); if (wet ? a < .35 || a > 1 : a > .05) return false;
  if (camino(x, z) < 3.2 + r) return false;
  if (r > 0 && empinado(x, z)) return false;
  for (const p of PUEBLOS) if (Math.abs(p.x - x) < 40 && Math.abs(p.z - z) < 40 && Math.hypot(p.x - x, p.z - z) < p.r + 4 + r) return false;
  for (const g of GUARIDAS) if (Math.abs(g.x - x) < 30 && Math.abs(g.z - z) < 30 && Math.hypot(g.x - x, g.z - z) < g.r + 1 + r) return false;
  const ds = Math.hypot(x - SALA.x, z - SALA.z); if (ds > SALA.r - 5 - r && ds < SALA.r + 5 + r) return false;
  if (Math.abs(x - SALA.puerta.x) < 8 && z > SALA.puerta.z - 20 && z < SALA.puerta.z + 30) return false;
  return true;
}
export function pedazo(cx, cz) {
  const key = cx + ',' + cz; let L = cache.get(key); if (L) return L;
  L = (fijosCh.get(key) || []).slice(); const x0 = cx * CH, z0 = cz * CH, q = mul(hash(cx, cz, 77));
  const regs = new Set([regionEn(x0 + 4, z0 + 4), regionEn(x0 + CH - 4, z0 + 4), regionEn(x0 + 4, z0 + CH - 4), regionEn(x0 + CH - 4, z0 + CH - 4), regionEn(x0 + CH / 2, z0 + CH / 2)]);
  const camps = CAMPOS.filter(c => c.x > x0 - 8 && c.x < x0 + CH + 8 && c.z > z0 - 8 && c.z < z0 + CH + 8);
  for (const rg of regs) for (const [t, dn, o = {}] of REG[rg].deco) {
    let n = dn * DENS * CH * CH / 1000; n = Math.floor(n) + (q() < n % 1 ? 1 : 0);
    const kr = KITR[t] || [0, 0]; const big = kr[0] + kr[1];
    for (let i = 0; i < n; i++) {
      const s = .85 + q() * .35, x = x0 + q() * CH, z = z0 + q() * CH, ry = q() * 6.28, r = big * s;
      if (regionEn(x, z) !== rg || (o.sur && z < 235) || !libre(x, z, r, o.wet)) continue;
      if (r > 0 && camps.some(c => Math.hypot(c.x - x, c.z - z) < 5 + r)) continue;
      if (r > 0 && L.some(b => b.r > 0 && Math.hypot(b.x - x, b.z - z) < r + b.r + b.len + 1.6)) continue;
      L.push(prep({t, x, z, ry, s}));
    }
  }
  if (cache.size > 3000) cache.delete(cache.keys().next().value);
  cache.set(key, L); return L;
}
// obstáculos que tocan un círculo
export function cerca(x, z, R, out = []) {
  out.length = 0; const a = Math.floor((x - R - 6) / CH), b = Math.floor((x + R + 6) / CH), c = Math.floor((z - R - 6) / CH), d = Math.floor((z + R + 6) / CH);
  for (let j = c; j <= d; j++) for (let i = a; i <= b; i++) for (const o of pedazo(i, j)) if (o.r > 0) out.push(o);
  return out;
}
const tmp = [];
// corre un círculo fuera de los obstáculos y del borde. salta: puede pasar por encima de los bajos.
// Si viene de (ox, oz), no lo deja meterse en un barranco: se desliza por el costado
export function chocar(p, r, salta = false, ox, oz, trepa) {
  cerca(p.x, p.z, r + 2, tmp);
  for (const o of tmp) {
    if (salta && o.low) continue;
    let ox = o.x, oz = o.z; if (o.len) { const t = clamp((p.x - o.x) * o.cx + (p.z - o.z) * o.cz, -o.len, o.len); ox += o.cx * t; oz += o.cz * t; }
    const dx = p.x - ox, dz = p.z - oz, R = o.r + r, d2 = dx * dx + dz * dz;
    if (d2 < R * R) { const d = Math.sqrt(d2) || .001; p.x = ox + dx / d * R; p.z = oz + dz / d * R; }
  }
  if (p.z < NORTE + 2) p.z = NORTE + 2; if (p.z > SUR - 2) p.z = SUR - 2;
  const [o, e] = bordeX(p.z); if (p.x < o + 2) p.x = o + 2;
  if (ox !== undefined && !trepa && empinado(p.x, p.z) && !empinado(ox, oz)) { if (!empinado(p.x, oz)) p.z = oz; else if (!empinado(ox, p.z)) p.x = ox; else { p.x = ox; p.z = oz; } }
  if (agua(p.x, p.z) > 1.05 || p.x > e - 1) return false;
  return true;
}
export const enPueblo = (x, z, m = 0) => PUEBLOS.find(p => Math.abs(p.x - x) < p.r + m && Math.abs(p.z - z) < p.r + m && Math.hypot(p.x - x, p.z - z) < p.r + m);

// ---------- parajes: cada territorio dividido en lugares con nombre (como los barrios de un mapa grande) ----------
export const PARAJES = [
  ['pampa', 'Pueblo Ombú', 32, 95], ['pampa', 'La Cañada de las Ánimas', -5, 40], ['pampa', 'Lomas del Tala', 82, 52], ['pampa', 'Laguna del Sauce', 78, 128], ['pampa', 'Estancia La Perdida', 120, 95],
  ['pampa', 'El rancho del séptimo hijo', 75, 192], ['pampa', 'Sierra de la Ventana', -50, 128], ['pampa', 'Camino de la Salamanca', -8, 10],
  ['ibera', 'Puerto Irupé', 125, -20], ['ibera', 'Laguna Iberá', 142, -62], ['ibera', 'Los Embalsados', 175, -45], ['ibera', 'El Malezal', 110, -110], ['ibera', 'El embalsado de Mbói Tu’ĩ', 165, -110], ['ibera', 'Esteros del Batel', 205, -85],
  ['monte', 'Paraje Quebrachal', 85, -200], ['monte', 'El Obraje Abandonado', 40, -158], ['monte', 'Bañado La Estrella', 70, -245], ['monte', 'Picada del Sachayoj', -8, -222], ['monte', 'El camino de la Alma Mula', 25, -268],
  ['ingenio', 'Villa Zafra', -125, -150], ['ingenio', 'Los Cañaverales', -75, -125], ['ingenio', 'La Vía Muerta', -60, -185], ['ingenio', 'La Casona del Patrón', -158, -136], ['ingenio', 'El galpón del Familiar', -185, -125],
  ['selva', 'Misión de las Ruinas', 175, -195], ['selva', 'Garganta del Diablo', 135, -175], ['selva', 'Tierra Colorada', 215, -175], ['selva', 'La Picada Guaraní', 214, -236], ['selva', 'La cueva del Teyú Yaguá', 190, -262],
  ['cuyo', 'Posta del Arriero', -142, 12], ['cuyo', 'Los Viñedos', -118, 42], ['cuyo', 'Mirador del Aconcagua', -212, -24], ['cuyo', 'Médanos del Zonda', -165, 72], ['cuyo', 'El paso del Futre', -190, -45], ['cuyo', 'Cerro Uritorco', -95, 52], ['cuyo', 'Cerro Champaquí', -205, -88],
  ['puna', 'Abra de las Apachetas', -115, -220], ['puna', 'Cerro de los Siete Colores', -88, -262], ['puna', 'Salinas Grandes', -200, -226], ['puna', 'Quebrada de las Flechas', -150, -200], ['puna', 'El nido de la Huayrapuca', -170, -268],
  ['sur', 'Fortín del Viento', -58, 210], ['sur', 'Lago del Arrayán', -165, 235], ['sur', 'Meseta de Somuncurá', -30, 255], ['sur', 'Bosque de Lengas', -192, 190], ['sur', 'Valle de los Chenques', -100, 178], ['sur', 'La meseta de Elëngásëm', -120, 258],
  ['salamanca', 'La Salamanca', SALA.x, SALA.z],
].map(([reg, n, x, z], id) => ({id, reg, n, x, z}));
for (const p of PARAJES) p.lv = [Math.max(REG[p.reg].lv[0], nivelEn(p.x, p.z, p.reg) - 1), Math.min(REG[p.reg].lv[1], nivelEn(p.x, p.z, p.reg) + 1)];
// el paraje de un punto: el más cercano de su territorio
export function parajeEn(x, z, rg = regionEn(x, z)) { let b = null, bd = 1e12; for (const p of PARAJES) { if (p.reg !== rg) continue; const d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < bd) { bd = d; b = p; } } return b; }
