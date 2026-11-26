// Azar con semilla y ruido: el servidor y cada pantalla arman exactamente el mismo mundo.
export const mul = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
export const hash = (a, b, c = 0) => { let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(c | 0, 2147483647); h = Math.imul(h ^ h >>> 13, 1274126177); return (h ^ h >>> 16) >>> 0; };
const h2 = (x, z, s) => hash(x, z, s) / 4294967296;
const sm = t => t * t * (3 - 2 * t);
// ruido suave entre 0 y 1
export function ruido(x, z, s = 0) {
  const i = Math.floor(x), j = Math.floor(z), fx = sm(x - i), fz = sm(z - j);
  const a = h2(i, j, s), b = h2(i + 1, j, s), c = h2(i, j + 1, s), d = h2(i + 1, j + 1, s);
  return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
}
export function fbm(x, z, s = 0, o = 4) { let a = .5, t = 0, n = 0; for (let i = 0; i < o; i++) { t += a * ruido(x, z, s + i * 17); n += a; x = x * 2.03 + 7.1; z = z * 2.03 + 3.7; a *= .5; } return t / n; }
export const clamp = (x, a, b) => x < a ? a : x > b ? b : x;
export const lerp = (a, b, t) => a + (b - a) * t;
// distancia de un punto a un segmento
export function dSeg(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az, l = dx * dx + dz * dz; let t = l ? ((px - ax) * dx + (pz - az) * dz) / l : 0; t = clamp(t, 0, 1);
  const x = ax + dx * t - px, z = az + dz * t - pz; return Math.sqrt(x * x + z * z);
}
export function dLinea(px, pz, pts) { let d = 1e9; for (let i = 0; i < pts.length - 1; i++) { const e = dSeg(px, pz, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]); if (e < d) d = e; } return d; }
