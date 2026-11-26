// Servidor del mundo compartido. Sin dependencias: Node trae todo lo necesario.
// - /ws      : la conexión de cada jugador (WebSocket)
// - /salud   : para ver si está prendido y cuánta gente hay
// - el resto : sirve el juego de docs/ (así también se puede jugar entrando directo al servidor)
import http from 'http';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import {Mundo} from '../shared/sim.js';

const PORT = +process.env.PORT || 8080, MAX = 16, RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'docs');
const TIPOS = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml'};
const clientes = new Map();
let nid = 1;
const mundo = new Mundo({envia: (id, m) => clientes.get(id)?.manda(m)});
mundo.corta = id => clientes.get(id)?.cierra();

const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/salud') { res.writeHead(200, {'content-type': 'application/json', 'access-control-allow-origin': '*', 'cache-control': 'no-store'}); res.end(JSON.stringify({ok: true, jugadores: clientes.size, max: MAX, hora: mundo.hora()})); return; }
  let f = path.normalize(path.join(RAIZ, decodeURIComponent(u.pathname)));
  if (!f.startsWith(RAIZ)) { res.writeHead(403); res.end(); return; }
  if (f === RAIZ || f.endsWith(path.sep)) f = path.join(f, 'index.html');
  fs.readFile(f, (e, d) => {
    if (e) { res.writeHead(404, {'content-type': 'text/plain; charset=utf-8'}); res.end('No está'); return; }
    res.writeHead(200, {'content-type': TIPOS[path.extname(f)] || 'application/octet-stream', 'cache-control': f.endsWith('.html') || f.endsWith('sw.js') ? 'no-cache' : 'public, max-age=300'}); res.end(d);
  });
});

class Cliente {
  constructor(sock) {
    this.id = nid++; this.s = sock; this.buf = Buffer.alloc(0); this.frag = []; this.vivo = true; this.cuenta = 0; this.seg = Date.now();
    sock.on('data', d => this.datos(d)); sock.on('close', () => this.fin()); sock.on('error', () => this.fin());
    clientes.set(this.id, this); mundo.entra(this.id);
  }
  datos(d) {
    this.buf = Buffer.concat([this.buf, d]);
    while (this.buf.length >= 2) {
      const b0 = this.buf[0], b1 = this.buf[1], op = b0 & 15, fin = b0 & 128, mask = b1 & 128; let len = b1 & 127, o = 2;
      if (len === 126) { if (this.buf.length < 4) return; len = this.buf.readUInt16BE(2); o = 4; }
      else if (len === 127) { if (this.buf.length < 10) return; len = Number(this.buf.readBigUInt64BE(2)); o = 10; }
      if (len > 65536 || !mask) return this.cierra();
      if (this.buf.length < o + 4 + len) return;
      const k = this.buf.subarray(o, o + 4), p = Buffer.from(this.buf.subarray(o + 4, o + 4 + len));
      for (let i = 0; i < p.length; i++) p[i] ^= k[i & 3];
      this.buf = this.buf.subarray(o + 4 + len);
      if (op === 8) return this.cierra();
      if (op === 9) { this.cuadro(10, p); continue; }
      if (op === 10) continue;
      if (op === 1 || op === 0) { this.frag.push(p); if (fin) { const s = Buffer.concat(this.frag).toString('utf8'); this.frag = []; this.mensaje(s); } }
    }
  }
  mensaje(s) {
    const t = Date.now(); if (t - this.seg > 1000) { this.seg = t; this.cuenta = 0; } if (++this.cuenta > 80) return;
    let m; try { m = JSON.parse(s); } catch (e) { return; }
    if (m && m.t === 'hola' && clientes.size > MAX) { this.manda({t: 'lleno', max: MAX}); return this.cierra(); }
    mundo.recibe(this.id, m);
  }
  cuadro(op, p) {
    if (!this.vivo) return; const n = p.length; let h;
    if (n < 126) h = Buffer.from([128 | op, n]); else if (n < 65536) { h = Buffer.alloc(4); h[0] = 128 | op; h[1] = 126; h.writeUInt16BE(n, 2); } else { h = Buffer.alloc(10); h[0] = 128 | op; h[1] = 127; h.writeBigUInt64BE(BigInt(n), 2); }
    try { this.s.write(Buffer.concat([h, p])); } catch (e) { this.fin(); }
  }
  manda(m) { if (this.s.writableLength > 1 << 20) return; this.cuadro(1, Buffer.from(JSON.stringify(m))); }
  cierra() { if (!this.vivo) return; try { this.cuadro(8, Buffer.alloc(0)); this.s.end(); } catch (e) { } this.fin(); }
  fin() { if (!this.vivo) return; this.vivo = false; clientes.delete(this.id); mundo.sale(this.id); try { this.s.destroy(); } catch (e) { } }
}

server.on('upgrade', (req, sock) => {
  const key = req.headers['sec-websocket-key'];
  if (!key || String(req.headers.upgrade).toLowerCase() !== 'websocket' || !req.url.startsWith('/ws')) { sock.destroy(); return; }
  const acc = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + acc + '\r\n\r\n');
  sock.setNoDelay(true); new Cliente(sock);
});

let ant = performance.now();
setInterval(() => { const t = performance.now(), dt = Math.min(.1, (t - ant) / 1000); ant = t; try { mundo.tick(dt); } catch (e) { console.error(e); } }, 50);
server.listen(PORT, () => console.log('Tierra Adentro: mundo prendido en el puerto ' + PORT));
