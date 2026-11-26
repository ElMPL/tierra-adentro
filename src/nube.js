// Mundo compartido sobre Firebase Realtime Database (plan gratis): no hace falta un servidor prendido.
// Una de las pantallas que están jugando hace de "anfitrión": corre el mundo (bichos, jefes, hora) igual que jugando solo,
// y los mensajes van y vienen por la base de datos. Si el anfitrión se va o se cuelga, otra pantalla toma su lugar sola.
//
// Lo que hay en la base (todo bajo ta1/):
//   gente/<id>   quién está jugando (se borra solo al desconectarse)
//   anfi         {id, t}: quién corre el mundo y cuándo dio señales de vida por última vez
//   h/<clave>    mensajes para el anfitrión: {d: quién, t: cuándo, m: lista en JSON}
//   j/<id>/<c>   mensajes del anfitrión para cada jugador (lista en JSON; el jugador los borra al leerlos)
//   f/<id>       lo último que ve cada jugador (bichos y gente cerca), se pisa 10 veces por segundo
import {Mundo} from '../shared/sim.js';

const R = 'ta1/', MAX = 12, VIVO = 9000; // si el anfitrión no da señales en 9 s, otro toma el mundo
const SDK = 'https://www.gstatic.com/firebasejs/12.4.0/';
const copia = v => v == null ? null : JSON.parse(JSON.stringify(v));

// ---------- la base de datos de verdad ----------
export async function baseFirebase(url) {
  const [A, D] = await Promise.all([import(/* @vite-ignore */ SDK + 'firebase-app.js'), import(/* @vite-ignore */ SDK + 'firebase-database.js')]);
  const app = A.getApps().find(a => a.name === 'ta') || A.initializeApp({databaseURL: url}, 'ta');
  const db = D.getDatabase(app), r = p => D.ref(db, p); D.goOnline(db);
  const b = {
    desfase: 0,
    poner: (p, v) => D.set(r(p), v).catch(e => console.warn(e)),
    juntar: m => D.update(r('/'), m).catch(e => console.warn(e)),
    clave: p => D.push(r(p)).key,
    alHijo: (p, f) => D.onChildAdded(r(p), s => f(s.key, s.val())),
    alQuitar: (p, f) => D.onChildRemoved(r(p), s => f(s.key)),
    alValor: (p, f) => D.onValue(r(p), s => f(s.val())),
    leer: p => D.get(r(p)).then(s => s.val()),
    tomar: (p, fn) => D.runTransaction(r(p), fn, {applyLocally: false}).then(x => x.committed).catch(() => false),
    alCortar: p => D.onDisconnect(r(p)).remove().catch(() => {}),
    conectado: f => D.onValue(r('.info/connected'), s => f(!!s.val())),
  };
  D.onValue(r('.info/serverTimeOffset'), s => { b.desfase = s.val() || 0; });
  return b;
}

