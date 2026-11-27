// Misiones y charlas. La historia (capítulos con gente con nombre) está en historia.js; acá están las changas
// de cada pueblo, cómo se cuenta el progreso y cómo se habla con la gente.
import {REG, ORDEN, RELIQUIAS, GUARIDAS, SALA, PUEBLOS, CAMPOS, chocar, alto} from '../shared/mapa.js';
import {ENEMIES, BOSSES, RELIQ, AMULETOS, OBJETOS, xpSig} from '../shared/reglas.js';
import {esNoche} from '../shared/sim.js';
import {RG} from '../lib/regions.js';
import {FX, TAU, rnd, lerp} from '../lib/gfx.js';
import {audio} from '../lib/audio.js';
import {historia, AGRADECE, TRATOS, xz} from './historia.js';

const nB = t => (ENEMIES[t] || BOSSES[t] || {n: t}).n;
const plural = (n, s) => n === 1 ? s : s.replace(/([aeiouáéíóú])$/i, '$1s').replace(/([^s])$/, '$1es');
export const MIS = {};
const M = (id, o) => { MIS[id] = {id, ...o}; };
export const CAPS = {1: 'La noche colorada', 2: 'Agua que traga', 3: 'El monte te mira', 4: 'Azúcar, humo y pacto', 5: 'Tierra colorada', 6: 'Viento blanco', 7: 'Siete colores', 8: 'Viento, piedra y lago', 9: 'La Salamanca'};
historia(M);
// ---------- changas de cada pueblo ----------
const TXT = {
  pampa: ['Los Jinetes de Ánimas cruzan el campo al galope', 'Por el andén viejo anda la Viuda'],
  ibera: ['Los mbarigüí no dejan pescar', 'La Llorona se escucha en la orilla'],
  monte: ['Las vinchucas bajan de los techos', 'Sachayoj castiga al que hachea de más'],
  ingenio: ['Los zafreros en pena no dejan cortar caña', 'El Runa Uturunco anda suelto'],
  selva: ['El Ao Ao embiste en manada', 'El Yaguareté-Abá ronda las ruinas'],
  cuyo: ['Los arrieros helados bajan de la cordillera', 'El Cóndor Agorero no deja pasar a nadie'],
  puna: ['Los diablitos del carnaval no quieren volver a enterrarse', 'El Ucumar baja de los cerros'],
  sur: ['Los chonchones vuelan de noche', 'El Kalku hace gualichos'],
};
for (const r of RELIQUIAS) {
  const R = REG[r], B = R.bichos, lv = R.lv;
  const a = B.slice(0, 2), b = B.slice(2), na = 8, nb = 5;
  M('c1_' + r, {de: r + ':baqueano', n: 'Cacería: ' + a.map(nB).join(' y '), reg: r, obj: {tipo: 'matar', bichos: a, n: na},
    pide: `${TXT[r][0]}. Bájeme ${na} entre ${a.map(nB).join(' y ')} y le pago bien.`, fin: 'Así me gusta. Tome lo prometido.', premio: {xp: Math.round(xpSig(lv[0]) * .45), oro: 25 * lv[0], it: [['mate', 2], ['retazo', 2]]}});
  M('c2_' + r, {de: r + ':baqueano', req: ['c1_' + r], n: 'Cacería brava: ' + b.map(nB).join(', '), reg: r, obj: {tipo: 'matar', bichos: b, n: nb},
    pide: `${TXT[r][1]}. Lo que sigue es más bravo: ${nb} entre ${b.map(nB).join(', ')}. Vaya preparado.`, fin: 'Usted es de los buenos. Esto se lo ganó.', premio: {xp: Math.round(xpSig(lv[0] + 2) * .5), oro: 40 * lv[0], it: [['asado', 1], ['retazo', 4]]}});
  M('k_' + r, {de: r + ':cantor', n: 'El campeón de ' + R.n, reg: r, obj: {tipo: 'campeon', reg: r, n: 1},
    pide: `Por ${R.n} anda un bicho que brilla como oro: un campeón. ${Object.values(R.campeones).join(', ')}… Dicen que el que lo vence se hace famoso. Si lo baja, le compongo una copla.`,
    fin: 'Ya tengo la copla. Y algo más para usted, que en los fogones se habla de su hazaña.', premio: {xp: Math.round(xpSig(lv[0] + 1) * .5), oro: 60 * lv[0], am: Object.keys(AMULETOS)[RELIQUIAS.indexOf(r) % 9]}});
}
// ---------- cosas que pasan en el mundo ----------
M('v_doma', {de: 'pampa:cantor', n: 'El bagual overo', reg: 'pampa', obj: {tipo: 'evento', ev: 'doma', n: 1},
  pide: 'Por el campo andan baguales que nunca tuvieron dueño. Acérquese despacito, apriete F y aguante arriba hasta que se canse. Si lo doma, va a cruzar la pampa en un suspiro. Y lo llama con un silbido (G).',
  fin: '¡Ese es un jinete! Ahora sí que no lo alcanza nadie.', premio: {xp: 120, oro: 50, it: [['mate', 2]]}});
