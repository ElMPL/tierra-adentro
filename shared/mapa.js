// El mundo: una Argentina dibujada a mano con los 9 territorios de Noche de Salamanca.
// x crece hacia el este y z hacia el sur (el norte queda arriba en la pantalla).
// Todo sale de semillas fijas: el servidor y cada pantalla calculan el mismo mapa sin mandarlo por la red.
import {mul, hash, fbm, ruido, clamp, lerp, dLinea} from './azar.js';
import {KITR} from './kit.js';

export const NORTE = -600, SUR = 600, CH = 32;
export const SALA = {x: -60, z: -140, r: 72, puerta: {x: -60, z: -68}};

// ---------- territorios ----------
// bichos: de más débil a más fuerte. deco: [modelo, cantidad cada 1000 m², opciones]
export const REG = {
  pampa: {n: 'La Pampa', sub: 'Llanura sin fin', c: [40, 150], w: 1.3, lv: [1, 5], tr: 'a0', jefe: 'lobizon',
    pueblo: {n: 'Pueblo Ombú', x: 40, z: 190}, guarida: {x: 175, z: 330, n: 'El rancho del séptimo hijo'},
    deco: [['cortadera', 1.1], ['ombu', .045], ['parva', .16], ['tapera', .08], ['molino', .025], ['tronco', .1], ['tranquera', .05], ['tinaja', .07], ['barril', .05]],
    bichos: ['anima', 'luzmala', 'chancha', 'jinete', 'viuda'], campeones: {chancha: 'La Chancha con Cadenas', viuda: 'La Viuda del Andén', jinete: 'El Matrero sin Nombre'}},
  ibera: {n: 'Esteros del Iberá', sub: 'Agua que brilla, agua que traga', c: [275, -135], w: 1, lv: [5, 9], tr: 'a2', jefe: 'mboitui',
    pueblo: {n: 'Puerto Irupé', x: 215, z: -80}, guarida: {x: 345, z: -230, n: 'El embalsado de Mbói Tu’ĩ'},
    deco: [['palmera', .8], ['junco', 1.4], ['irupeD', 1.2, {wet: 1}], ['canoa', .12, {wet: 1}], ['tronco', .15], ['tinaja', .07], ['barril', .05]],
    bichos: ['mbarigui', 'carau', 'irupe', 'llorona', 'yacare'], campeones: {yacare: 'El Yacaré Viejo', llorona: 'La Madre Llorona', carau: 'El Carau Enlutado'}},
  monte: {n: 'El Impenetrable', sub: 'El monte te mira', c: [60, -395], w: 1, lv: [8, 12], tr: 'a1', jefe: 'almamula',
    pueblo: {n: 'Paraje Quebrachal', x: 95, z: -330}, guarida: {x: 0, z: -480, n: 'El camino de la Alma Mula'},
    deco: [['quebracho', 1.4], ['vinal', .55], ['paloB', .4], ['tacuru', .4], ['tronco', .5], ['helecho', 1.1], ['hongo', .8], ['tinaja', .07], ['barril', .05]],
    bichos: ['vinchuca', 'duende', 'kakuy', 'pombero', 'telesita', 'sachayoj'], campeones: {sachayoj: 'Sachayoj, dueño del monte', telesita: 'La Telesita', kakuy: 'La Kakuy'}},
  ingenio: {n: 'El Ingenio', sub: 'Azúcar, humo y pacto', c: [-175, -290], w: .95, lv: [11, 15], tr: 'ing', jefe: 'elfamiliar',
    pueblo: {n: 'Villa Zafra', x: -140, z: -245}, guarida: {x: -230, z: -360, n: 'El galpón del Familiar'},
    deco: [['cana', 1.3], ['bagazo', .3], ['vagon', .12], ['chimenea', .03], ['galpon', .025], ['tinaja', .08], ['barril', .08]],
    bichos: ['zafrero', 'mikilo', 'familiar', 'uturunco', 'capataz'], campeones: {capataz: 'El Capataz sin Sombra', uturunco: 'El Runa Uturunco'}},
  selva: {n: 'Selva Misionera', sub: 'Tierra colorada', c: [360, -445], w: .9, lv: [13, 17], tr: 'sel', jefe: 'teyu',
    pueblo: {n: 'Misión de las Ruinas', x: 320, z: -390}, guarida: {x: 415, z: -530, n: 'La cueva del Teyú Yaguá'},
    deco: [['arbolote', .6], ['tacuara', .7], ['helecho', 1.6], ['ruina', .25], ['columna', .08], ['tronco', .3], ['pena', .12], ['tinaja', .07]],
    bichos: ['aoao', 'kurupi', 'yasy', 'yaguarete', 'caapora'], campeones: {kurupi: 'Kurupí el Viejo', yasy: 'Yasy Yateré', caapora: 'Caá Porá'}},
  cuyo: {n: 'Cuyo y la Cordillera', sub: 'Viento blanco y uva', c: [-335, 0], w: 1, lv: [15, 19], tr: 'cuy', jefe: 'futre',
    pueblo: {n: 'Posta del Arriero', x: -285, z: 25}, guarida: {x: -405, z: -75, n: 'El paso del Futre'},
    deco: [['vid', .45], ['alamo', .3], ['penasco', .35], ['pirca', .2], ['tonel', .15], ['tapera', .08], ['pena', .25], ['tinaja', .06], ['barril', .06]],
    bichos: ['arriero', 'remolino', 'minero', 'condor', 'pericana'], campeones: {pericana: 'La Pericana', condor: 'El Cóndor Viejo', minero: 'El Minero Enterrado'}},
  puna: {n: 'La Puna y la Quebrada', sub: 'Cerros de siete colores', c: [-290, -500], w: .95, lv: [17, 21], tr: 'a3', jefe: 'huayrapuca',
    pueblo: {n: 'Abra de las Apachetas', x: -245, z: -455}, guarida: {x: -365, z: -560, n: 'El nido de la Huayrapuca'},
    deco: [['cardon', .7], ['pena', .55], ['pirca', .35], ['apachetaD', .12], ['tinaja', .07], ['barril', .04]],
    bichos: ['diablito', 'umita', 'ucumar', 'huaca'], campeones: {ucumar: 'El Ucumar de las Yungas', huaca: 'La Huaca Despierta', umita: 'La Umita Mayor'}},
  sur: {n: 'La Patagonia', sub: 'Viento, piedra y lago', c: [-165, 450], w: 1.2, lv: [19, 23], tr: 'sur', jefe: 'elengassen',
    pueblo: {n: 'Fortín del Viento', x: -115, z: 395}, guarida: {x: -250, z: 545, n: 'La meseta de Elëngásëm'},
    deco: [['coiron', 1.1], ['basalto', .3], ['lenga', .35], ['arrayan', .25], ['troncoP', .25], ['chenque', .08], ['hieloB', .15, {sur: 1}], ['helecho', .3], ['tinaja', .06]],
    bichos: ['chonchon', 'anchimallen', 'gualicho', 'cuero', 'kalku'], campeones: {kalku: 'El Kalku', cuero: 'El Cuero Uñudo', gualicho: 'El Gualicho'}},
  salamanca: {n: 'La Salamanca', sub: 'La cueva de Mandinga', c: [SALA.x, SALA.z], w: 0, lv: [24, 26], tr: 'a4', jefe: 'mandinga',
    pueblo: null, guarida: {x: SALA.x, z: SALA.z - 18, n: 'El trono de Mandinga'},
    deco: [['estal', .9], ['pilarH', .5], ['losa', .3], ['caldero', .25], ['craneo', .06]],
    bichos: ['condenado', 'bruja', 'chivo', 'basilisco', 'culebron'], campeones: {chivo: 'El Chivo Hediondo', culebron: 'El Culebrón', basilisco: 'El Basilisco Ciego'}},
};
export const ORDEN = ['pampa', 'ibera', 'monte', 'ingenio', 'selva', 'cuyo', 'puna', 'sur', 'salamanca'];
export const RELIQUIAS = ORDEN.filter(r => r !== 'salamanca');

