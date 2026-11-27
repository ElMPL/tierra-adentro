// Pantallas y botones: inicio, personajes, barra de vida y habilidades, mapa, inventario, misiones, tiendas, charlas y chat.
import {THREE, U, Batch} from '../lib/gfx.js';
import {HEROES, FOES, OBJ, MISC, model} from '../lib/models.js';
import {audio} from '../lib/audio.js';
import {WEAPONS} from '../lib/data.js';
import {KITS, DESBLOQUEO, CHARS, ENEMIES, BOSSES, OBJETOS, AMULETOS, RELIQ, GRADOS, costoMejora, xpSig, NIVEL_MAX} from '../shared/reglas.js';
import {REG, ORDEN, RELIQUIAS, PUEBLOS, GUARIDAS, SALA, NORTE, SUR, LUGARES, MAPA_V, alto, PARAJES, relieve, GR} from '../shared/mapa.js';
import {esNoche} from '../shared/sim.js';
import {Misiones, MIS, CAPS, TRATOS} from './misiones.js';
import {NOMBRE_FORASTERO} from './historia.js';
import {ctl, botones} from './controles.js';
import {via} from './red.js';
import {RES} from './mundo3d.js';
import {RAMAS, MAX_RANGO, TITULOS, rangoFama, titulo, descuento, manasGanadas, manasGastadas, manasLibres, EXPLORA, visto, explorado, HITOS_EXPLORA} from './progreso.js';
import {MONTURAS, ORDEN_M} from './vida.js';
import {TODOS_PECES} from './pesca.js';

const $ = s => document.querySelector(s);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const CLAVE = 'tierra-adentro';
const ICH = {tajo: 'rebenque', onda: 'guitarra', charco: 'mate', pisoton: 'bota', giro: 'facon', orbita: 'vela', aura: 'brasa', carga: 'espuela', cura: 'yerba', escudo: 'poncho', lazo: 'lazo', lluvia: 'rayo', furia: 'garras'};
const icoHab = ef => ef.mod && ef.tipo === 'tiro' ? ef.mod : ICH[ef.tipo] || 'boleadoras';
const ROL = {pulpero: 'Pulpero', herrero: 'Herrero', posta: 'Mercachifle', vecino: 'Vecina', baqueano: 'Baqueano', cantor: 'Cantor'};

// íconos sacados de los modelos 3D
function hacerIconos() {
  const S = 128, r = new THREE.WebGLRenderer({alpha: true, antialias: true, preserveDrawingBuffer: true}); r.setSize(S, S); r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.25;
  const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(28, 1, .1, 100); sc.add(new THREE.HemisphereLight(0xfff2e0, 0x6a5070, 1.6)); const d = new THREE.DirectionalLight(0xffffff, 2.6); d.position.set(2, 4, 5); sc.add(d); const d2 = new THREE.DirectionalLight(0x9ac0ff, 1.6); d2.position.set(-4, 2, -3); sc.add(d2);
  const shot = (geo, ry = 0, view) => {
    const or = U.uRim.value.clone(); U.uRim.value.setRGB(.8, .8, 1); const b = new Batch(sc, geo, 1, {shadow: false, recv: false, abs: true}); b.begin(); b.push(0, 0, 0, ry, 1, .4, 0, 0); b.end();
    const bb = geo.boundingBox, c = bb.getCenter(new THREE.Vector3()), sz = bb.getSize(new THREE.Vector3()); let R = sz.length() / 2;
    if (view === 'head') { c.set(0, bb.max.y - sz.y * .2, 0); R = sz.y * .3; } else if (view === 'foe') { c.y = bb.min.y + sz.y * .56; R = Math.max(sz.y, Math.min(sz.x, sz.y * 1.3)) * .56; }
    if (ry && view !== 'head') { const cs = Math.cos(ry), sn = Math.sin(ry), x = c.x * cs + c.z * sn, z = -c.x * sn + c.z * cs; c.x = x; c.z = z; }
    const D = R / Math.sin(14 * Math.PI / 180) * (view ? 1.02 : .86); cam.position.set(c.x + D * .18, c.y + D * (view ? .16 : .34), c.z + D * .93); cam.lookAt(c); r.render(sc, cam);
    const u = r.domElement.toDataURL('image/png'); sc.remove(b.m); b.m.geometry.dispose(); b.m.dispose(); U.uRim.value.copy(or); return u;
  };
  const out = {};
  const mk = k => { try { if (k.startsWith('h_')) return HEROES[k.slice(2)] && shot(model(HEROES[k.slice(2)]), .25, 'head'); if (k.startsWith('c_')) return HEROES[k.slice(2)] && shot(model(HEROES[k.slice(2)]), .35, 'foe'); if (k.startsWith('f_')) return FOES[k.slice(2)] && shot(model(FOES[k.slice(2)], .8), .4, 'foe'); if (k.startsWith('m_')) return MISC[k.slice(2)] && shot(model(MISC[k.slice(2)], .8), .5, 'foe'); return OBJ[k] ? shot(model(OBJ[k]), .35) : ''; } catch (e) { console.warn(k, e); return ''; } };
  const get = k => k in out ? out[k] : (out[k] = mk(k) || '');
  return get;
}

