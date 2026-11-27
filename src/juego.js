// La partida en la pantalla: tu personaje, los demás jugadores, los bichos que manda el mundo, las peleas y la cámara.
import {THREE, Batch, FX, TAU, clamp, lerp, rnd} from '../lib/gfx.js';
import {HEROES, FOES, OBJ, MISC, model} from '../lib/models.js';
import '../lib/models2.js';
import {KIT} from '../lib/deco.js';
import {audio} from '../lib/audio.js';
import {KITS, DESBLOQUEO, ESQUIVE, danoBase, vidaMax, armadura, xpSig, NIVEL_MAX, AMULETOS, OBJETOS, ENEMIES, BOSSES, RELIQ, CHARS} from '../shared/reglas.js';
import {chocar, agua, velAgua, enPueblo, regionEn, nivelEn, NPCS, LUGARES, PUEBLOS, REG, SALA, RELIQUIAS, dentro, alto, empinado} from '../shared/mapa.js';
import {esNoche, DIA} from '../shared/sim.js';
import {Vida, MONTURAS, ORDEN_M} from './vida.js';
import {Pesca} from './pesca.js';
import {aplicarManas, rangoFama, TITULOS, leerVisto, guardarVisto, explorar, explorado, HITOS_EXPLORA} from './progreso.js';
import {bordeX, NORTE, SUR} from '../shared/mapa.js';
// qué montura te deja cada jefe
const JEFE_MONTURA = {ibera: 'yacare', monte: 'mula', ingenio: 'familiar', selva: 'yaguarete', cuyo: 'condor'};
import {Eventos} from './eventos.js';
import {Ambiente} from './ambiente.js';
import {PERSONAJES, NOMBRES, TRATOS} from './historia.js';
import {parajeEn} from '../shared/mapa.js';
import {FIJOS} from '../shared/mapa.js';
import {ctl} from './controles.js';