M('v_luz', {de: 'pampa:baqueano', req: ['c1_pampa'], n: 'La Luz Mala', reg: 'pampa', obj: {tipo: 'evento', ev: 'tesoro', n: 1},
  pide: 'Mi abuelo decía que la Luz Mala es el alma de un difunto que dejó plata enterrada. De noche, si ve una luz verde que se mueve sola, sígala. Va a escaparse unas cuantas veces, pero al final se hunde en la tierra: cave ahí.',
  fin: '¡Así que era cierto! Guárdese esa plata vieja, que trae suerte.', premio: {xp: 260, oro: 60, am: 'pata'}});
M('v_malon', {de: 'ibera:baqueano', n: 'Cuando viene el malón', reg: 'ibera', obj: {tipo: 'evento', ev: 'malon', n: 1},
  pide: 'Cada tanto las leyendas se juntan y atacan un pueblo entero. Si escucha que se viene un malón, no lo deje solo: aguante las tres oleadas junto al fogón.',
  fin: 'Lo vi pelear desde acá. El pueblo no se va a olvidar.', premio: {xp: 420, oro: 160, it: [['asado', 2]]}});
M('v_estrellas', {de: 'monte:cantor', n: 'Deseos de estrella', reg: 'monte', obj: {tipo: 'evento', ev: 'estrella', n: 3},
  pide: 'En las noches claras a veces llueven estrellas. Las que caen quedan brillando en el piso un ratito. Junte tres y pida un deseo por cada una.',
  fin: '¿Y qué pidió? No, no me diga, que no se cumple.', premio: {xp: 520, oro: 120, am: 'luna'}});
M('v_carreta', {de: 'cuyo:vecino', n: 'El mercachifle andariego', reg: 'cuyo', obj: {tipo: 'evento', ev: 'carreta', n: 1},
  pide: 'Por los caminos anda la carreta de un mercachifle que trae cosas de todos lados. Si la ve, párela y cómprele algo. Dicen que tiene amuletos que no se consiguen.',
  fin: 'Buen ojo para las compras. Tome, para que siga gastando.', premio: {xp: 600, oro: 200}});