export class UI {
  constructor(o) {
    Object.assign(this, o); // juego, red, mundo, cfg
    this.icon = hacerIconos(); this.misiones = new Misiones(this); this.datos = this.cargar(); this.pausa = false; this.panel = null; this.toasts = []; this.track = null;
    this.ov = $('#ov'); this.cx = this.ov.getContext('2d'); this.mini = $('#mini'); this.mcx = this.mini.getContext('2d');
    botones(document.body);
    $('#bmapa').onclick = () => this.mapa(); $('#bprog').onclick = () => this.progreso(); $('#binv').onclick = () => this.inventario(); $('#bmis').onclick = () => this.listaMis(); $('#bop').onclick = () => this.opciones(); $('#bchat').onclick = () => this.abrirChat();
    $('#seg').onclick = () => this.listaMis(); $('#mini').onclick = () => this.mapa();
    const ci = $('#chatin'); ci.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') { const v = ci.value.trim(); if (v) this.red.manda({t: 'chat', m: v}); ci.value = ''; ci.hidden = true; ci.blur(); } if (e.key === 'Escape') { ci.hidden = true; ci.blur(); } });
    this.imgMapa();
  }
  // ---------- guardado ----------
  cargar() { let d = {perfiles: [], cfg: {}}; try { d = {...d, ...JSON.parse(localStorage.getItem(CLAVE) || '{}')}; } catch (e) { } this.cfg = Object.assign(this.cfg || {}, {mus: .6, sfx: .8, q: 'media', nums: 1, vista: 'arriba'}, d.cfg || {}); audio.vol.m = this.cfg.mus; audio.vol.s = this.cfg.sfx; return d; }
  guardar() {
    const p = this.perfil, j = this.juego; if (p && j.activo) { p.pos = {x: Math.round(j.yo.x * 10) / 10, z: Math.round(j.yo.z * 10) / 10}; p.hpPct = j.yo.vivo ? Math.max(.2, j.yo.hp / j.stats().vida) : 1; p.t = (p.t || 0); }
    try { localStorage.setItem(CLAVE, JSON.stringify({perfiles: this.datos.perfiles, cfg: this.cfg})); } catch (e) { }
  }
  nuevoPerfil(ch, nombre) { return {id: Math.random().toString(36).slice(2, 10), nombre, ch, lv: 1, xp: 0, oro: 20, arma: 1, poncho: 1, amuleto: null, amuletos: {}, inv: {mate: 3, asado: 0, cana: 0, retazo: 0}, reliq: {}, mis: {}, pueblos: {pampa: 1}, fogon: 'pampa', bestiario: {}, creado: Date.now(), pos: null}; }
  // ---------- pantallas de inicio ----------
  show(id, html) { const u = $('#ui'); u.innerHTML = html; this.scr = id; return u.firstElementChild; }
  inicio() {
    this.scr = 'inicio'; $('#hud').hidden = true; document.body.classList.remove('jugando');
    const hay = this.datos.perfiles.length;
    const e = this.show('inicio', `<div class="scr" id="inicio"><h1>Noche de Salamanca<span>Tierra Adentro</span></h1><div class="guarda"></div>
      <div class="menu">${hay ? '<button data-a="seguir">Seguir jugando</button>' : ''}<button data-a="nuevo">Nuevo personaje</button>${hay > 1 ? '<button data-a="lista">Mis personajes</button>' : ''}<button data-a="op">Opciones</button></div>
      <p class="pie">Un mundo abierto de leyendas argentinas, para jugar solo o con hasta 12 personas.</p></div>`);
    e.querySelector('.menu').onclick = ev => { const a = ev.target.closest('button')?.dataset.a; if (!a) return; audio.init(); audio.play('ok');
      if (a === 'seguir') { const p = [...this.datos.perfiles].sort((x, y) => (y.ult || 0) - (x.ult || 0))[0]; this.modo(p); } if (a === 'nuevo') this.crear(); if (a === 'lista') this.lista(); if (a === 'op') this.opciones(); };
    audio.track('menu');
  }
  lista() {
    const P = this.datos.perfiles;
    const e = this.show('lista', `<div class="scr panel" id="lista"><h2>Mis personajes</h2><div class="cartas">${P.map((p, i) => `<div class="carta"><img alt="" src="${this.icon('h_' + p.ch)}"><b>${esc(p.nombre)}</b><span>${CHARS[p.ch].t} · nivel ${p.lv}</span><span>${Object.keys(p.reliq).length} de 8 reliquias</span><button class="btn" data-j="${i}">Jugar</button><button class="lnk" data-b="${i}">Borrar</button></div>`).join('')}</div><button class="btn sec" data-v>Volver</button></div>`);
    e.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.j) this.modo(P[+b.dataset.j]); if (b.dataset.b) { if (!b.dataset.ok) { b.dataset.ok = 1; b.textContent = '¿Seguro? Tocá otra vez para borrarlo'; return; } P.splice(+b.dataset.b, 1); this.guardar(); P.length ? this.lista() : this.inicio(); } if (b.dataset.v !== undefined) this.inicio(); };
  }
  crear() {
    const ks = Object.keys(KITS); let sel = this.sel || 'gaucho';
    const e = this.show('crear', `<div class="scr panel" id="crear"><h2>Elegí tu personaje</h2><div id="chs">${ks.map(k => `<button data-k="${k}" class="${k === sel ? 'on' : ''}"><img alt="" src="${this.icon('h_' + k)}"><b>${CHARS[k].n}</b><span>${CHARS[k].t}</span></button>`).join('')}</div><div id="chd"></div>
      <div class="fila"><label>Nombre <input id="nom" maxlength="16" autocomplete="off"></label><button class="btn" id="go">Empezar</button><button class="btn sec" id="vol">Volver</button></div></div>`);
    const det = () => { const K = KITS[sel], C = CHARS[sel]; $('#chd').innerHTML = `<img alt="" src="${this.icon('c_' + sel)}"><div><h3>${C.n} <small>${C.t}</small></h3><p>${C.d}</p><p class="st">Vida ${K.vida} · Velocidad ${K.vel}${K.arm ? ' · Aguante' : ''}${K.suerte ? ' · Suerte' : ''}${K.crit ? ' · Crítico' : ''}</p>
      <ul class="habs"><li><img alt="" src="${this.icon(icoHab(K.basico))}"><b>${WEAPONS[C.w]?.n || 'Ataque'}</b><span>Ataque básico</span></li>${K.h.map((h, i) => `<li><img alt="" src="${this.icon(icoHab(h.ef[0]))}"><b>${h.n}</b><span>${h.d} Nivel ${DESBLOQUEO[i]}.</span></li>`).join('')}</ul></div>`; const n = $('#nom'); if (!n.dataset.toc) n.value = C.n; };
    det(); $('#nom').oninput = () => { $('#nom').dataset.toc = 1; };
    $('#chs').onclick = ev => { const b = ev.target.closest('button'); if (!b) return; sel = this.sel = b.dataset.k; e.querySelectorAll('#chs button').forEach(x => x.classList.toggle('on', x === b)); audio.play('move'); det(); };
    $('#vol').onclick = () => this.inicio();
    $('#go').onclick = () => { const n = ($('#nom').value || '').replace(/[<>&"'`\\]/g, '').trim().slice(0, 16) || CHARS[sel].n; const p = this.nuevoPerfil(sel, n); this.datos.perfiles.push(p); this.guardar(); audio.play('ok'); this.modo(p); };
  }
  async modo(p) {
    const v = via(), nube = v === 'nube' || v === 'prueba';
    const e = this.show('modo', `<div class="scr panel" id="modo"><h2>¿Dónde jugás, ${esc(p.nombre)}?</h2>
      <button class="op" data-m="online" ${v ? '' : 'disabled'}><b>En el mundo compartido</b><span id="est">${v ? 'Buscando el mundo…' : 'Todavía no hay un mundo compartido publicado.'}</span></button>
      <button class="op" data-m="solo"><b>Solo, sin internet</b><span>El mismo mundo, pero solo para vos. Tu personaje es el mismo en los dos.</span></button>
      <button class="btn sec" data-m="vol">Volver</button></div>`);
    let vivo = true; e.onclick = async ev => { const m = ev.target.closest('button')?.dataset.m; if (!m) return; vivo = false; audio.play('ok'); if (m === 'vol') return this.inicio(); if (m === 'solo') return this.jugar(p, 'solo');
      $('#est').textContent = nube ? 'Conectando…' : 'Conectando… si el mundo estaba dormido puede tardar hasta un minuto.'; e.querySelectorAll('button').forEach(b => b.disabled = true);
      if (!nube) this.red.salud(65000).then(() => {});
      const ok = await this.jugar(p, 'online'); if (!ok) { this.toast(this.red.lleno ? 'El mundo está lleno. Probá en un rato.' : nube ? 'No se pudo llegar al mundo. Revisá la conexión a internet; mientras tanto podés jugar solo.' : 'No se pudo conectar. Podés jugar solo mientras tanto.', null, 5); this.modo(p); } };
    if (v) {
      const s = await this.red.salud(); if (!vivo) return; const est = $('#est'); if (!est) return;
      const gente = n => `${n} ${n === 1 ? 'persona jugando' : 'personas jugando'}`;
      if (nube) est.textContent = !s ? 'No se pudo llegar al mundo. ¿Hay internet?' : s.jugadores >= s.max ? `Lleno · ${gente(s.jugadores)}` : s.jugadores ? `Abierto · ${gente(s.jugadores)}` : 'Abierto · no hay nadie ahora, ¡entrá primero!';
      else est.textContent = s ? `Prendido · ${gente(s.jugadores)}` : 'Está dormido o apagado. Tocá para despertarlo (tarda hasta un minuto).';
    }
  }
  async jugar(p, modo) {
    this.perfil = p; p.ult = Date.now(); if (p.mapa !== MAPA_V) { p.pos = null; p.mapa = MAPA_V; p.entierros = {}; }
    const hola = {n: p.nombre, ch: p.ch, lv: p.lv, hp: 1, x: p.pos?.x ?? REG.pampa.pueblo.x, z: p.pos?.z ?? REG.pampa.pueblo.z};
    this.red.cerrar(); if (modo === 'solo') this.red.solo(hola); else { const ok = await this.red.conectar(hola); if (!ok) { this.red.cerrar(); return false; } }
    this.juego.empezar(p, this.red); this.show('', ''); this.scr = 'juego'; $('#hud').hidden = false; document.body.classList.add('jugando');
    this.armarHud(); this.seguimiento();
    if (!p.mis.h1) setTimeout(() => this.toast('Hablá con Doña Eulogia, junto al fogón del pueblo (la de la estrella ★).', 'h_curandera', 7), 1200);
    this.guardar(); return true;
  }
  salir() { this.guardar(); this.red.cerrar(); this.juego.activo = false; this.cerrarPanel(); this.jefe(null); this.inicio(); }
  // ---------- barra de abajo ----------
  armarHud() {
    const p = this.perfil, K = KITS[p.ch];
    $('#cara').src = this.icon('h_' + p.ch); $('#nom2').textContent = p.nombre;
    const slot = (k, ic, key, lab) => `<button class="hab" data-b="${k}" aria-label="${esc(lab)}"><img alt="" src="${ic}"><i></i><kbd>${key}</kbd><em></em></button>`;
    $('#habs').innerHTML = slot('atk', this.icon(icoHab(K.basico)), 'Clic', 'Atacar') + K.h.map((h, i) => slot('h' + i, this.icon(icoHab(h.ef[0])), 'QER'[i], h.n)).join('') + slot('esq', this.icon('espuela'), 'Espacio', 'Esquivar') + slot('mate', this.icon('mate'), 'H', 'Tomar mate') + (p.montura && p.monturas?.[p.montura] ? slot('caballo', this.icon(MONTURAS[p.montura].ic), 'G', 'Montura: ' + p.monturas[p.montura].n) : '');
    botones($('#habs'));
  }
  hud() {
    const j = this.juego, p = this.perfil, y = j.yo, s = j.stats(), K = KITS[p.ch]; if (!y) return;
    const vp = Math.max(0, y.hp / s.vida); $('#vida i').style.width = vp * 100 + '%'; $('#vida span').textContent = `${Math.ceil(y.hp)} / ${Math.round(s.vida)}`; $('#vida').classList.toggle('baja', vp < .3);
    $('#xpb i').style.width = (p.lv >= NIVEL_MAX ? 100 : p.xp / xpSig(p.lv) * 100) + '%'; $('#niv').textContent = 'Nivel ' + p.lv + ' · ' + titulo(p);
    const ml = manasLibres(p); if (ml !== this.mlAnt) { this.mlAnt = ml; const bi = $('#bprog i'); bi.hidden = ml <= 0; bi.textContent = ml; } $('#oro').textContent = p.oro + ' $';
    const bs = $('#habs').children; if (!bs.length) return;
    const cd = (el, v, max, bloq) => { el.querySelector('i').style.height = (bloq ? 100 : max ? v / max * 100 : 0) + '%'; el.classList.toggle('bloq', !!bloq); const em = el.querySelector('em'); em.textContent = bloq ? 'Nv ' + bloq : v > .9 ? Math.ceil(v) : ''; };
    cd(bs[0], y.cdB, K.basico.cd); for (let i = 0; i < 3; i++) cd(bs[i + 1], y.cd[i], K.h[i].cd * s.cdr, p.lv < DESBLOQUEO[i] ? DESBLOQUEO[i] : 0); cd(bs[4], y.esq, y.esqMax || 1.1); bs[5].querySelector('em').textContent = p.inv.mate || 0; bs[5].classList.toggle('bloq', !(p.inv.mate > 0));
    const h = j.horaAhora(); $('#reloj').textContent = esNoche(h) ? '☾ Noche' : '☀ Día'; $('#red').textContent = this.red.modo === 'solo' ? 'Solo' : this.red.estado === 'conectado' ? `${(j.lista?.length || 1)} en el mundo` : 'Reconectando…';
  }
  zona(R, k) { this.zonaT = performance.now(); $('#zona b').textContent = R.n; $('#zona span').textContent = `Nivel ${R.lv[0]}–${R.lv[1]}`; this.cartel(R.n, k === 'salamanca' ? 'La cueva de Mandinga' : `${R.sub} · Nivel ${R.lv[0]} a ${R.lv[1]}`); }
  paraje(pj) { $('#zona span').textContent = `${pj.n} · Nv ${pj.lv[0]}–${pj.lv[1]}`; if (pj.n === REG[pj.reg].n || PUEBLOS.some(p => p.n === pj.n && p.id === pj.reg) && this.ultParaje == null) { this.ultParaje = pj.id; return; } this.ultParaje = pj.id; if (performance.now() - (this.zonaT || 0) < 2500) return; const c = $('#parajeC'); c.innerHTML = `${esc(pj.n)}<small>Nivel ${pj.lv[0]} a ${pj.lv[1]}</small>`; c.classList.remove('ver'); void c.offsetWidth; c.classList.add('ver'); }
  cartel(t, s) { const c = $('#cartel'); c.innerHTML = `<h2>${esc(t)}</h2><p>${esc(s)}</p>`; c.classList.remove('ver'); void c.offsetWidth; c.classList.add('ver'); }
  toast(txt, ic, dur = 2.6) { const d = document.createElement('div'); d.className = 'toast'; const u = ic ? this.icon(ic) : ''; d.innerHTML = (u ? `<img alt="" src="${u}">` : '') + `<span></span>`; d.querySelector('span').textContent = txt; $('#toasts').append(d); while ($('#toasts').children.length > 4) $('#toasts').firstChild.remove(); setTimeout(() => { d.classList.add('fue'); setTimeout(() => d.remove(), 400); }, dur * 1000); }
  subeNivel(lv, h) { this.cartel('¡Nivel ' + lv + '!', h ? 'Aprendiste: ' + h.n : 'Más vida y más daño'); if (h) this.toast(`Nueva habilidad: ${h.n}. ${h.d}`, icoHab(h.ef[0]), 5); }
  jefe(m) { const b = $('#jefeb'); if (!m) { b.hidden = true; this.jefeId = null; return; } this.jefeId = m.b; b.hidden = false; b.querySelector('b').textContent = m.n; b.querySelector('span').textContent = m.sub || ''; this.cartel(m.n, m.sub || ''); }
  caido(v) { $('#caido').hidden = !v; if (v) $('#caido').innerHTML = `<h2>Caíste</h2><p>Volvés al fogón de ${esc(REG[this.perfil.fogon || 'pampa'].pueblo.n)} y perdés un poco de plata.</p><button class="btn" id="rev">Volver al fogón</button>`, $('#rev').onclick = () => this.juego.revivir(true); }
  final() { const s = this.perfil.final === 'socio'; this.cartel(s ? 'La Salamanca quedó cerrada' : '¡Cerraste la Salamanca!', s ? 'Con vos de llavero, socio de Mandinga' : 'Las leyendas vuelven a ser cuentos de fogón'); this.toast('Volvé a Pueblo Ombú: Doña Eulogia te espera con un asado.', 'asado', 8); }
  // una escena de la historia, sin nadie que hable: lo que ves
  escena(lugar, L) { const ver = i => { const e = this.abrir('escena', `<h2>${esc(lugar)}</h2><p></p><div class="ops"><button class="btn">${i < L.length - 1 ? 'Seguir' : 'Listo'}</button></div>`, 'escena'); e.querySelector('p').textContent = L[i]; e.querySelector('.ops button').onclick = () => { audio.play('move'); if (i < L.length - 1) ver(i + 1); else this.cerrarPanel(); }; e.querySelector('.ops button').focus(); }; ver(0); }
  // charla corta con alguien que no está en la lista de gente (el que acompañás, el forastero)
  hablarCon(q, txt, boton = 'Seguir', ops) { const e = this.abrir('charla', `<div class="quien"><img alt="" src="${this.icon(q.ic)}"><div><b>${esc(q.nom)}</b><span>${esc(q.titulo || '')}</span></div></div><p class="dice"></p><div class="ops"></div>`, 'abajo ' + (q.cls || '')); e.querySelector('.dice').textContent = txt; const O = ops || [{t: boton, prim: 1}]; const box = e.querySelector('.ops'); O.forEach(o => { const b = document.createElement('button'); b.className = o.prim ? 'btn' : 'btn sec'; b.textContent = o.t; b.onclick = () => { audio.play('move'); const r = o.f?.(); if (r) this.hablarCon(q, r, 'Seguir'); else this.cerrarPanel(); }; box.append(b); }); box.querySelector('button')?.focus(); }
  // el forastero de poncho negro te ofrece un trato después de cada jefe
  forastero(reg) {
    const p = this.perfil, j = this.juego, q = {nom: reg === 'final' ? 'Mandinga' : NOMBRE_FORASTERO, ic: 'f_mandinga', titulo: reg === 'final' ? 'sin disfraz' : 'poncho negro, espuelas de plata', cls: 'forastero'}; audio.play('wail');
    if (reg === 'final') return this.hablarCon(q, `Usted me aceptó ${p.pactos} tratos, paisano. Ya es medio mío. Quédese de socio: la cueva queda cerrada igual… con usted de llavero.`, '', [
      {t: 'Quedarme de socio', f: () => { p.final = 'socio'; p.oro += 3000; this.guardar(); setTimeout(() => this.final(), 400); return 'Trato hecho. Tome, para los gastos. Nos vemos en cada cruce de caminos.'; }},
      {t: 'Romper todos los tratos', prim: 1, f: () => { p.final = 'libre'; p.oro = Math.floor(p.oro * .7); this.juego.fama(60); this.guardar(); setTimeout(() => this.final(), 400); return 'Rompió los tratos. Cuesta caro, eh: se le fue un buen pedazo de la plata. Pero usted es libre.'; }}]);
    const T = TRATOS[reg]; if (!T || p.tratos?.[reg]) return; (p.tratos ||= {});
    this.hablarCon(q, T.ofrece, '', [
      {t: 'Darle la mano', f: () => { p.tratos[reg] = 'si'; p.pactos = (p.pactos || 0) + 1; const D = T.da; if (D.oro) { p.oro += D.oro; j.num(j.yo.x, j.yo.z, '+' + D.oro + ' $', '#f2c14a', 1.1); } if (D.am) p.amuletos[D.am] = (p.amuletos[D.am] || 0) + 1; for (const [k, n] of D.it || []) p.inv[k] = (p.inv[k] || 0) + n; audio.play('jackpot'); this.guardar(); return T.si; }},
      {t: 'No hago tratos con desconocidos', prim: 1, f: () => { p.tratos[reg] = 'no'; j.fama(12); this.guardar(); return 'Se tocó el sombrero, sonrió y se fue en un remolino de polvo. Te quedó olor a azufre en la ropa.'; }}]);
  }
  seguimiento() {
    const l = this.misiones.activas().sort((a, b) => (b.hist || 0) - (a.hist || 0)).slice(0, 3);
    if (!this.track || !l.includes(MIS[this.track])) this.track = l[0]?.id || null;
    $('#seg').innerHTML = l.map(m => `<div class="${m.id === this.track ? 'on' : ''}"><b>${m.hist ? '★ ' : ''}${esc(m.n)}</b><span>${esc(this.misiones.texto(m))}</span></div>`).join('');
  }
  // ---------- cerca de alguien ----------
  cerca(c) {
    const u = $('#usar'); const k = c ? (c.tipo === 'npc' ? c.ref.id : c.tipo + (c.ref.id ?? '')) : ''; if (k === this.cercaK) return; this.cercaK = k;
    if (!c) { u.hidden = true; return; } u.hidden = false;
    const t = {npc: () => `Hablar con ${this.nombreNpc(c.ref)}`, fogon: () => 'Fogón: descansar y viajar', santuario: () => 'Prenderle una vela al Gauchito', difunta: () => 'Dejarle agua a la Difunta Correa', entierro: () => 'Cavar', apacheta: () => 'Dejar una piedra en la apacheta',
      aljibe: () => 'Tomar agua del aljibe', bagual: () => ({caballo: 'Domar al bagual', vaca: 'Jinetear la vaca', vicuna: 'Domar la vicuña'}[c.ref.k] || 'Domar'), caballo: () => `Subirte a ${this.perfil.monturas?.[c.ref.k]?.n || 'tu montura'}`, pesca: () => 'Pescar', gente: () => `Charlar con ${CHARS[c.ref.ch]?.n || 'el vecino'}`, perro: () => 'Acariciar al perro', tesoro: () => 'Cavar el entierro de la Luz Mala', carreta: () => 'Comprarle al mercachifle', mision: () => c.ref.que, escolta: () => 'Hablar con ' + c.ref.que}[c.tipo]();
    u.innerHTML = `<kbd>F</kbd><span>${esc(t)}</span>`;
  }
  nombreNpc(n) { if (n.nom) return n.nom; if (n.ch) return CHARS[n.ch].n; return {pulpero: 'el pulpero', herrero: 'el herrero', posta: 'el mercachifle'}[n.rol] || ROL[n.rol]; }
  usar(c) {
    const j = this.juego, p = this.perfil, t = j.t; audio.play('ok');
    if (c.tipo === 'npc') return this.hablar(c.ref);
    if (c.tipo === 'fogon') return this.fogon(c.ref);
    if (['bagual', 'caballo', 'gente', 'perro'].includes(c.tipo)) return j.vida.usar(c);
    if (['tesoro', 'carreta'].includes(c.tipo)) return j.eventos.usar(c);
    if (c.tipo === 'pesca') return j.pesca.empezar(c.ref);
    if (c.tipo === 'mision' || c.tipo === 'escolta') return this.misiones.usar(c);
    if (c.tipo === 'aljibe') { const k = 'aljibe' + Math.round(c.ref.x) + ',' + Math.round(c.ref.z); if ((j.lugCd[k] || -1e9) > t) { this.toast('Ya tomaste. Esperá un ratito.', 'agua', 1.5); return; } j.lugCd[k] = t + 45; j.curar(.3); audio.play('splash'); j.parts.burst(c.ref.x, 1, c.ref.z, 14, [.6, .8, 1], {sp: 3, size: .3, life: .6}); this.toast('Agua fresquita del aljibe.', 'agua', 2); return; }
    const id = c.tipo + c.ref.id; if ((j.lugCd[id] || -1e9) > t) { this.toast('Ya hiciste tu promesa acá. Volvé más tarde.', null, 2); return; }
    if (c.tipo === 'santuario') { j.lugCd[id] = t + 180; j.curar(1); j.yo.buff.santo = t + 300; this.toast('Le prendiste una vela al Gauchito Gil: +10% de daño por 5 minutos.', 'vela', 4); }
    if (c.tipo === 'difunta') { j.lugCd[id] = t + 180; j.curar(1); j.yo.buff.difunta = t + 300; this.toast('Le dejaste agua a la Difunta Correa: te curás más rápido por 5 minutos.', 'agua', 4); }
    if (c.tipo === 'apacheta') { j.lugCd[id] = t + 300; j.yo.buff.apacheta = t + 600; this.toast('Dejaste una piedra en la apacheta: +30% de suerte por 10 minutos.', 'piedra', 4); }
    if (c.tipo === 'entierro') {
      const hora = j.horaAhora(); const hoy = new Date().toDateString();
      if (!esNoche(hora ?? .5)) { this.toast('Acá hay algo enterrado… De noche, la luz mala marca el lugar.', 'gema', 3); return; }
      if ((p.entierros ||= {})[c.ref.id] === hoy) { this.toast('Este entierro ya lo cavaste hoy.', null, 2); return; }
      p.entierros[c.ref.id] = hoy; const v = 40 + p.lv * 30; p.oro += v; audio.play('jackpot'); this.toast(`¡Un entierro! ${v} patacones.`, 'plata', 4);
      if (Math.random() < .3) { const ks = Object.keys(AMULETOS), a = ks[Math.random() * ks.length | 0]; p.amuletos[a] = (p.amuletos[a] || 0) + 1; this.toast(`Y adentro había: ${AMULETOS[a].n}`, AMULETOS[a].ic, 4); }
      this.guardar();
    }
  }
  // ---------- paneles ----------
  abrir(id, html, cls = '') { this.cerrarPanel(); if (document.pointerLockElement) document.exitPointerLock?.(); const d = document.createElement('div'); d.className = 'modal ' + cls; d.id = id; d.innerHTML = `<div class="caja">${html}<button class="x" aria-label="Cerrar">✕</button></div>`; $('#ui').append(d); d.querySelector('.x').onclick = () => this.cerrarPanel(); d.onclick = e => { if (e.target === d) this.cerrarPanel(); }; this.panel = d; if (this.red.modo === 'solo') this.red.pausa = true; return d; }
  cerrarPanel() { if (this.panel) { this.panel.remove(); this.panel = null; } this.red.pausa = false; }
  hablar(npc) {
    const nom = this.nombreNpc(npc), ic = npc.ch ? 'h_' + npc.ch : npc.mod?.startsWith('m_') || npc.mod?.startsWith('h_') ? npc.mod : 'h_asador';
    const ver = d => {
      if (!d) return this.cerrarPanel();
      const ops = d.op || [{t: 'Seguir', f: () => this.misiones.charla(npc)}];
      const e = this.abrir('charla', `<div class="quien"><img alt="" src="${this.icon(ic)}"><div><b>${esc(nom.replace(/^el /, 'El '))}</b><span>${esc(npc.titulo || (ROL[npc.rol] + ' de ' + REG[npc.reg].pueblo.n))}</span></div></div><p class="dice"></p><div class="ops">${ops.map((o, i) => `<button class="${o.prim ? 'btn' : 'btn sec'}" data-i="${i}"></button>`).join('')}</div>`, 'abajo');
      e.querySelector('.dice').textContent = d.txt; e.querySelectorAll('.ops button').forEach((b, i) => { b.textContent = ops[i].t; });
      e.querySelector('.ops').onclick = ev => { const b = ev.target.closest('button'); if (!b) return; audio.play('move'); const o = ops[+b.dataset.i]; if (!o.f) return this.cerrarPanel(); const r = o.f(); if (r === null) { if (this.panel?.id === 'charla') this.cerrarPanel(); return; } ver(r || null); };
      e.querySelector('.ops button')?.focus();
    };
    ver(this.misiones.charla(npc));
  }
  fogon(pu) {
    const p = this.perfil, j = this.juego; p.fogon = pu.id;
    const dest = PUEBLOS.filter(o => o.id !== pu.id && p.pueblos[o.id]); const costo = o => Math.round(Math.hypot(o.x - pu.x, o.z - pu.z) / 12);
    const e = this.abrir('fogon', `<h2>Fogón de ${esc(pu.n)}</h2><p>Descansar te cura del todo y guarda la partida. Desde acá un chasqui te lleva a los pueblos que ya conocés.</p>
      <button class="btn" data-a="des">Descansar</button><h3>Viajar</h3><div class="lst">${dest.length ? dest.map(o => `<button class="fila2" data-v="${o.id}"><b>${esc(o.n)}</b><span>${REG[o.id].n} · ${costo(o)} $</span></button>`).join('') : '<p class="tip">Todavía no conocés otros pueblos. Seguí los caminos.</p>'}</div>`);
    e.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.a) { j.curar(1); this.guardar(); this.toast('Descansaste junto al fogón. Partida guardada.', 'brasa', 2.5); audio.play('heal'); this.cerrarPanel(); }
      if (b.dataset.v) { const o = PUEBLOS.find(x => x.id === b.dataset.v), c = costo(o); if (p.oro < c) { this.toast('No te alcanza la plata.', 'plata', 2); return; } p.oro -= c; j.yo.x = o.x + 2; j.yo.z = o.z + 5; j.cam.x = j.yo.x; j.cam.z = j.yo.z; j.yo.inv = j.t + 2; j.enviar(true); this.cerrarPanel(); this.toast('Llegaste a ' + o.n, 'brasa', 2.5); audio.play('whistle'); this.guardar(); } };
  }
  tienda(tipo, stock) {
    const p = this.perfil, j = this.juego, w = WEAPONS[CHARS[p.ch].w]?.n || 'Arma', precio = v => Math.round(v * (1 - descuento(p)));
    const pint = () => {
      let h = '';
      if (tipo === 'carreta') h = `<h2>La carreta del mercachifle</h2><p class="tip">Tenés ${p.oro} $. Lo que trae hoy, mañana quién sabe.</p><div class="lst">${stock.am.map(o => `<div class="fila2"><img alt="" src="${this.icon(AMULETOS[o.k].ic)}"><div><b>${AMULETOS[o.k].n}</b><span>${AMULETOS[o.k].d}${p.amuletos[o.k] ? ` Tenés ${p.amuletos[o.k]}.` : ''}</span></div><button class="btn" data-ca="${o.k}" data-p="${precio(o.precio)}">${precio(o.precio)} $</button></div>`).join('')}${stock.it.map(o => `<div class="fila2"><img alt="" src="${this.icon(OBJETOS[o.k].ic)}"><div><b>${OBJETOS[o.k].n}</b><span>${OBJETOS[o.k].d} Tenés ${p.inv[o.k] || 0}.</span></div><button class="btn" data-ci="${o.k}" data-p="${precio(o.precio)}">${precio(o.precio)} $</button></div>`).join('')}</div>`;
      if (tipo === 'pulperia') h = `<h2>Pulpería</h2><p class="tip">Tenés ${p.oro} $.${descuento(p) ? ` Por ser ${titulo(p)} te hacen ${Math.round(descuento(p) * 100)}% de descuento.` : ''}</p><div class="lst">${['mate', 'asado', 'cana'].map(k => `<div class="fila2"><img alt="" src="${this.icon(OBJETOS[k].ic)}"><div><b>${OBJETOS[k].n}</b><span>${OBJETOS[k].d} Tenés ${p.inv[k] || 0}.</span></div><button class="btn" data-c="${k}">${precio(OBJETOS[k].precio)} $</button></div>`).join('')}</div>`;
      if (tipo === 'herreria') { const fila = (k, n, g) => { if (g >= 6) return `<div class="fila2"><div><b>${n} ${GRADOS[g - 1]}</b><span>Ya está al máximo.</span></div></div>`; const c = costoMejora(g); const ok = p.oro >= c.oro && (p.inv.retazo || 0) >= c.retazos && p.lv >= c.nivel; return `<div class="fila2"><div><b>${n}: ${GRADOS[g - 1]} → ${GRADOS[g]}</b><span>${c.oro} $ y ${c.retazos} retazos de leyenda${p.lv < c.nivel ? ` · necesitás nivel ${c.nivel}` : ''}. Tenés ${p.inv.retazo || 0} retazos.</span></div><button class="btn" data-m="${k}" ${ok ? '' : 'disabled'}>Mejorar</button></div>`; };
        h = `<h2>Herrería</h2><p class="tip">Tenés ${p.oro} $. Cada mejora del arma suma 30% de daño; la del poncho, vida y aguante.</p><div class="lst">${fila('arma', w, p.arma)}${fila('poncho', 'Poncho', p.poncho)}</div>`; }
      if (tipo === 'mercachifle') { const ks = Object.keys(p.amuletos).filter(k => p.amuletos[k] > (p.amuleto === k ? 1 : 0)); h = `<h2>Mercachifle</h2><p class="tip">Te compro los amuletos que te sobran a 80 $ cada uno.</p><div class="lst">${ks.length ? ks.map(k => `<div class="fila2"><img alt="" src="${this.icon(AMULETOS[k].ic)}"><div><b>${AMULETOS[k].n} ×${p.amuletos[k]}</b><span>${AMULETOS[k].d}</span></div><button class="btn" data-v="${k}">Vender</button></div>`).join('') : '<p class="tip">No tenés amuletos para vender.</p>'}</div>`; }
      const e = this.abrir('tienda', h);
      e.onclick = ev => { const b = ev.target.closest('button'); if (!b || b.disabled) return;
        if (b.dataset.ca || b.dataset.ci) { const pr = +b.dataset.p; if (p.oro < pr) { this.toast('No te alcanza.', 'plata', 1.5); return; } p.oro -= pr; if (b.dataset.ca) { p.amuletos[b.dataset.ca] = (p.amuletos[b.dataset.ca] || 0) + 1; audio.play('gem'); } else { p.inv[b.dataset.ci] = (p.inv[b.dataset.ci] || 0) + 1; audio.play('coin'); } this.misiones.alEvento('carreta'); this.guardar(); pint(); return; }
        if (b.dataset.c) { const o = OBJETOS[b.dataset.c], pr = precio(o.precio); if (p.oro < pr) { this.toast('No te alcanza.', 'plata', 1.5); return; } p.oro -= pr; p.inv[b.dataset.c] = (p.inv[b.dataset.c] || 0) + 1; audio.play('coin'); this.guardar(); pint(); }
        if (b.dataset.m) { const k = b.dataset.m, c = costoMejora(p[k]); p.oro -= c.oro; p.inv.retazo -= c.retazos; p[k]++; audio.play('evo'); this.toast(`${k === 'arma' ? w : 'Poncho'} ${GRADOS[p[k] - 1]}`, k === 'arma' ? icoHab(KITS[p.ch].basico) : 'poncho', 3); j.yo.hp = Math.min(j.yo.hp, j.stats().vida); this.guardar(); pint(); }
        if (b.dataset.v) { const k = b.dataset.v; p.amuletos[k]--; if (!p.amuletos[k]) delete p.amuletos[k]; p.oro += 80; audio.play('coin'); this.guardar(); pint(); } };
    };
    pint();
  }
  inventario() {
    const p = this.perfil, j = this.juego, s = j.stats(), K = KITS[p.ch], w = WEAPONS[CHARS[p.ch].w]?.n || 'Arma';
    const e = this.abrir('inv', `<h2>${esc(p.nombre)} <small>${CHARS[p.ch].t} · nivel ${p.lv}</small></h2>
      <div class="dos"><div><h3>Equipo</h3><div class="lst"><div class="fila2"><img alt="" src="${this.icon(icoHab(K.basico))}"><div><b>${w}</b><span>${GRADOS[p.arma - 1]}</span></div></div><div class="fila2"><img alt="" src="${this.icon('poncho')}"><div><b>Poncho</b><span>${GRADOS[p.poncho - 1]}</span></div></div></div>
        <h3>Amuleto</h3><div class="lst">${Object.keys(p.amuletos).length ? Object.keys(p.amuletos).map(k => `<button class="fila2 ${p.amuleto === k ? 'on' : ''}" data-a="${k}"><img alt="" src="${this.icon(AMULETOS[k].ic)}"><div><b>${AMULETOS[k].n}${p.amuletos[k] > 1 ? ' ×' + p.amuletos[k] : ''}</b><span>${AMULETOS[k].d}${p.amuleto === k ? ' · Puesto' : ''}</span></div></button>`).join('') : '<p class="tip">Los amuletos salen de campeones, jefes y entierros.</p>'}</div></div>
      <div><h3>Bolsa</h3><div class="lst">${['mate', 'asado', 'cana', 'pescado', 'retazo'].map(k => `<div class="fila2"><img alt="" src="${this.icon(OBJETOS[k].ic)}"><div><b>${OBJETOS[k].n} ×${p.inv[k] || 0}</b><span>${OBJETOS[k].d}</span></div>${OBJETOS[k].usa && p.inv[k] > 0 ? `<button class="btn" data-u="${k}">Usar</button>` : ''}</div>`).join('')}</div>
        <p class="st">${p.oro} $ · Vida ${Math.round(s.vida)} · Daño ${Math.round(s.dmg)} · Aguante ${Math.round(s.arm * 100)}% · Crítico ${Math.round(s.crit * 100)}% · Velocidad ${s.vel.toFixed(1)}</p>
        <h3>Reliquias</h3><div class="reliq">${RELIQUIAS.map(r => `<span class="${p.reliq[r] ? 'si' : ''}" title="${p.reliq[r] ? RELIQ[r].n : REG[r].n}"><img alt="" src="${this.icon(RELIQ[r].ic)}"></span>`).join('')}</div></div></div>`, 'ancho');
    e.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.a) { p.amuleto = p.amuleto === b.dataset.a ? null : b.dataset.a; audio.play('ok'); this.guardar(); this.inventario(); } if (b.dataset.u) { j.usar(b.dataset.u); this.inventario(); } };
  }
  // ---------- progreso: mañas, monturas y logros ----------
  progreso(tab = this.tabProg || 'manas') {
    this.tabProg = tab; const p = this.perfil, j = this.juego, libres = manasLibres(p), G = manasGanadas(p), olvido = 50 * p.lv;
    const tabs = `<div class="tabs">${[['manas', 'Mañas' + (libres > 0 ? ` (${libres})` : '')], ['mont', 'Monturas'], ['logros', 'Logros']].map(([k, n]) => `<button class="btn ${k === tab ? '' : 'sec'}" data-tab="${k}">${n}</button>`).join('')}</div>`;
    let h = '';
    if (tab === 'manas') h = `<p class="tip">${libres > 0 ? `Tenés <b>${libres}</b> ${libres === 1 ? 'maña' : 'mañas'} para aprender.` : 'No tenés mañas para aprender.'} Se ganan subiendo de nivel (${G.nivel}), con la fama (${G.fama}), explorando el mapa (${G.expl}), volteando diez de cada leyenda (${G.best}) y pescando (${G.pesca}).</p>
      <div class="ramas">${RAMAS.map(R => `<div class="rama"><h3>${R.n} <small>${R.d}</small></h3>${Object.entries(R.t).map(([k, t]) => { const r = p.manas?.[k] || 0; return `<div class="tal"><b>${t.n}</b><span>${r ? t.d(r) : 'Todavía no la sabés'}${r < MAX_RANGO ? ' → ' + t.d(r + 1) : ' (al máximo)'}</span><span class="pips">${'●'.repeat(r)}${'○'.repeat(MAX_RANGO - r)}</span><button class="btn" data-m="${k}" aria-label="Aprender ${t.n}" ${libres > 0 && r < MAX_RANGO ? '' : 'disabled'}>+</button></div>`; }).join('')}</div>`).join('')}</div>
      ${manasGastadas(p) ? `<p class="tip">¿Te arrepentiste? <button class="btn sec" data-olvidar="1">Olvidar todas por ${olvido} $</button></p>` : ''}`;
    if (tab === 'mont') h = `<p class="tip">Con G llamás a la que elegiste y te subís o te bajás. Arriba de la montura, Espacio usa su habilidad.</p>${ORDEN_M.map(k => { const M = MONTURAS[k], t = p.monturas?.[k]; return `<div class="mont ${t ? '' : 'no'} ${t && p.montura === k ? 'on' : ''}"><img alt="" src="${this.icon(M.ic)}"><b>${t ? esc(t.n) + (t.n !== M.n ? ` <small>· ${M.n}</small>` : '') : M.n}</b><span>${t ? `Velocidad ×${M.vel}. ${esc(M.hab)}.` : '🔒 ' + esc(M.como) + '.'}</span>${t ? `<button class="btn ${p.montura === k ? 'sec' : ''}" data-mo="${k}" ${p.montura === k ? 'disabled' : ''}>${p.montura === k ? 'Elegida' : 'Elegir'}</button>` : ''}</div>`; }).join('')}`;
    if (tab === 'logros') {
      const r = rangoFama(p.fama), sig = TITULOS[r + 1], pc = j.vistoB ? explorado(j.vistoB) : 0, hs = HITOS_EXPLORA.find(v => v > pc), especies = Object.keys(p.bestiario || {}), diez = especies.filter(k => p.bestiario[k] >= 10), peces = Object.keys(p.pesca || {}), mont = Object.keys(p.monturas || {}).length, mis = Object.values(p.mis || {}).filter(m => m.e === 'hecha').length;
      const fila = (a, b) => `<div class="logro"><b>${a}</b><span>${b}</span></div>`;
      h = fila(`Título: ${TITULOS[r][1]}`, `${p.fama || 0} de fama${sig ? ` · ${sig[1]} con ${sig[0]}` : ' · ¡el máximo!'}`)
        + fila(`Exploración: ${Math.floor(pc)}%`, hs ? `próxima maña al ${hs}%` : 'recorriste todo')
        + fila(`Bestiario: ${especies.length} leyendas`, `${diez.length} con diez o más (una maña cada una)`)
        + fila(`Pesca: ${peces.length} de ${TODOS_PECES.length} peces`, peces.length ? esc(peces.join(', ')) : 'Buscá un río o una laguna y apretá F en la orilla')
        + fila(`Monturas: ${mont} de ${ORDEN_M.length}`, mont ? ORDEN_M.filter(k => p.monturas[k]).map(k => esc(p.monturas[k].n)).join(', ') : 'Domá un bagual')
        + fila(`Reliquias: ${Object.keys(p.reliq).filter(k => RELIQUIAS.includes(k)).length} de 8`, 'Una por cada jefe')
        + fila(`Misiones cumplidas: ${mis}`, `Territorios descubiertos: ${Object.keys(p.regiones || {}).length} de 9`)
        + fila(`Mañas: ${G.total} ganadas`, `${manasGastadas(p)} aprendidas`);
    }
    const e = this.abrir('prog', `<h2>Progreso <small>${esc(p.nombre)} · ${titulo(p)} · nivel ${p.lv}</small></h2>${tabs}${h}`, 'ancho');
    e.onclick = ev => { const b = ev.target.closest('button'); if (!b || b.disabled) return;
      if (b.dataset.tab) { audio.play('move'); return this.progreso(b.dataset.tab); }
      if (b.dataset.m) { if (manasLibres(p) <= 0) return; (p.manas ||= {})[b.dataset.m] = (p.manas[b.dataset.m] || 0) + 1; audio.play('evo'); j.yo.hp = Math.min(j.yo.hp, j.stats().vida); this.guardar(); return this.progreso('manas'); }
      if (b.dataset.olvidar) { if (p.oro < olvido) { this.toast('No te alcanza la plata.', 'plata', 2); return; } p.oro -= olvido; p.manas = {}; audio.play('back'); j.yo.hp = Math.min(j.yo.hp, j.stats().vida); this.guardar(); return this.progreso('manas'); }
      if (b.dataset.mo) { const k = b.dataset.mo, iba = j.yo.montado === true; if (iba) j.yo.montado = false; j.vida.mio = null; p.montura = k; if (iba) j.vida.montar(); audio.play('ok'); this.armarHud(); this.guardar(); return this.progreso('mont'); } };
  }
  listaMis(tab = this.tabMis || 'mis') {
    this.tabMis = tab; const tabs = `<div class="tabs">${[['mis', 'Misiones'], ['diario', 'Diario']].map(([k, n]) => `<button class="btn ${k === tab ? '' : 'sec'}" data-tab="${k}">${n}</button>`).join('')}</div>`;
    if (tab === 'diario') { const D = this.misiones.diario(); const e = this.abrir('mis', `<h2>Diario de ${esc(this.perfil.nombre)}</h2>${tabs}<div class="diario">${D.length ? D.map(c => `<h3>Capítulo ${c.c}: ${esc(c.n)}</h3>${c.L.map(t => `<p>${esc(t)}</p>`).join('')}`).join('') : '<p class="tip">Todavía no pasó nada que valga la pena contar. Hablá con Doña Eulogia en Pueblo Ombú.</p>'}</div>`, 'ancho'); e.onclick = ev => { const b = ev.target.closest('[data-tab]'); if (b) this.listaMis(b.dataset.tab); }; return; }
    const act = this.misiones.activas().sort((a, b) => (b.hist || 0) - (a.hist || 0)), hechas = Object.values(MIS).filter(m => this.perfil.mis[m.id]?.e === 'hecha');
    const e = this.abrir('mis', `<h2>Misiones</h2>${tabs}<div class="lst">${act.length ? act.map(m => `<button class="fila2 ${m.id === this.track ? 'on' : ''}" data-t="${m.id}"><div><b>${m.hist ? '★ ' : ''}${esc(m.n)}</b><span>${esc(this.misiones.texto(m))} · ${esc(this.misiones.destino(m).n)}</span></div></button>`).join('') : '<p class="tip">No tenés misiones. La gente de los pueblos con un ! tiene changas para vos.</p>'}</div>
      ${hechas.length ? `<h3>Cumplidas (${hechas.length})</h3><p class="tip">${hechas.map(m => esc(m.n)).join(' · ')}</p>` : ''}<p class="tip">Tocá una misión para seguirla: la flecha y el mapa te marcan a dónde ir.</p>`);
    e.onclick = ev => { const tb = ev.target.closest('[data-tab]'); if (tb) return this.listaMis(tb.dataset.tab); const b = ev.target.closest('[data-t]'); if (!b) return; this.track = b.dataset.t; this.seguimiento(); this.listaMis(); };
  }
  opciones() {
    const c = this.cfg, en = !!this.juego.activo;
    const e = this.abrir('op', `<h2>Opciones</h2><label class="rng">Música <input type="range" min="0" max="1" step=".05" value="${c.mus}" data-k="mus"></label><label class="rng">Sonidos <input type="range" min="0" max="1" step=".05" value="${c.sfx}" data-k="sfx"></label>
      <label class="rng">Cámara <select data-k="vista">${[['arriba', 'Desde arriba'], ['atras', 'Desde atrás'], ['fp', 'Primera persona']].map(([v, n]) => `<option value="${v}" ${(this.juego.vista || c.vista) === v ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label class="rng">Gráficos <select data-k="q">${['baja', 'media', 'alta'].map(q => `<option value="${q}" ${c.q === q ? 'selected' : ''}>${q[0].toUpperCase() + q.slice(1)}</option>`).join('')}</select></label>
      <h3>Controles</h3><p class="tip">Compu: WASD para moverte, el mouse apunta, clic ataca, Q E R habilidades, Espacio esquiva, H toma mate, F habla, G llama o baja de la montura (Espacio usa su habilidad), V cambia la cámara, P progreso (mañas, monturas y logros), M mapa, I inventario, L misiones y diario, Enter chat. En primera persona y desde atrás, hacé clic para mirar con el mouse (Esc lo suelta).<br>Celular: joystick a la izquierda y botones a la derecha; con la cámara de atrás o en primera persona, arrastrá el dedo en la mitad derecha para mirar. Joystick de consola: A ataca, X / RB / RT habilidades, B esquiva, Y habla, palanca derecha mira, apretar la izquierda llama al caballo y la derecha cambia la cámara.</p>
      ${en ? '<button class="btn sec" data-a="salir">Guardar y salir al inicio</button>' : ''}`);
    e.oninput = ev => { const k = ev.target.dataset.k; if (!k) return; if (k === 'vista') { c.vista = ev.target.value; if (this.juego.activo) this.juego.cambiarVista(c.vista); this.guardar(); return; } c[k] = k === 'q' ? ev.target.value : +ev.target.value; audio.vol.m = c.mus; audio.vol.s = c.sfx; this.guardar(); if (k === 'q') this.toast('Se aplica la próxima vez que abras el juego.', null, 3); };
    e.onclick = ev => { if (ev.target.dataset?.a === 'salir') this.salir(); };
  }
  abrirChat() { if (this.red.modo !== 'online') { this.toast('El chat es para el mundo compartido.', null, 2); return; } const ci = $('#chatin'); ci.hidden = false; ci.focus(); }
  chat(m) { const d = document.createElement('p'); const b = document.createElement('b'); b.textContent = m.n + ': '; d.append(b, document.createTextNode(m.m)); $('#chatlog').append(d); while ($('#chatlog').children.length > 6) $('#chatlog').firstChild.remove(); setTimeout(() => d.classList.add('fue'), 15000); audio.play('pick'); }
  // ---------- mapa ----------
  imgMapa() {
    const M = this.mundo, W = M.dA ? Math.round(M.uS?.x) : 0; const TW = this.mundo.u.uS.value.x / RES, TH = this.mundo.u.uS.value.y / RES; const RV = relieve(); const c = document.createElement('canvas'); c.width = TW; c.height = TH; const x = c.getContext('2d'), im = x.createImageData(TW, TH);
    for (let i = 0; i < TW * TH; i++) { const o = i * 4, a = M.dA, b = M.dB; let r = a[o], g = a[o + 1], bl = a[o + 2]; if (b[o + 3] > 30) { r = 50; g = 100; bl = 160; } else if (a[o + 3] > 110) { r = 170; g = 140; bl = 100; } const out = M.dC[o] > 200; const A = RV.ALT, w = GR.w, sh = i % w > 0 && i % w < w - 1 && i > w && i < A.length - w ? clamp(1 + (A[i - 1] - A[i + 1] + A[i - w] - A[i + w]) * .22, .55, 1.45) : 1, hk = (out ? .6 : 1) * sh * (1 + clamp(A[i], 0, 20) * .012); im.data[o] = r * hk; im.data[o + 1] = g * hk; im.data[o + 2] = bl * hk; im.data[o + 3] = 255; }
    x.putImageData(im, 0, 0); this.mapaC = c; this.mapaO = {x: this.mundo.u.uO.value.x, z: this.mundo.u.uO.value.y, k: RES};
  }
  mapa() {
    const e = this.abrir('mapa', `<h2>Mapa</h2><canvas id="mapac"></canvas><p class="tip">★ amarilla: tu misión · ★ naranja: sigue la historia · ! changas · ? para entregar · ☠ jefes · ⌂ pueblos · lo oscuro todavía no lo recorriste (${this.juego.vistoB ? Math.floor(explorado(this.juego.vistoB)) : 0}% explorado)</p>`, 'ancho');
    const cv = e.querySelector('#mapac'), j = this.juego, p = this.perfil, O = this.mapaO; const W = Math.min(innerWidth - 60, 900), H = Math.min(innerHeight - 190, W * 1.25); const k = Math.min(W / this.mapaC.width, H / this.mapaC.height);
    cv.width = this.mapaC.width * k * devicePixelRatio; cv.height = this.mapaC.height * k * devicePixelRatio; cv.style.width = this.mapaC.width * k + 'px'; cv.style.height = this.mapaC.height * k + 'px';
    const x = cv.getContext('2d'), S = k * devicePixelRatio / O.k, P = (wx, wz) => [(wx - O.x) * S, (wz - O.z) * S]; x.imageSmoothingEnabled = true; x.drawImage(this.mapaC, 0, 0, cv.width, cv.height);
    const vb = j.vistoB; if (vb) { const E = EXPLORA; x.fillStyle = 'rgba(14,8,22,.74)'; for (let jj = 0; jj < E.FILAS; jj++) for (let ii = 0; ii < E.COLS; ii++) { if (visto(vb, jj * E.COLS + ii)) continue; const [a, b] = P(E.X0 + ii * E.CX, E.Z0 + jj * E.CX), [c, d] = P(E.X0 + (ii + 1) * E.CX, E.Z0 + (jj + 1) * E.CX); x.fillRect(Math.round(a), Math.round(b), Math.round(c) - Math.round(a), Math.round(d) - Math.round(b)); } }
    x.font = `${13 * devicePixelRatio}px "Alegreya Sans",sans-serif`; x.textAlign = 'center';
    for (const r of ORDEN) { const [a, b] = P(...REG[r].c); x.fillStyle = 'rgba(20,10,20,.55)'; x.fillText(REG[r].n, a + 1, b + 1 - 14 * devicePixelRatio); x.fillStyle = '#f3e6c8'; x.fillText(REG[r].n, a, b - 14 * devicePixelRatio); }
    x.font = `italic ${11 * devicePixelRatio}px "Alegreya Sans",sans-serif`; for (const pj of PARAJES) { if (!p.parajes?.[pj.id] || PUEBLOS.some(q => q.n === pj.n) || GUARIDAS.some(g => g.n === pj.n)) continue; const [a, b] = P(pj.x, pj.z); x.fillStyle = 'rgba(20,10,20,.5)'; x.fillText(pj.n, a + 1, b + 1); x.fillStyle = '#e8dcc0'; x.fillText(pj.n, a, b); }
    for (const n of j.npcs) { const mk = n.rol === 'pulpero' || n.rol === 'herrero' || n.rol === 'posta' ? '' : this.misiones.marca(n); if (!mk) continue; const [a, b] = P(n.x, n.z); x.font = `800 ${15 * devicePixelRatio}px sans-serif`; x.fillStyle = mk === '?' ? '#5fd68a' : mk === '★' ? '#ff9a2a' : '#f2b33d'; x.fillText(mk, a, b - 8 * devicePixelRatio); }
    x.font = `${13 * devicePixelRatio}px "Alegreya Sans",sans-serif`;
    for (const g of GUARIDAS) { const [a, b] = P(g.x, g.z); x.fillStyle = p.reliq[g.reg] || (g.reg === 'salamanca' && p.fin) ? '#7d7' : '#ff5a4a'; x.fillText('☠', a, b + 5); }
    for (const pu of PUEBLOS) { const [a, b] = P(pu.x, pu.z); x.fillStyle = p.pueblos[pu.id] ? '#fff' : '#bba'; x.fillText('⌂ ' + (p.pueblos[pu.id] ? pu.n : '?'), a, b + 5); }
    const m = this.track && MIS[this.track]; if (m) { const d = this.misiones.destino(m), [a, b] = P(d.x, d.z); x.fillStyle = '#ffd23a'; x.font = `${20 * devicePixelRatio}px sans-serif`; x.fillText('★', a, b + 7); }
    for (const o of j.lista || []) { if (o[0] === this.red.yo) continue; const [a, b] = P(o[4], o[5]); x.fillStyle = '#8ec5e8'; x.beginPath(); x.arc(a, b, 4 * devicePixelRatio, 0, 7); x.fill(); }
    const [a, b] = P(j.yo.x, j.yo.z); x.fillStyle = '#e8453c'; x.strokeStyle = '#fff'; x.lineWidth = 2 * devicePixelRatio; x.beginPath(); x.arc(a, b, 6 * devicePixelRatio, 0, 7); x.fill(); x.stroke();
  }
  pesca(txt, st) { const d = $('#pesca'); d.hidden = !txt; if (!txt) return; d.querySelector('small').textContent = txt; d.classList.toggle('tira', !!st); if (st) { const z = d.querySelector('.zona'); z.style.left = (st.zona - st.half) * 100 + '%'; z.style.width = st.half * 200 + '%'; d.querySelector('.pez').style.left = st.pos * 100 + '%'; d.querySelector('.tiempo i').style.width = clamp(st.prog, 0, 1) * 100 + '%'; } }
  doma(on, eq = 0, k = 0, mk) { const d = $('#doma'); d.hidden = !on; if (!on) return; d.querySelector('b').textContent = {toro: '¡Aguantá al toro!', vicuna: '¡Aguantá a la vicuña!'}[mk] || '¡Aguantá al bagual!'; d.querySelector('.eq i').style.left = (50 + clamp(eq, -1, 1) * 48) + '%'; d.querySelector('.tiempo i').style.width = k * 100 + '%'; }
  // ---------- capa 2D: barras, nombres y números ----------
  dibujarOv(dt, camera) {
    const W = innerWidth, H = innerHeight, dpr = Math.min(2, devicePixelRatio || 1), cv = this.ov; if (cv.width !== W * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
    const x = this.cx; x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H); const j = this.juego; if (!j.activo) return;
    const v = new THREE.Vector3(), P = (wx, wy, wz) => { v.set(wx, wy + alto(wx, wz), wz).project(camera); return v.z < 1 && v.z > -1 ? [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H] : null; };
    const barra = (a, b, w, k, col) => { x.fillStyle = 'rgba(10,5,12,.75)'; x.fillRect(a - w / 2 - 1, b - 1, w + 2, 6); x.fillStyle = col; x.fillRect(a - w / 2, b, w * Math.max(0, k), 4); };
    x.textAlign = 'center'; x.font = '600 13px "Alegreya Sans",sans-serif';
    for (const bc of j.bichos.values()) {
      if (bc.die || bc.id === this.jefeId) continue; const show = bc.hp < 1 || bc.camp || bc.mostrar > j.t; if (!show) continue; const p = P(bc.x, bc.r * 2 + (bc.fly ? 2 : 1.6) * bc.s, bc.z); if (!p) continue;
      const dif = (bc.lv || 1) - this.perfil.lv; barra(p[0], p[1], bc.camp ? 64 : 40, bc.hp, bc.camp ? '#f2b33d' : '#e8453c');
      x.fillStyle = dif >= 4 ? '#ff6a5a' : dif <= -4 ? '#aaa' : '#f3e6c8'; x.fillText((bc.n ? bc.n + ' · ' : '') + 'Nv ' + bc.lv, p[0], p[1] - 4);
    }
    for (const o of j.otros.values()) { const p = P(o.x, 2.9, o.z); if (!p) continue; barra(p[0], p[1], 44, o.hp, '#5fd68a'); x.fillStyle = '#8ec5e8'; x.fillText(`${o.n} · ${o.lv}`, p[0], p[1] - 4); }
    for (const n of j.npcs) { if (Math.abs(n.x - j.yo.x) > 44 || Math.abs(n.z - j.yo.z) > 48) continue; const p = P(n.x, 2.7 * (n.s || 1), n.z); if (!p) continue; const mk = n.rol === 'pulpero' || n.rol === 'herrero' || n.rol === 'posta' ? '' : this.misiones.marca(n);
      if (Math.abs(n.x - j.yo.x) < 26 && Math.abs(n.z - j.yo.z) < 30) { x.fillStyle = '#f3e6c8'; x.fillText(this.nombreNpc(n), p[0], p[1]); }
      if (mk) { x.font = '800 28px "Grenze Gotisch",serif'; x.lineWidth = 4; x.strokeStyle = 'rgba(20,8,10,.85)'; const yy = p[1] - 18 + Math.sin(j.t * 3 + n.x) * 3; x.strokeText(mk, p[0], yy); x.fillStyle = mk === '?' ? '#5fd68a' : mk === '★' ? '#ff9a2a' : '#f2b33d'; x.fillText(mk, p[0], yy); x.font = '600 13px "Alegreya Sans",sans-serif'; } }
    // globitos: lo que dice la gente al pasar
    x.font = '600 13px "Alegreya Sans",sans-serif';
    for (const b of j.burbujas) { const o = b.o, p = P(o.x, 2.95 * (o.s || 1) + (o.T?.mont ? .75 : 0), o.z); if (!p) continue; const al = Math.min(1, b.t * 5, (b.dur - b.t) * 2); if (al <= 0) continue;
      const pal = String(b.txt).split(' '), L = []; let l = ''; for (const w of pal) { const t2 = l ? l + ' ' + w : w; if (x.measureText(t2).width > 190 && l) { L.push(l); l = w; } else l = t2; } L.push(l);
      const w = Math.max(...L.map(s => x.measureText(s).width)) + 16, h = L.length * 16 + 10, bx = p[0] - w / 2, by = p[1] - h - 14; x.globalAlpha = al; x.fillStyle = 'rgba(250,244,230,.94)'; x.beginPath(); x.roundRect?.(bx, by, w, h, 8); if (!x.roundRect) x.rect(bx, by, w, h); x.fill(); x.beginPath(); x.moveTo(p[0] - 6, by + h); x.lineTo(p[0], by + h + 8); x.lineTo(p[0] + 6, by + h); x.fill();
      x.fillStyle = '#2a1a12'; L.forEach((s, i) => x.fillText(s, p[0], by + 18 + i * 16)); x.globalAlpha = 1; }
    // el que acompañás
    const es = this.misiones.esc; if (es && !es.llego) { const mm = MIS[es.m], p = P(es.x, 2.3 * (mm?.obj.esc || 1), es.z); if (p && mm) { x.fillStyle = '#8ef0a8'; x.fillText(mm.obj.nombre, p[0], p[1]); } }
    // cartel del camino
    const ct = j.ambiente.cartel(); if (ct) { const p = P(ct.k.x, 3.2, ct.k.z); if (p) { x.font = '700 15px "Alegreya Sans",sans-serif'; const w = Math.max(x.measureText(ct.txt).width, x.measureText(ct.sub).width) + 20; x.fillStyle = 'rgba(60,38,20,.9)'; x.fillRect(p[0] - w / 2, p[1] - 40, w, 44); x.strokeStyle = '#c8a06a'; x.lineWidth = 2; x.strokeRect(p[0] - w / 2, p[1] - 40, w, 44); x.fillStyle = '#f7e6c4'; x.fillText(ct.txt, p[0], p[1] - 22); x.font = '600 13px "Alegreya Sans",sans-serif'; x.fillStyle = '#e8cc98'; x.fillText(ct.sub, p[0], p[1] - 6); } }
    x.font = '600 13px "Alegreya Sans",sans-serif';
    // números
    for (let i = j.nums.length - 1; i >= 0; i--) { const n = j.nums[i]; n.t += dt; if (n.t > 1) { j.nums.splice(i, 1); continue; } const p = P(n.x, n.y + n.t * 1.6, n.z); if (!p) continue; x.globalAlpha = 1 - Math.max(0, n.t - .6) / .4; x.font = `800 ${Math.round(18 * n.s)}px "Alegreya Sans",sans-serif`; x.lineWidth = 3; x.strokeStyle = 'rgba(0,0,0,.7)'; x.strokeText(n.txt, p[0], p[1]); x.fillStyle = n.col; x.fillText(n.txt, p[0], p[1]); }
    x.globalAlpha = 1;
    // con la cámara de atrás o en primera persona: una mira en el medio y flechas arriba
    const fp = j.vista !== 'arriba';
    if (fp && j.yo.vivo) { x.strokeStyle = 'rgba(255,240,210,.85)'; x.lineWidth = 2; x.beginPath(); x.arc(W / 2, H / 2, 7, 0, 7); x.moveTo(W / 2 - 14, H / 2); x.lineTo(W / 2 - 9, H / 2); x.moveTo(W / 2 + 9, H / 2); x.lineTo(W / 2 + 14, H / 2); x.stroke(); }
    const flechaArriba = (d, col, i) => { const dx = d.x - j.yo.x, dz = d.z - j.yo.z, L = Math.hypot(dx, dz); if (L < 12) return; const a = Math.atan2(dx, dz) - j.cam.yaw, rel = -Math.atan2(Math.sin(a), Math.cos(a)), cx = W / 2 + clamp(rel / 1.2, -1, 1) * Math.min(W * .4, 260), cy = 96 + i * 40; x.save(); x.translate(cx, cy); x.rotate(Math.abs(rel) > 1.2 ? Math.sign(rel) * Math.PI / 2 : 0); x.fillStyle = col; x.beginPath(); x.moveTo(0, -12); x.lineTo(-8, 6); x.lineTo(0, 2); x.lineTo(8, 6); x.fill(); x.restore(); x.fillStyle = col; x.font = '700 12px "Alegreya Sans",sans-serif'; x.fillText((d.n ? d.n + ' · ' : '') + Math.round(L) + ' m', cx, cy + 22); };
    const ev = j.eventos.objetivo(); const evb = $('#evb'), bt = j.eventos.banner(); if (evb.textContent !== bt) evb.textContent = bt; evb.hidden = !bt;
    if (ev && j.yo.vivo) { if (fp) flechaArriba(ev, '#8ec5e8', 1); else { const dx = ev.x - j.yo.x, dz = ev.z - j.yo.z, L = Math.hypot(dx, dz); if (L > 10) { const a = Math.atan2(dx, dz), c = P(j.yo.x + Math.sin(a) * 2.4, .2, j.yo.z + Math.cos(a) * 2.4), c0 = P(j.yo.x, .2, j.yo.z); if (c && c0) { const an = Math.atan2(c[1] - c0[1], c[0] - c0[0]); x.save(); x.translate(c[0], c[1]); x.rotate(an); x.fillStyle = 'rgba(142,197,232,.9)'; x.beginPath(); x.moveTo(10, 0); x.lineTo(-5, -7); x.lineTo(-2, 0); x.lineTo(-5, 7); x.fill(); x.restore(); x.fillStyle = '#8ec5e8'; x.font = '700 12px "Alegreya Sans",sans-serif'; x.fillText(ev.n + ' · ' + Math.round(L) + ' m', c[0], c[1] + 18); } } } }
    // flecha hacia la misión
    const m = this.track && MIS[this.track]; if (m && j.yo.vivo && fp) flechaArriba(this.misiones.destino(m), '#ffd23a', 0);
    if (m && j.yo.vivo && !fp) { const d = this.misiones.destino(m), dx = d.x - j.yo.x, dz = d.z - j.yo.z, L = Math.hypot(dx, dz); if (L > 18) { const a = Math.atan2(dx, dz), c = P(j.yo.x + Math.sin(a) * 3, .2, j.yo.z + Math.cos(a) * 3), c0 = P(j.yo.x, .2, j.yo.z); if (c && c0) { const ang = Math.atan2(c[1] - c0[1], c[0] - c0[0]); x.save(); x.translate(c[0], c[1]); x.rotate(ang); x.fillStyle = 'rgba(255,210,58,.9)'; x.beginPath(); x.moveTo(12, 0); x.lineTo(-6, -8); x.lineTo(-2, 0); x.lineTo(-6, 8); x.fill(); x.restore(); x.fillStyle = '#ffd23a'; x.font = '700 12px "Alegreya Sans",sans-serif'; x.fillText(Math.round(L) + ' m', c[0], c[1] + 20); } } }
    // jefe
    if (this.jefeId) { const b = j.bichos.get(this.jefeId); $('#jefeb i').style.width = (b ? b.hp * 100 : 0) + '%'; }
    this.minimapa();
  }
  minimapa() {
    const c = this.mcx, cv = this.mini, j = this.juego, O = this.mapaO, S = cv.width, R = 70; const y = j.yo;
    c.clearRect(0, 0, S, S); c.save(); c.beginPath(); c.arc(S / 2, S / 2, S / 2 - 2, 0, 7); c.clip();
    c.drawImage(this.mapaC, (y.x - R - O.x) / O.k, (y.z - R - O.z) / O.k, R * 2 / O.k, R * 2 / O.k, 0, 0, S, S);
    const k = S / (R * 2), P = (wx, wz) => [(wx - y.x) * k + S / 2, (wz - y.z) * k + S / 2];
    for (const b of j.bichos.values()) { if (b.die) continue; const [a, d] = P(b.x, b.z); c.fillStyle = b.jefe ? '#ff2a1a' : b.camp ? '#f2b33d' : '#e8453c'; c.fillRect(a - (b.jefe ? 3 : 1.5), d - (b.jefe ? 3 : 1.5), b.jefe ? 6 : 3, b.jefe ? 6 : 3); }
    for (const n of j.npcs) { const [a, d] = P(n.x, n.z); if (a < 0 || a > S || d < 0 || d > S) continue; const mk = n.rol === 'pulpero' || n.rol === 'herrero' || n.rol === 'posta' ? '' : this.misiones.marca(n); if (mk) { c.font = '800 13px sans-serif'; c.textAlign = 'center'; c.fillStyle = mk === '?' ? '#5fd68a' : mk === '★' ? '#ff9a2a' : '#f2b33d'; c.fillText(mk, a, d + 4); } else { c.fillStyle = '#f2e6c8'; c.fillRect(a - 1.5, d - 1.5, 3, 3); } }
    { const m = this.track && MIS[this.track]; if (m) { const q = this.misiones.destino(m); let [a, d] = P(q.x, q.z); const dx = a - S / 2, dz = d - S / 2, L = Math.hypot(dx, dz), R2 = S / 2 - 8; if (L > R2) { a = S / 2 + dx / L * R2; d = S / 2 + dz / L * R2; } c.font = '800 14px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#ffd23a'; c.fillText('★', a, d + 5); } }
    for (const o of j.otros.values()) { const [a, d] = P(o.x, o.z); c.fillStyle = '#8ec5e8'; c.beginPath(); c.arc(a, d, 3, 0, 7); c.fill(); }
    c.fillStyle = '#fff'; c.strokeStyle = '#e8453c'; c.lineWidth = 2; c.beginPath(); c.arc(S / 2, S / 2, 4, 0, 7); c.fill(); c.stroke(); c.restore();
  }
}
