// El mundo compartido: bichos, jefes y la hora del día. Corre en el servidor (y en la pantalla cuando se juega sin conexión).
// Cada jugador maneja su propio personaje y su vida; el mundo decide dónde están los bichos y a quién atacan.
// Los ataques de los bichos se anuncian con tiempo: cada pantalla se fija si su jugador quedó adentro cuando pegan.
import {mul, clamp} from './azar.js';
import {CAMPOS, GUARIDAS, REG, chocar, enPueblo} from './mapa.js';
import {bicho, jefe, PATRON, botin, ENEMIES, CHARS} from './reglas.js';

export const DIA = 20 * 60; // un día entero dura 20 minutos
export const horaDe = ms => (ms / 1000 / DIA + .35) % 1;
export const esNoche = h => h < .23 || h > .77;
const VISTA = 58, LEJOS = 150;
const r1 = v => Math.round(v * 10) / 10, r2 = v => Math.round(v * 100) / 100;
const txt = (s, n) => String(s == null ? '' : s).replace(/[<>&"'`\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, n);
const num = (v, a, b, d = 0) => Number.isFinite(+v) ? clamp(+v, a, b) : d;

export class Mundo {
  constructor(o = {}) {
    this.envia = o.envia || (() => {}); this.js = new Map(); this.bs = new Map(); this.nid = 1; this.t = 0; this.q = mul(o.semilla ?? (Date.now() | 0));
    this.camps = CAMPOS.map(c => ({...c, act: false, slots: null, lejos: 0}));
    this.guar = GUARIDAS.map(g => ({...g, act: false, b: null, muerto: 0, lejos: 0, minis: 0}));
    this.campT = 0; this.snapT = 0; this.listaT = 0; this.reloj = o.reloj || (() => Date.now());
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
        p.hp = num(m.hp, 0, 1, p.hp); p.lv = num(m.lv, 1, 30, p.lv) | 0; p.d = m.d ? 1 : 0; p.es = m.es ? 1 : 0; p.fu = m.fu ? 1 : 0;
        if (p.vivo && p.hp <= 0) { p.vivo = false; for (const b of this.bs.values()) if (b.obj === id) b.obj = null; }
        if (!p.vivo && p.hp > 0) p.vivo = true; break;
      case 'g': if (Array.isArray(m.h)) for (const h of m.h.slice(0, 60)) if (Array.isArray(h)) this.golpe(p, h); break;
      case 'fx': this.cerca(p.x, p.z, {t: 'fx', id, k: txt(m.k, 20), x: r1(num(m.x, -500, 500)), z: r1(num(m.z, -620, 620)), ry: r2(num(m.ry, -10, 10)), a: num(m.a, -100, 100), b: num(m.b, -100, 100)}, 70, id); break;
      case 'chat': { const s = txt(m.m, 90); if (s) this.todos({t: 'chat', id, n: p.n, m: s}); break; }
      case 'ping': this.envia(id, {t: 'pong', c: m.c, hora: this.hora()}); break;
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
    if (b.slot) { b.slot.b = null; b.slot.vuelve = this.t + (b.camp ? 150 : 50 + this.q() * 40); }
    if (b.g && b.jefe) { b.g.b = null; b.g.muerto = this.t + 120; this.cerca(b.x, b.z, {t: 'jefefin', b: b.id, reg: b.g.reg, jefe: b.tipo}, 90); for (const o of this.bs.values()) if (o.g === b.g && o.mini) { this.bs.delete(o.id); this.cerca(o.x, o.z, {t: 'muere', b: o.id, x: r1(o.x), z: r1(o.z)}); } }
  }
  // ---------- reloj ----------
  tick(dt) {
    this.t += dt; const vivos = [...this.js.values()].filter(p => p.listo);
    this.campT -= dt; if (this.campT <= 0) { this.campT = 1; this.revisar(vivos); }
    const noche = esNoche(this.hora());
    for (const b of this.bs.values()) this.piensa(b, dt, vivos, noche);
    this.snapT -= dt; if (this.snapT <= 0) { this.snapT = .1; for (const p of vivos) this.foto(p); }
    this.listaT -= dt; if (this.listaT <= 0) { this.listaT = 2; const l = this.lista(); this.todos({t: 'lista', j: l, hora: this.hora()}); }
    for (const p of [...this.js.values()]) if (this.t - p.ult > 30) { this.sale(p.id); if (this.corta) this.corta(p.id); }
  }
  revisar(vivos) {
    const hay = (x, z, R) => vivos.some(p => Math.abs(p.x - x) < R && Math.abs(p.z - z) < R);
    for (const c of this.camps) { if (hay(c.x, c.z, 100)) { if (!c.act) this.activa(c); c.lejos = 0; for (const s of c.slots) if (!s.b && this.t >= s.vuelve && !hay(c.x, c.z, 16)) this.naceSlot(c, s); } else if (c.act && ++c.lejos > 15) this.duerme(c); }
    for (const g of this.guar) {
      if (hay(g.x, g.z, 70)) { g.lejos = 0; if (!g.b && this.t >= g.muerto) { const R = REG[g.reg]; const nj = vivos.filter(p => Math.hypot(p.x - g.x, p.z - g.z) < 70).length; g.b = this.nace(jefe(g.jefe, R.lv[1] + 1, nj), g.x, g.z, {g, reg: g.reg}); } }
      else if (g.b && ++g.lejos > 20) { this.bs.delete(g.b.id); g.b = null; for (const o of this.bs.values()) if (o.g === g) this.bs.delete(o.id); }
    }
  }
  // lo que ve cada jugador
  foto(p) {
    const b = [], j = [];
    for (const o of this.bs.values()) if (Math.abs(o.x - p.x) < VISTA && Math.abs(o.z - p.z) < VISTA) b.push([o.id, o.tipo, r1(o.x), r1(o.z), r2(o.ry), r2(Math.max(0, o.hp / o.hpM)), o.sk, o.lv, (o.camp ? 1 : 0) | (o.jefe ? 2 : 0) | (o.mini ? 4 : 0) | (o.aturde > 0 ? 8 : 0) | (o.traba > 0 ? 16 : 0), o.camp || o.jefe ? o.n : 0]);
    for (const o of this.js.values()) if (o !== p && o.listo && Math.abs(o.x - p.x) < LEJOS && Math.abs(o.z - p.z) < LEJOS) j.push([o.id, r1(o.x), r1(o.z), r2(o.ry), r2(o.mv), r2(o.at), r2(o.hp), o.ch, o.lv, o.n, o.d | (o.es << 1) | (o.fu << 2)]);
    this.envia(p.id, {t: 's', b, j});
  }
  // ---------- cabeza de los bichos ----------
  piensa(b, dt, vivos, noche) {
    const q = this.q;
    if (b.vx || b.vz) { b.x += b.vx * dt; b.z += b.vz * dt; const k = Math.max(0, 1 - dt * 7); b.vx *= k; b.vz *= k; if (Math.abs(b.vx) + Math.abs(b.vz) < .1) b.vx = b.vz = 0; if (!b.fly) chocar(b, b.r); }
    b.mv = 0; b.cd -= dt; if (b.traba > 0) b.traba -= dt;
    if (b.aturde > 0) { b.aturde -= dt; b.sk = 0; return; }
    if (b.ai === 'jefe') return this.jefe(b, dt, vivos);
    const sp = b.vel * (b.traba > 0 ? .5 : 1) * (noche ? 1.08 : 1);
    if (b.sk === 2) { // preparando un golpe
      b.t -= dt; if (b.mov) { const m = b.mov; m.t += dt; const k = clamp(m.t / m.d, 0, 1); b.x = m.x0 + (m.x1 - m.x0) * k; b.z = m.z0 + (m.z1 - m.z0) * k; if (!b.fly) chocar(b, b.r); }
      if (b.t <= 0) { b.sk = 0; b.mov = null; b.cd = 1.6 + q() * 1.1; if (b.ai === 'kami') { b.hp = 0; this.muere(b); } }
      return;
    }
    const tg = b.obj != null ? this.js.get(b.obj) : null;
    if (b.st === 'quieto') {
      const R = 8.5 + (noche ? 2 : 0) + (b.camp ? 2 : 0);
      let best = null, bd = R; for (const p of vivos) { if (!p.vivo || enPueblo(p.x, p.z, 4)) continue; const d = Math.hypot(p.x - b.x, p.z - b.z); if (d < bd) { bd = d; best = p; } }
      if (best) { this.persigue(b, best.id); if (b.c) for (const o of this.bs.values()) if (o.c === b.c && o.st === 'quieto' && Math.hypot(o.x - b.x, o.z - b.z) < 12) this.persigue(o, best.id); return; }
      if (b.ai === 'plant') return;
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
    if (!tg || !tg.vivo || lejos || Math.hypot(tg.x - b.x, tg.z - b.z) > 30 || enPueblo(tg.x, tg.z, 2)) { b.st = 'vuelve'; b.obj = null; return; }
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