// ---------- bordes del mundo ----------
// oeste: la cordillera. este: la selva del lado de Brasil y, más abajo, el mar.
export function bordeX(z) {
  const o = -468 + 30 * (fbm(z * .012, 3, 1) - .5) + (z > 280 ? (z - 280) * .12 : 0);
  let e; if (z < -70) e = 468 + 20 * (fbm(z * .015, 9, 2) - .5);
  else { const t = clamp((z + 70) / 670, 0, 1); e = lerp(452, 40, t * t * .9 + t * .1) + 26 * (fbm(z * .012, 5, 2) - .5); }
  return [o, e];
}
export function dentro(x, z, m = 0) { if (z < NORTE + m || z > SUR - m) return false; const [o, e] = bordeX(z); return x > o + m && x < e - m; }

// ---------- agua ----------
const RIOS = [
  {n: 'Río Paraná', w: 5.5, p: [[318, -600], [292, -480], [258, -330], [200, -190], [160, -60], [196, 50], [300, 108], [420, 120]]},
  {n: 'Río Bermejo', w: 3.6, p: [[-110, -600], [-60, -500], [40, -430], [120, -300], [200, -190]]},
  {n: 'Río Salado', w: 3, p: [[-200, -40], [-130, 60], [-40, 120], [10, 250], [90, 310], [200, 290]]},
  {n: 'Río Mendoza', w: 3, p: [[-470, -20], [-380, 20], [-320, 80], [-260, 140]]},
  {n: 'Río Negro', w: 4.6, p: [[-440, 330], [-320, 345], [-180, 330], [-40, 350], [80, 370]]},
  {n: 'Río Dulce', w: 3, p: [[-200, -440], [-150, -350], [-120, -220], [-130, -90], [-200, -40]]},
];
for (const r of RIOS) { const xs = r.p.map(p => p[0]), zs = r.p.map(p => p[1]); r.bb = [Math.min(...xs) - 20, Math.max(...xs) + 20, Math.min(...zs) - 20, Math.max(...zs) + 20]; }
const LAGOS = [
  {x: 285, z: -125, r: 26}, {x: 250, z: -160, r: 16}, {x: 312, z: -170, r: 14}, {x: 300, z: -95, r: 12}, {x: 240, z: -120, r: 10},
  {x: 365, z: -245, r: 20, hondo: 1}, {x: -10, z: 60, r: 13}, {x: 120, z: 230, r: 11}, {x: -330, z: 470, r: 36, hondo: 1},
  {x: -250, z: -520, r: 11}, {x: -380, z: 260, r: 16, hondo: 1}, {x: -20, z: 470, r: 14},
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
  const wx = x + (fbm(x * .006, z * .006, 11) - .5) * 120, wz = z + (fbm(x * .006, z * .006, 23) - .5) * 120;
  let b = 'pampa', bd = 1e12; for (const r of RL) { const d = ((wx - r.x) ** 2 + (wz - r.z) ** 2) / (r.w * r.w); if (d < bd) { bd = d; b = r.k; } }
  return b;
}
// nivel de los bichos: suben a medida que te alejás del pueblo
export function nivelEn(x, z, rg = regionEn(x, z)) {
  const R = REG[rg], p = R.pueblo || SALA; const d = Math.hypot(x - p.x, z - p.z);
  return Math.round(lerp(R.lv[0], R.lv[1], clamp((d - 40) / 230, 0, 1)));
}