// ---------- una de mentira, para probar en la compu con varias pestañas (?prueba) ----------
export async function basePrueba() {
  const bc = new BroadcastChannel('ta-prueba'), arbol = {}, subs = new Set(), cortes = new Set(); let n = 0, listo = false;
  const pt = p => String(p).split('/').filter(Boolean);
  const leerP = p => { let o = arbol; for (const k of pt(p)) { if (!o || typeof o !== 'object') return null; o = o[k]; } return o === undefined ? null : o; };
  const ponerP = (p, v) => {
    const ks = pt(p), ca = []; let o = arbol;
    for (const k of ks.slice(0, -1)) { if (!o[k] || typeof o[k] !== 'object') o[k] = {}; ca.push([o, k]); o = o[k]; }
    const u = ks[ks.length - 1]; if (v == null) delete o[u]; else o[u] = copia(v);
    for (let i = ca.length - 1; i >= 0; i--) { const [pa, k] = ca[i]; if (!Object.keys(pa[k]).length) delete pa[k]; }
  };
  const revisar = () => { for (const s of [...subs]) s(); };
  const aplicar = ops => { for (const [p, v] of ops) ponerP(p, v); revisar(); };
  const hacer = (ops, st) => { aplicar(ops); bc.postMessage({op: 'w', ops, st}); };
  // las "transacciones" llevan un sello (reloj de Lamport + sorteo) para que, si dos pestañas toman lo mismo a la vez, todas terminen de acuerdo en quién ganó
  let reloj = 0; const sellos = new Map(), mio = Math.random();
  const gana = (p, st) => { reloj = Math.max(reloj, st[0]); const s0 = sellos.get(p); if (s0 && (s0[0] > st[0] || s0[0] === st[0] && s0[1] > st[1])) return false; sellos.set(p, st); return true; };
  bc.onmessage = e => { const d = e.data; if (d.op === 'w') { if (!d.st || gana(d.ops[0][0], d.st)) aplicar(d.ops); } else if (d.op === 'pide') bc.postMessage({op: 'todo', arbol}); else if (d.op === 'todo' && !listo) { listo = true; Object.assign(arbol, d.arbol); revisar(); } };
  bc.postMessage({op: 'pide'}); await new Promise(ok => setTimeout(ok, 300)); listo = true;
  const sub = f => { subs.add(f); setTimeout(f, 0); return () => subs.delete(f); };
  addEventListener('pagehide', () => { if (cortes.size) hacer([...cortes].map(p => [p, null])); });
  return {
    desfase: 0,
    poner: (p, v) => hacer([[p, v]]),
    juntar: m => hacer(Object.entries(m)),
    clave: () => '-' + Date.now().toString(36) + (++n).toString(36).padStart(4, '0') + Math.random().toString(36).slice(2, 6),
    alHijo: (p, f) => { const vis = new Set(); return sub(() => { const v = leerP(p), ks = v && typeof v === 'object' ? Object.keys(v) : []; for (const k of ks) if (!vis.has(k)) { vis.add(k); f(k, copia(v[k])); } const s = new Set(ks); for (const k of [...vis]) if (!s.has(k)) vis.delete(k); }); },
    alQuitar: (p, f) => { let ant = null; return sub(() => { const v = leerP(p), s = new Set(v && typeof v === 'object' ? Object.keys(v) : []), fue = ant ? [...ant].filter(k => !s.has(k)) : []; ant = s; for (const k of fue) f(k); }); },
    alValor: (p, f) => { let ant; return sub(() => { const s = JSON.stringify(leerP(p)); if (s !== ant) { ant = s; f(JSON.parse(s)); } }); },
    leer: async p => copia(leerP(p)),
    tomar: async (p, fn) => { const v = fn(copia(leerP(p))); if (v === undefined) return false; const st = [++reloj, mio]; sellos.set(p, st); hacer([[p, v]], st); return true; },
    alCortar: p => { cortes.add(p); },
    conectado: f => { setTimeout(() => f(true), 0); return () => {}; },
  };
}

// cuánta gente hay (para la pantalla de elegir dónde jugar)
export async function saludNube(b) { const g = await b.leer(R + 'gente'); return {ok: true, jugadores: g ? Object.keys(g).length : 0, max: MAX, nube: true}; }

