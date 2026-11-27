// La progresión del personaje: mañas (talentos), fama y títulos, exploración del mapa y logros.
// Las mañas se ganan subiendo de nivel, con la fama, explorando y llenando el bestiario.
import {dentro, NORTE, SUR} from '../shared/mapa.js';

const M = (n, d, f) => ({n, d, f});
export const RAMAS = [
  {k: 'coraje', n: 'Coraje', d: 'Pegar fuerte', ic: 'facon', t: {
    filo: M('Filo de facón', r => `+${4 * r}% de daño`, (s, r) => { s.dmg *= 1 + .04 * r; }),
    certero: M('Ojo certero', r => `+${2 * r}% de crítico`, (s, r) => { s.crit += .02 * r; }),
    furia: M('Mano pesada', r => `+${7 * r}% de daño de las habilidades`, (s, r) => { s.habK += .07 * r; }),
    rapidez: M('Rapidez', r => `−${5 * r}% de espera en las habilidades`, (s, r) => { s.cdr *= 1 - .05 * r; }),
    verdugo: M('Cazador de leyendas', r => `+${9 * r}% de daño a campeones y jefes`, (s, r) => { s.verdugo += .09 * r; }),
  }},
  {k: 'aguante', n: 'Aguante', d: 'Que no te tumben', ic: 'poncho', t: {
    cuero: M('Cuero duro', r => `+${6 * r}% de vida`, (s, r) => { s.vidaK += .06 * r; }),
    poncho: M('Poncho grueso', r => `+${2 * r}% de aguante`, (s, r) => { s.arm += .02 * r; }),
    mate: M('Buen cebador', r => `Los mates curan ${10 * r}% más`, (s, r) => { s.mateK += .1 * r; }),
    aire: M('Segundo aire', r => `+${(.6 * r).toFixed(1)} de vida por segundo`, (s, r) => { s.regen += .6 * r; }),
    esquive: M('Cintura', r => `−${7 * r}% de espera del esquive y de la montura`, (s, r) => { s.esqK *= 1 - .07 * r; }),
  }},
  {k: 'baqueano', n: 'Baqueano', d: 'Andar el país', ic: 'espuela', t: {
    pies: M('Pata de ñandú', r => `+${3 * r}% de velocidad a pie`, (s, r, mo) => { if (!mo) s.vel *= 1 + .03 * r; }),
    jinete: M('Jinete', r => `+${5 * r}% de velocidad en montura`, (s, r, mo) => { if (mo) s.vel *= 1 + .05 * r; }),
    suerte: M('Buena estrella', r => `+${6 * r}% de suerte`, (s, r) => { s.suerte += .06 * r; }),
    olfato: M('Olfato para la plata', r => `+${8 * r}% de patacones`, (s, r) => { s.oro += .08 * r; }),
    pescador: M('Pescador', r => `La caña es ${12 * r}% más fácil y salen peces más raros`, (s, r) => { s.pesca += .12 * r; }),
  }},
];
export const MAX_RANGO = 5;
export const TALENTO = Object.fromEntries(RAMAS.flatMap(R => Object.entries(R.t).map(([k, t]) => [k, {...t, rama: R.k}])));
export function aplicarManas(s, p, montado) {
  s.habK = 1; s.verdugo = 0; s.vidaK = 1; s.mateK = 1; s.esqK = 1; s.pesca = 0;
  for (const [k, r] of Object.entries(p.manas || {})) if (TALENTO[k] && r > 0) TALENTO[k].f(s, Math.min(MAX_RANGO, r), montado);
  s.vida = Math.round(s.vida * s.vidaK);
}
// ---------- fama ----------
export const TITULOS = [[0, 'Forastero'], [40, 'Paisano'], [120, 'Baqueano'], [260, 'Gaucho'], [460, 'Gaucho Matrero'], [720, 'Payador de leyendas'], [1100, 'Leyenda viva']];
export const rangoFama = f => { let i = 0; while (i + 1 < TITULOS.length && (f || 0) >= TITULOS[i + 1][0]) i++; return i; };
export const titulo = p => TITULOS[rangoFama(p.fama)][1];
export const descuento = p => Math.min(.24, rangoFama(p.fama) * .04);
// ---------- exploración: el mapa en cuadritos de 12 m ----------
const CX = 12, X0 = -264, Z0 = NORTE - 30, COLS = Math.ceil(528 / CX), FILAS = Math.ceil((SUR - NORTE + 60) / CX);
export const EXPLORA = {CX, X0, Z0, COLS, FILAS};
const VALEN = []; for (let j = 0; j < FILAS; j++) for (let i = 0; i < COLS; i++) if (dentro(X0 + (i + .5) * CX, Z0 + (j + .5) * CX, 0)) VALEN.push(j * COLS + i);
const VALE = new Set(VALEN); export const TOTAL_EXPLORA = VALEN.length;
export const HITOS_EXPLORA = [10, 25, 50, 75, 95];
export function leerVisto(p) {
  const n = Math.ceil(COLS * FILAS / 8), b = new Uint8Array(n);
  try { const s = atob(p.visto || ''); for (let i = 0; i < Math.min(n, s.length); i++) b[i] = s.charCodeAt(i); } catch (e) { }
  return b;
}
export function guardarVisto(p, b) { let s = ''; for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); p.visto = btoa(s); }
export const visto = (b, k) => (b[k >> 3] >> (k & 7)) & 1;
// marca lo que ves alrededor; devuelve cuántos cuadritos nuevos
export function explorar(b, x, z, R = 22) {
  let n = 0; const i0 = Math.floor((x - R - X0) / CX), i1 = Math.floor((x + R - X0) / CX), j0 = Math.floor((z - R - Z0) / CX), j1 = Math.floor((z + R - Z0) / CX);
  for (let j = Math.max(0, j0); j <= Math.min(FILAS - 1, j1); j++) for (let i = Math.max(0, i0); i <= Math.min(COLS - 1, i1); i++) {
    const cx = X0 + (i + .5) * CX, cz = Z0 + (j + .5) * CX; if ((cx - x) ** 2 + (cz - z) ** 2 > R * R) continue;
    const k = j * COLS + i; if (!VALE.has(k) || visto(b, k)) continue; b[k >> 3] |= 1 << (k & 7); n++;
  }
  return n;
}
export function explorado(b) { let n = 0; for (const k of VALEN) if (visto(b, k)) n++; return n / TOTAL_EXPLORA * 100; }
// ---------- todas las mañas que te ganaste ----------
export function manasGanadas(p) {
  const nivel = Math.max(0, p.lv - 1), fama = rangoFama(p.fama), expl = (p.hitosExp || 0), best = Object.values(p.bestiario || {}).filter(n => n >= 10).length, pesca = (p.pescaHito || 0);
  return {nivel, fama, expl, best, pesca, total: nivel + fama + expl + best + pesca};
}
export const manasGastadas = p => Object.values(p.manas || {}).reduce((a, r) => a + r, 0);
export const manasLibres = p => manasGanadas(p).total - manasGastadas(p);