// ---------- caminos ----------
const P = k => [REG[k].pueblo.x, REG[k].pueblo.z];
const TRAMOS = [['pampa', 'ibera'], ['pampa', 'cuyo'], ['pampa', 'sur'], ['ibera', 'selva'], ['ibera', 'monte'], ['monte', 'ingenio'], ['ingenio', 'puna'], ['cuyo', 'ingenio'], ['cuyo', 'sur']];
export const CAMINOS = TRAMOS.map(([a, b], i) => {
  const A = P(a), Bp = P(b), q = mul(hash(i, 3, 99)), pts = [A];
  const n = Math.max(2, Math.round(Math.hypot(Bp[0] - A[0], Bp[1] - A[1]) / 70));
  for (let k = 1; k < n; k++) { const t = k / n, nx = -(Bp[1] - A[1]), nz = Bp[0] - A[0], l = Math.hypot(nx, nz); const o = (q() - .5) * 50; pts.push([lerp(A[0], Bp[0], t) + nx / l * o, lerp(A[1], Bp[1], t) + nz / l * o]); }
  pts.push(Bp); return {a, b, p: pts};
});
CAMINOS.push({a: 'pampa', b: 'salamanca', p: [P('pampa'), [0, 80], [-40, -10], [SALA.puerta.x, SALA.puerta.z + 4]]});
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
// adornos alrededor de cada guarida
const ANILLO = {pampa: 'tapera', ibera: 'junco', monte: 'tronco', ingenio: 'bagazo', selva: 'columna', cuyo: 'penasco', puna: 'apachetaD', sur: 'chenque', salamanca: 'caldero'};
for (const g of GUARIDAS) { const n = 9; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; fijo(ANILLO[g.reg], g.x + Math.sin(a) * 23, g.z + Math.cos(a) * 23, a + Math.PI / 2); } fijo('craneo', g.x + 6, g.z - 26, 3.1); }
// el cerco de la Salamanca: piedras en redondo con una sola entrada al sur
for (let i = 0; i < 90; i++) { const a = i / 90 * Math.PI * 2; if (Math.abs(a - Math.PI * 2) < .09 || a < .09) continue; const x = SALA.x + Math.sin(a) * SALA.r, z = SALA.z + Math.cos(a) * SALA.r; fijo(i % 3 ? 'estal' : 'penasco', x, z, a, 1 + (i % 4) * .08); }
fijo('antorcha', SALA.puerta.x - 6, SALA.puerta.z); fijo('antorcha', SALA.puerta.x + 6, SALA.puerta.z); fijo('cara', SALA.puerta.x, SALA.puerta.z - 4);
// lugares: santuarios (curan), entierros (plata de noche) y apachetas (suerte)
{
  const q = mul(1234); let id = 0;
  for (const c of CAMINOS) for (let i = 1; i < c.p.length - 1; i++) { const [x, z] = c.p[i]; const ox = (q() > .5 ? 1 : -1) * 6; LUGARES.push({id: id++, tipo: regionEn(x, z) === 'cuyo' ? 'difunta' : 'santuario', x: x + ox, z: z + 3}); }
  for (const k of RELIQUIAS) { const R = REG[k]; for (let i = 0; i < 3; i++) { let x, z, t = 0; do { const a = q() * 6.28, r = 60 + q() * 150; x = R.c[0] + Math.sin(a) * r; z = R.c[1] + Math.cos(a) * r; } while ((t++ < 40) && (!dentro(x, z, 15) || regionEn(x, z) !== k || agua(x, z) > 0 || camino(x, z) < 8)); LUGARES.push({id: id++, tipo: 'entierro', x, z}); } }
  for (let i = 0; i < 5; i++) { const R = REG.puna; const a = i * 1.3, r = 50 + i * 25; LUGARES.push({id: id++, tipo: 'apacheta', x: R.c[0] + Math.sin(a) * r, z: R.c[1] + Math.cos(a) * r}); }
  for (const l of LUGARES) { if (l.tipo === 'santuario') fijo('santuario', l.x, l.z, 0, 1, {misc: 1}); else if (l.tipo === 'difunta') fijo('difunta', l.x, l.z); else if (l.tipo === 'apacheta') fijo('apachetaP', l.x, l.z); else fijo('entierro', l.x, l.z, l.id); }
}