// ---------- la conexión de un jugador ----------
export class Nube {
  constructor(red, base) {
    this.red = red; this.b = base; this.subs = []; this.yo = 1 + Math.floor(Math.random() * 2e9);
    this.anfi = null; this.gente = new Map(); this.salida = []; this.borrar = {}; this.buzon = new Map(); this.fotos = new Map(); this.pedidos = new Map();
    this.mundo = null; this.vueltas = 0; this.saludos = 0;
  }
  ahora() { return Date.now() + (this.b.desfase || 0); }
  async conectar(hola) {
    const b = this.b, yo = this.yo; this.hola = hola;
    let g; try { g = await b.leer(R + 'gente'); } catch (e) { return false; }
    g = g || {}; if (Object.keys(g).length >= MAX) { this.red.lleno = true; return false; }
    for (const k in g) this.gente.set(+k, g[k]);
    this.red.yo = yo;
    const espera = new Promise(ok => { this.listo = ok; this.tm = setTimeout(() => { this.listo = null; ok(false); }, 15000); });
    this.subs.push(
      b.alHijo(R + 'gente', (k, v) => this.gente.set(+k, v)),
      b.alQuitar(R + 'gente', k => { k = +k; this.gente.delete(k); if (this.mundo) this.seFue(k); if (this.anfi && this.anfi.id === k) this.elegir(); }),
      b.alHijo(R + 'j/' + yo, (k, v) => { this.borrar[R + 'j/' + yo + '/' + k] = null; this.recibir(v); }),
      b.alValor(R + 'f/' + yo, v => { if (v) this.recibir(v); }),
      b.alValor(R + 'anfi', v => this.cambiaAnfi(v)),
      b.conectado(ok => this.conexion(ok)));
    this.vis = () => { if (document.hidden) { if (this.mundo && this.gente.size > 1) this.dejar(); } else this.elegir(); };
    document.addEventListener('visibilitychange', this.vis);
    this.iv = setInterval(() => this.cada(), 100);
    return espera;
  }
  conexion(ok) {
    const b = this.b, yo = this.yo;
    if (ok) {
      for (const p of ['gente/', 'j/', 'f/']) b.alCortar(R + p + yo);
      b.poner(R + 'gente/' + yo, {n: this.hola.n, ch: this.hola.ch, t: this.ahora()});
      if (this.cortado) { this.cortado = false; this.red.estado = 'conectado'; this.red.cola.push({t: 'vuelve'}); this.saludar(); }
    } else if (this.red.estado === 'conectado') { this.cortado = true; this.red.estado = 'reconectando'; this.red.cola.push({t: 'corte'}); }
  }
  // lo que llega del anfitrión (o de mi propio mundo, si el anfitrión soy yo)
  recibir(s) { let v; try { v = typeof s === 'string' ? JSON.parse(s) : s; } catch (e) { return; } for (const m of Array.isArray(v) ? v : [v]) this.llega(m); }
  llega(m) {
    if (!m || typeof m !== 'object') return;
    if (m.t === 'quien') { this.saludar(); return; }
    if (m.t === 'lleno' && this.listo) { this.red.lleno = true; clearTimeout(this.tm); const f = this.listo; this.listo = null; f(false); return; }
    if (m.t === 'bien') { if (this.listo) { clearTimeout(this.tm); const f = this.listo; this.listo = null; this.red.estado = 'conectado'; f(true); } }
    this.red.cola.push(m);
  }
  manda(m) { if (m.t === 'p') this.ultP = m; if (this.mundo) this.mundo.recibe(this.yo, m); else this.salida.push(m); }
  // presentarse al que corre el mundo (con la posición de ahora). "re" evita el cartel de "llegó al mundo" cuando cambia el anfitrión
  saludar() { const p = this.ultP; this.manda({...this.hola, ...(p ? {x: p.x, z: p.z, hp: p.hp, lv: p.lv} : {}), t: 'hola', ...(this.saludos++ ? {re: 1} : {})}); }
  // cada 0,1 s: mandar todo junto en una sola escritura
  cada() {
    const b = this.b, m = this.borrar; this.borrar = {};
    if (this.mundo) {
      for (const [id, l] of this.buzon) if (l.length) m[R + 'j/' + id + '/' + b.clave(R + 'j/' + id)] = JSON.stringify(l);
      for (const [id, f] of this.fotos) m[R + 'f/' + id] = JSON.stringify(f);
      this.buzon.clear(); this.fotos.clear();
      if (this.vueltas % 20 === 0) m[R + 'anfi/t'] = this.ahora();
      if (document.hidden && this.gente.size > 1 && this.vueltas % 10 === 5) this.dejar();
    } else if (this.salida.length) {
      if (this.vivo(this.anfi)) m[R + 'h/' + b.clave(R + 'h')] = {d: this.yo, t: this.ahora(), m: JSON.stringify(this.salida.slice(-60))};
      this.salida = [];
    }
    if (Object.keys(m).length) b.juntar(m);
    if (++this.vueltas % 10 === 0) this.elegir();
  }
  // ---------- quién corre el mundo ----------
  vivo(a) { return a && a.id && this.gente.has(a.id) && this.ahora() - (a.t || 0) < VIVO; }
  elegir() {
    if (this.mundo || this.vivo(this.anfi) || !this.gente.has(this.yo)) return; // solo puede tomarlo alguien que está anotado (o sea, conectado)
    if (document.hidden && this.gente.size > 1) return; // en segundo plano el navegador frena todo: mejor que lo corra otro
    this.b.tomar(R + 'anfi', a => { if (a && a.id && a.id !== this.yo && this.vivo(a)) return; return {id: this.yo, t: this.ahora()}; });
  }
  dejar() { this.b.tomar(R + 'anfi', a => a && a.id === this.yo ? null : undefined); }
  cambiaAnfi(v) {
    const id = v && v.id ? +v.id : 0, antes = this.anfi ? this.anfi.id : 0;
    this.anfi = id ? {id, t: +v.t || 0} : null;
    if (id === this.yo) { if (!this.mundo) this.arrancar(); return; }
    if (this.mundo) this.soltar();
    if (!id) this.elegir(); else if (id !== antes) this.saludar();
  }
  // me toca correr el mundo
  arrancar() {
    const m = this.mundo = new Mundo({envia: (id, x) => this.envia(id, x), reloj: () => this.ahora()});
    m.nid = 1 + Math.floor(Math.random() * 1e9); // números de bichos nuevos, para no confundirlos con los del anfitrión anterior
    m.corta = id => this.pedir(id);
    this.red.mundo = m; m.entra(this.yo); this.saludar();
    this.subH = this.b.alHijo(R + 'h', (k, v) => this.deOtro(k, v));
    let ant = performance.now();
    this.ivM = setInterval(() => { const t = performance.now(), dt = Math.min(.1, (t - ant) / 1000); ant = t; try { m.tick(dt); } catch (e) { console.error(e); } }, 50);
  }
  soltar() { clearInterval(this.ivM); if (this.subH) this.subH(); this.subH = null; this.mundo = null; this.red.mundo = null; this.buzon.clear(); this.fotos.clear(); }
  envia(id, m) {
    if (id === this.yo) { this.llega(m); return; }
    if (m.t === 's') { this.fotos.set(id, m); return; }
    let l = this.buzon.get(id); if (!l) this.buzon.set(id, l = []); if (l.length < 300) l.push(m);
  }
  deOtro(k, v) {
    this.borrar[R + 'h/' + k] = null;
    const m = this.mundo; if (!m || !v) return;
    const id = +v.d; if (!id || id === this.yo || this.ahora() - (+v.t || 0) > 8000) return; // viejo: era para el anfitrión anterior
    let l; try { l = JSON.parse(v.m); } catch (e) { return; } if (!Array.isArray(l)) return;
    for (const x of l) {
      if (!x || typeof x !== 'object') continue;
      if (!m.js.has(id)) { if (x.t !== 'hola') { this.pedir(id); continue; } if (m.js.size >= MAX) { this.envia(id, {t: 'lleno', max: MAX}); continue; } m.entra(id); }
      m.recibe(id, x);
    }
  }
  // se desconectó alguien: sacarlo del mundo y, un rato después, barrer lo que haya quedado suyo en la base
  seFue(k) {
    this.mundo.sale(k); this.buzon.delete(k); this.fotos.delete(k);
    setTimeout(() => { if (this.mundo && !this.gente.has(k)) this.b.juntar({[R + 'j/' + k]: null, [R + 'f/' + k]: null}); }, 1500);
  }
  // alguien me habla y no sé quién es: que se presente
  pedir(id) { const t = this.ahora(); if (t - (this.pedidos.get(id) || 0) < 3000 || !this.gente.has(id)) return; this.pedidos.set(id, t); this.envia(id, {t: 'quien'}); }
  cerrar() {
    clearInterval(this.iv); clearTimeout(this.tm); if (this.listo) { const f = this.listo; this.listo = null; f(false); }
    document.removeEventListener('visibilitychange', this.vis);
    if (this.mundo) { this.dejar(); this.soltar(); }
    for (const f of this.subs) try { f(); } catch (e) { } this.subs = [];
    const yo = this.yo, m = {};
    for (const k in this.borrar) if (!k.startsWith(R + 'j/' + yo + '/')) m[k] = null;
    for (const p of ['gente/', 'j/', 'f/']) m[R + p + yo] = null;
    this.b.juntar(m);
  }
}