// ---------- qué dice cada uno ----------
const SALUDO = {
  pulpero: ['¡Buenas! Pase, que hay de todo.', 'Mate, asado, caña… lo que necesite para el camino.'],
  herrero: ['El fuego está prendido. ¿Le afilo algo?', 'Con retazos de leyenda y unos patacones, le dejo el arma como nueva.'],
  posta: ['Soy mercachifle: voy y vengo por todo el país.', 'Si junta amuletos de más, se los compro.'],
  vecino: ['Ande con cuidado, que de noche salen más.', 'Buenas, buenas.'], baqueano: ['Conozco estos pagos como la palma de la mano.', '¿Anda buscando changa?'], cantor: ['Siéntese, que le canto una.', 'Cada pago tiene su leyenda.'],
};
const ICONO = {huella: 'garras', remo: 'machete', 'panal de lechiguana': 'azucar', 'contrato del patrón': 'libro', 'piedra tallada': 'piedraG', 'kultrún': 'kultrun'};
// varias páginas de texto, una atrás de la otra
function paginas(t, fin) { const L = Array.isArray(t) ? t : [t]; const ir = i => i < L.length - 1 ? {txt: L[i], op: [{t: 'Seguir', f: () => ir(i + 1), prim: 1}]} : fin(L[i]); return ir(0); }

