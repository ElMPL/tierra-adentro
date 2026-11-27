// Misiones y charlas. La historia: Mandinga abrió la Salamanca y las leyendas andan sueltas por todo el país.
// Hay que juntar las 8 reliquias de los jefes para poder entrar a la cueva y cerrarla.
import {REG, ORDEN, RELIQUIAS, GUARIDAS, SALA, PUEBLOS, CAMPOS} from '../shared/mapa.js';
import {ENEMIES, BOSSES, RELIQ, AMULETOS, xpSig} from '../shared/reglas.js';
import {RG} from '../lib/regions.js';

const nB = t => (ENEMIES[t] || BOSSES[t] || {n: t}).n;
const plural = (n, s) => n === 1 ? s : s.replace(/([aeiouáéíóú])$/i, '$1s').replace(/([^s])$/, '$1es');
export const MIS = {};
const M = (id, o) => { MIS[id] = {id, ...o}; };
// ---------- historia ----------
M('h1', {hist: 1, de: 'pampa:vecino', n: 'La noche que se abrió la Salamanca', reg: 'pampa', obj: {tipo: 'matar', bichos: ['anima'], n: 5},
  pide: 'Ay, m’hijo, menos mal que llegó. Anoche tembló la tierra para el lado del norte y el cielo se puso colorado: Mandinga abrió la Salamanca. Desde entonces las ánimas andan sueltas por los caminos. Despache cinco, que acá no se puede ni ir a buscar agua.',
  fin: 'Bien hecho. Pero esto recién empieza. Tome estos mates, que le van a hacer falta.', premio: {xp: 90, oro: 40, it: [['mate', 3]]}});
M('h2', {hist: 1, de: 'pampa:vecino', req: ['h1'], n: 'El séptimo hijo', reg: 'pampa', obj: {tipo: 'jefe', reg: 'pampa'},
  pide: 'Hay algo peor. El séptimo hijo varón de los Arrieta se volvió Lobizón. Vive en un rancho al sureste, pasando el río. Si lo vence, guarde lo que deje: dicen que con las reliquias de los jefes se puede volver a cerrar la cueva.',
  fin: '¡El Colmillo del Lobizón! Esa es la primera reliquia. Ahora escuche bien lo que le voy a decir.', premio: {xp: 320, oro: 160, am: 'ruda'}});
M('h3', {hist: 1, de: 'pampa:vecino', req: ['h2'], n: 'Las ocho reliquias', reg: 'pampa', obj: {tipo: 'reliquias', n: 8},
  pide: 'La Salamanca tiene una sola puerta, al sur de la cueva, y solo se abre con las ocho reliquias. Cada territorio tiene su dueño: Mbói Tu’ĩ en los esteros, la Alma Mula en el monte, el Familiar en el ingenio, el Teyú Yaguá en la selva, el Futre en la cordillera, la Huayrapuca en la puna y Elëngásëm en la Patagonia. En cada pueblo hay gente que lo va a ayudar. Vaya primero para el norte, a Puerto Irupé.',
  fin: '¡Las ocho! No lo puedo creer. La puerta de la Salamanca ya lo deja pasar.', premio: {xp: 2000, oro: 1500, am: 'luna'}});
M('h4', {hist: 1, de: 'pampa:vecino', req: ['h3'], n: 'Cerrar la Salamanca', reg: 'salamanca', obj: {tipo: 'jefe', reg: 'salamanca'},
  pide: 'Adentro de la cueva lo espera el mismísimo Mandinga, sentado en su trono. Le va a ofrecer de todo. No le acepte nada. Y vuelva, que acá le tenemos un asado.',
  fin: 'Volvió. La Salamanca está cerrada y las leyendas vuelven a ser cuentos de fogón. Siéntese, que el asado está listo.', premio: {xp: 5000, oro: 5000}});
