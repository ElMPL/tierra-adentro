// Compila el juego: docs/ es lo que publica GitHub Pages (y lo que abre la app de Android).
// También regenera shared/kit.js (tamaños de choque de cada adorno) a partir de lib/deco.js.
import {buildSync} from 'esbuild';
import fs from 'fs';
import crypto from 'crypto';
import os from 'os';
import path from 'path';
import {pathToFileURL} from 'url';

// 1) tamaños de choque del decorado, para el servidor (que no carga los modelos 3D)
const tmp = path.join(os.tmpdir(), 'ta-kit-' + process.pid + '.mjs');
buildSync({stdin: {contents: "export {KIT} from './lib/deco.js';", resolveDir: '.'}, bundle: true, format: 'esm', outfile: tmp, logLevel: 'error'});
const {KIT} = await import(pathToFileURL(tmp).href); fs.rmSync(tmp);
const kr = {}; for (const t in KIT) { const d = KIT[t]; kr[t] = [d.r || 0, d.len || 0, d.low ? 1 : 0, d.tall ? 1 : 0]; }
fs.writeFileSync('shared/kit.js', '// Generado por build.mjs a partir de lib/deco.js: [radio de choque, medio largo, bajo (se salta esquivando), alto]\nexport const KITR=' + JSON.stringify(kr) + ';\n');

// 2) el juego
const js = buildSync({entryPoints: ['src/main.js'], bundle: true, minify: true, format: 'iife', target: 'es2020', write: false, legalComments: 'none'}).outputFiles[0].text.split('</scr' + 'ipt').join('<\/scr' + 'ipt');
const body = fs.readFileSync('src/body.html', 'utf8'), app = fs.readFileSync('web/app.js', 'utf8'), sw = fs.readFileSync('web/sw.js', 'utf8');
const v = crypto.createHash('sha1').update(body + js + app + sw).digest('hex').slice(0, 10);
fs.rmSync('docs', {recursive: true, force: true}); fs.mkdirSync('docs');
fs.writeFileSync('docs/game.js', js); fs.writeFileSync('docs/app.js', app); fs.writeFileSync('docs/sw.js', sw.split('__V__').join(v));
fs.writeFileSync('docs/index.html', '<!doctype html>\n<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
  + '<title>Tierra Adentro</title><meta name="description" content="Noche de Salamanca: Tierra Adentro. Un mundo abierto de leyendas argentinas para jugar solo o con amigos."><meta name="theme-color" content="#140d20">'
  + '<style>[hidden]{display:none!important}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#140d20}</style></head><body>\n' + body
  + '\n<script src="game.js?v=' + v + '"></script>\n<script src="app.js?v=' + v + '"></script>\n</body></html>\n');
fs.writeFileSync('docs/version.json', JSON.stringify({v, fecha: new Date().toISOString()}) + '\n');
fs.writeFileSync('docs/.nojekyll', '');
console.log('docs/ versión ' + v + ' · ' + (js.length / 1024 | 0) + ' KB');