export class Misiones {
  constructor(ui) { this.ui = ui; this.esc = null; }
  get p() { return this.ui.perfil; }
  get J() { return this.ui.juego; }
  val(v) { return typeof v === 'function' ? v(this.p) : v; }
  estado(id) { return this.p.mis[id]; }
  // hecha, o salteada porque el jefe ya estaba vencido de antes
  hecha(id) { const m = MIS[id], p = this.p; if (p.mis[id]?.e === 'hecha') return true; return !!(m && m.obj.tipo === 'jefe' && m.obj.reg !== 'salamanca' && p.reliq[m.obj.reg]); }
  libre(m) { const p = this.p; if (p.mis[m.id]) return false; if (m.req && !m.req.every(r => this.hecha(r))) return false; if (m.obj.tipo === 'jefe' && m.obj.reg !== 'salamanca' && p.reliq[m.obj.reg] && m.id !== 'h2') return false; if (m.id === 'h2' && p.reliq.pampa) return false; return true; }
  entregaDe(m) { return m.entrega || (m.obj.tipo === 'hablar' ? m.obj.a : m.de); }
  disponibles(npc) { return Object.values(MIS).filter(m => m.de === npc.id && this.libre(m)); }
  entregables(npc) { return Object.values(MIS).filter(m => { const s = this.p.mis[m.id]; return s && this.entregaDe(m) === npc.id && (s.e === 'lista' || (s.e === 'activa' && m.obj.tipo === 'hablar')); }); }
  activas() { return Object.values(MIS).filter(m => this.p.mis[m.id] && this.p.mis[m.id].e !== 'hecha'); }
  marca(npc) { if (this.entregables(npc).length) return '?'; const d = this.disponibles(npc); if (!d.length) return ''; return d.some(m => m.hist) ? '★' : '!'; }
  aceptar(id) {
    const m = MIS[id]; this.p.mis[id] = {e: 'activa', n: 0}; this.revisar(m); this.ui.toast((m.hist ? '★ ' : '') + 'Misión nueva: ' + m.n, 'libro', 3); if (m.hist) this.ui.track = id;
    if (m.obj.tipo === 'escoltar') this.esc = null; this.ui.guardar(); this.ui.seguimiento();
  }
  entregar(id, op) {
    const m = MIS[id], p = this.p, P = m.premio || {}; p.mis[id].e = 'hecha';
    if (P.oro) p.oro += P.oro; for (const [k, n] of P.it || []) p.inv[k] = (p.inv[k] || 0) + n; if (P.am) { p.amuletos[P.am] = (p.amuletos[P.am] || 0) + 1; this.ui.toast('Te dieron: ' + AMULETOS[P.am].n, AMULETOS[P.am].ic, 4); }
    if (op) { (p.dec ||= {})[m.dk] = op.dec; if (op.oro) p.oro += op.oro; if (op.pacto) p.pactos = (p.pactos || 0) + 1; if (op.fama) this.J.fama(op.fama); }
    this.J.xp(P.xp || 0); if (m.hist) this.J.fama(5);
    this.ui.toast(`Misión cumplida: ${m.n}`, 'estampita', 3); audio.play('win');
    for (const o of Object.values(MIS)) if (p.mis[o.id]?.e === 'activa') this.revisar(o);
    // ¿quién sigue la historia?
    const sig = Object.values(MIS).filter(o => o.hist && o.req?.includes(id) && this.libre(o));
    for (const o of sig) { const n = this.J.npcs.find(x => x.id === o.de); if (n) setTimeout(() => this.ui.toast(`★ ${n.nom || 'Alguien'} tiene algo para vos: ${o.n}`, n.ch ? 'h_' + n.ch : 'libro', 5), 1400); }
    this.ui.guardar(); this.ui.seguimiento();
  }
  // progreso
  revisar(m) {
    const p = this.p, s = p.mis[m.id]; if (!s || s.e === 'hecha') return; const o = m.obj;
    if (o.tipo === 'reliquias') s.n = Object.keys(p.reliq).filter(r => RELIQUIAS.includes(r)).length;
    if (o.tipo === 'jefe' && p.reliq[o.reg]) s.n = 1;
    if (o.tipo === 'jefe' && o.reg === 'salamanca' && p.fin) s.n = 1;
    if (o.tipo === 'hablar') return;
    const meta = o.n || 1; if (s.e === 'activa' && s.n >= meta) { s.e = 'lista'; const n = this.J.npcs.find(x => x.id === this.entregaDe(m)); this.ui.toast(`¡Listo! Volvé con ${n?.nom || 'quien te la dio'}: ${m.n}`, 'libro', 4); audio.play('ok'); }
  }
  alMatar(e) {
    for (const m of this.activas()) {
      const s = this.p.mis[m.id], o = m.obj; if (s.e !== 'activa') continue;
      if (o.tipo === 'matar' && o.bichos.includes(e.tipo)) s.n++;
      if (o.tipo === 'juntar' && o.bichos.includes(e.tipo) && Math.random() < o.p) { s.n++; this.ui.toast(`Conseguiste: ${o.item} (${Math.min(s.n, o.n)} de ${o.n})`, 'gema', 2.5); audio.play('gem'); }
      if (o.tipo === 'campeon' && e.camp && e.reg === o.reg) s.n++;
      if (o.tipo === 'campeon' && e.camp && !e.reg) { const c = Object.entries(REG).find(([, R]) => R.campeones[e.tipo]); if (c && c[0] === o.reg) s.n++; }
      this.revisar(m);
    }
    this.ui.seguimiento();
  }
  alEvento(k) { for (const m of this.activas()) { const s = this.p.mis[m.id]; if (s.e === 'activa' && m.obj.tipo === 'evento' && m.obj.ev === k) { s.n++; this.revisar(m); } } this.ui.seguimiento(); }
  texto(m) {
    const s = this.p.mis[m.id], o = m.obj, n = s?.n || 0; if (s?.e === 'lista') { const q = this.J.npcs.find(x => x.id === this.entregaDe(m)); return 'Volvé con ' + (q?.nom || 'quien te la dio'); }
    if (o.tipo === 'evento') return {doma: 'Domá un bagual (F cerca de un caballo suelto)', tesoro: 'De noche, seguí a la Luz Mala y cavá su entierro', malon: 'Defendé un pueblo de un malón', estrella: `${Math.min(n, o.n)} de ${o.n} estrellas fugaces`, carreta: 'Comprale algo a la carreta del mercachifle'}[o.ev] || '';
    if (o.tipo === 'matar') return `${Math.min(n, o.n)} de ${o.n}: ${o.bichos.map(nB).join(', ')}`; if (o.tipo === 'jefe') return o.reg === 'salamanca' ? 'Vencé a Mandinga en la Salamanca' : `Vencé a ${BOSSES[REG[o.reg].jefe].n}`;
    if (o.tipo === 'reliquias') return `${n} de 8 reliquias`; if (o.tipo === 'campeon') return `Vencé a un campeón dorado de ${REG[o.reg].n}`;
    if (o.tipo === 'hablar') { const q = this.J.npcs.find(x => x.id === o.a); return 'Hablá con ' + (q?.nom || 'alguien'); }
    if (o.tipo === 'ir') return 'Andá a ' + o.lugar + (o.noche ? ' (de noche)' : '');
    if (o.tipo === 'accion') return o.que + ' en ' + o.lugar.replace(/^E/, 'e').replace(/^L/, 'l');
    if (o.tipo === 'buscar') return `${Math.min(n, o.n)} de ${o.n}: ${o.n > 1 ? plural(2, o.item) : o.item}`;
    if (o.tipo === 'juntar') return `${Math.min(n, o.n)} de ${o.n}: ${o.n > 1 ? plural(2, o.item) : o.item} (de ${o.bichos.map(nB).join(', ')})`;
    if (o.tipo === 'escoltar') return this.esc?.m === m.id && this.esc.sigue ? `Llevá a ${o.nombre} hasta el pueblo` : `Encontrá a ${o.nombre}`;
    return '';
  }
  // a dónde ir
  destino(m) {
    const s = this.p.mis[m.id], J = this.J, y = J.yo, o = m.obj; const npc = id => { const n = J.npcs.find(x => x.id === id); return n ? {x: n.x, z: n.z, n: n.nom || 'Alguien'} : null; };
    if (s?.e === 'lista') return npc(this.entregaDe(m)) || {x: REG[m.reg].pueblo?.x ?? 0, z: REG[m.reg].pueblo?.z ?? 0, n: 'El pueblo'};
    if (o.tipo === 'hablar') return npc(o.a) || {x: REG[m.reg].c[0], z: REG[m.reg].c[1], n: REG[m.reg].n};
    if (o.tipo === 'ir' || o.tipo === 'accion') return {x: o.x, z: o.z, n: o.lugar};
    if (o.tipo === 'buscar') { const got = s?.got || []; let best = null, bd = 1e9; o.pts.forEach((q, i) => { if (got.includes(i)) return; const d = y ? Math.hypot(q[0] - y.x, q[1] - y.z) : 0; if (d < bd) { bd = d; best = q; } }); if (best) return {x: best[0], z: best[1], n: o.item[0].toUpperCase() + o.item.slice(1)}; }
    if (o.tipo === 'escoltar') { const e = this.esc?.m === m.id ? this.esc : null; if (e?.sigue) return {x: o.hasta[0], z: o.hasta[1], n: 'El pueblo'}; return {x: e ? e.x : o.desde[0], z: e ? e.z : o.desde[1], n: o.nombre}; }
    if (o.tipo === 'evento') { if (o.ev === 'doma' && y) { let best = null, bd = 1e9; for (const a of J.vida.anim) if (a.bagual) { const d = Math.hypot(a.x - y.x, a.z - y.z); if (d < bd) { bd = d; best = a; } } if (best) return {x: best.x, z: best.z, n: 'Un bagual'}; } const R = REG[m.reg]; return {x: R.c[0], z: R.c[1], n: o.ev === 'doma' ? 'Baguales por ' + R.n : 'Andá atento'}; }
    if (o.tipo === 'jefe') { const g = GUARIDAS.find(g => g.reg === o.reg); return {x: g.x, z: g.z, n: g.n}; }
    if (o.tipo === 'reliquias') { const r = RELIQUIAS.find(r => !this.p.reliq[r]); if (!r) return {x: SALA.puerta.x, z: SALA.puerta.z, n: 'La puerta de la Salamanca'}; const P = REG[r].pueblo; return {x: P.x, z: P.z, n: P.n}; }
    // cacerías: el campamento más cercano que tenga esos bichos (o un campeón, si es lo que se busca)
    let best = null, bd = 1e9;
    for (const c of CAMPOS) { if (c.reg !== m.reg) continue; if (o.tipo === 'campeon' ? !c.camp : !c.tipos.some(t => o.bichos.includes(t))) continue; const d = y ? Math.hypot(c.x - y.x, c.z - y.z) : 0; if (d < bd) { bd = d; best = c; } }
    if (best) return {x: best.x, z: best.z, n: o.tipo === 'campeon' ? 'Un campeón de ' + REG[m.reg].n : 'Campamento de ' + nB(best.tipos.find(t => o.bichos?.includes(t)) || best.camp)};
    return {x: REG[m.reg].c[0], z: REG[m.reg].c[1], n: REG[m.reg].n};
  }
  // ---------- en el mundo: lugares a los que ir, cosas para levantar y gente para acompañar ----------
  update(dt) {
    const J = this.J, y = J.yo; if (!y || !this.p) return;
    for (const m of this.activas()) {
      const s = this.p.mis[m.id], o = m.obj; if (s.e !== 'activa') continue;
      if (o.tipo === 'ir' && Math.hypot(y.x - o.x, y.z - o.z) < o.r) {
        if (o.noche && !esNoche(J.horaAhora())) { if (!this.avisoN || J.t - this.avisoN > 20) { this.avisoN = J.t; this.ui.toast('Acá es. Pero tiene que ser de noche…', 'luna', 3); } continue; }
        s.n = 1; this.ver(o.lugar, o.ve); if (m.id === 'x_nahuel') J.ambiente?.nahuelito?.(o.x, o.z); this.revisar(m); this.ui.seguimiento();
      }
      if (o.tipo === 'escoltar') this.escolta(dt, m, s);
    }
    if (this.esc && !this.p.mis[this.esc.m]) this.esc = null;
  }
  escolta(dt, m, s) {
    const J = this.J, y = J.yo, o = m.obj;
    if (!this.esc || this.esc.m !== m.id) this.esc = {m: m.id, x: o.desde[0], z: o.desde[1], ry: 0, ph: 0, mv: 0, sigue: false, hab: 0};
    const e = this.esc; e.hab -= dt; if (!e.sigue) return;
    const dx = y.x - e.x, dz = y.z - e.z, d = Math.hypot(dx, dz);
    if (d > 32) { e.mv = 0; if (e.hab <= 0) { e.hab = 8; J.burbuja?.(e, o.dice[1] || '¡Espéreme!'); } return; }
    if (d > 2.6) { const sp = Math.min(J.stats().vel * 1.05, 9) * Math.min(1, (d - 2.4) / 2), ox = e.x, oz = e.z; e.x += dx / d * sp * dt; e.z += dz / d * sp * dt; chocar(e, .45, false, ox, oz); e.ry = Math.atan2(dx, dz); e.mv = 1; e.ph += dt * 11; } else e.mv = 0;
    if (Math.hypot(e.x - o.hasta[0], e.z - o.hasta[1]) < 12) { s.n = 1; e.sigue = false; e.llego = 1; J.burbuja?.(e, '¡Llegamos!'); this.revisar(m); this.ui.seguimiento(); }
    else if (e.hab <= 0 && Math.random() < dt * .08) { e.hab = 12; J.burbuja?.(e, o.dice[2] || o.dice[0]); }
  }
  candidatos(cand) {
    const J = this.J, y = J.yo;
    for (const m of this.activas()) {
      const s = this.p.mis[m.id], o = m.obj; if (s.e !== 'activa') continue;
      if (o.tipo === 'buscar') o.pts.forEach((q, i) => { if ((s.got || []).includes(i)) return; const d = Math.hypot(q[0] - y.x, q[1] - y.z); if (d < 3) cand('mision', {m, i, x: q[0], z: q[1], que: o.que, id: m.id + i}, d - .6); });
      if (o.tipo === 'accion') { const d = Math.hypot(o.x - y.x, o.z - y.z); if (d < 3.6) cand('mision', {m, x: o.x, z: o.z, que: o.que, id: m.id}, d - 1.2); }
      if (o.tipo === 'escoltar' && this.esc?.m === m.id && !this.esc.sigue && !this.esc.llego) { const d = Math.hypot(this.esc.x - y.x, this.esc.z - y.z); if (d < 3) cand('escolta', {m, x: this.esc.x, z: this.esc.z, que: o.nombre, id: 'esc' + m.id}, d - .8); }
    }
  }
  usar(c) {
    const m = c.ref.m, s = this.p.mis[m.id], o = m.obj, J = this.J;
    if (c.tipo === 'escolta') { const e = this.esc; e.sigue = true; e.hab = 6; this.ui.hablarCon({nom: o.nombre, ic: o.mod, titulo: 'anda perdido'}, o.dice[0], 'Vamos, yo te llevo'); return; }
    if (o.tipo === 'buscar') { (s.got ||= []).push(c.ref.i); s.n = s.got.length; J.parts.burst(c.ref.x, .8, c.ref.z, 20, [1, .85, .4], {sp: 4, size: .4, type: 3}); audio.play('gem'); this.ui.toast(`${o.item[0].toUpperCase() + o.item.slice(1)} (${s.n} de ${o.n})`, ICONO[o.item] || 'gema', 2.5); }
    if (o.tipo === 'accion') { s.n = 1; J.parts.burst(o.x, 1.2, o.z, 40, [1, .9, .55], {sp: 5, size: .45, type: 3, up: 2}); J.fx.spawn(FX.RING, o.x, o.z, 4, [1, .85, .4], .9); audio.play('heal'); this.ver(o.lugar, o.ve); }
    this.revisar(m); this.ui.seguimiento(); this.ui.guardar();
  }
  // una escena: lo que ves cuando llegás a un lugar de la historia
  ver(lugar, txt) { if (!txt) return; const L = Array.isArray(txt) ? txt : [txt]; this.ui.cartel(lugar, ''); setTimeout(() => this.ui.escena(lugar, L), 600); }
  dibujar() {
    const J = this.J, y = J.yo, t = J.t; if (!y) return;
    for (const m of this.activas()) {
      const s = this.p.mis[m.id], o = m.obj; if (s.e !== 'activa') continue;
      const brillo = (x, z, k) => { if (Math.abs(x - y.x) > 70 || Math.abs(z - y.z) > 70) return; J.fx.draw(FX.GLOW, x, .06, z, 0, 2.2, 2.2, [1, .8, .3], .5, .5); J.fx.draw(FX.RING, x, .07, z, 0, 1.6, 1.6, [1, .85, .4], .5, (t * .6 + (k || 0) * .3) % 1); if (Math.random() < .25) J.parts.emit(x + rnd(-.5, .5), .2, z + rnd(-.5, .5), 0, rnd(1.5, 3), 0, 1, .85, .45, .3, .9, 3, 0, 0); };
      if (o.tipo === 'buscar') o.pts.forEach((q, i) => { if ((s.got || []).includes(i)) return; brillo(q[0], q[1], i); J.bt('o_' + (ICONO[o.item] || 'gema'), 12).push(q[0], .5 + Math.sin(t * 2 + i) * .12, q[1], t, .9, 0, 0, 0, .25); });
      if (o.tipo === 'accion') brillo(o.x, o.z);
      if (o.tipo === 'ir' && Math.hypot(o.x - y.x, o.z - y.z) < 90) { J.fx.draw(FX.RING, o.x, .08, o.z, 0, o.r, o.r, [1, .85, .35], .55, (t * .4) % 1); if (Math.random() < .5) J.parts.emit(o.x + rnd(-1, 1), .3, o.z + rnd(-1, 1), 0, rnd(4, 7), 0, 1, .85, .4, .45, 1.6, 3, 0, 0); }
      if (o.tipo === 'escoltar' && this.esc?.m === m.id) { const e = this.esc; J.bt(o.mod, 4).push(e.x, 0, e.z, e.ry, o.esc || 1, e.mv ? e.ph : t + e.x, e.mv, 0); J.fx.draw(FX.SHADOW, e.x, .05, e.z, 0, .8, .8, [0, 0, 0], .45); if (!e.sigue && !e.llego) brillo(e.x, e.z); }
    }
  }
  // ---------- charla ----------
  charla(npc) {
    const R = REG[npc.reg], rg = RG[npc.reg], op = [], p = this.p;
    for (const m of this.entregables(npc)) op.push({t: (m.hist ? '★ ' : '') + (m.obj.tipo === 'hablar' && p.mis[m.id].e === 'activa' ? m.n : 'Ya está: ' + m.n), prim: 1, f: () => {
      const fin = this.val(m.fin);
      if (m.elegir) return paginas(fin, last => ({txt: last, op: m.elegir.map(e => ({t: e.t, prim: 1, f: () => { this.entregar(m.id, e); return {txt: e.txt}; }}))}));
      this.entregar(m.id); return paginas(fin, last => ({txt: last}));
    }});
    for (const m of this.disponibles(npc)) op.push({t: (m.hist ? '★ ' : '') + m.n, f: () => paginas(this.val(m.pide), last => ({txt: last, op: [{t: 'Dale, cuente conmigo', f: () => { this.aceptar(m.id); return null; }, prim: 1}, {t: 'Ahora no'}]}))});
    for (const m of this.activas().filter(m => m.de === npc.id && p.mis[m.id].e === 'activa' && m.obj.tipo !== 'hablar')) op.push({t: 'Sobre: ' + m.n, f: () => ({txt: `${this.texto(m)}. ${m.obj.tipo === 'jefe' ? 'Lo encuentra en ' + this.destino(m).n + '.' : 'No se me afloje.'}`})});
    if (npc.rol === 'pulpero') op.push({t: 'Quiero comprar', f: () => { this.ui.tienda('pulperia'); return null; }});
    if (npc.rol === 'herrero') op.push({t: 'Mejorar arma y poncho', f: () => { this.ui.tienda('herreria'); return null; }});
    if (npc.rol === 'posta') op.push({t: 'Venderle amuletos', f: () => { this.ui.tienda('mercachifle'); return null; }});
    if (npc.rol === 'cantor' && rg) op.push({t: 'Contame de ' + R.n, f: () => ({txt: rg.lore + ' ' + (rg.dato || '')})});
    op.push({t: 'Chau'});
    let txt; if (npc.dice) txt = npc.dice[(Math.random() * npc.dice.length) | 0];
    else if (['vecino', 'baqueano', 'cantor'].includes(npc.rol) && p.reliq[npc.reg] && AGRADECE[npc.reg]) txt = AGRADECE[npc.reg];
    else { const sal = SALUDO[npc.rol] || SALUDO.vecino, i = (npc.x * 7 | 0) % sal.length; txt = sal[Math.abs(i)]; }
    return {txt, op};
  }
  // ---------- tu libreta: lo que te pasó, capítulo por capítulo ----------
  diario() {
    const p = this.p, out = [];
    for (const c of Object.keys(CAPS)) {
      const L = Object.values(MIS).filter(m => m.cap == c && p.mis[m.id]?.e === 'hecha' && m.diario).map(m => this.val(m.diario));
      if (c === '9' && p.final) L.push(p.final === 'socio' ? 'Mandinga me ofreció quedarme de socio, y acepté. La cueva quedó cerrada… conmigo de llavero.' : 'Mandinga me ofreció de todo. No le acepté nada. La Salamanca quedó cerrada.');
      for (const r of RELIQUIAS) if (CAPS_REG[r] == c && p.tratos?.[r]) L.push(p.tratos[r] === 'si' ? 'El forastero de poncho negro me ofreció un trato, y le di la mano.' : 'El forastero de poncho negro me ofreció un trato. Le dije que no.');
      if (L.length) out.push({c, n: CAPS[c], L});
    }
    return out;
  }
}
const CAPS_REG = {pampa: 1, ibera: 2, monte: 3, ingenio: 4, selva: 5, cuyo: 6, puna: 7, sur: 8};
export {plural, TRATOS};
