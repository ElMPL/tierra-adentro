// Conexión con el mundo: el compartido por internet (Firebase, o un servidor propio) o el mismo mundo corriendo en esta pantalla para jugar solo.
import {Mundo} from '../shared/sim.js';
import {Nube, baseFirebase, basePrueba, saludNube} from './nube.js';

// Dirección de la base de datos de Firebase (Realtime Database) donde vive el mundo compartido.
export const FIREBASE = '';
// Dirección de un servidor propio (server/server.js), si algún día se usa en vez de Firebase.
export const SERVIDOR = '';
export function direccion() {
  const h = location.hostname;
  // abierto desde el propio servidor o en la compu para probar: se conecta ahí mismo
  if (location.protocol.startsWith('http') && (/^(localhost|127\.|192\.168\.|10\.)/.test(h) || h.endsWith('.onrender.com'))) return (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws';
  return SERVIDOR;
}
// por dónde va el mundo compartido: 'nube' (Firebase), 'prueba' (varias pestañas de la compu, con ?prueba), 'ws' (servidor propio) o '' (no hay)
export function via() {
  if (window.TA_SOLO) return '';
  const q = location.search;
  if (/[?&]prueba\b/.test(q)) return 'prueba';
  if (FIREBASE && !/[?&]ws\b/.test(q)) return 'nube';
  return direccion() ? 'ws' : '';
}
const httpDe = ws => ws.replace(/^ws/, 'http').replace(/\/ws$/, '');
const plazo = (p, ms) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error('tarde')), ms))]);
let baseP = null;
function base() {
  if (!baseP) { baseP = via() === 'prueba' ? basePrueba() : baseFirebase(FIREBASE); baseP.catch(() => { baseP = null; }); }
  return baseP;
}

export class Red {
  constructor() { this.cola = []; this.modo = ''; this.estado = 'sin'; this.yo = 0; this.ws = null; this.nube = null; this.mundo = null; this.pausa = false; this.reint = 0; }
  // ¿se puede llegar al mundo? ¿cuánta gente hay?
  async salud(timeout = 4000) {
    const v = via(); if (!v) return null;
    if (v !== 'ws') { try { return await plazo(base().then(saludNube), Math.max(timeout, 8000)); } catch (e) { return null; } }
    try { const c = new AbortController(); const tm = setTimeout(() => c.abort(), timeout); const r = await fetch(httpDe(direccion()) + '/salud', {signal: c.signal, cache: 'no-store'}); clearTimeout(tm); return r.ok ? await r.json() : null; } catch (e) { return null; }
  }
  async conectar(hola) {
    this.modo = 'online'; this.hola = hola; this.estado = 'conectando'; this.lleno = false;
    if (via() === 'ws') return this.conectarWs();
    let b; try { b = await plazo(base(), 15000); } catch (e) { this.estado = 'sin'; return false; }
    if (this.modo !== 'online') return false;
    this.nube = new Nube(this, b);
    const ok = await this.nube.conectar(hola);
    if (!ok) this.estado = 'sin';
    return ok;
  }
  conectarWs() {
    return new Promise(ok => {
      let listo = false; const fin = v => { if (!listo) { listo = true; ok(v); } };
      let ws; try { ws = new WebSocket(direccion()); } catch (e) { this.estado = 'sin'; return fin(false); }
      this.ws = ws; const tm = setTimeout(() => { try { ws.close(); } catch (e) { } fin(false); }, 12000);
      ws.onopen = () => { ws.send(JSON.stringify({t: 'hola', ...this.hola})); };
      ws.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch (er) { return; } if (m.t === 'bien') { this.yo = m.id; this.estado = 'conectado'; this.reint = 0; clearTimeout(tm); fin(true); } if (m.t === 'lleno') { this.lleno = true; fin(false); } this.cola.push(m); };
      ws.onclose = () => { clearTimeout(tm); if (this.ws !== ws) return; this.estado = 'sin'; fin(false); if (this.modo === 'online' && !this.lleno) this.reconectar(); };
      ws.onerror = () => { };
    });
  }
  reconectar() {
    if (this.reint > 20 || this.modo !== 'online') return; this.reint++; this.estado = 'reconectando'; this.cola.push({t: 'corte'});
    setTimeout(async () => { if (this.modo !== 'online') return; const ok = await this.conectarWs(); if (ok) this.cola.push({t: 'vuelve'}); }, Math.min(8000, 1500 * this.reint));
  }
  solo(hola) {
    this.modo = 'solo'; this.estado = 'conectado'; this.yo = 1;
    this.mundo = new Mundo({envia: (id, m) => this.cola.push(m)}); this.mundo.entra(1); this.mundo.recibe(1, {t: 'hola', ...hola});
    let ant = performance.now(); clearInterval(this.iv);
    this.iv = setInterval(() => { const t = performance.now(), dt = Math.min(.1, (t - ant) / 1000); ant = t; if (!this.pausa && this.mundo) this.mundo.tick(dt); }, 50);
  }
  manda(m) {
    if (this.modo === 'solo') { this.mundo.recibe(1, m); return; }
    if (this.nube) { this.nube.manda(m); return; }
    if (this.ws && this.ws.readyState === 1) { try { this.ws.send(JSON.stringify(m)); } catch (e) { } }
  }
  cerrar() {
    this.modo = ''; clearInterval(this.iv); this.mundo = null;
    if (this.nube) { const n = this.nube; this.nube = null; n.cerrar(); }
    if (this.ws) { const w = this.ws; this.ws = null; try { w.close(); } catch (e) { } }
    this.cola = []; this.estado = 'sin';
  }
  procesar(f) { const c = this.cola; this.cola = []; for (const m of c) f(m); }
}