// ---------- campamentos de bichos ----------
export const CAMPOS = [];
{
  const G = 46; let id = 0;
  for (let gz = Math.floor(NORTE / G); gz <= Math.ceil(SUR / G); gz++) for (let gx = -11; gx <= 11; gx++) {
    const q = mul(hash(gx, gz, 5)); const x = gx * G + (q() - .5) * G * .8, z = gz * G + (q() - .5) * G * .8;
    if (!dentro(x, z, 12) || agua(x, z) > .2 || camino(x, z) < 9) continue;
    if (PUEBLOS.some(p => Math.hypot(p.x - x, p.z - z) < p.r + 32)) continue;
    if (GUARIDAS.some(g => Math.hypot(g.x - x, g.z - z) < 48)) continue;
    const ds = Math.hypot(x - SALA.x, z - SALA.z); if (ds > SALA.r - 14 && ds < SALA.r + 16) continue;
    const reg = regionEn(x, z), R = REG[reg], lv = nivelEn(x, z, reg), t = (lv - R.lv[0]) / Math.max(1, R.lv[1] - R.lv[0]);
    const B = R.bichos, i = clamp(Math.floor(t * B.length + (q() - .5) * 2), 0, B.length - 1);
    const tipos = [B[i]]; if (q() < .45 && i > 0) tipos.push(B[Math.floor(q() * i)]);
    const camp = q() < .12 && R.campeones[B[i]] ? B[i] : null;
    CAMPOS.push({id: id++, x, z, reg, lv, tipos, camp, q: hash(gx, gz, 6)});
  }
  // adentro de la Salamanca, una ronda de campamentos alrededor del trono
  const B = REG.salamanca.bichos;
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + .4, x = SALA.x + Math.sin(a) * 50, z = SALA.z + Math.cos(a) * 50; if (Math.abs(a - Math.PI * 2) < .5) continue;
    CAMPOS.push({id: id++, x, z, reg: 'salamanca', lv: 24 + (i % 2), tipos: [B[i % B.length], B[(i + 2) % B.length]], camp: i % 3 === 0 ? B[2 + i % 3] : null, q: hash(i, 0, 66)}); }
}

