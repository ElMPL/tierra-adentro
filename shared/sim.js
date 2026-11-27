// El mundo compartido: bichos, jefes y la hora del día. Corre en el servidor (y en la pantalla cuando se juega sin conexión).
// Cada jugador maneja su propio personaje y su vida; el mundo decide dónde están los bichos y a quién atacan.
// Los ataques de los bichos se anuncian con tiempo: cada pantalla se fija si su jugador quedó adentro cuando pegan.
import {mul, clamp} from './azar.js';
import {CAMPOS, GUARIDAS, REG, PUEBLOS, CAMINOS, chocar, enPueblo, regionEn, nivelEn, dentro, agua} from './mapa.js';
import {bicho, jefe, PATRON, botin, ENEMIES, CHARS, AMULETOS, xpSig} from './reglas.js';

export const DIA = 20 * 60; // un día entero dura 20 minutos
export const horaDe = ms => (ms / 1000 / DIA + .35) % 1;
export const esNoche = h => h < .23 || h > .77;
const VISTA = 52, LEJOS = 150;
// cuánto tiene que pasar para que vuelva a pasar lo mismo (segundos)
const ESPERA = {luz: 120, estrellas: 240, ovni: 540, tormenta: 200, malon: 420, carreta: 300};
const r1 = v => Math.round(v * 10) / 10, r2 = v => Math.round(v * 100) / 100;
const txt = (s, n) => String(s == null ? '' : s).replace(/[<>&"'`\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, n);
const num = (v, a, b, d = 0) => Number.isFinite(+v) ? clamp(+v, a, b) : d;

export class Mundo {
  constructor(o = {}) {
    this.envia = o.envia || (() => {}); this.js = new Map(); this.bs = new Map(); this.nid = 1; this.t = 0; this.q = mul(o.semilla ?? (Date.now() | 0));
    this.camps = CAMPOS.map(c => ({...c, act: false, slots: null, lejos: 0}));
    this.guar = GUARIDAS.map(g => ({...g, act: false, b: null, muerto: 0, lejos: 0, minis: 0}));
    this.campT = 0; this.snapT = 0; this.listaT = 0; this.reloj = o.reloj || (() => Date.now());
    this.ev = new Map(); this.evT = o.evT ?? 40 + this.q() * 30; this.rayos = []; this.evUlt = {};
  }
  hora() { return horaDe(this.reloj()); }
  // ---------- jugadores ----------
  entra(id) { this.js.set(id, {id, n: 'Gaucho', ch: 'gaucho', lv: 1, x: 0, z: 0, ry: 0, mv: 0, at: 0, hp: 1, vivo: false, listo: false, d: 0, ult: this.t}); }
  sale(id) { if (!this.js.delete(id)) return; for (const b of this.bs.values()) if (b.obj === id) b.obj = null; this.todos({t: 'sale', id}); }
  todos(m, salvo) { for (const id of this.js.keys()) if (id !== salvo) this.envia(id, m); }
  cerca(x, z, m, R = VISTA, salvo) { for (const p of this.js.values()) if (p.listo && p.id !== salvo && Math.abs(p.x - x) < R && Math.abs(p.z - z) < R) this.envia(p.id, m); }
  recibe(id, m) {
    const p = this.js.get(id); if (!p || !m || typeof m !== 'object') return; p.ult = this.t;
    switch (m.t) {
      case 'hola': {
        p.n = txt(m.n, 16) || 'Gaucho'; p.ch = CHARS[m.ch] ? m.ch : 'gaucho'; p.lv = num(m.lv, 1, 30, 1) | 0;
        p.x = num(m.x, -500, 500); p.z = num(m.z, -620, 620); p.hp = num(m.hp, 0, 1, 1); p.vivo = p.hp > 0; p.listo = true;
        this.envia(id, {t: 'bien', id, hora: this.hora(), dia: DIA, j: this.lista()});
        if (!m.re) this.todos({t: 'entra', id, n: p.n, ch: p.ch, lv: p.lv}, id); break; // re: vuelve a presentarse (cambió el anfitrión o se cortó)
      }
      case 'p': p.x = num(m.x, -500, 500, p.x); p.z = num(m.z, -620, 620, p.z); p.ry = num(m.ry, -10, 10); p.mv = num(m.mv, 0, 1); p.at = num(m.at, 0, 1);
        p.hp = num(m.hp, 0, 1, p.hp); p.lv = num(m.lv, 1, 30, p.lv) | 0; p.d = m.d ? 1 : 0; p.es = m.es ? 1 : 0; p.fu = m.fu ? 1 : 0; p.ca = m.ca ? 1 : 0;
        if (p.vivo && p.hp <= 0) { p.vivo = false; for (const b of this.bs.values()) if (b.obj === id) b.obj = null; }
        if (!p.vivo && p.hp > 0) p.vivo = true; break;
      case 'g': if (Array.isArray(m.h)) for (const h of m.h.slice(0, 60)) if (Array.isArray(h)) this.golpe(p, h); break;
      case 'fx': this.cerca(p.x, p.z, {t: 'fx', id, k: txt(m.k, 20), x: r1(num(m.x, -500, 500)), z: r1(num(m.z, -620, 620)), ry: r2(num(m.ry, -10, 10)), a: num(m.a, -100, 100), b: num(m.b, -100, 100)}, 70, id); break;
      case 'chat': { const s = txt(m.m, 90); if (s) this.todos({t: 'chat', id, n: p.n, m: s}); break; }
      case 'ping': this.envia(id, {t: 'pong', c: m.c, hora: this.hora()}); break;
      case 'cava': case 'agarra': case 'abduce': this.tocaEvento(p, m.t, m.e | 0); break;
      case 'sorpresa': this.sorpresa(p, m); break;
    }
  }
  lista() { return [...this.js.values()].filter(p => p.listo).map(p => [p.id, p.n, p.ch, p.lv, r1(p.x), r1(p.z)]); }
  // un jugador le pegó a un bicho: [id, daño, empuje x, empuje z, estado (1 traba, 2 aturde), duración]
  golpe(p, h) {
    const b = this.bs.get(h[0] | 0); if (!b || b.hp <= 0) return;
    if (Math.abs(b.x - p.x) > 32 || Math.abs(b.z - p.z) > 32) return;
    const dmg = num(h[1], 0, 60 * (1 + .12 * p.lv) * 4); b.hp -= dmg; b.dano.set(p.id, (b.dano.get(p.id) || 0) + dmg);
    if (!b.jefe) { b.vx += num(h[2], -25, 25); b.vz += num(h[3], -25, 25); }
    const est = h[4] | 0, dur = num(h[5], 0, 4); if (est === 1) b.traba = Math.max(b.traba, dur); if (est === 2 && !b.jefe) b.aturde = Math.max(b.aturde, dur * (b.camp ? .5 : 1));
    if (!b.jefe && (b.st === 'quieto' || b.st === 'vuelve')) { this.persigue(b, p.id); if (b.c) for (const o of this.bs.values()) if (o.c === b.c && o.st === 'quieto') this.persigue(o, p.id); }
    if (b.hp <= 0) this.muere(b);
  }
  persigue(b, id) { b.st = 'persigue'; b.obj = id; b.cd = Math.max(b.cd, .4 + this.q() * .5); }
  // ---------- bichos ----------
  nace(d, x, z, extra) {
    const b = {id: this.nid++, ...d, x, z, hx: x, hz: z, hpM: d.hp, st: 'quieto', obj: null, t: this.q() * 3, cd: 1, vx: 0, vz: 0, traba: 0, aturde: 0, ry: this.q() * 6.28, mv: 0, sk: 0, dano: new Map(), ...extra};
    this.bs.set(b.id, b); return b;
  }
  activa(c) {
    c.act = true; c.lejos = 0; if (!c.slots) {
      c.slots = []; const q = mul(c.q);
      c.tipos.forEach((t, i) => { const e = ENEMIES[t]; let n = e.hp < 20 ? 4 : e.hp < 50 ? 3 : e.hp < 110 ? 2 : 1; if (i) n = Math.max(1, n - 2); n += q() < .3 ? 1 : 0; for (let k = 0; k < n; k++) c.slots.push({t, camp: false, b: null, vuelve: 0}); });
      if (c.camp) c.slots.push({t: c.camp, camp: true, b: null, vuelve: 0});
    }
    for (const s of c.slots) if (!s.b && this.t >= s.vuelve) this.naceSlot(c, s);
  }
  naceSlot(c, s) {
    const a = this.q() * 6.28, r = this.q() * 4.5; const d = bicho(s.t, c.lv, s.camp); if (!d) return;
    if (s.camp) d.n = REG[c.reg].campeones[s.t] || d.n;
    s.b = this.nace(d, c.x + Math.sin(a) * r, c.z + Math.cos(a) * r, {c, slot: s, camp: s.camp, hx: c.x, hz: c.z, reg: c.reg});
  }
  duerme(c) { c.act = false; for (const s of c.slots || []) if (s.b) { this.bs.delete(s.b.id); s.b = null; } for (const b of this.bs.values()) if (b.c === c) this.bs.delete(b.id); }
  muere(b) {
    this.bs.delete(b.id); this.cerca(b.x, b.z, {t: 'muere', b: b.id, x: r1(b.x), z: r1(b.z)}, VISTA + 10);
    const quienes = new Set(b.dano.keys()); for (const p of this.js.values()) if (p.vivo && Math.hypot(p.x - b.x, p.z - b.z) < 36) quienes.add(p.id);
    for (const id of quienes) { if (!this.js.has(id)) continue; const bo = botin(this.q, b); this.envia(id, {t: 'premio', b: b.id, tipo: b.tipo, lv: b.lv, xp: b.mini ? Math.round(b.xp * .3) : b.xp, oro: b.mini ? 0 : bo.oro, it: b.mini ? [] : bo.it, jefe: b.jefe ? 1 : 0, camp: b.camp ? 1 : 0, reg: b.reg, x: r1(b.x), z: r1(b.z)}); }
    if (b.ladron && this.js.has(b.ladron)) this.envia(b.ladron, {t: 'regalo', oro: b.robo * 2, txt: `¡Agarraste al duende! Te devolvió el doble: ${b.robo * 2} patacones.`, ic: 'plata', son: 'jackpot'});
    if (b.slot) { b.slot.b = null; b.slot.vuelve = this.t + (b.camp ? 150 : 50 + this.q() * 40); }
    if (b.g && b.jefe) { b.g.b = null; b.g.muerto = this.t + 120; this.cerca(b.x, b.z, {t: 'jefefin', b: b.id, reg: b.g.reg, jefe: b.tipo}, 90); for (const o of this.bs.values()) if (o.g === b.g && o.mini) { this.bs.delete(o.id); this.cerca(o.x, o.z, {t: 'muere', b: o.id, x: r1(o.x), z: r1(o.z)}); } }
  }
  // ---------- reloj ----------
  tick(dt) {
    this.t += dt; const vivos = [...this.js.values()].filter(p => p.listo);
    this.campT -= dt; if (this.campT <= 0) { this.campT = 1; this.revisar(vivos); }
    const noche = esNoche(this.hora());
    for (const b of this.bs.values()) this.piensa(b, dt, vivos, noche);
    this.evT -= dt; if (this.evT <= 0) { this.evT = 70 + this.q() * 70; this.nuevoEvento(vivos, noche); }
    for (const e of [...this.ev.values()]) this.evento(e, dt, vivos, noche);
    this.truenos(dt);
    this.snapT -= dt; if (this.snapT <= 0) { this.snapT = .1; for (const p of vivos) this.foto(p); }
    this.listaT -= dt; if (this.listaT <= 0) { this.listaT = 2; const l = this.lista(); this.todos({t: 'lista', j: l, hora: this.hora()}); }
    for (const p of [...this.js.values()]) if (this.t - p.ult > 30) { this.sale(p.id); if (this.corta) this.corta(p.id); }
  }
  revisar(vivos) {
    const hay = (x, z, R) => vivos.some(p => Math.abs(p.x - x) < R && Math.abs(p.z - z) < R);
    for (const c of this.camps) { if (hay(c.x, c.z, 80)) { if (!c.act) this.activa(c); c.lejos = 0; for (const s of c.slots) if (!s.b && this.t >= s.vuelve && !hay(c.x, c.z, 16)) this.naceSlot(c, s); } else if (c.act && ++c.lejos > 15) this.duerme(c); }
    for (const g of this.guar) {
      if (hay(g.x, g.z, 60)) { g.lejos = 0; if (!g.b && this.t >= g.muerto) { const R = REG[g.reg]; const nj = vivos.filter(p => Math.hypot(p.x - g.x, p.z - g.z) < 70).length; g.b = this.nace(jefe(g.jefe, R.lv[1] + 1, nj), g.x, g.z, {g, reg: g.reg}); } }
      else if (g.b && ++g.lejos > 20) { this.bs.delete(g.b.id); g.b = null; for (const o of this.bs.values()) if (o.g === g) this.bs.delete(o.id); }
    }
  }
  // lo que ve cada jugador
  foto(p) {
    const b = [], j = [];
    // [id, x, z, giro, vida, ataque, marcas] y, la primera vez que lo ve (y cada 2 s por las dudas), también [tipo, nivel, nombre]
    const ya = p.ya || (p.ya = new Map()), antes = p.vis || new Set(), ahora = new Set();
    for (const o of this.bs.values()) if (Math.abs(o.x - p.x) < VISTA && Math.abs(o.z - p.z) < VISTA) {
      const e = [o.id, r1(o.x), r1(o.z), r2(o.ry), r2(Math.max(0, o.hp / o.hpM)), o.sk, (o.camp ? 1 : 0) | (o.jefe ? 2 : 0) | (o.mini ? 4 : 0) | (o.aturde > 0 ? 8 : 0) | (o.traba > 0 ? 16 : 0) | (o.ladron ? 32 : 0) | (o.malon ? 64 : 0)];
      if (!antes.has(o.id) || this.t - (ya.get(o.id) ?? -9) > 2) { ya.set(o.id, this.t); e.push(o.tipo, o.lv); if (o.camp || o.jefe || o.ladron) e.push(o.n); }
      ahora.add(o.id); b.push(e);
    }
    p.vis = ahora; if (ya.size > 400) for (const id of ya.keys()) if (!this.bs.has(id)) ya.delete(id);
    for (const o of this.js.values()) if (o !== p && o.listo && Math.abs(o.x - p.x) < LEJOS && Math.abs(o.z - p.z) < LEJOS) j.push([o.id, r1(o.x), r1(o.z), r2(o.ry), r2(o.mv), r2(o.at), r2(o.hp), o.ch, o.lv, o.n, o.d | (o.es << 1) | (o.fu << 2) | ((o.ca || 0) << 3)]);
    const e = []; for (const v of this.ev.values()) if (v.k !== 'estrellas' && Math.abs(v.x - p.x) < 150 && Math.abs(v.z - p.z) < 150) e.push([v.id, v.k, r1(v.x), r1(v.z), r2(v.a || 0), r2(v.b || 0)]);
    this.envia(p.id, {t: 's', b, j, e});
  }
  // ---------- cabeza de los bichos ----------
  piensa(b, dt, vivos, noche) {
    const q = this.q;
    if (b.vx || b.vz) { b.x += b.vx * dt; b.z += b.vz * dt; const k = Math.max(0, 1 - dt * 7); b.vx *= k; b.vz *= k; if (Math.abs(b.vx) + Math.abs(b.vz) < .1) b.vx = b.vz = 0; if (!b.fly) chocar(b, b.r); }
    b.mv = 0; b.cd -= dt; if (b.traba > 0) b.traba -= dt;
    if (b.aturde > 0) { b.aturde -= dt; b.sk = 0; return; }
    if (b.ai === 'jefe') return this.jefe(b, dt, vivos);
    if (b.ai === 'huye') return this.huye(b, dt, vivos);
    const sp = b.vel * (b.traba > 0 ? .5 : 1) * (noche ? 1.08 : 1);
    if (b.sk === 2) { // preparando un golpe
      b.t -= dt; if (b.mov) { const m = b.mov; m.t += dt; const k = clamp(m.t / m.d, 0, 1); b.x = m.x0 + (m.x1 - m.x0) * k; b.z = m.z0 + (m.z1 - m.z0) * k; if (!b.fly) chocar(b, b.r); }
      if (b.t <= 0) { b.sk = 0; b.mov = null; b.cd = 1.6 + q() * 1.1; if (b.ai === 'kami') { b.hp = 0; this.muere(b); } }
      return;
    }
    const tg = b.obj != null ? this.js.get(b.obj) : null;
    if (b.st === 'quieto') {
      const R = 8.5 + (noche ? 2 : 0) + (b.camp ? 2 : 0);
      let best = null, bd = R; for (const p of vivos) { if (!p.vivo || (!b.malon && enPueblo(p.x, p.z, 4))) continue; const d = Math.hypot(p.x - b.x, p.z - b.z); if (d < bd) { bd = d; best = p; } }
      if (best) { this.persigue(b, best.id); if (b.c) for (const o of this.bs.values()) if (o.c === b.c && o.st === 'quieto' && Math.hypot(o.x - b.x, o.z - b.z) < 12) this.persigue(o, best.id); return; }
      if (b.ai === 'plant') return;
      if (b.malon) { this.anda(b, b.hx, b.hz, sp * .75, dt, 5); return; }
      b.t -= dt; if (b.t <= 0) { b.t = 3 + q() * 4; const a = q() * 6.28, r = q() * 6; b.wx = b.hx + Math.sin(a) * r; b.wz = b.hz + Math.cos(a) * r; }
      if (b.wx != null) this.anda(b, b.wx, b.wz, sp * .35, dt, .5);
      return;
    }
    if (b.st === 'vuelve') {
      b.hp = Math.min(b.hpM, b.hp + b.hpM * dt * .5); b.dano.clear();
      if (this.anda(b, b.hx, b.hz, sp * 1.5, dt, 1.5)) { b.st = 'quieto'; b.wx = null; }
      return;
    }
    // persigue
    const lejos = Math.hypot(b.x - b.hx, b.z - b.hz) > (b.c ? 34 : 50);
    if (!tg || !tg.vivo || (lejos && !b.malon) || Math.hypot(tg.x - b.x, tg.z - b.z) > 30 || (!b.malon && enPueblo(tg.x, tg.z, 2))) { b.st = b.malon ? 'quieto' : 'vuelve'; b.obj = null; return; }
    const dx = tg.x - b.x, dz = tg.z - b.z, d = Math.hypot(dx, dz); const rr = b.r + 1.5;
    const ai = b.ai;
    if (ai === 'shoot' || ai === 'plant' || ai === 'summon') {
      b.ry = Math.atan2(dx, dz);
      if (ai !== 'plant') { if (d > 10) this.anda(b, tg.x, tg.z, sp, dt, 0); else if (d < 5.5) this.anda(b, b.x - dx, b.z - dz, sp * .8, dt, 0); }
      if (b.cd <= 0 && d < 14) this.dispara(b, tg, dx / d, dz / d);
      return;
    }
    if (ai === 'charge' && b.cd <= 0 && d > 4 && d < 11) return this.embiste(b, dx / d, dz / d);
    if (ai === 'leap' && b.cd <= 0 && d > 3.5 && d < 10) return this.salta(b, tg);
    if (d > rr) { this.anda(b, tg.x, tg.z, sp, dt, rr * .8); return; }
    b.ry = Math.atan2(dx, dz);
    if (b.cd <= 0) this.pega(b);
  }
  anda(b, x, z, sp, dt, stop) {
    const dx = x - b.x, dz = z - b.z, d = Math.hypot(dx, dz); if (d <= stop) return true;
    const k = Math.min(d - stop, sp * dt) / d; b.x += dx * k; b.z += dz * k; b.ry = Math.atan2(dx, dz); b.mv = 1;
    // no amontonarse
    for (const o of this.bs.values()) { if (o === b || o.jefe) continue; const ex = b.x - o.x, ez = b.z - o.z; if (Math.abs(ex) > 2.5 || Math.abs(ez) > 2.5) continue; const e = Math.hypot(ex, ez), R = b.r + o.r; if (e < R && e > .001) { const f = (R - e) * .5 / e; b.x += ex * f; b.z += ez * f; } }
    if (!b.fly) chocar(b, b.r);
    return false;
  }
  // golpe anunciado: c = círculo, l = línea
  avisa(b, a) { this.cerca(b.x, b.z, {t: 'atk', b: b.id, ...a, dmg: Math.round(a.dmg ?? b.dmg)}, VISTA + 10); }
  pega(b) {
    const slam = b.ai === 'slam' || b.ai === 'kami', del = slam ? .85 : b.ai === 'kami' ? .7 : .5;
    b.sk = 2; b.t = del;
    if (slam) this.avisa(b, {k: 'c', x: r1(b.x), z: r1(b.z), r: r1(b.r + (b.ai === 'kami' ? 2.4 : 2.6)), dt: del, v: b.ai === 'kami' ? 'boom' : 'golpe', dmg: b.dmg * (b.ai === 'kami' ? 1.6 : 1.15)});
    else { const f = b.r + .8; this.avisa(b, {k: 'c', x: r1(b.x + Math.sin(b.ry) * f), z: r1(b.z + Math.cos(b.ry) * f), r: r1(1.1 + b.r * .6), dt: del, v: 'zarpa'}); }
  }
  embiste(b, ux, uz) {
    const L = 11, del = .75; b.ry = Math.atan2(ux, uz); b.sk = 2; b.t = del + .4;
    b.mov = {x0: b.x, z0: b.z, x1: b.x + ux * L, z1: b.z + uz * L, t: -del, d: .4};
    this.avisa(b, {k: 'l', x: r1(b.x), z: r1(b.z), ry: r2(b.ry), len: L, w: r1(b.r * 2 + 1), dt: del + .15, v: 'embiste'});
  }
  salta(b, tg) {
    const del = .85; b.sk = 2; b.t = del; b.mov = {x0: b.x, z0: b.z, x1: tg.x, z1: tg.z, t: 0, d: del};
    this.avisa(b, {k: 'c', x: r1(tg.x), z: r1(tg.z), r: r1(2 + b.r * .5), dt: del, v: 'salto'});
  }
  dispara(b, tg, ux, uz) {
    const n = b.lv > 14 ? 3 : b.lv > 7 ? 2 : 1, del = .35; b.sk = 2; b.t = del;
    for (let i = 0; i < n; i++) { const a = Math.atan2(ux, uz) + (i - (n - 1) / 2) * .22; this.cerca(b.x, b.z, {t: 'bala', b: b.id, x: r1(b.x), z: r1(b.z), dx: r2(Math.sin(a)), dz: r2(Math.cos(a)), v: 9 + b.lv * .12, r: .5, dmg: Math.round(b.dmg * .85), ttl: 1.7, dt: del, k: b.tipo}, VISTA + 10); }
    if (b.ai === 'summon' && (b.disp = (b.disp || 0) + 1) % 3 === 0) { let n2 = 0; for (const o of this.bs.values()) if (o.dueno === b) n2++; if (n2 < 4) for (let i = 0; i < 2; i++) { const d = bicho('chonchon', b.lv); if (d) this.nace(d, b.x + this.q() * 4 - 2, b.z + this.q() * 4 - 2, {dueno: b, mini: 1, c: b.c, hx: b.hx, hz: b.hz, st: 'persigue', obj: tg.id}); } }
    b.cd = 1.9 + this.q() * 1.2;
  }
  // ---------- sorpresas: el duende que sale de una tinaja y se lleva tu plata ----------
  sorpresa(p, m) {
    if (m.k !== 'duende' || [...this.bs.values()].some(b => b.ladron === p.id)) return;
    const x = num(m.x, -500, 500, p.x), z = num(m.z, -620, 620, p.z); if (Math.hypot(x - p.x, z - p.z) > 22) return;
    const d = bicho('duende', Math.max(1, p.lv)); if (!d) return; d.n = 'Duende ladrón'; d.hp = Math.round(d.hp * 1.6); d.vel = 6.3;
    const robo = num(m.robo, 0, 5000) | 0; this.nace(d, x, z, {ladron: p.id, robo, ai: 'huye', st: 'huye', vida: 24, reg: regionEn(x, z)});
    this.envia(p.id, {t: 'robo', robo, x: r1(x), z: r1(z)});
  }
  huye(b, dt, vivos) {
    b.vida -= dt;
    if (b.vida <= 0) { this.bs.delete(b.id); this.cerca(b.x, b.z, {t: 'muere', b: b.id, x: r1(b.x), z: r1(b.z), fue: 1}, VISTA + 10); if (this.js.has(b.ladron)) this.envia(b.ladron, {t: 'regalo', txt: `El duende se escapó con tus ${b.robo} patacones.`, ic: 'plata', son: 'lose'}); return; }
    let near = null, bd = 16; for (const p of vivos) { const d = Math.hypot(p.x - b.x, p.z - b.z); if (p.vivo && d < bd) { bd = d; near = p; } }
    const sp = b.vel * (b.traba > 0 ? .45 : 1);
    if (near) { const dx = b.x - near.x, dz = b.z - near.z, l = Math.hypot(dx, dz) || 1, a = Math.sin(this.t * 1.7 + b.id) * .9; this.anda(b, b.x + (dx / l * Math.cos(a) - dz / l * Math.sin(a)) * 6, b.z + (dz / l * Math.cos(a) + dx / l * Math.sin(a)) * 6, sp, dt, 0); }
    else { b.t -= dt; if (b.t <= 0) { b.t = 1 + this.q() * 2; b.wx = b.x + (this.q() - .5) * 10; b.wz = b.z + (this.q() - .5) * 10; } if (b.wx != null) this.anda(b, b.wx, b.wz, sp * .5, dt, .5); }
  }
  // ---------- eventos del mundo: cada tanto pasa algo cerca de alguien ----------
  avisoEv(x, z, m, R = 170) { for (const p of this.js.values()) if (p.listo && Math.abs(p.x - x) < R && Math.abs(p.z - z) < R) this.envia(p.id, {t: 'ev', x: r1(x), z: r1(z), ...m}); }
  lugarCerca(x, z, ra, rb, ok = () => true) {
    for (let i = 0; i < 30; i++) { const a = this.q() * 6.283, r = ra + this.q() * (rb - ra), px = x + Math.sin(a) * r, pz = z + Math.cos(a) * r; if (dentro(px, pz, 8) && agua(px, pz) < .3 && regionEn(px, pz) !== 'salamanca' && ok(px, pz)) return [px, pz]; }
    return null;
  }
  ponEv(e) { e.id = this.nid++; this.ev.set(e.id, e); this.evUlt[e.k] = this.t; return e; }
  nuevoEvento(vivos, noche) {
    const ps = vivos.filter(p => p.vivo); if (!ps.length || this.ev.size >= 4) return;
    const p = ps[Math.floor(this.q() * ps.length)], rg = regionEn(p.x, p.z); if (rg === 'salamanca') return;
    const hay = k => [...this.ev.values()].some(e => e.k === k) || this.t - (this.evUlt[k] ?? -1e9) < ESPERA[k];
    const op = (noche ? [['luz', 4], ['estrellas', 2.5], ['ovni', 1.3], ['tormenta', 1.4], ['malon', 1.6]] : [['tormenta', 2.6], ['carreta', 2.4], ['malon', 2.2]]).filter(([k]) => !hay(k));
    let r = this.q() * op.reduce((a, o) => a + o[1], 0);
    for (const [k, w] of op) { r -= w; if (r <= 0) { if (!this.arranca(k, p, rg) && k !== 'tormenta' && !hay('tormenta')) this.arranca('tormenta', p, rg); return; } }
  }
  arranca(k, p, rg) {
    const R = REG[rg], lv = nivelEn(p.x, p.z, rg);
    if (k === 'luz') { const l = this.lugarCerca(p.x, p.z, 22, 30); if (!l) return false; this.ponEv({k, x: l[0], z: l[1], tx: l[0], tz: l[1], a: 0, n: 0, max: 3 + (this.q() * 3 | 0), ttl: 160, lv}); this.avisoEv(l[0], l[1], {k, n: 'La Luz Mala', d: 'Una luz se prende en el campo. Dicen que marca dónde hay un entierro…'}, 90); return true; }
    if (k === 'estrellas') { this.ponEv({k, x: p.x, z: p.z, ttl: 45, cada: 0, lv}); this.avisoEv(p.x, p.z, {k, n: 'Lluvia de estrellas', d: 'Agarrá las que caen y pedí un deseo'}, 120); return true; }
    if (k === 'ovni') { const l = this.lugarCerca(p.x, p.z, 26, 34); if (!l) return false; this.ponEv({k, x: l[0], z: l[1], ox: l[0], oz: l[1], tx: l[0], tz: l[1], ttl: 80, a: 0, lv}); this.avisoEv(l[0], l[1], {k, n: 'Luces raras en el cielo', d: 'Algo baja del cielo y no es una estrella…'}, 110); return true; }
    if (k === 'tormenta') {
      const e = this.ponEv({k, x: p.x, z: p.z, a: 80, b: 70, ttl: 70, rt: 3, lv});
      if (['pampa', 'cuyo', 'sur', 'puna', 'ingenio'].includes(rg) && this.q() < .65) { const l = this.lugarCerca(p.x, p.z, 25, 35) || [p.x + 25, p.z]; this.ponEv({k: 'tornado', x: l[0], z: l[1], tx: p.x, tz: p.z, ttl: 60, tor: e.id, lv}); }
      this.avisoEv(p.x, p.z, {k, n: rg === 'cuyo' ? 'Viento Zonda' : rg === 'pampa' ? 'Tormenta de verano' : 'Se viene la tormenta', d: 'Cuidado con los rayos: a los bichos también les pegan'}, 120); return true;
    }
    if (k === 'malon') {
      let pu = null, bd = 170; for (const o of PUEBLOS) { const d = Math.hypot(o.x - p.x, o.z - p.z); if (d < bd) { bd = d; pu = o; } } if (!pu) return false;
      this.ponEv({k, x: pu.x, z: pu.z, pu: pu.id, n: pu.n, a: 0, b: 3, espera: 10, ttl: 210, reg: pu.id});
      this.avisoEv(pu.x, pu.z, {k, n: '¡Malón en ' + pu.n + '!', d: 'Las leyendas vienen a saquear el pueblo: defendelo'}, 220); return true;
    }
    if (k === 'carreta') {
      let best = null, bd = 160; for (const c of CAMINOS) { if (c.b === 'salamanca') continue; for (const fin of [0, 1]) { const q = fin ? c.p[c.p.length - 1] : c.p[0]; const d = Math.hypot(q[0] - p.x, q[1] - p.z); if (d < bd) { bd = d; best = fin ? [...c.p].reverse() : c.p; } } }
      if (!best) return false; const pu = PUEBLOS.find(o => Math.hypot(o.x - best[0][0], o.z - best[0][1]) < 5);
      const [ax, az] = best[0], [bx, bz] = best[1], l = Math.hypot(bx - ax, bz - az) || 1, k0 = Math.min(.9, 16 / l);
      this.ponEv({k, ruta: best, i: 1, x: ax + (bx - ax) * k0, z: az + (bz - az) * k0, a: Math.atan2(bx - ax, bz - az), ttl: 320});
      this.avisoEv(best[0][0], best[0][1], {k, n: 'La carreta del mercachifle', d: `Sale de ${pu ? pu.n : 'un pueblo'} con cosas que no se ven en las pulperías`}, 200); return true;
    }
    return false;
  }
  hayGente(x, z, R) { for (const p of this.js.values()) if (p.listo && Math.abs(p.x - x) < R && Math.abs(p.z - z) < R && Math.hypot(p.x - x, p.z - z) < R) return true; return false; }
  evento(e, dt, vivos, noche) {
    const q = this.q; e.ttl -= dt; const fin = () => this.ev.delete(e.id);
    if (e.ttl <= 0) { if (e.k === 'malon') this.finMalon(e, false); return fin(); }
    const mueve = (sp, stop = .3) => { const dx = e.tx - e.x, dz = e.tz - e.z, d = Math.hypot(dx, dz); if (d <= stop) return true; const k = Math.min(1, sp * dt / d); e.x += dx * k; e.z += dz * k; return false; };
    switch (e.k) {
      case 'luz': {
        if (!noche) return fin();
        const near = vivos.find(p => p.vivo && Math.hypot(p.x - e.x, p.z - e.z) < 7);
        if (mueve(9) && near) {
          if (e.n >= e.max) { e.k = 'tesoro'; e.ttl = 100; e.a = 0; this.avisoEv(e.x, e.z, {k: 'tesoro', n: 'La luz se hundió en la tierra', d: '¡Cavá ahí!'}, 50); return; }
          const base = Math.atan2(e.x - near.x, e.z - near.z);
          const t = this.lugarCerca(e.x, e.z, 13, 19, (x, z) => Math.abs(Math.atan2(Math.sin(Math.atan2(x - e.x, z - e.z) - base), Math.cos(Math.atan2(x - e.x, z - e.z) - base))) < 1.3) || this.lugarCerca(e.x, e.z, 10, 16); if (t) { e.tx = t[0]; e.tz = t[1]; } e.n++; e.a = e.n;
        }
        return;
      }
      case 'tesoro': return;
      case 'estrellas': {
        if (!this.hayGente(e.x, e.z, 90)) return fin();
        e.cada -= dt; if (e.cada <= 0 && e.ttl > 6) { e.cada = 1.3 + q() * .9; const l = this.lugarCerca(e.x, e.z, 3, 34); if (l) this.ponEv({k: 'estrella', x: l[0], z: l[1], a: 1.6, ttl: 26, lv: e.lv}); }
        return;
      }
      case 'estrella': if (e.a > 0) e.a = Math.max(0, e.a - dt); return;
      case 'ovni': {
        if (e.fue) { e.a = 1; return; }
        if (mueve(2.2)) { const l = this.lugarCerca(e.ox, e.oz, 2, 14); if (l) { e.tx = l[0]; e.tz = l[1]; } }
        return;
      }
      case 'tormenta': {
        e.b = e.ttl; e.rt -= dt; if (e.rt > 0 || e.ttl < 4) return; e.rt = .7 + q() * .8;
        const ps = vivos.filter(p => p.vivo && Math.hypot(p.x - e.x, p.z - e.z) < e.a);
        const bs = [...this.bs.values()].filter(b => !b.jefe && Math.abs(b.x - e.x) < e.a && Math.abs(b.z - e.z) < e.a);
        let x, z; if (bs.length && q() < .45) { const b = bs[Math.floor(q() * bs.length)]; x = b.x + (q() - .5) * 2; z = b.z + (q() - .5) * 2; }
        else if (ps.length) { const p = ps[Math.floor(q() * ps.length)], o = q() < .25 ? 0 : 2.5 + q() * 7, a = q() * 6.283; x = p.x + Math.sin(a) * o; z = p.z + Math.cos(a) * o; } else return;
        const dt2 = 1.3, R = 2.6; this.cerca(x, z, {t: 'atk', b: 0, k: 'c', x: r1(x), z: r1(z), r: R, dt: dt2, v: 'rayo', dmg: Math.round(10 + e.lv * 4)}, VISTA + 30);
        this.rayos.push({x, z, r: R, t: dt2, dmg: 45 + e.lv * 14}); return;
      }
      case 'tornado': {
        if (!this.ev.has(e.tor)) e.ttl = Math.min(e.ttl, 3);
        if (mueve(3.6, 1)) { const l = this.lugarCerca(e.x, e.z, 8, 22); if (l) { e.tx = l[0]; e.tz = l[1]; } }
        for (const b of [...this.bs.values()]) { if (b.jefe || Math.abs(b.x - e.x) > 4 || Math.abs(b.z - e.z) > 4) continue; const d = Math.hypot(b.x - e.x, b.z - e.z); if (d > 3.2) continue; b.hp -= (25 + e.lv * 7) * dt; const a = q() * 6.283; b.vx += Math.sin(a) * 30 * dt; b.vz += Math.cos(a) * 30 * dt; b.aturde = Math.max(b.aturde, .3); if (b.hp <= 0) this.muere(b); }
        return;
      }
      case 'malon': {
        let vivosM = 0; for (const b of this.bs.values()) if (b.malon === e.id) vivosM++;
        if (vivosM > 0) return; e.espera -= dt; if (e.espera > 0) return;
        if (e.a >= e.b) { this.finMalon(e, true); return fin(); }
        e.a++; e.espera = 6; const R = REG[e.reg], B = R.bichos.slice(0, 3), nj = vivos.filter(p => Math.hypot(p.x - e.x, p.z - e.z) < 90).length || 1;
        const n = 3 + e.a * 2 + (nj - 1) * 2, lv = Math.min(R.lv[1], R.lv[0] + e.a - 1), a0 = q() * 6.283;
        for (let i = 0; i < n; i++) {
          const a = a0 + (i % 3 - 1) * .5 + (q() - .5) * .3, r = 48 + q() * 8; let x = e.x + Math.sin(a) * r, z = e.z + Math.cos(a) * r; if (!dentro(x, z, 4)) { x = e.x - Math.sin(a) * r; z = e.z - Math.cos(a) * r; }
          const camp = e.a === e.b && i === 0; const t = camp ? Object.keys(R.campeones)[0] : B[Math.floor(q() * B.length)]; const d = bicho(t, lv, camp); if (!d) continue; if (camp) d.n = R.campeones[t];
          this.nace(d, x, z, {malon: e.id, hx: e.x, hz: e.z, camp, reg: e.reg});
        }
        this.avisoEv(e.x, e.z, {k: 'ola', n: `Oleada ${e.a} de ${e.b}`, d: e.a === e.b ? 'Viene con un campeón' : e.n}, 150); return;
      }
      case 'carreta': {
        if (this.hayGente(e.x, e.z, 6)) return;
        const pt = e.ruta[e.i]; e.tx = pt[0]; e.tz = pt[1]; const ox = e.x, oz = e.z;
        if (mueve(2.3, .5)) { e.i++; if (e.i >= e.ruta.length) return fin(); }
        if (e.x !== ox || e.z !== oz) e.a = Math.atan2(e.x - ox, e.z - oz);
        return;
      }
    }
  }
  finMalon(e, ok) {
    for (const b of [...this.bs.values()]) if (b.malon === e.id) { this.bs.delete(b.id); this.cerca(b.x, b.z, {t: 'muere', b: b.id, x: r1(b.x), z: r1(b.z), fue: 1}, VISTA + 10); }
    if (!ok) { this.avisoEv(e.x, e.z, {k: 'fin', n: 'El malón se fue', d: `Se llevaron las gallinas de ${e.n}`}, 150); return; }
    const R = REG[e.reg];
    for (const p of this.js.values()) if (p.listo && Math.hypot(p.x - e.x, p.z - e.z) < 80) this.envia(p.id, {t: 'regalo', ev: 'malon', oro: 30 * R.lv[1], xp: Math.round(xpSig(R.lv[0] + 1) * .25), it: [['asado', 1], ['retazo', 3]], am: this.q() < .35 ? this.amuleto() : null, txt: `¡Salvaste ${e.n}! El pueblo te regala lo mejor que tiene.`, ic: 'asado', son: 'win', cartel: 1});
  }
  amuleto() { const k = Object.keys(AMULETOS); return k[Math.floor(this.q() * k.length)]; }
  tocaEvento(p, que, id) {
    const e = this.ev.get(id); if (!e || !p.vivo || Math.hypot(p.x - e.x, p.z - e.z) > 8) return; const lv = Math.max(1, p.lv);
    if (que === 'cava' && e.k === 'tesoro') {
      this.ev.delete(id); const trampa = this.q() < .25;
      this.envia(p.id, {t: 'regalo', ev: 'tesoro', oro: 40 + lv * 28, am: this.q() < .4 ? this.amuleto() : null, it: [['retazo', 2]], txt: trampa ? '¡Un entierro! Pero era una trampa de Mandinga…' : '¡Un entierro de la Luz Mala! Patacones de plata vieja.', ic: 'plata', son: 'jackpot', cartel: 1});
      if (trampa) { const B = REG[regionEn(e.x, e.z)].bichos; for (let i = 0; i < 3; i++) { const d = bicho(B[i % 2], nivelEn(e.x, e.z)); if (d) this.persigue(this.nace(d, e.x + Math.sin(i * 2.1) * 3, e.z + Math.cos(i * 2.1) * 3, {hx: e.x, hz: e.z}), p.id); } }
    }
    if (que === 'agarra' && e.k === 'estrella' && e.a <= 0) {
      this.ev.delete(id); const d = ['vel', 'dmg', 'suerte', 'cura'][Math.floor(this.q() * 4)];
      this.envia(p.id, {t: 'regalo', ev: 'estrella', xp: Math.round(xpSig(lv) * .012), deseo: d, txt: {vel: 'Pediste ser rápido como el viento', dmg: 'Pediste fuerza de toro', suerte: 'Pediste suerte', cura: 'Pediste salud'}[d], ic: 'gema3', son: 'gem'});
    }
    if (que === 'abduce' && e.k === 'ovni' && !e.fue) {
      e.fue = 1; e.ttl = 5;
      this.envia(p.id, {t: 'regalo', ev: 'ovni', xp: Math.round(xpSig(lv) * .12), am: this.q() < .5 ? this.amuleto() : null, txt: 'Te llevaron a dar una vuelta… y te devolvieron en otro lado.', ic: 'gema2', son: 'ufo', cartel: 1});
    }
  }
  truenos(dt) {
    for (let i = this.rayos.length - 1; i >= 0; i--) {
      const r = this.rayos[i]; r.t -= dt; if (r.t > 0) continue; this.rayos.splice(i, 1);
      for (const b of [...this.bs.values()]) if (!b.jefe && Math.abs(b.x - r.x) < 5 && Math.abs(b.z - r.z) < 5 && Math.hypot(b.x - r.x, b.z - r.z) < r.r + b.r) { b.hp -= r.dmg; b.aturde = Math.max(b.aturde, 1); if (b.hp <= 0) this.muere(b); }
    }
  }
  // ---------- jefes ----------
  jefe(b, dt, vivos) {
    const g = b.g, q = this.q; let tg = null, bd = 44;
    for (const p of vivos) { if (!p.vivo) continue; const d = Math.hypot(p.x - g.x, p.z - g.z); if (d < bd) { bd = d; tg = p; } }
    if (!tg) { if (b.st !== 'quieto') { b.st = 'quieto'; b.sk = 0; b.mov = null; } b.hp = Math.min(b.hpM, b.hp + b.hpM * dt * .2); b.dano.clear(); this.anda(b, g.x, g.z, b.vel, dt, 1); return; }
    if (b.st === 'quieto') { b.st = 'persigue'; b.cd = 1.5; this.cerca(b.x, b.z, {t: 'jefe', b: b.id, n: b.n, sub: b.sub, reg: g.reg, jefe: b.tipo}, 80); }
    if (b.sk === 2) { b.t -= dt; if (b.mov) { const m = b.mov; m.t += dt; const k = clamp(m.t / m.d, 0, 1); b.x = m.x0 + (m.x1 - m.x0) * k; b.z = m.z0 + (m.z1 - m.z0) * k; chocar(b, b.r); } if (b.t <= 0) { b.sk = 0; b.mov = null; } return; }
    const dx = tg.x - b.x, dz = tg.z - b.z, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d; b.ry = Math.atan2(dx, dz);
    if (d > 3.2) this.anda(b, tg.x, tg.z, b.vel * .8, dt, 3);
    if (b.cd > 0) return;
    const f2 = b.hp < b.hpM * .5, P = PATRON[b.tipo] || ['golpe', 'embestida'], ak = P[(b.pi = ((b.pi ?? -1) + 1)) % P.length];
    const dmg = b.dmg, A = a => this.avisa(b, a);
    b.sk = 2; b.t = 1; b.cd = (f2 ? 1.6 : 2.3) + q() * .6;
    switch (ak) {
      case 'golpe': A({k: 'c', x: r1(b.x), z: r1(b.z), r: r1(b.r + 4), dt: 1, v: 'golpe', dmg: dmg * 1.2}); break;
      case 'embestida': { const L = 16; b.t = 1.45; b.mov = {x0: b.x, z0: b.z, x1: b.x + ux * L, z1: b.z + uz * L, t: -1, d: .45}; A({k: 'l', x: r1(b.x), z: r1(b.z), ry: r2(b.ry), len: L, w: r1(b.r * 2 + 1.2), dt: 1.15, v: 'embiste', dmg: dmg * 1.3}); break; }
      case 'salto': b.t = 1.1; b.mov = {x0: b.x, z0: b.z, x1: tg.x, z1: tg.z, t: 0, d: 1.1}; A({k: 'c', x: r1(tg.x), z: r1(tg.z), r: r1(b.r + 2.4), dt: 1.1, v: 'salto', dmg: dmg * 1.25}); break;
      case 'aliento': A({k: 'l', x: r1(b.x), z: r1(b.z), ry: r2(b.ry), len: 10, w: 4.2, dt: .85, v: 'fuego', dmg: dmg * 1.1}); break;
      case 'lluvia': { const ps = vivos.filter(p => p.vivo && Math.hypot(p.x - b.x, p.z - b.z) < 30).slice(0, 5); for (const p of ps) for (let i = 0; i < (f2 ? 3 : 2); i++) A({k: 'c', x: r1(p.x + (q() - .5) * (i ? 6 : 1)), z: r1(p.z + (q() - .5) * (i ? 6 : 1)), r: 2.6, dt: 1.25 + i * .2, v: 'rayo', dmg: dmg * .9}); break; }
      case 'abanico': { const n = f2 ? 11 : 7; for (let i = 0; i < n; i++) { const a = b.ry + (i - (n - 1) / 2) * .14; this.cerca(b.x, b.z, {t: 'bala', b: b.id, x: r1(b.x), z: r1(b.z), dx: r2(Math.sin(a)), dz: r2(Math.cos(a)), v: 11, r: .7, dmg: Math.round(dmg * .75), ttl: 2.2, dt: .5, k: b.tipo}, VISTA + 10); } b.t = .6; break; }
      case 'anillo': { const n = f2 ? 24 : 16; for (let i = 0; i < n; i++) { const a = i / n * 6.283 + q(); this.cerca(b.x, b.z, {t: 'bala', b: b.id, x: r1(b.x), z: r1(b.z), dx: r2(Math.sin(a)), dz: r2(Math.cos(a)), v: 8.5, r: .7, dmg: Math.round(dmg * .7), ttl: 2.8, dt: .6, k: b.tipo}, VISTA + 10); } b.t = .7; break; }
      case 'invoca': { let n = 0; for (const o of this.bs.values()) if (o.g === g && o.mini) n++; const B = REG[g.reg].bichos; for (let i = 0; i < Math.min(3, 6 - n); i++) { const d2 = bicho(B[i % 2], Math.max(1, b.lv - 3)); if (d2) this.nace(d2, b.x + Math.sin(i * 2.1) * 4, b.z + Math.cos(i * 2.1) * 4, {g, mini: 1, hx: g.x, hz: g.z, st: 'persigue', obj: tg.id, reg: g.reg}); } this.cerca(b.x, b.z, {t: 'grito', b: b.id}, VISTA); b.t = .8; break; }
    }
  }
}