const now = () => performance.now() / 1000;
const ang = (a, b) => { let d = a - b; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
const COLB = t => { let h = 0; for (const c of t) h = h * 31 + c.charCodeAt(0) | 0; const a = (h >>> 0) % 360 / 360 * TAU; return [.6 + .4 * Math.cos(a), .45 + .3 * Math.cos(a + 2), .5 + .4 * Math.cos(a + 4)]; };
// quién atiende en cada pueblo: [vecino, baqueano, cantor]
const GENTE = {pampa: ['curandera', 'gaucho', 'payador'], ibera: ['chamamecero', 'boleador', 'paisana'], monte: ['malambista', 'carpincho', 'septimo'], ingenio: ['zafrera', 'asador', 'domadora'],
  selva: ['paisana', 'boleador', 'pujllay'], cuyo: ['domadora', 'gaucho', 'payador'], puna: ['pujllay', 'machi', 'malambista'], sur: ['machi', 'boleador', 'curandera']};
const REEMPLAZO = ['carpincho', 'asador', 'payador', 'curandera', 'gaucho'];

export class Juego {
  constructor(o) {
    Object.assign(this, o); // scene, camera, mundo, fx, parts, ui, cfg
    this.B = {}; this.otros = new Map(); this.bichos = new Map(); this.atks = []; this.balasE = []; this.balasP = []; this.zonas = []; this.nums = []; this.orb = [];
    this.golpes = []; this.t = 0; this.envT = 0; this.cam = {x: 0, z: 0, d: 26, sh: 0}; this.activo = false; this.snap = 0; this.ray = new THREE.Raycaster(); this.plano = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.npcs = [...NPCS.map(n => ({...n})), ...PERSONAJES.map(p => ({id: 'campo:' + p.k, reg: p.reg, rol: 'campo', x: p.x, z: p.z, ry: 0, nom: p.nom, titulo: p.titulo, mod: p.mod, s: p.s || 1, dice: p.dice}))]; this.region = null; this.burbujas = []; this.ambiente = new Ambiente(this); this.pueblo = null; this.jefeB = null; this.cerca = null; this.lugCd = {};
    this.vista = 'arriba'; this.cam.yaw = Math.PI; this.cam.pitch = -.12; this.parar = 0; this.vida = new Vida(this); this.eventos = new Eventos(this); this.pesca = new Pesca(this);
    this.aljibes = FIJOS.filter(o => o.t === 'aljibe' || o.t === 'pozo');
  }
  // ---------- batches ----------
  bt(k, max = 64) {
    let b = this.B[k]; if (b) return b;
    let g; const [t, n] = [k[0], k.slice(2)];
    if (t === 'h') g = model(HEROES[n]); else if (t === 'f') g = model(FOES[n] || FOES.anima, .8); else if (t === 'm') g = model(MISC[n], .85); else if (t === 'o') g = model(OBJ[n] || OBJ.bala, .8);
    b = this.B[k] = new Batch(this.scene, g, max, {shadow: t !== 'o'}); b.n = 0; return b;
  }
  // ---------- empezar ----------
  empezar(perfil, red) {
    this.p = perfil; this.red = red; const K = KITS[perfil.ch];
    const pos = perfil.pos && dentro(perfil.pos.x, perfil.pos.z, 2) ? perfil.pos : {x: REG.pampa.pueblo.x + 3, z: REG.pampa.pueblo.z + 6};
    this.yo = {x: pos.x, z: pos.z, ry: Math.PI, ph: 0, mv: 0, atk: 0, fl: 0, hp: 1, cd: [0, 0, 0], cdB: 0, esq: 0, esqT: 0, dash: null, buff: {}, ultDano: -99, vivo: true, cura: null};
    this.yo.hp = this.stats().vida * (perfil.hpPct ?? 1); if (this.yo.hp <= 0) this.yo.hp = this.stats().vida;
    this.cam.x = this.yo.x; this.cam.z = this.yo.z; this.activo = true; this.region = null; this.cam.yaw = Math.PI; this.yo.montado = false;
    this.vista = this.cfg.vista || 'arriba'; ctl.vista = this.vista; this.eventos.limpiar(); this.vida.empezar(); this.pesca.e = null; this.vistoB = leerVisto(perfil); perfil.regiones ||= {};
    this.ambiente.empezar(); this.burbujas = []; this.paraje = null;
    for (const n of this.npcs) { if (n.rol === 'campo') continue; const nb = NOMBRES[n.reg]?.[{vecino: 0, baqueano: 1, cantor: 2}[n.rol]]; if (nb) [n.nom, n.titulo] = nb; else { n.nom = {pulpero: 'El pulpero', herrero: 'El herrero', posta: 'El mercachifle'}[n.rol]; n.titulo = n.nom.replace(/^El /, '') + ' de ' + REG[n.reg].pueblo.n; }
      if (n.rol === 'pulpero') n.mod = 'm_pulpero'; else if (n.rol === 'herrero') n.mod = 'h_asador'; else if (n.rol === 'posta') n.mod = 'm_mercachifle'; else { const i = {vecino: 0, baqueano: 1, cantor: 2}[n.rol]; let ch = GENTE[n.reg][i]; if (ch === perfil.ch) ch = REEMPLAZO.find(c => c !== perfil.ch); n.ch = ch; n.mod = 'h_' + ch; } }
    for (const n of this.npcs) if (n.rol === 'herrero' && perfil.ch === 'asador') n.mod = 'h_gaucho';
    this.mundo.decorar(this.yo.x, this.yo.z, true);
  }
  stats() {
    const p = this.p, K = KITS[p.ch], b = this.yo?.buff || {}, t = this.t;
    const s = {vida: vidaMax(K.vida, p.lv, p.poncho), vel: K.vel, dmg: danoBase(p.lv, p.arma), crit: .05 + (K.crit || 0), arm: armadura(p.poncho) + (K.arm || 0), suerte: K.suerte || 0, regen: .5 + p.lv * .05, cdr: 1, robo: K.robo || 0, oro: 0, revive: 0};
    if (p.amuleto && AMULETOS[p.amuleto]) AMULETOS[p.amuleto].f(s);
    if (b.furia > t) { s.dmg *= b.furiaK || 1.6; s.vel *= 1.3; s.robo += .2; }
    if (b.cana > t) s.dmg *= 1.25; if (b.santo > t) s.dmg *= 1.1; if (b.apacheta > t) s.suerte += .3; if (b.difunta > t) s.regen += 3; if (b.velK > t) s.vel *= 1.25;
    const mo = this.yo?.montado === true && MONTURAS[p.montura]; if (mo) { s.vel *= mo.vel; s.arm += mo.arm || 0; s.robo += mo.robo || 0; }
    aplicarManas(s, p, !!mo);
    s.arm = Math.min(.6, s.arm); return s;
  }
  // ---------- mensajes del mundo ----------
  mensaje(m) {
    const t = now();
    switch (m.t) {
      case 's': {
        const id = ++this.snap;
        for (const a of m.b) {
          // [id, x, z, giro, vida, ataque, marcas, tipo?, nivel?, nombre?]: el tipo viene solo cuando aparece
          let b = this.bichos.get(a[0]); const f = a[6];
          if (!b) { if (!a[7]) continue; const d = ENEMIES[a[7]] || BOSSES[a[7]] || {}; b = {id: a[0], tipo: a[7], buf: [], x: a[1], z: a[2], ry: a[3], ph: Math.random() * 9, mv: 0, at: 0, fl: 0, die: 0, s: (d.s || 1) * ((f & 1) ? 1.4 : (f & 2) ? 1.15 : 1), r: (d.r || .5) * ((f & 1) ? 1.35 : (f & 2) ? 1.15 : 1), fly: !!d.fly, mostrar: 0}; this.bichos.set(a[0], b); }
          if (a[7]) { b.lv = a[8]; b.n = a[9] || null; }
          if (b.buf.length && b.buf[b.buf.length - 1][0] === t) b.buf.pop(); b.buf.push([t, a[1], a[2], a[3]]); if (b.buf.length > 6) b.buf.shift();
          b.hp = a[4]; b.sk = a[5]; b.fl8 = f; b.camp = !!(f & 1); b.jefe = !!(f & 2); b.est = f & 24; b.ladron = !!(f & 32); b.malon = !!(f & 64); b.seen = id;
        }
        for (const [k, b] of this.bichos) if (b.seen !== id && !b.muere) this.bichos.delete(k);
        const vis = new Set();
        for (const a of m.j) {
          vis.add(a[0]); let o = this.otros.get(a[0]);
          if (!o) { o = {id: a[0], buf: [], x: a[1], z: a[2], ry: a[3], ph: 0, mv: 0, at: 0}; this.otros.set(a[0], o); }
          if (o.buf.length && o.buf[o.buf.length - 1][0] === t) o.buf.pop(); o.buf.push([t, a[1], a[2], a[3]]); if (o.buf.length > 6) o.buf.shift(); o.mvS = a[4]; o.atS = a[5]; o.hp = a[6]; o.ch = CHARS[a[7]] ? a[7] : 'gaucho'; o.lv = a[8]; o.n = a[9]; o.d = a[10] & 1; o.es = a[10] & 2; o.fu = a[10] & 4; o.ca = (a[10] >> 3) & 15;
        }
        for (const k of this.otros.keys()) if (!vis.has(k)) this.otros.delete(k);
        this.eventos.snap(m.e || []);
        break;
      }
      case 'atk': this.atks.push({...m, t0: t}); break;
      case 'bala': this.balasE.push({...m, t0: t + (m.dt || 0), col: COLB(m.k || 'x')}); break;
      case 'ev': case 'regalo': this.eventos.mensaje(m); break;
      case 'robo': { const v = Math.min(this.p.oro, m.robo | 0); this.p.oro -= v; this.num(m.x, m.z, '-' + v + ' $', '#ff6a5a', 1); this.ui.toast(`¡Un duende salió de la tinaja y se llevó ${v} patacones! Agarralo antes de que se escape.`, 'f_duende', 4); audio.play('wail'); this.ui.guardar(); break; }
      case 'muere': { const b = this.bichos.get(m.b); if (b) { b.muere = t; b.x = m.x; b.z = m.z; b.buf.length = 0; } if (m.fue) { this.parts.burst(m.x, .6, m.z, 10, [.7, .65, .6], {type: 2, sp: 3, size: .9, life: .6, grow: 1}); break; } if (b && b.mostrar > this.t) this.parar = Math.max(this.parar, b.jefe ? .5 : .05); this.parts.burst(m.x, .9, m.z, b && (b.jefe) ? 90 : 12, b?.jefe ? [1, .5, .2] : [1, .55, .25], {sp: b?.jefe ? 12 : 5, size: b?.jefe ? .6 : .32, life: b?.jefe ? 1.6 : .6, up: 1}); if (b?.jefe) { this.cam.sh = .8; audio.play('boom'); } break; }
      case 'premio': this.premio(m); break;
      case 'jefe': this.jefeB = m.b; this.ui.jefe(m); audio.track('boss'); audio.play('roar'); this.cam.sh = .5; break;
      case 'jefefin': if (this.jefeB === m.b) { this.jefeB = null; this.ui.jefe(null); this.region = null; } break;
      case 'grito': audio.play('roar'); this.cam.sh = .3; break;
      case 'fx': this.fxOtro(m); break;
      case 'chat': this.ui.chat(m); break;
      case 'entra': this.ui.toast(`${m.n} llegó al mundo`, 'h_' + m.ch); break;
      case 'sale': this.otros.delete(m.id); break;
      case 'lista': this.lista = m.j; this.ponerHora(m.hora); break;
      case 'bien': this.ponerHora(m.hora); break;
      case 'pong': this.ponerHora(m.hora); break;
    }
  }
  ponerHora(h) { if (typeof h === 'number') { this.hora0 = h; this.horaT = now(); } }
  horaAhora() { if (this.red?.mundo) return this.red.mundo.hora(); if (this.hora0 == null) return .4; return (this.hora0 + (now() - this.horaT) / DIA) % 1; }
  // ---------- premios ----------
  premio(m) {
    const p = this.p, s = this.stats();
    const oro = Math.round(m.oro * (1 + s.oro) * (1 + s.suerte * .5)); p.oro += oro;
    if (oro > 0) { this.num(m.x, m.z, '+' + oro + ' $', '#f2c14a', .9); audio.play('coin'); }
    for (const [k, n] of m.it || []) {
      if (k.startsWith('am:')) { const a = k.slice(3); if (AMULETOS[a]) { p.amuletos[a] = (p.amuletos[a] || 0) + 1; this.ui.toast(`¡Encontraste ${AMULETOS[a].n}!`, AMULETOS[a].ic); audio.play('gem'); } }
      else if (OBJETOS[k]) { p.inv[k] = (p.inv[k] || 0) + n; if (k !== 'retazo' || n > 1) this.num(m.x + .5, m.z, `+${n} ${OBJETOS[k].n}`, '#cde', .9); }
    }
    p.bestiario[m.tipo] = (p.bestiario[m.tipo] || 0) + 1;
    if (p.bestiario[m.tipo] === 10) this.ui.toast(`Ya volteaste diez de ${(ENEMIES[m.tipo] || BOSSES[m.tipo] || {}).n || m.tipo}: aprendiste sus mañas (+1 maña).`, 'libro', 4);
    if (m.jefe) { this.fama(40); if (JEFE_MONTURA[m.reg]) this.vida.dar(JEFE_MONTURA[m.reg]); } else if (m.camp) this.fama(8);
    if (m.jefe && RELIQ[m.reg] && !p.reliq[m.reg] && TRATOS[m.reg] && !(p.tratos ||= {})[m.reg]) setTimeout(() => this.ui.forastero(m.reg), 5000);
    if (m.jefe && RELIQ[m.reg] && !p.reliq[m.reg]) { p.reliq[m.reg] = 1; this.ui.toast(`¡${RELIQ[m.reg].n}! (${Object.keys(p.reliq).length} de 8 reliquias)`, RELIQ[m.reg].ic, 6); audio.play('win'); }
    if (m.jefe && m.reg === 'salamanca') { p.fin = (p.fin || 0) + 1; if (!p.final && (p.pactos || 0) >= 3) setTimeout(() => this.ui.forastero('final'), 2500); else { p.final ||= 'libre'; this.ui.final(); } }
    this.ui.misiones.alMatar(m);
    this.xp(m.xp);
    this.ui.guardar();
  }
  xp(n) {
    const p = this.p; if (p.lv >= NIVEL_MAX) return; p.xp += n; this.num(this.yo.x, this.yo.z, '+' + n + ' exp', '#9ee86a', .7, 2.6);
    while (p.lv < NIVEL_MAX && p.xp >= xpSig(p.lv)) {
      p.xp -= xpSig(p.lv); p.lv++; this.yo.hp = this.stats().vida; audio.play('level');
      this.parts.burst(this.yo.x, 1, this.yo.z, 60, [1, .8, .25], {sp: 9, size: .5, life: 1.2, type: 3}); this.fx.spawn(FX.RING, this.yo.x, this.yo.z, 6, [1, .8, .3], .8);
      const i = DESBLOQUEO.indexOf(p.lv); this.ui.subeNivel(p.lv, i >= 0 ? KITS[p.ch].h[i] : null); setTimeout(() => this.ui.toast('Ganaste una maña: abrí Progreso (P) para aprenderla.', 'libro', 4), 1500);
    }
    this.ui.guardar();
  }
  // ---------- daño que recibís ----------
  dano(d, de) {
    const y = this.yo; if (!y.vivo || y.dash || this.t < y.inv) return false;
    const s = this.stats(); let k = 1 - s.arm; if (y.buff.escudo > this.t) k *= 1 - (y.buff.escudoK || 0); if (k <= 0) { this.num(y.x, y.z, 'Nada', '#9cf', .6); return false; }
    const v = Math.max(1, Math.round(d * k)); y.hp -= v; y.fl = 1; y.ultDano = this.t; this.cam.sh = Math.max(this.cam.sh, Math.min(.5, v / s.vida * 2));
    this.num(y.x, y.z, '-' + v, '#ff5a4a', .8); audio.play('hurt'); this.herido = 1;
    if (y.hp <= 0) this.cae();
    return true;
  }
  cae() {
    const y = this.yo, s = this.stats();
    if (s.revive && (this.p.estampita || 0) < Date.now() - 300e3) { this.p.estampita = Date.now(); y.hp = s.vida * .5; y.inv = this.t + 2; this.ui.toast('¡El Gauchito te levantó!', 'estampita', 4); audio.play('heal'); return; }
    if (y.montado) this.vida.silbar(); y.hp = 0; y.vivo = false; audio.play('lose'); this.ui.caido(true); this.enviar(true);
  }
  revivir(enFogon = true) {
    const y = this.yo, p = this.p; if (enFogon) { const pu = REG[p.fogon || 'pampa'].pueblo; y.x = pu.x + 2; y.z = pu.z + 5; p.oro = Math.floor(p.oro * .9); }
    y.hp = this.stats().vida; y.vivo = true; y.inv = this.t + 2; this.ui.caido(false); this.cam.x = y.x; this.cam.z = y.z; this.enviar(true); this.ui.guardar();
  }
  // ---------- tu turno: moverte y pelear ----------
  update(dt, c) {
    this.t += dt; const t = this.t, y = this.yo, s = this.stats();
    this.mirar(dt, c); if (c.cam) this.cambiarVista(); if (c.caballo && !this.ui.pausa) this.vida.silbar();
    this.vida.update(dt, c); this.eventos.update(dt); this.ui.misiones.update(dt); this.ambiente.update(dt);
    for (let i = this.burbujas.length - 1; i >= 0; i--) if ((this.burbujas[i].t += dt) > this.burbujas[i].dur) this.burbujas.splice(i, 1); if (!this.ui.pausa) this.pesca.update(dt, c);
    if (y.vivo && !this.ui.pausa && !this.vida.doma && !this.eventos.abd && !this.pesca.e) this.manejar(dt, c, s);
    this.expT = (this.expT || 0) - dt; if (this.expT <= 0) { this.expT = .5; this.explorar(); }
    // vida
    if (y.vivo) { const fuera = t - y.ultDano > 6; y.hp = Math.min(s.vida, y.hp + (fuera ? s.vida * .03 + s.regen : s.regen) * dt); if (y.cura) { const k = Math.min(dt, y.cura.t); y.hp = Math.min(s.vida, y.hp + y.cura.v * k); y.cura.t -= dt; if (y.cura.t <= 0) y.cura = null; } }
    y.fl = Math.max(0, y.fl - dt * 4); y.atk = Math.max(0, y.atk - dt * 4); this.herido = Math.max(0, (this.herido || 0) - dt * 2);
    // lugar
    this.lugar(); this.interaccion(c);
    this.enemigos(dt); this.proyectiles(dt, s); this.zonasUpd(dt, s); this.ataquesBichos(); this.balasBichos(dt);
    if (this.golpes.length) { this.red.manda({t: 'g', h: this.golpes}); this.golpes = []; }
    this.envT -= dt; if (this.envT <= 0) { this.envT = .1; this.enviar(); }
    this.camara(dt);
    if ((this.guT = (this.guT || 0) + dt) > 10) { this.guT = 0; this.ui.guardar(); }
  }
  enviar(forzar) { const y = this.yo; this.red.manda({t: 'p', x: Math.round(y.x * 10) / 10, z: Math.round(y.z * 10) / 10, ry: Math.round(y.ry * 100) / 100, mv: Math.round(y.mv * 10) / 10, at: Math.round(y.atk * 10) / 10, hp: Math.round(y.hp / this.stats().vida * 100) / 100, lv: this.p.lv, d: y.dash ? 1 : 0, es: y.buff.escudo > this.t ? 1 : 0, fu: y.buff.furia > this.t ? 1 : 0, ca: y.montado === true ? ORDEN_M.indexOf(this.p.montura) + 1 : 0}); }
  apunta(c) {
    const y = this.yo;
    if (this.vista !== 'arriba') { // apuntás con la vista: al bicho que tengas más adelante o al piso donde mirás
      const yaw = this.cam.yaw, fx = Math.sin(yaw), fz = Math.cos(yaw); let best = null, bs = 1e9;
      for (const b of this.bichos.values()) { if (b.muere) continue; const dx = b.x - y.x, dz = b.z - y.z, d = Math.hypot(dx, dz); if (d > 20 || d < .1) continue; const a = Math.abs(ang(Math.atan2(dx, dz), yaw)); if (a > .42) continue; const sc = a * 14 + d; if (sc < bs) { bs = sc; best = b; } }
      if (best) return {x: best.x, z: best.z, b: best};
      const L = clamp(this.vista === 'fp' ? 2.2 / Math.max(.12, -Math.sin(this.cam.pitch - .05)) : 9, 4, 14); return {x: y.x + fx * L, z: y.z + fz * L};
    }
    if (c.mouse) { const v = new THREE.Vector2(c.mouse.x / innerWidth * 2 - 1, -(c.mouse.y / innerHeight) * 2 + 1); this.ray.setFromCamera(v, this.camera); const p = new THREE.Vector3(); if (this.ray.ray.intersectPlane(this.plano, p)) return {x: p.x, z: p.z, raton: 1}; }
    // sin mouse: al bicho más cercano adelante tuyo, si no hacia donde mirás
    let best = null, bd = 13; const fx = Math.sin(y.ry), fz = Math.cos(y.ry);
    for (const b of this.bichos.values()) { if (b.muere) continue; const dx = b.x - y.x, dz = b.z - y.z, d = Math.hypot(dx, dz); if (d > bd) continue; const dot = (dx * fx + dz * fz) / (d || 1); const sc = d * (dot > .3 ? 1 : dot > -.2 ? 1.8 : 3); if (sc < bd) { bd = sc; best = b; } }
    if (best) return {x: best.x, z: best.z, b: best};
    return {x: y.x + fx * 6, z: y.z + fz * 6};
  }
  manejar(dt, c, s) {
    const y = this.yo, t = this.t, K = KITS[this.p.ch];
    for (let i = 0; i < 3; i++) y.cd[i] = Math.max(0, y.cd[i] - dt); y.cdB = Math.max(0, y.cdB - dt); y.esq = Math.max(0, y.esq - dt);
    // esquive y cargas
    if (this.vista !== 'arriba') { const yaw = this.cam.yaw, fx = Math.sin(yaw), fz = Math.cos(yaw), mx = c.mx, mz = c.mz; c = {...c, mx: -fz * mx - fx * mz, mz: fx * mx - fz * mz}; }
    if (y.dash) {
      const d = y.dash; d.t += dt; const k = Math.min(dt, Math.max(0, d.dur - (d.t - dt))) / d.dur; const ox = y.x, oz = y.z; y.x += d.dx * d.dist * k; y.z += d.dz * d.dist * k;
      if (!this.chocarYo(y, true, d.libre, ox, oz)) { y.x = ox; y.z = oz; } this.puerta(y, ox, oz);
      if (d.hit) this.golpeLinea(d, ox, oz, s); if (t % .05 < dt) this.parts.burst(y.x, .3, y.z, 2, [.8, .75, .6], {type: 2, sp: 1, size: .6, life: .4, grow: 1});
      if (d.t >= d.dur) { y.dash = null; d.fin?.(); } y.mv = 1; y.ph += dt * 14; return;
    }
    const m = Math.hypot(c.mx, c.mz); const aq = agua(y.x, y.z);
    if (m > .1) {
      const M = this.montura(), sp = s.vel * (M?.vuela ? 1 : M?.nada ? (aq > .2 ? 1.35 : 1) : velAgua(aq)) * Math.min(1, m * 1.3); const ox = y.x, oz = y.z;
      y.x += c.mx * sp * dt; y.z += c.mz * sp * dt;
      // los bichos no se atraviesan
      for (const b of this.bichos.values()) { if (b.muere || b.fly) continue; const dx = y.x - b.x, dz = y.z - b.z, R = b.r + .5, d2 = dx * dx + dz * dz; if (d2 < R * R && d2 > 1e-4) { const d = Math.sqrt(d2); y.x = b.x + dx / d * R; y.z = b.z + dz / d * R; } }
      if (!this.chocarYo(y, false, false, ox, oz)) { y.x = ox; y.z = oz; } this.puerta(y, ox, oz);
      if (M?.fuego && t % .22 < dt) this.zonas.push({x: y.x - Math.sin(y.ry) * 1.3, z: y.z - Math.cos(y.ry) * 1.3, r: 1.5, t: 2.2, dmg: s.dmg * .35, tick: 0, cada: .45, aura: 1, me: true, col: [1, .45, .1]});
      if (this.vista === 'fp') y.ry = this.cam.yaw; else if (!c.atk || c.mouse == null) y.ry = lerpA(y.ry, Math.atan2(c.mx, c.mz), Math.min(1, dt * (y.montado ? 8 : 14)));
      y.ph += dt * (y.montado ? 7 : 11) * sp / 6.2; if (y.montado && t % .12 < dt) this.parts.burst(y.x - Math.sin(y.ry) * 1.2, .2, y.z - Math.cos(y.ry) * 1.2, 2, [.75, .65, .5], {type: 2, sp: 1.5, size: .7, life: .5, grow: 1}); if (aq > .1 && !M?.vuela && t % .25 < dt) this.parts.burst(y.x, .1, y.z, 3, [.7, .85, 1], {sp: 2, size: .2, life: .4});
    }
    y.mv = lerp(y.mv, m > .1 ? 1 : 0, Math.min(1, dt * 12));
    if (c.esq && y.esq <= 0) { const a = m > .1 ? Math.atan2(c.mx, c.mz) : y.ry; if (y.montado === true) { this.vida.habilidad(s, a); return; } y.dash = {dx: Math.sin(a), dz: Math.cos(a), dist: ESQUIVE.dist, dur: ESQUIVE.dur, t: 0}; y.esq = ESQUIVE.cd * s.esqK; y.esqMax = y.esq; audio.play('dash'); this.red.manda({t: 'fx', k: 'esq', x: y.x, z: y.z, ry: a}); return; }
    if (c.mate) this.usar('mate');
    const enPue = !!enPueblo(y.x, y.z);
    // ataque básico (mantener apretado)
    if (c.atk && y.cdB <= 0 && !(enPue && !this.bichosCerca(10))) { const a = this.apunta(c); this.lanzar(K.basico, a, -1, s); this.avisarFx(-1, a); y.cdB = K.basico.cd; }
    for (let i = 0; i < 3; i++) if (c.h[i]) {
      if (this.p.lv < DESBLOQUEO[i]) { this.ui.toast(`Se aprende en el nivel ${DESBLOQUEO[i]}`, null, 1.5); continue; }
      if (y.cd[i] > 0) { audio.play('back'); continue; }
      const H = K.h[i], a = this.apunta(c), sh = {...s, dmg: s.dmg * s.habK}; for (const ef of H.ef) this.lanzar(ef, a, i, sh); this.avisarFx(i, a); y.cd[i] = H.cd * s.cdr;
    }
  }
  avisarFx(i, a) { const y = this.yo; this.red.manda({t: 'fx', k: this.p.ch + ':' + i, x: Math.round(y.x * 10) / 10, z: Math.round(y.z * 10) / 10, ry: Math.round(y.ry * 100) / 100, a: Math.round(a.x * 10) / 10, b: Math.round(a.z * 10) / 10}); }
  bichosCerca(R) { const y = this.yo; for (const b of this.bichos.values()) if (!b.muere && Math.abs(b.x - y.x) < R && Math.abs(b.z - y.z) < R) return true; return false; }
  // la puerta de la Salamanca solo se abre con las 8 reliquias
  puerta(y, ox, oz) {
    const P = SALA.puerta; if (Math.abs(y.x - P.x) > 9 || Math.abs(y.z - P.z) > 4) return;
    if (RELIQUIAS.every(r => this.p.reliq[r])) return;
    if (oz > P.z && y.z < P.z + 1.2) { y.z = P.z + 1.2; if (!this.avisoP || this.t - this.avisoP > 4) { this.avisoP = this.t; this.ui.toast(`La Salamanca está cerrada. Faltan ${RELIQUIAS.filter(r => !this.p.reliq[r]).length} reliquias.`, 'mano', 3); } }
  }
  // ---------- habilidades ----------
  lanzar(ef, a, idx, s, remoto) {
    const y = remoto || this.yo, D = s.dmg, me = !remoto, t = this.t; let dx = a.x - y.x, dz = a.z - y.z; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l; const ry = Math.atan2(dx, dz);
    if (me) { y.ry = ry; y.atk = 1; if (ef.son) audio.play(ef.son); }
    const col = ef.col || [1, .75, .35];
    switch (ef.tipo) {
      case 'tajo': this.fx.spawn(FX.SLASH, y.x + dx * ef.alc * .45, y.z + dz * ef.alc * .45, ef.alc * .7, ef.quema ? [1, .45, .1] : [.9, .75, .5], .22, {rot: ry, sz: ef.alc * .7 * Math.max(.6, ef.ang), al: .55}); if (me) this.area(y.x, y.z, ef.alc, ry, ef.ang, D * ef.dmg, {emp: ef.emp || 1.5, quema: ef.quema}); break;
      case 'onda': this.fx.spawn(FX.RING, y.x + dx * 1.5, y.z + dz * 1.5, ef.alc, ef.emp < 0 ? [.6, .9, 1] : [1, .85, .5], .35); for (let i = 0; i < 10; i++) { const aa = ry + (i / 9 - .5) * ef.ang * 2; this.parts.emit(y.x, 1, y.z, Math.sin(aa) * ef.alc * 2.6, 0, Math.cos(aa) * ef.alc * 2.6, 1, .85, .5, .45, .35, 3, 0, 2); } if (me) this.area(y.x, y.z, ef.alc, ry, ef.ang, D * ef.dmg, {emp: ef.emp ?? 2}); break;
      case 'tiro': for (let i = 0; i < ef.n; i++) { const aa = ef.n > 1 ? ry + (ef.abre >= 6 ? i / ef.n * TAU : (i / (ef.n - 1) - .5) * ef.abre) : ry; this.balasP.push({x: y.x + Math.sin(aa) * .6, z: y.z + Math.cos(aa) * .6, dx: Math.sin(aa), dz: Math.cos(aa), v: ef.vel, ttl: ef.alc / ef.vel, dmg: D * ef.dmg, perf: ef.perf || 0, hit: new Set(), traba: ef.traba, expl: ef.expl, busca: ef.busca, mod: ef.mod || 'bala', me, r: .45, sp: rnd(TAU)}); } break;
      case 'charco': { const d = Math.min(ef.alc, Math.hypot(a.x - y.x, a.z - y.z)); const x = y.x + dx * d, z = y.z + dz * d; this.zonas.push({x, z, r: ef.r, t: ef.dur, dmg: D * ef.dmg * .5, tick: 0, traba: ef.traba, col, me}); this.fx.spawn(FX.PUD, x, z, ef.r, col, ef.dur); audio.play('splash'); break; }
      case 'pisoton': { const ad = ef.adel || 0, x = y.x + dx * ad, z = y.z + dz * ad; this.fx.spawn(FX.RING, x, z, ef.r, [1, .8, .5], .4); this.parts.burst(x, .3, z, 14, [.7, .6, .45], {type: 2, sp: 4, size: .9, life: .5, grow: 1}); if (ef.r > 4) this.cam.sh = Math.max(this.cam.sh, .25); if (me) this.area(x, z, ef.r, 0, Math.PI, D * ef.dmg, {emp: ef.emp || 2, aturde: ef.aturde}); break; }
      case 'giro': this.zonas.push({sigue: y, r: ef.r, t: ef.dur, dmg: D * ef.dmg, tick: 0, cada: ef.dur / ef.golpes, giro: ef.mod || 'facon', me, col: [1, .9, .7]}); break;
      case 'orbita': this.zonas.push({sigue: y, r: ef.r, t: ef.dur, dmg: D * ef.dmg, tick: 0, cada: .35, orbita: ef.n, mod: ef.mod, me, col: [1, .7, .3]}); break;
      case 'aura': this.zonas.push({sigue: y, r: ef.r, t: ef.dur, dmg: D * ef.dmg * .5, tick: 0, cada: .5, aura: 1, me, col}); break;
      case 'carga': if (me) { y.dash = {dx, dz, dist: ef.dist, dur: .28 + ef.dist * .012, t: 0, hit: new Set(), dmg: D * ef.dmg, ancho: ef.ancho}; y.inv = t + .35; } this.parts.burst(y.x, .5, y.z, 10, [1, .9, .6], {sp: 4, size: .4}); break;
      case 'lluvia': { const cx = ef.alc ? y.x + dx * Math.min(ef.alc, Math.hypot(a.x - y.x, a.z - y.z)) : y.x, cz = ef.alc ? y.z + dz * Math.min(ef.alc, Math.hypot(a.x - y.x, a.z - y.z)) : y.z; for (let i = 0; i < ef.n; i++) { const r = Math.sqrt(Math.random()) * (ef.radio || 4), aa = Math.random() * TAU; this.zonas.push({x: cx + Math.sin(aa) * r, z: cz + Math.cos(aa) * r, r: ef.r, t: .12, espera: .1 + i * .1, dmg: D * ef.dmg, tick: 0, golpe: 1, me, col: [1, .8, .4]}); } break; }
      case 'lazo': { this.fx.spawn(FX.TLINE, y.x + dx * ef.alc / 2, y.z + dz * ef.alc / 2, ef.ancho / 2, [.9, .75, .5], .3, {rot: ry, sz: ef.alc / 2}); if (me) for (const b of this.bichos.values()) { if (b.muere) continue; const ex = b.x - y.x, ez = b.z - y.z, al = ex * dx + ez * dz, pe = Math.abs(ex * dz - ez * dx); if (al > 0 && al < ef.alc + b.r && pe < ef.ancho / 2 + b.r) this.pega(b, D * ef.dmg, -dx * Math.min(al, 8) * 1.6, -dz * Math.min(al, 8) * 1.6, 2, .6); } break; }
      case 'cura': { const v = ef.pct; if (me) { if (ef.lento) y.cura = {v: this.stats().vida * v / ef.lento, t: ef.lento}; else this.curar(v); } this.fx.spawn(FX.RING, y.x, y.z, Math.max(2, ef.r), [.5, 1, .6], .7); this.parts.burst(y.x, 1, y.z, 30, [.5, 1, .6], {sp: 5, grav: 2, type: 3, size: .5}); audio.play('heal'); if (!me && ef.r && Math.hypot(this.yo.x - y.x, this.yo.z - y.z) < ef.r) this.curar(v); break; }
      case 'escudo': { const yo = this.yo; const pone = me || (ef.r && Math.hypot(yo.x - y.x, yo.z - y.z) < ef.r); if (pone) { yo.buff.escudo = this.t + ef.dur; yo.buff.escudoK = ef.red; if (ef.vel) yo.buff.velK = this.t + ef.dur; } this.fx.spawn(FX.RUNE, y.x, y.z, Math.max(2.5, ef.r * .6), [.5, .8, 1], .8); break; }
      case 'furia': if (me) { y.buff.furia = t + ef.dur; y.buff.furiaK = ef.dmg; } this.parts.burst(y.x, 1, y.z, 40, [1, .3, .2], {sp: 8, size: .5, life: 1}); this.cam.sh = .3; break;
    }
  }
  curar(pct) { const y = this.yo, s = this.stats(); if (!y.vivo) return; const v = Math.round(s.vida * pct); y.hp = Math.min(s.vida, y.hp + v); this.num(y.x, y.z, '+' + v, '#7dff8a', .8); }
  // golpe en abanico o en redondo
  area(x, z, R, ry, an, dmg, o = {}) {
    const fx = Math.sin(ry), fz = Math.cos(ry); let n = 0;
    for (const b of this.bichos.values()) {
      if (b.muere) continue; const dx = b.x - x, dz = b.z - z, d = Math.hypot(dx, dz); if (d > R + b.r) continue;
      if (an < Math.PI - .01 && d > .6) { const c = (dx * fx + dz * fz) / d; if (Math.acos(clamp(c, -1, 1)) > an + Math.atan(b.r / Math.max(d, .1))) continue; }
      const e = o.emp ?? 1.5; this.pega(b, dmg, dx / (d || 1) * e * 3, dz / (d || 1) * e * 3, o.aturde ? 2 : 0, o.aturde || 0); n++;
      if (o.quema) this.parts.burst(b.x, 1, b.z, 4, [1, .5, .1], {sp: 2, size: .3});
    }
    this.romperCerca(x + fx * R * .5, z + fz * R * .5, R);
    return n;
  }
  golpeLinea(d, ox, oz, s) { for (const b of this.bichos.values()) { if (b.muere || d.hit.has(b.id)) continue; if (Math.hypot(b.x - this.yo.x, b.z - this.yo.z) < b.r + (d.ancho || 2) / 2 + .5) { d.hit.add(b.id); this.pega(b, d.dmg, d.dx * 6, d.dz * 6, 2, .5); } } }
  pega(b, dmg, kx, kz, est = 0, dur = 0) {
    const s = this.stats(), y = this.yo; const dif = Math.max(0, (b.lv || 1) - this.p.lv - 2); let v = dmg * rnd(.9, 1.1) * Math.max(.45, 1 - .07 * dif) * (b.camp || b.jefe ? 1 + s.verdugo : 1);
    const crit = Math.random() < s.crit; if (crit) { v *= 1.8; this.parar = Math.max(this.parar, .035); } v = Math.max(1, Math.round(v));
    this.golpes.push([b.id, v, Math.round(kx * 10) / 10, Math.round(kz * 10) / 10, est, dur]);
    b.fl = 1; this.num(b.x, b.z, String(v), crit ? '#ffd23a' : '#fff', crit ? 1.1 : .8, b.r * 2 + 1.4);
    this.parts.burst(b.x, .9, b.z, crit ? 7 : 3, [1, .75, .4], {sp: 4, size: .22, life: .35}); if (crit) audio.play('crit');
    if (s.robo) y.hp = Math.min(s.vida, y.hp + v * s.robo);
    b.mostrar = this.t + 4;
  }
  romperCerca(x, z, R) { for (const o of this.mundo.vis) { if (this.mundo.rotos.has(o)) continue; if (Math.hypot(o.x - x, o.z - z) < R + .6) this.romper(o); } }
  romper(o) {
    const K = KIT[o.t] || {}, p = this.p; this.mundo.romper(o);
    if (K.pasto) { this.parts.burst(o.x, .5, o.z, 10, [.55, .75, .35], {sp: 4, size: .3, life: .6, grav: -4, type: 4}); if (Math.random() < .15) { const v = 1 + Math.floor(Math.random() * (2 + p.lv * .5)); p.oro += v; this.num(o.x, o.z, '+' + v + ' $', '#f2c14a', .7); audio.play('coin'); } else audio.play('slash'); return; }
    this.parts.burst(o.x, .6, o.z, 12, [.7, .45, .25], {sp: 5, size: .35, life: .6, grav: 1}); audio.play('pick');
    const r = Math.random();
    if (K.loot && r < .07 && p.oro >= 10 && !this.bichosCerca(14) && Math.hypot(o.x - this.yo.x, o.z - this.yo.z) < 12) { this.enviar(true); this.red.manda({t: 'sorpresa', k: 'duende', x: Math.round(o.x * 10) / 10, z: Math.round(o.z * 10) / 10, robo: Math.min(p.oro, 10 + p.lv * 4)}); return; }
    if (K.loot && r < .12) { p.inv.mate = (p.inv.mate || 0) + 1; this.num(o.x, o.z, '+1 Mate', '#cde', .9); return; }
    if (K.loot && r < .125) { const ks = Object.keys(AMULETOS), a = ks[Math.random() * ks.length | 0]; p.amuletos[a] = (p.amuletos[a] || 0) + 1; this.ui.toast(`¡Adentro había ${AMULETOS[a].n}!`, AMULETOS[a].ic, 4); audio.play('gem'); return; }
    if (Math.random() < .6) { const v = 2 + Math.floor(Math.random() * p.lv * 1.5); p.oro += v; this.num(o.x, o.z, '+' + v + ' $', '#f2c14a', .8); }
  }
  usar(k) {
    const p = this.p, y = this.yo; if (!(p.inv[k] > 0)) { if (k === 'mate') this.ui.toast('No te quedan mates. Comprá en la pulpería.', 'mate', 2); return; }
    if (k === 'mate') { if (this.t < (y.mateCd || 0)) return; y.mateCd = this.t + 2; this.curar(.35 * this.stats().mateK); }
    else if (k === 'pescado') this.curar(.5);
    else if (k === 'asado') y.cura = {v: this.stats().vida / 6, t: 6};
    else if (k === 'cana') y.buff.cana = this.t + 60;
    p.inv[k]--; audio.play('heal'); this.parts.burst(y.x, 1, y.z, 18, [.5, 1, .6], {sp: 4, grav: 2, type: 3, size: .4}); this.ui.guardar();
  }
  // efecto de la habilidad de otro jugador
  fxOtro(m) {
    const o = this.otros.get(m.id); if (m.k === 'esq') { this.parts.burst(m.x, .3, m.z, 6, [.8, .75, .6], {type: 2, sp: 2, size: .7, life: .4, grow: 1}); return; }
    const [ch, i] = String(m.k).split(':'); const K = KITS[ch]; if (!K) return; const idx = +i;
    const efs = idx < 0 ? [K.basico] : K.h[idx]?.ef || []; const src = o && Math.hypot(o.x - m.x, o.z - m.z) < 4 ? o : {x: m.x, z: m.z};
    for (const ef of efs) this.lanzar(ef, {x: m.a, z: m.b}, idx, {dmg: 0}, src);
    if (o) o.atk = 1;
  }
  // ---------- bichos ----------
  enemigos(dt) {
    const t = now(), rt = t - .11;
    for (const [k, b] of this.bichos) {
      if (b.muere) { b.die = Math.min(1, (t - b.muere) / .7); if (b.die >= 1) this.bichos.delete(k); continue; }
      const B = b.buf; let x = b.x, z = b.z, ry = b.ry;
      if (B.length) { let i = B.length - 1; while (i > 0 && B[i - 1][0] > rt) i--; const a = B[Math.max(0, i - 1)], c = B[i]; if (c[0] <= rt || i === 0 || c[0] - a[0] < 1e-3) { x = c[1]; z = c[2]; ry = c[3]; } else { const f = clamp((rt - a[0]) / (c[0] - a[0]), 0, 1); x = lerp(a[1], c[1], f); z = lerp(a[2], c[2], f); ry = a[3] + ang(c[3], a[3]) * f; } }
      const sp = Math.hypot(x - b.x, z - b.z) / Math.max(dt, 1e-3); b.x = x; b.z = z; b.ry = ry;
      b.mv = lerp(b.mv, sp > .3 ? 1 : 0, Math.min(1, dt * 8)); b.ph += dt * (sp * (b.jefe ? 2.1 : 3.4) / Math.max(.6, b.s)) + (b.fly ? dt * 2 : 0);
      b.at = lerp(b.at, b.sk === 2 ? 1 : 0, Math.min(1, dt * 10)); b.fl = Math.max(0, b.fl - dt * 5);
    }
    for (const o of this.otros.values()) {
      const B = o.buf; if (!B.length) continue; let i = B.length - 1; while (i > 0 && B[i - 1][0] > rt) i--; const a = B[Math.max(0, i - 1)], c = B[i];
      if (c[0] <= rt || i === 0 || c[0] - a[0] < 1e-3) { o.x = c[1]; o.z = c[2]; o.ry = c[3]; } else { const f = clamp((rt - a[0]) / (c[0] - a[0]), 0, 1); o.x = lerp(a[1], c[1], f); o.z = lerp(a[2], c[2], f); o.ry = a[3] + ang(c[3], a[3]) * f; }
      o.mv = lerp(o.mv, o.mvS || 0, Math.min(1, dt * 10)); o.ph += dt * 11 * o.mv; o.at = Math.max(o.atS || 0, (o.atk || 0)); o.atk = Math.max(0, (o.atk || 0) - dt * 4);
    }
  }
  ataquesBichos() {
    const t = now(), y = this.yo;
    for (let i = this.atks.length - 1; i >= 0; i--) {
      const a = this.atks[i], k = (t - a.t0) / a.dt;
      if (k >= 1) {
        this.atks.splice(i, 1); let dentro = false;
        if (a.k === 'c') dentro = Math.hypot(y.x - a.x, y.z - a.z) < a.r + .4;
        else { const fx = Math.sin(a.ry), fz = Math.cos(a.ry), ex = y.x - a.x, ez = y.z - a.z, al = ex * fx + ez * fz, pe = Math.abs(ex * fz - ez * fx); dentro = al > -1 && al < a.len + .5 && pe < a.w / 2 + .4; }
        if (dentro) this.dano(a.dmg, a.b);
        const cx = a.k === 'c' ? a.x : a.x + Math.sin(a.ry) * a.len / 2, cz = a.k === 'c' ? a.z : a.z + Math.cos(a.ry) * a.len / 2;
        if (a.v === 'golpe' || a.v === 'salto' || a.v === 'boom') { this.parts.burst(cx, .3, cz, a.r > 3 ? 26 : 10, [.7, .6, .45], {type: 2, sp: 5, size: 1, life: .6, grow: 1}); if (a.r > 3) { this.cam.sh = Math.max(this.cam.sh, .3); audio.play('stomp'); } }
        else if (a.v === 'fuego') { for (let j = 0; j < 20; j++) { const f = Math.random() * a.len; this.parts.emit(a.x + Math.sin(a.ry) * f, .6, a.z + Math.cos(a.ry) * f, rnd(-1, 1), rnd(1, 3), rnd(-1, 1), 1, .5, .1, .7, .6, 1, -2, 1); } audio.play('fire'); }
        else if (a.v === 'rayo') { this.parts.burst(cx, 2, cz, 14, [.7, .85, 1], {sp: 7, size: .3}); this.mundo.u.flash.value = .4; audio.play('thunder'); }
        continue;
      }
      // aviso en el piso
      const col = a.v === 'zarpa' ? [1, .35, .25] : [1, .25, .15];
      if (a.k === 'c') this.fx.draw(FX.TCIRC, a.x, .07, a.z, 0, a.r, a.r, col, a.v === 'zarpa' ? .55 : .9, k);
      else this.fx.draw(FX.TLINE, a.x + Math.sin(a.ry) * a.len / 2, .07, a.z + Math.cos(a.ry) * a.len / 2, a.ry, a.w / 2, a.len / 2, col, .9, k);
    }
  }
  balasBichos(dt) {
    const t = now(), y = this.yo;
    for (let i = this.balasE.length - 1; i >= 0; i--) {
      const b = this.balasE[i]; if (t < b.t0) continue; const e = t - b.t0; if (e > b.ttl) { this.balasE.splice(i, 1); continue; }
      b.cx = b.x + b.dx * b.v * e; b.cz = b.z + b.dz * b.v * e;
      if (y.vivo && Math.hypot(y.x - b.cx, y.z - b.cz) < b.r + .45) { if (this.dano(b.dmg, b.b) || !y.dash) { this.parts.burst(b.cx, 1, b.cz, 6, b.col, {sp: 3, size: .3}); this.balasE.splice(i, 1); } }
    }
  }
  proyectiles(dt, s) {
    for (let i = this.balasP.length - 1; i >= 0; i--) {
      const p = this.balasP[i]; p.ttl -= dt; p.sp += dt * 12;
      if (p.busca) { let best = null, bd = 9; for (const b of this.bichos.values()) { if (b.muere || p.hit.has(b.id)) continue; const d = Math.hypot(b.x - p.x, b.z - p.z); if (d < bd) { bd = d; best = b; } } if (best) { const tx = (best.x - p.x) / bd, tz = (best.z - p.z) / bd; p.dx = lerp(p.dx, tx, Math.min(1, dt * 5)); p.dz = lerp(p.dz, tz, Math.min(1, dt * 5)); const l = Math.hypot(p.dx, p.dz); p.dx /= l; p.dz /= l; } }
      p.x += p.dx * p.v * dt; p.z += p.dz * p.v * dt; let fin = p.ttl <= 0;
      if (p.me) for (const b of this.bichos.values()) {
        if (b.muere || p.hit.has(b.id)) continue; if (Math.hypot(b.x - p.x, b.z - p.z) > b.r + p.r) continue; p.hit.add(b.id);
        if (p.expl) { this.area(p.x, p.z, p.expl, 0, Math.PI, p.dmg, {emp: 1}); fin = true; } else this.pega(b, p.dmg, p.dx * 2, p.dz * 2, p.traba ? 1 : 0, p.traba || 0);
        if (!p.expl && p.perf-- <= 0) { fin = true; break; }
      }
      else for (const b of this.bichos.values()) if (!b.muere && Math.hypot(b.x - p.x, b.z - p.z) < b.r + p.r) { fin = true; break; }
      if (p.me && !fin) for (const o of this.mundo.vis) if (!this.mundo.rotos.has(o) && Math.hypot(o.x - p.x, o.z - p.z) < .9) { if (KIT[o.t]?.pasto) { this.romper(o); continue; } this.romperCerca(p.x, p.z, .4); fin = true; break; }
      if (fin) { if (p.expl) { this.fx.spawn(FX.RING, p.x, p.z, p.expl, [1, .7, .3], .3); this.parts.burst(p.x, .6, p.z, 10, [1, .7, .3], {sp: 5, size: .35}); } this.balasP.splice(i, 1); }
    }
  }
  zonasUpd(dt) {
    for (let i = this.zonas.length - 1; i >= 0; i--) {
      const z = this.zonas[i]; if (z.espera > 0) { z.espera -= dt; if (z.golpe) this.fx.draw(FX.TCIRC, z.x, .07, z.z, 0, z.r, z.r, [1, .85, .4], .5, 1 - z.espera / .3); continue; }
      z.t -= dt; if (z.sigue) { z.x = z.sigue.x; z.z = z.sigue.z; }
      if (z.golpe) { if (!z.hecho) { z.hecho = 1; if (z.me) this.area(z.x, z.z, z.r, 0, Math.PI, z.dmg, {emp: 1.5}); this.fx.spawn(FX.RING, z.x, z.z, z.r, z.col, .3); this.parts.burst(z.x, .4, z.z, 10, [.7, .6, .45], {type: 2, sp: 4, size: .8, life: .5, grow: 1}); audio.play('stomp'); } }
      else {
        z.tick -= dt; if (z.tick <= 0) { z.tick = z.cada || .5; if (z.me) { if (z.orbita) { const tt = this.t * 3.2; for (let k = 0; k < z.orbita; k++) { const a = tt + k / z.orbita * TAU, ox = z.x + Math.sin(a) * z.r, oz = z.z + Math.cos(a) * z.r; this.area(ox, oz, .9, 0, Math.PI, z.dmg, {emp: .8}); } } else this.area(z.x, z.z, z.r, 0, Math.PI, z.dmg, {emp: z.giro ? 1.2 : .2, aturde: z.traba ? .5 : 0}); } }
        if (z.aura) this.fx.draw(FX.FIRE, z.x, .06, z.z, this.t, z.r, z.r, z.col, .8, .5);
        if (z.giro) this.fx.draw(FX.SPIRAL, z.x, .07, z.z, this.t * 9, z.r, z.r, [1, .9, .7], .7, .5);
      }
      if (z.t <= 0) this.zonas.splice(i, 1);
    }
  }
  // ---------- lugares y gente ----------
  lugar() {
    const y = this.yo, r = regionEn(y.x, y.z), pu = enPueblo(y.x, y.z);
    if (r !== this.region) { this.region = r; const R = REG[r]; this.ui.zona(R, r); if (!this.jefeB) audio.track(R.tr); const p = this.p; if (!p.regiones[r]) { p.regiones[r] = 1; if (Object.keys(p.regiones).length > 1) { this.fama(10); this.xp(Math.round(xpSig(Math.max(p.lv, R.lv[0])) * .08)); setTimeout(() => this.ui.toast(`Descubriste ${R.n}`, 'libro', 3), 1800); } } }
    const pj = parajeEn(y.x, y.z, r); if (pj && pj.id !== this.paraje) { this.paraje = pj.id; this.ui.paraje(pj); const vp = (p => p.parajes ||= {})(this.p); if (!vp[pj.id]) { vp[pj.id] = 1; if (Object.keys(vp).length > 1) { this.xp(Math.max(5, Math.round(xpSig(Math.max(this.p.lv, pj.lv[0])) * .025))); this.fama(2); this.ui.toast('Descubriste: ' + pj.n, 'libro', 2.5); } } }
    if (pu?.id !== this.pueblo) { this.pueblo = pu?.id || null; if (pu) { const nuevo = !this.p.pueblos[pu.id]; this.p.pueblos[pu.id] = 1; this.p.fogon = pu.id; this.ui.toast(nuevo ? `Llegaste a ${pu.n}. Ya podés viajar acá desde cualquier fogón.` : pu.n, 'brasa', nuevo ? 4 : 2); this.ui.misiones.llega?.(pu.id); this.ui.guardar(); } }
  }
  interaccion(c) {
    const y = this.yo; let best = null, bd = 3.4;
    for (const n of this.npcs) { const d = Math.hypot(n.x - y.x, n.z - y.z); if (d < bd) { bd = d; best = {tipo: 'npc', ref: n}; } }
    for (const p of PUEBLOS) { const d = Math.hypot(p.x - y.x, p.z - y.z) - 1.2; if (d < bd) { bd = d; best = {tipo: 'fogon', ref: p}; } }
    for (const l of LUGARES) { if (Math.abs(l.x - y.x) > 5 || Math.abs(l.z - y.z) > 5) continue; const d = Math.hypot(l.x - y.x, l.z - y.z) - 1; if (d < bd) { bd = d; best = {tipo: l.tipo, ref: l}; } }
    const cand = (tipo, ref, d) => { if (d < bd) { bd = d; best = {tipo, ref}; } };
    for (const o of this.aljibes) if (Math.abs(o.x - y.x) < 4 && Math.abs(o.z - y.z) < 4) cand('aljibe', o, Math.hypot(o.x - y.x, o.z - y.z) - 1);
    if (!this.vida.doma && !this.eventos.abd) { this.vida.candidatos(cand); this.eventos.candidatos(cand); this.pesca.candidatos(cand); this.ui.misiones.candidatos(cand); }
    this.cerca = best; this.ui.cerca(best);
    if (best && c.usar && y.vivo) this.ui.usar(best);
  }
  // ---------- cámara ----------
  // ---------- monturas ----------
  montura() { return this.yo?.montado === true ? MONTURAS[this.p.montura] : null; }
  vueloDash(y) { const d = y.dash; if (!d) return 0; const k = Math.sin(Math.min(1, d.t / d.dur) * Math.PI); return d.baja ? -(this.montura()?.vuela || 0) * k : d.vuela ? k * 3 * d.vuela : 0; }
  // choques: el cóndor y los saltos altos pasan por arriba de todo; el yacaré nada en lo hondo
  chocarYo(y, salta, libre, ox, oz) {
    const M = this.montura();
    if (libre || M?.vuela) { const [o, e] = bordeX(y.z); y.x = clamp(y.x, o + 2, e - 2); y.z = clamp(y.z, NORTE + 2, SUR - 2); if (!RELIQUIAS.every(r => this.p.reliq[r])) { const dx = y.x - SALA.x, dz = y.z - SALA.z, d = Math.hypot(dx, dz); if (d < SALA.r + 3) { y.x = SALA.x + dx / (d || 1) * (SALA.r + 3); y.z = SALA.z + dz / (d || 1) * (SALA.r + 3); } } return true; }
    if (chocar(y, .55, salta, ox, oz, M?.trepa)) return true;
    if (M?.nada) { const [, e] = bordeX(y.z); return y.x < e - 1; }
    return false;
  }
  // ---------- fama y exploración ----------
  fama(n) { const p = this.p, r0 = rangoFama(p.fama); p.fama = (p.fama || 0) + n; const r1 = rangoFama(p.fama); if (r1 > r0) { this.ui.cartel('Ahora te dicen: ' + TITULOS[r1][1], 'Tu fama creció: ganaste una maña y te hacen descuento en los pueblos'); audio.play('level'); this.ui.armarHud(); } }
  explorar() {
    const p = this.p, n = explorar(this.vistoB, this.yo.x, this.yo.z, this.vista === 'arriba' ? 22 : 30); if (!n) return;
    this.expN = (this.expN || 0) + n; if (this.expN >= 40) { this.expN -= 40; this.xp(Math.max(2, Math.round(xpSig(p.lv) * .006))); }
    guardarVisto(p, this.vistoB);
    const h = HITOS_EXPLORA.filter(v => explorado(this.vistoB) >= v).length; if (h > (p.hitosExp || 0)) { p.hitosExp = h; this.ui.cartel(`Exploraste el ${HITOS_EXPLORA[h - 1]}% del país`, 'Ganaste una maña. En el mapa (M) lo oscuro es lo que te falta conocer'); audio.play('level'); this.fama(5); }
  }
  // ---------- vista: desde arriba, desde atrás o con tus ojos ----------
  cambiarVista(v) {
    const L = ['arriba', 'atras', 'fp']; this.vista = v || L[(L.indexOf(this.vista) + 1) % L.length]; this.cfg.vista = this.vista; ctl.vista = this.vista;
    if (this.vista === 'arriba' && document.pointerLockElement) document.exitPointerLock?.();
    if (this.vista !== 'arriba') { this.cam.yaw = this.yo.ry; this.cam.pitch = this.vista === 'fp' ? -.08 : -.2; }
    this.ui.toast({arriba: 'Cámara desde arriba', atras: 'Cámara desde atrás', fp: 'Primera persona'}[this.vista] + (this.vista !== 'arriba' ? (ctl.tactil ? ' · arrastrá a la derecha para mirar' : ' · hacé clic para mirar con el mouse') : ''), null, 2.5); this.ui.guardar?.();
  }
  mirar(dt, c) {
    if (this.vista === 'arriba') return; const C = this.cam, k = ctl.tactil ? .0042 : .0024;
    C.yaw -= (c.look?.dx || 0) * k + (c.stick?.[0] || 0) * 2.8 * dt; C.pitch = clamp(C.pitch - (c.look?.dy || 0) * k - (c.stick?.[1] || 0) * 1.8 * dt, this.vista === 'fp' ? -1.15 : -.75, this.vista === 'fp' ? .7 : .25);
    // sin mouse ni dedo, la cámara de atrás se acomoda sola detrás tuyo cuando caminás
    if (this.vista === 'atras' && !c.trabado && !ctl.mira.on && !c.stick?.[0] && this.yo.mv > .5) C.yaw = lerpA(C.yaw, this.yo.ry, Math.min(1, dt * 1.4));
  }
  fov() { const por = innerHeight > innerWidth; return this.vista === 'fp' ? (por ? 80 : 72) : this.vista === 'atras' ? (por ? 68 : 60) : (por ? 50 : 40); }
  foco() { const y = this.yo; if (this.vista === 'arriba') return this.cam; const f = this.vista === 'fp' ? 18 : 13; return {x: y.x + Math.sin(this.cam.yaw) * f, z: y.z + Math.cos(this.cam.yaw) * f}; }
  camara(dt) {
    const y = this.yo, c = this.cam, por = innerHeight > innerWidth; const D = por ? 33 : 27;
    const gy = alto(y.x, y.z); y.gy = y.gy == null ? gy : lerp(y.gy, gy, Math.min(1, dt * 14)); this.plano.constant = -y.gy;
    if (this.vista !== 'arriba') {
      c.x = lerp(c.x, y.x, Math.min(1, dt * 12)); c.z = lerp(c.z, y.z, Math.min(1, dt * 12)); const sh = c.sh * c.sh * .5; c.sh = Math.max(0, c.sh - dt * 1.8);
      const fx = Math.sin(c.yaw), fz = Math.cos(c.yaw), cp = Math.cos(c.pitch), sp = Math.sin(c.pitch), MM = this.montura(), alto = (MM ? MM.alto + (this.vista === 'fp' ? .5 : 0) + (MM.vuela || 0) : 0) + this.eventos.altura() + this.vueloDash(y);
      if (this.vista === 'fp') { const bob = y.mv * Math.sin(y.ph * (y.montado ? 1 : 2)) * (y.montado ? .09 : .045), e = 1.62 + alto + bob + (y.vivo ? 0 : -1.2) + y.gy; const adel = y.montado ? -.4 : .18; this.camera.position.set(c.x + fx * adel + rnd(-sh, sh), e + rnd(-sh, sh), c.z + fz * adel + rnd(-sh, sh)); this.camera.lookAt(this.camera.position.x + fx * cp, e + sp, this.camera.position.z + fz * cp); }
      else { const dd = MM?.vuela ? 9 : y.montado ? 7.5 : 6.2, hx = c.x, hz = c.z, hy = 1.7 + alto + y.gy; const px = hx - fx * cp * dd, pz = hz - fz * cp * dd, py = Math.max(this.altoCam(px, pz) + .8, hy - sp * dd + .6); this.camera.position.set(px + rnd(-sh, sh), py + rnd(-sh, sh), pz + rnd(-sh, sh)); this.camera.lookAt(hx + fx * 2.5, hy + sp * 2.5, hz + fz * 2.5); }
      return;
    }
    c.x = lerp(c.x, y.x, Math.min(1, dt * 6)); c.z = lerp(c.z, y.z, Math.min(1, dt * 6)); c.d = lerp(c.d, D * (this.jefeB ? 1.12 : 1), Math.min(1, dt * 2));
    const el = .88, sh = c.sh * c.sh * .8; c.sh = Math.max(0, c.sh - dt * 1.8); c.h = c.h == null ? y.gy : lerp(c.h, y.gy, Math.min(1, dt * 4));
    this.camera.position.set(c.x + rnd(-sh, sh), Math.sin(el) * c.d + c.h + rnd(-sh, sh), c.z + Math.cos(el) * c.d + rnd(-sh, sh)); this.camera.lookAt(c.x, .6 + c.h, c.z - (por ? 1.5 : 0));
  }
  // algo que dice alguien, en un globito arriba de la cabeza
  burbuja(o, txt, dur = 4.5) { this.burbujas = this.burbujas.filter(b => b.o !== o); this.burbujas.push({o, txt, t: 0, dur}); if (this.burbujas.length > 5) this.burbujas.shift(); }
  altoCam(x, z) { let h = alto(x, z); for (const [a, b] of [[1.2, 0], [-1.2, 0], [0, 1.2], [0, -1.2]]) h = Math.max(h, alto(x + a, z + b)); return h; }
  // ---------- dibujar ----------
  dibujar(dt) {
    for (const k in this.B) this.B[k].begin();
    const y = this.yo, t = this.t, s = this.stats();
    // vos
    const gl = y.buff.furia > t ? [1, .2, .1] : y.buff.escudo > t ? [.3, .6, 1] : [0, 0, 0], inv = t < (y.inv || 0) ? (Math.sin(t * 30) > 0 ? .3 : 0) : 0;
    const MM = this.montura(), vuelo = this.vueloDash(y) + this.eventos.altura() + (MM?.vuela || 0), cab = !!MM;
    if (MM) this.bt(MM.mod, 40).push(y.x, vuelo, y.z, y.ry, MM.s, y.ph, MM.vuela ? 1 : y.mv, 0, 0, gl[0] * .5, gl[1] * .5, gl[2] * .5, 0, y.dash ? -.25 : 0, 0);
    if (this.vista !== 'fp' && !this.vida.doma) this.bt('h_' + this.p.ch).push(y.x, (cab ? MM.alto : y.dash && !y.dash.vuela ? .25 : 0) + vuelo, y.z, y.ry, 1, cab ? 0 : y.ph, cab ? 0 : y.mv, y.atk * y.atk, Math.max(y.fl * .8, inv), gl[0], gl[1], gl[2], y.vivo ? 0 : .7, y.vivo ? 0 : -1.3);
    this.fx.draw(FX.SHADOW, y.x, .05, y.z, 0, cab ? 1.4 : .9, cab ? 1.4 : .9, [0, 0, 0], .5);
    if (y.buff.escudo > t) this.fx.draw(FX.RUNE, y.x, .06, y.z, t, 1.6, 1.6, [.4, .7, 1], .6, .5);
    // otros jugadores
    for (const o of this.otros.values()) { const g2 = o.fu ? [1, .2, .1] : o.es ? [.3, .6, 1] : [0, 0, 0]; const OM = MONTURAS[ORDEN_M[o.ca - 1]]; if (OM) this.bt(OM.mod, 40).push(o.x, OM.vuela || 0, o.z, o.ry, OM.s, o.ph * .7, OM.vuela ? 1 : o.mv); this.bt('h_' + o.ch).push(o.x, OM ? OM.alto + (OM.vuela || 0) : o.d ? .25 : 0, o.z, o.ry, 1, o.ph, o.mv, o.at * o.at, 0, g2[0], g2[1], g2[2], o.hp <= 0 ? .7 : 0, o.hp <= 0 ? -1.3 : 0); this.fx.draw(FX.SHADOW, o.x, .05, o.z, 0, .9, .9, [0, 0, 0], .5); }
    // gente de los pueblos
    for (const n of this.npcs) { if (Math.abs(n.x - y.x) > 60 || Math.abs(n.z - y.z) > 60) continue; const look = Math.hypot(n.x - y.x, n.z - y.z) < 7 ? Math.atan2(y.x - n.x, y.z - n.z) : n.ry; n.ryv = n.ryv == null ? look : n.ryv + ang(look, n.ryv) * Math.min(1, dt * 4); this.bt(n.mod, 24).push(n.x, 0, n.z, n.ryv, n.s || 1, n.anda ? t * 8 : t + n.x, n.anda ? 1 : 0, 0); }
    this.ui.misiones.dibujar(); this.ambiente.dibujar(); this.vida.dibujar(); this.eventos.dibujar(dt); this.pesca.dibujar();
    // bichos
    for (const b of this.bichos.values()) {
      if (Math.abs(b.x - y.x) > 70 || Math.abs(b.z - y.z) > 70) continue; const tint = b.camp ? [1, .75, .15] : b.jefe ? [0, 0, 0] : [0, 0, 0];
      const k = 'f_' + b.tipo, fy = b.fly ? .25 + Math.sin(b.ph * .5) * .12 : 0;
      this.bt(k, b.jefe ? 4 : 48).push(b.x, fy, b.z, b.ry, b.s, b.ph, b.mv, b.at * b.at, b.fl, tint[0] * .5, tint[1] * .5, tint[2] * .5, b.die);
      if (!b.die) this.fx.draw(FX.SHADOW, b.x, .05, b.z, 0, b.r * 1.5, b.r * 1.5, [0, 0, 0], .45);
      if (b.est & 8) this.fx.draw(FX.RUNE, b.x, .07, b.z, t * 3, b.r + .6, b.r + .6, [1, .9, .3], .5, .5);
      if (b.ladron && !b.die) this.fx.draw(FX.GLOW, b.x, .06, b.z, 0, 2, 2, [1, .85, .3], .5, .5);
      if (b.camp && !b.die) this.fx.draw(FX.GLOW, b.x, .06, b.z, 0, b.r * 2.2, b.r * 2.2, [1, .7, .2], .35, .5);
    }
    // proyectiles
    for (const p of this.balasP) this.bt('o_' + p.mod, 128).push(p.x, 1, p.z, p.sp, .9, 0, 0, 0, .3);
    const T = now(); for (const b of this.balasE) if (T >= b.t0 && b.cx != null) { this.bt('o_bala', 160).push(b.cx, 1, b.cz, T * 6, 1.1, 0, 0, 0, .6, b.col[0], b.col[1], b.col[2]); this.fx.draw(FX.GLOW, b.cx, .06, b.cz, 0, 1, 1, b.col, .5, .5); }
    for (const z of this.zonas) if (z.orbita && z.t > 0) { const tt = this.t * 3.2; for (let k = 0; k < z.orbita; k++) { const a = tt + k / z.orbita * TAU; this.bt('o_' + (z.mod || 'vela'), 64).push(z.x + Math.sin(a) * z.r, 1, z.z + Math.cos(a) * z.r, a, 1, 0, 0, 0, .4); } }
    else if (z.giro && z.t > 0) { for (let k = 0; k < 3; k++) { const a = this.t * 12 + k / 3 * TAU; this.bt('o_' + z.giro, 32).push(z.x + Math.sin(a) * z.r * .6, 1, z.z + Math.cos(a) * z.r * .6, a + Math.PI / 2, 1.2, 0, 0, 0, .3); } }
    for (const k in this.B) this.B[k].end();
  }
  // números flotantes
  num(x, z, txt, col, s = .8, h = 2.2) { if (this.nums.length > 60) this.nums.shift(); this.nums.push({x: x + rnd(-.4, .4), z, y: h, txt, col, s, t: 0}); }
}
function lerpA(a, b, k) { return a + ang(b, a) * k; }