// ---------- obstáculos por pedazos de 32 m ----------
const DENS = .62;
const fijosCh = new Map();
for (const o of FIJOS) { const k = Math.floor(o.x / CH) + ',' + Math.floor(o.z / CH); (fijosCh.get(k) || fijosCh.set(k, []).get(k)).push(prep(o)); }
function prep(o) { const d = KITR[o.t] || [0, 0, 0, 0]; return {...o, r: d[0] * o.s, len: d[1] * o.s, low: d[2], tall: d[3], cx: Math.cos(o.ry), cz: -Math.sin(o.ry)}; }
const cache = new Map();
function libre(x, z, r, wet) {
  if (!dentro(x, z, 3 + r)) return false;
  const a = agua(x, z); if (wet ? a < .35 || a > 1 : a > .05) return false;
  if (camino(x, z) < 3.2 + r) return false;
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
      if (regionEn(x, z) !== rg || (o.sur && z < 470) || !libre(x, z, r, o.wet)) continue;
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
// corre un círculo fuera de los obstáculos y del borde. salta: puede pasar por encima de los bajos
export function chocar(p, r, salta = false) {
  cerca(p.x, p.z, r + 2, tmp);
  for (const o of tmp) {
    if (salta && o.low) continue;
    let ox = o.x, oz = o.z; if (o.len) { const t = clamp((p.x - o.x) * o.cx + (p.z - o.z) * o.cz, -o.len, o.len); ox += o.cx * t; oz += o.cz * t; }
    const dx = p.x - ox, dz = p.z - oz, R = o.r + r, d2 = dx * dx + dz * dz;
    if (d2 < R * R) { const d = Math.sqrt(d2) || .001; p.x = ox + dx / d * R; p.z = oz + dz / d * R; }
  }
  if (p.z < NORTE + 2) p.z = NORTE + 2; if (p.z > SUR - 2) p.z = SUR - 2;
  const [o, e] = bordeX(p.z); if (p.x < o + 2) p.x = o + 2;
  if (agua(p.x, p.z) > 1.05 || p.x > e - 1) return false;
  return true;
}
export const enPueblo = (x, z, m = 0) => PUEBLOS.find(p => Math.abs(p.x - x) < p.r + m && Math.abs(p.z - z) < p.r + m && Math.hypot(p.x - x, p.z - z) < p.r + m);