// ---------- en cada territorio ----------
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
  const R = REG[r], B = R.bichos, G = GUARIDAS.find(g => g.reg === r), lv = R.lv;
  const a = B.slice(0, 2), b = B.slice(2), na = 8, nb = 5;
  M('c1_' + r, {de: r + ':baqueano', n: 'Cacería: ' + a.map(nB).join(' y '), reg: r, obj: {tipo: 'matar', bichos: a, n: na},
    pide: `${TXT[r][0]}. Bájeme ${na} entre ${a.map(nB).join(' y ')} y le pago bien.`, fin: 'Así me gusta. Tome lo prometido.', premio: {xp: Math.round(xpSig(lv[0]) * .45), oro: 25 * lv[0], it: [['mate', 2], ['retazo', 2]]}});
  M('c2_' + r, {de: r + ':baqueano', req: ['c1_' + r], n: 'Cacería brava: ' + b.map(nB).join(', '), reg: r, obj: {tipo: 'matar', bichos: b, n: nb},
    pide: `${TXT[r][1]}. Lo que sigue es más bravo: ${nb} entre ${b.map(nB).join(', ')}. Vaya preparado.`, fin: 'Usted es de los buenos. Esto se lo ganó.', premio: {xp: Math.round(xpSig(lv[0] + 2) * .5), oro: 40 * lv[0], it: [['asado', 1], ['retazo', 4]]}});
  M('k_' + r, {de: r + ':cantor', n: 'El campeón de ' + R.n, reg: r, obj: {tipo: 'campeon', reg: r, n: 1},
    pide: `Por ${R.n} anda un bicho que brilla como oro: un campeón. ${Object.values(R.campeones).join(', ')}... Dicen que el que lo vence se hace famoso. Si lo baja, le compongo una copla.`,
    fin: 'Ya tengo la copla. Y algo más para usted, que en los fogones se habla de su hazaña.', premio: {xp: Math.round(xpSig(lv[0] + 1) * .5), oro: 60 * lv[0], am: Object.keys(AMULETOS)[RELIQUIAS.indexOf(r) % 9]}});
  if (r !== 'pampa') M('j_' + r, {de: r + ':vecino', n: BOSSES[R.jefe].n, reg: r, obj: {tipo: 'jefe', reg: r},
    pide: `Usted busca las reliquias, ¿no? La de acá la tiene ${BOSSES[R.jefe].n}. ${BOSSES[R.jefe].d} Lo encuentra en ${G.n}. Vaya con nivel ${lv[1]}, por lo menos.`,
    fin: `¡${RELIQ[r].n}! Que Dios lo acompañe en lo que sigue.`, premio: {xp: Math.round(xpSig(lv[1]) * .6), oro: 90 * lv[1], it: [['asado', 2], ['retazo', 6]]}});
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
  pulpero: ['¡Buenas! Pase, que hay de todo.', 'Mate, asado, caña... lo que necesite para el camino.'],
  herrero: ['El fuego está prendido. ¿Le afilo algo?', 'Con retazos de leyenda y unos patacones, le dejo el arma como nueva.'],
  posta: ['Soy mercachifle: voy y vengo por todo el país.', 'Si junta amuletos de más, se los compro.'],
  vecino: ['Ande con cuidado, que de noche salen más.', 'Buenas, buenas.'], baqueano: ['Conozco estos pagos como la palma de la mano.', '¿Anda buscando changa?'], cantor: ['Siéntese, que le canto una.', 'Cada pago tiene su leyenda.'],
};
export class Misiones {
  constructor(ui) { this.ui = ui; }
  get p() { return this.ui.perfil; }
  estado(id) { return this.p.mis[id]; }
  libre(m) { const p = this.p; if (p.mis[m.id]) return false; if (m.req && !m.req.every(r => p.mis[r]?.e === 'hecha')) return false; if (m.id.startsWith('j_') && p.reliq[m.reg]) return false; return true; }
  disponibles(npc) { return Object.values(MIS).filter(m => m.de === npc.id && this.libre(m)); }
  entregables(npc) { return Object.values(MIS).filter(m => m.de === npc.id && this.p.mis[m.id]?.e === 'lista'); }
  activas() { return Object.values(MIS).filter(m => this.p.mis[m.id] && this.p.mis[m.id].e !== 'hecha'); }
  marca(npc) { if (this.entregables(npc).length) return '?'; if (this.disponibles(npc).length) return '!'; return ''; }
  aceptar(id) { const m = MIS[id]; this.p.mis[id] = {e: 'activa', n: 0}; this.revisar(m); this.ui.toast('Misión nueva: ' + m.n, 'libro', 3); this.ui.guardar(); this.ui.seguimiento(); }
  entregar(id) {
    const m = MIS[id], p = this.p, P = m.premio || {}; p.mis[id].e = 'hecha';
    if (P.oro) p.oro += P.oro; for (const [k, n] of P.it || []) p.inv[k] = (p.inv[k] || 0) + n; if (P.am) p.amuletos[P.am] = (p.amuletos[P.am] || 0) + 1;
    this.ui.juego.xp(P.xp || 0); this.ui.toast(`Misión cumplida: ${m.n}`, 'estampita', 3); this.ui.guardar(); this.ui.seguimiento();
    for (const o of Object.values(MIS)) if (p.mis[o.id]?.e === 'activa') this.revisar(o);
  }
  // progreso
  revisar(m) {
    const p = this.p, s = p.mis[m.id]; if (!s || s.e === 'hecha') return; const o = m.obj;
    if (o.tipo === 'reliquias') s.n = Object.keys(p.reliq).filter(r => RELIQUIAS.includes(r)).length;
    if (o.tipo === 'jefe' && p.reliq[o.reg]) s.n = 1;
    if (o.tipo === 'jefe' && o.reg === 'salamanca' && p.fin) s.n = 1;
    const meta = o.n || 1; if (s.e === 'activa' && s.n >= meta) { s.e = 'lista'; this.ui.toast(`¡Listo! Volvé a hablar por: ${m.n}`, 'libro', 3); }
  }
  alMatar(e) {
    for (const m of this.activas()) {
      const s = this.p.mis[m.id], o = m.obj; if (s.e !== 'activa') continue;
      if (o.tipo === 'matar' && o.bichos.includes(e.tipo)) s.n++;
      if (o.tipo === 'campeon' && e.camp && e.reg === o.reg) s.n++;
      if (o.tipo === 'campeon' && e.camp && !e.reg) { const c = Object.entries(REG).find(([, R]) => R.campeones[e.tipo]); if (c && c[0] === o.reg) s.n++; }
      this.revisar(m);
    }
    this.ui.seguimiento();
  }
  alEvento(k) { for (const m of this.activas()) { const s = this.p.mis[m.id]; if (s.e === 'activa' && m.obj.tipo === 'evento' && m.obj.ev === k) { s.n++; this.revisar(m); } } this.ui.seguimiento(); }
  texto(m) { const s = this.p.mis[m.id], o = m.obj, n = s?.n || 0; if (s?.e === 'lista') return 'Volvé a hablar con quien te la dio';
    if (o.tipo === 'evento') return {doma: 'Domá un bagual (F cerca de un caballo suelto)', tesoro: 'De noche, seguí a la Luz Mala y cavá su entierro', malon: 'Defendé un pueblo de un malón', estrella: `${Math.min(n, o.n)} de ${o.n} estrellas fugaces`, carreta: 'Comprale algo a la carreta del mercachifle'}[o.ev] || '';
    if (o.tipo === 'matar') return `${Math.min(n, o.n)} de ${o.n}: ${o.bichos.map(nB).join(', ')}`; if (o.tipo === 'jefe') return o.reg === 'salamanca' ? 'Vencé a Mandinga en la Salamanca' : `Vencé a ${BOSSES[REG[o.reg].jefe].n}`;
    if (o.tipo === 'reliquias') return `${n} de 8 reliquias`; if (o.tipo === 'campeon') return `Vencé a un campeón dorado de ${REG[o.reg].n}`; return ''; }
  // a dónde ir
  destino(m) {
    const s = this.p.mis[m.id]; if (s?.e === 'lista') { const [r] = m.de.split(':'); const P = REG[r].pueblo; return {x: P.x, z: P.z, n: P.n}; }
    const o = m.obj;
    if (o.tipo === 'evento') { const J = this.ui.juego, y = J.yo; if (o.ev === 'doma' && y) { let best = null, bd = 1e9; for (const a of J.vida.anim) if (a.bagual) { const d = Math.hypot(a.x - y.x, a.z - y.z); if (d < bd) { bd = d; best = a; } } if (best) return {x: best.x, z: best.z, n: 'Un bagual'}; } const R = REG[m.reg]; return {x: R.c[0], z: R.c[1], n: o.ev === 'doma' ? 'Baguales por ' + R.n : 'Andá atento'}; }
    if (o.tipo === 'jefe') { const g = GUARIDAS.find(g => g.reg === o.reg); return {x: g.x, z: g.z, n: g.n}; }
    if (o.tipo === 'reliquias') { const r = RELIQUIAS.find(r => !this.p.reliq[r]); if (!r) return {x: SALA.puerta.x, z: SALA.puerta.z, n: 'La puerta de la Salamanca'}; const P = REG[r].pueblo; return {x: P.x, z: P.z, n: P.n}; }
    // cacerías: el campamento más cercano que tenga esos bichos (o un campeón, si es lo que se busca)
    const y = this.ui.juego.yo; let best = null, bd = 1e9;
    for (const c of CAMPOS) { if (c.reg !== m.reg) continue; if (o.tipo === 'matar' ? !c.tipos.some(t => o.bichos.includes(t)) : !c.camp) continue; const d = y ? Math.hypot(c.x - y.x, c.z - y.z) : 0; if (d < bd) { bd = d; best = c; } }
    if (best) return {x: best.x, z: best.z, n: o.tipo === 'campeon' ? 'Un campeón de ' + REG[m.reg].n : 'Campamento de ' + nB(best.tipos.find(t => o.bichos?.includes(t)) || best.camp)};
    return {x: REG[m.reg].c[0], z: REG[m.reg].c[1], n: REG[m.reg].n};
  }
  // ---------- charla ----------
  charla(npc) {
    const R = REG[npc.reg], rg = RG[npc.reg], op = [];
    for (const m of this.entregables(npc)) op.push({t: 'Ya está: ' + m.n, f: () => { this.entregar(m.id); return {txt: m.fin}; }, prim: 1});
    for (const m of this.disponibles(npc)) op.push({t: (m.hist ? '★ ' : '') + m.n, f: () => ({txt: m.pide, op: [{t: 'Dale, cuente conmigo', f: () => { this.aceptar(m.id); return null; }, prim: 1}, {t: 'Ahora no'}]})});
    for (const m of this.activas().filter(m => m.de === npc.id && this.p.mis[m.id].e === 'activa')) op.push({t: 'Sobre: ' + m.n, f: () => ({txt: `${this.texto(m)}. ${m.obj.tipo === 'jefe' ? 'Lo encuentra en ' + this.destino(m).n + '.' : 'No se me afloje.'}`})});
    if (npc.rol === 'pulpero') op.push({t: 'Quiero comprar', f: () => { this.ui.tienda('pulperia'); return null; }});
    if (npc.rol === 'herrero') op.push({t: 'Mejorar arma y poncho', f: () => { this.ui.tienda('herreria'); return null; }});
    if (npc.rol === 'posta') op.push({t: 'Venderle amuletos', f: () => { this.ui.tienda('mercachifle'); return null; }});
    if (npc.rol === 'cantor' && rg) op.push({t: 'Contame de ' + R.n, f: () => ({txt: rg.lore + ' ' + (rg.dato || '')})});
    op.push({t: 'Chau'});
    const sal = SALUDO[npc.rol] || SALUDO.vecino, i = (npc.x * 7 | 0) % sal.length;
    return {txt: sal[Math.abs(i)], op};
  }
}
export {plural};
