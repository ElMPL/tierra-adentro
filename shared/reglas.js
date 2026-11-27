// Reglas del RPG: personajes y habilidades, niveles, bichos, jefes y objetos.
import {CHARS, ENEMIES, BOSSES} from '../lib/data.js';
import '../lib/data2.js';
export {CHARS, ENEMIES, BOSSES};

export const NIVEL_MAX = 30;
export const xpSig = lv => Math.round(60 * Math.pow(lv, 1.55));
// daño base del personaje según nivel y arma
export const danoBase = (lv, arma = 1) => 10 * (1 + .12 * (lv - 1)) * (1 + .3 * (arma - 1));
export const vidaMax = (base, lv, poncho = 1) => Math.round(base * (1 + .1 * (lv - 1)) + 18 * (poncho - 1) * (1 + .05 * lv));
export const armadura = poncho => Math.min(.45, .05 * (poncho - 1) + .02);

// ---------- habilidades ----------
// tipos: tajo (cuerpo a cuerpo en abanico), tiro (proyectiles), onda (empuja en abanico), charco (área que quema),
// pisoton (alrededor tuyo, aturde), giro (golpes en redondo), orbita (giran alrededor), aura (fuego que te sigue),
// carga (te tirás para adelante), cura, escudo, lazo (trae enemigos), lluvia (varios golpes en la zona), furia.
// dmg es un multiplicador del daño base. cd en segundos.
const H = (n, d, cd, ...ef) => ({n, d, cd, ef});
export const KITS = {
  gaucho: {vida: 120, vel: 6.6, basico: {tipo: 'tajo', alc: 2.9, ang: 1.1, dmg: 1, cd: .42, son: 'slash'},
    h: [H('Rebencazo', 'Chicotazo largo que empuja.', 5, {tipo: 'tajo', alc: 5.6, ang: .45, dmg: 1.9, emp: 4, son: 'whip'}),
      H('Boleada', 'Tres boleadoras que traban.', 8, {tipo: 'tiro', n: 3, abre: .3, vel: 16, alc: 14, dmg: 1.4, traba: 2, mod: 'boleadoras', son: 'throw'}),
      H('Duelo Criollo', 'Remolino de facones.', 38, {tipo: 'giro', r: 4.2, dmg: .9, golpes: 8, dur: 2, mod: 'facon'})]},
  paisana: {vida: 95, vel: 7.2, basico: {tipo: 'tiro', n: 1, vel: 16, alc: 13, dmg: .85, cd: .5, mod: 'vela', son: 'fire'},
    h: [H('Pañuelazo', 'Una vuelta de zamba que empuja.', 6, {tipo: 'onda', alc: 6.5, ang: .95, dmg: 1.4, emp: 5, son: 'wave'}),
      H('Velas del Gauchito', 'Cuatro velas que giran y queman.', 14, {tipo: 'orbita', n: 4, r: 2.8, dur: 6, dmg: .55, mod: 'vela'}),
      H('Zamba del Alma', 'Cura a todos y empuja a los bichos.', 45, {tipo: 'cura', pct: .5, r: 10}, {tipo: 'pisoton', r: 7, dmg: 1, emp: 6})]},
  payador: {vida: 100, vel: 6.6, basico: {tipo: 'onda', alc: 5, ang: .55, dmg: .8, emp: 1.2, cd: .62, son: 'pluck'},
    h: [H('Décima', 'Cinco notas que atraviesan.', 6, {tipo: 'tiro', n: 5, abre: .9, vel: 13, alc: 11, perf: 2, dmg: .9, mod: 'nota', son: 'pluck'}),
      H('Contrapunto', 'Un acorde que aturde alrededor.', 9, {tipo: 'pisoton', r: 5.5, dmg: 1.6, aturde: 1.5, son: 'wave'}),
      H('Payada Infernal', 'Notas para todos lados.', 40, {tipo: 'tiro', n: 18, abre: 6.28, vel: 13, alc: 14, perf: 4, dmg: 1.2, mod: 'nota', son: 'sapucay'})]},
  curandera: {vida: 110, vel: 6.4, basico: {tipo: 'tiro', n: 1, vel: 13, alc: 12, dmg: .8, expl: 2, cd: .7, mod: 'mate', son: 'throw'},
    h: [H('Mate Hirviendo', 'Un charco que quema.', 7, {tipo: 'charco', alc: 8, r: 3, dur: 4, dmg: .6, col: [1, .55, .2]}),
      H('Yuyos', 'Te cura a vos y a los que estén cerca.', 12, {tipo: 'cura', pct: .3, r: 10}),
      H('Tirar el Cuerito', 'Cura todo y protege a los tuyos.', 50, {tipo: 'cura', pct: 1, r: 14}, {tipo: 'escudo', red: .5, dur: 6, r: 14})]},
  boleador: {vida: 100, vel: 7, basico: {tipo: 'tiro', n: 1, vel: 18, alc: 16, dmg: 1, traba: .8, cd: .55, mod: 'boleadoras', son: 'throw'},
    h: [H('Tiro triple', 'Tres boleadoras que traban más.', 5, {tipo: 'tiro', n: 3, abre: .3, vel: 18, alc: 16, dmg: 1.1, traba: 1.6, mod: 'boleadoras', son: 'throw'}),
      H('Carrera tehuelche', 'Corrés y llevás puesto a todo.', 8, {tipo: 'carga', dist: 9, dmg: 1.5, ancho: 2}),
      H('Cacería', 'Lluvia de boleadoras donde apuntás.', 40, {tipo: 'lluvia', n: 12, r: 2.2, alc: 8, dmg: 1.6})]},
  malambista: {vida: 115, vel: 6.8, basico: {tipo: 'pisoton', r: 2.7, adel: 1.4, dmg: 1, cd: .6, son: 'stomp'},
    h: [H('Cepillado', 'Te deslizás zapateando.', 6, {tipo: 'carga', dist: 7, dmg: 1.3, ancho: 2.2}),
      H('Mudanza', 'Un pisotón que aturde.', 9, {tipo: 'pisoton', r: 5, dmg: 1.7, aturde: 1.2, son: 'stomp'}),
      H('Malambo Final', 'Diez pisotones en cadena.', 40, {tipo: 'lluvia', n: 10, r: 3, alc: 0, radio: 6, dmg: 1.5})]},
  asador: {vida: 160, vel: 6, arm: .08, basico: {tipo: 'tajo', alc: 2.6, ang: 1.2, dmg: 1.1, cd: .55, quema: 1, son: 'fire'},
    h: [H('Brasas', 'Un círculo de fuego que camina con vos.', 12, {tipo: 'aura', r: 3.2, dur: 6, dmg: .7, col: [1, .45, .1]}),
      H('Asado con cuero', 'Te curás y aguantás más.', 14, {tipo: 'cura', pct: .35, r: 0}, {tipo: 'escudo', red: .3, dur: 5, r: 0}),
      H('Parrillada', 'Prendés fuego todo alrededor.', 45, {tipo: 'charco', alc: 0, r: 8, dur: 6, dmg: 1.2, col: [1, .4, .1]})]},
  carpincho: {vida: 120, vel: 6.2, suerte: .3, basico: {tipo: 'tiro', n: 1, vel: 11, alc: 11, dmg: 1.1, expl: 2.2, cd: .8, mod: 'empanada', son: 'throw'},
    h: [H('La Docena', 'Seis empanadas que explotan.', 8, {tipo: 'tiro', n: 6, abre: 1.2, vel: 11, alc: 10, dmg: .9, expl: 2, mod: 'empanada', son: 'throw'}),
      H('Siesta', 'Te curás de a poco.', 15, {tipo: 'cura', pct: .45, r: 0, lento: 6}),
      H('Paz Interior', 'Nadie puede lastimar a los tuyos.', 50, {tipo: 'escudo', red: 1, dur: 4, r: 12})]},
  domadora: {vida: 115, vel: 7.2, basico: {tipo: 'tajo', alc: 4.2, ang: .45, dmg: 1, cd: .6, son: 'whip'},
    h: [H('Pialada', 'Enlazás y traés a los bichos.', 6, {tipo: 'lazo', alc: 9, ancho: 2.5, dmg: 1.2, son: 'whip'}),
      H('Galope', 'Una carrera que atropella.', 8, {tipo: 'carga', dist: 10, dmg: 1.6, ancho: 2.4}),
      H('Tropilla', 'Siete caballos pasan por arriba de todo.', 40, {tipo: 'carga', dist: 16, dmg: 2.2, ancho: 6})]},
  chamamecero: {vida: 110, vel: 6.6, basico: {tipo: 'onda', alc: 4.8, ang: .7, dmg: .85, emp: 1.5, cd: .6, son: 'pluck'},
    h: [H('Abre y cierra', 'El fuelle chupa a los bichos.', 6, {tipo: 'onda', alc: 7, ang: .8, dmg: 1.2, emp: -4, son: 'wave'}),
      H('Sapucay', 'Un grito que protege a todos.', 14, {tipo: 'escudo', red: .25, dur: 6, r: 10, vel: 1.25, son: 'sapucay'}),
      H('Chamamé Maceta', 'Suena para los cuatro lados y aturde.', 40, {tipo: 'pisoton', r: 8, dmg: 2, aturde: 2, son: 'sapucay'})]},
  zafrera: {vida: 110, vel: 6.8, crit: .12, basico: {tipo: 'tajo', alc: 3, ang: 1, dmg: 1.05, cd: .45, son: 'slash'},
    h: [H('Tajo cruzado', 'Dos tajos que pegan doble.', 5, {tipo: 'tajo', alc: 3.6, ang: 1.4, dmg: 2, son: 'slash'}),
      H('Astillas', 'Astillas de caña que atraviesan.', 7, {tipo: 'tiro', n: 5, abre: .6, vel: 17, alc: 12, perf: 2, dmg: .9, mod: 'machete', son: 'throw'}),
      H('Desmonte', 'Tajos en redondo.', 40, {tipo: 'giro', r: 5, dmg: 1, golpes: 10, dur: 2.5, mod: 'machete'})]},
  pujllay: {vida: 100, vel: 7.2, suerte: .25, basico: {tipo: 'tiro', n: 1, vel: 14, alc: 12, dmg: .8, expl: 1.8, traba: 1, cd: .6, mod: 'talco', son: 'throw'},
    h: [H('Talcazo', 'Una nube que ciega y frena.', 7, {tipo: 'charco', alc: 7, r: 3.2, dur: 3, dmg: .5, traba: 1, col: [.95, .95, 1]}),
      H('Serpentinas', 'Serpentinas para todos lados.', 9, {tipo: 'tiro', n: 8, abre: 6.28, vel: 12, alc: 9, dmg: .9, mod: 'talco', son: 'throw'}),
      H('Desentierro', 'Los bichos bailan y no te pegan.', 40, {tipo: 'pisoton', r: 9, dmg: 1.5, aturde: 3, son: 'sapucay'})]},
  machi: {vida: 100, vel: 6.6, basico: {tipo: 'tiro', n: 1, vel: 10, alc: 14, dmg: .9, busca: 1, cd: .65, mod: 'kultrun', son: 'pluck'},
    h: [H('Espíritus', 'Tres espíritus que persiguen.', 6, {tipo: 'tiro', n: 3, abre: .8, vel: 10, alc: 15, dmg: 1.1, busca: 1, mod: 'kultrun', son: 'wail'}),
      H('Rogativa', 'Cura a todos los que estén cerca.', 12, {tipo: 'cura', pct: .3, r: 10}),
      H('Nguillatún', 'Espíritus, curación y escudo para todos.', 50, {tipo: 'cura', pct: .6, r: 14}, {tipo: 'escudo', red: .4, dur: 6, r: 14})]},
  septimo: {vida: 125, vel: 7, robo: .08, basico: {tipo: 'tajo', alc: 2.6, ang: 1.2, dmg: .95, cd: .4, son: 'slash'},
    h: [H('Zarpazo', 'Saltás encima del más cercano.', 5, {tipo: 'carga', dist: 6, dmg: 1.6, ancho: 2.4}),
      H('Aullido', 'Los bichos quedan duros del miedo.', 10, {tipo: 'pisoton', r: 5, dmg: .8, aturde: 2, son: 'wail'}),
      H('Luna Llena', 'Te transformás: rápido, feroz y te curás pegando.', 45, {tipo: 'furia', dur: 8, dmg: 1.6, vel: 1.3, robo: .2, son: 'roar'})]},
};
export const DESBLOQUEO = [2, 4, 7]; // nivel en que se abre cada habilidad
export const ESQUIVE = {cd: 1.1, dist: 5.2, dur: .26};

// ---------- bichos ----------
// cómo pelea cada uno en el mundo abierto (a partir de la forma de pelear del primer juego)
const AI = {undefined: 'melee', float: 'melee', ride: 'melee', dance: 'melee', cold: 'melee', whirl: 'melee', snap: 'melee', hop: 'melee', root: 'melee', dig: 'melee', ambush: 'melee', thief: 'melee',
  charge: 'charge', roll: 'charge', leap: 'leap', dive: 'leap', blink: 'leap',
  shoot: 'shoot', spit: 'shoot', beam: 'shoot', curse: 'shoot', talc: 'shoot', charm: 'shoot', wail: 'shoot', lasso: 'shoot',
  slam: 'slam', whip: 'slam', plant: 'plant', kami: 'kami', summon: 'summon', flee: 'melee'};
export function bicho(tipo, lv, camp = false) {
  const e = ENEMIES[tipo]; if (!e) return null;
  const k = camp ? 1 : 0;
  return {tipo, lv, n: e.n, ai: AI[e.ai] || 'melee', fly: !!e.fly,
    hp: Math.round((16 + e.hp) * (1 + .28 * (lv - 1)) * (k ? 5 : 1)),
    dmg: Math.round(e.dmg * .62 * (1 + .14 * (lv - 1)) * (k ? 1.4 : 1)),
    vel: Math.max(e.spd, 1.4) * (k ? 1.05 : 1), r: e.r * (k ? 1.35 : 1), s: (e.s || 1) * (k ? 1.4 : 1),
    xp: Math.round((4 + e.xp * 3) * (1 + .25 * (lv - 1)) * (k ? 6 : 1))};
}
// jefes: qué ataques usa cada uno
export const PATRON = {
  lobizon: ['salto', 'golpe', 'embestida', 'invoca'], almamula: ['embestida', 'aliento', 'anillo', 'golpe'], mboitui: ['abanico', 'lluvia', 'golpe', 'invoca'],
  elfamiliar: ['embestida', 'golpe', 'aliento', 'invoca'], teyu: ['aliento', 'abanico', 'golpe', 'lluvia'], huayrapuca: ['anillo', 'lluvia', 'salto', 'abanico'],
  futre: ['embestida', 'abanico', 'salto', 'golpe'], elengassen: ['golpe', 'lluvia', 'salto', 'anillo'], mandinga: ['aliento', 'lluvia', 'anillo', 'salto', 'invoca', 'embestida'],
};
export function jefe(tipo, lv, nj = 1) {
  const b = BOSSES[tipo];
  return {tipo, lv, n: b.n, sub: b.sub, jefe: 1, ai: 'jefe', fly: false,
    hp: Math.round(1300 * (1 + .3 * (lv - 1)) * (1 + .65 * (nj - 1))), dmg: Math.round(b.dmg * .8 * (1 + .14 * (lv - 1))),
    vel: b.spd, r: b.r * 1.15, s: (b.s || 1) * 1.15, xp: Math.round(260 * (1 + .3 * (lv - 1))), col: b.col || [1, .4, .2]};
}

// ---------- objetos ----------
export const OBJETOS = {
  mate: {n: 'Mate', d: 'Cura el 35% de la vida.', ic: 'mate', precio: 15, usa: 1},
  asado: {n: 'Asado', d: 'Cura toda la vida en 6 segundos.', ic: 'asado', precio: 45, usa: 1},
  cana: {n: 'Caña con ruda', d: '+25% de daño por un minuto.', ic: 'botella', precio: 60, usa: 1},
  pescado: {n: 'Pescado asado', d: 'Cura el 50% de la vida. Sale de pescar.', ic: 'asado', precio: 0, usa: 1},
  retazo: {n: 'Retazo de leyenda', d: 'Lo que dejan los bichos. El herrero lo usa para mejorar el arma.', ic: 'cincha', mat: 1},
};
export const AMULETOS = {
  higa: {n: 'Higa de azabache', d: '+8% de golpe crítico.', ic: 'gema', f: s => { s.crit += .08; }},
  ruda: {n: 'Ramito de ruda', d: '−10% de daño recibido.', ic: 'trebol', f: s => { s.arm += .1; }},
  estampita: {n: 'Estampita del Gauchito', d: 'Si caés, te levantás una vez cada 5 minutos.', ic: 'estampita', f: s => { s.revive = 1; }},
  pata: {n: 'Pata de conejo', d: '+30% de suerte: más plata y más premios.', ic: 'trebol', f: s => { s.suerte += .3; }},
  colmillo: {n: 'Colmillo de yaguareté', d: '+12% de daño.', ic: 'colmillo', f: s => { s.dmg *= 1.12; }},
  pluma: {n: 'Pluma de ñandú', d: '+10% de velocidad.', ic: 'pluma', f: s => { s.vel *= 1.1; }},
  carbunclo: {n: 'Piedra del Carbunclo', d: '+40% de patacones.', ic: 'gema2', f: s => { s.oro += .4; }},
  cuerito: {n: 'Cuerito de víbora', d: '+1,5 de vida por segundo.', ic: 'cincha', f: s => { s.regen += 1.5; }},
  luna: {n: 'Piedra de luna', d: '−25% de espera en las habilidades.', ic: 'gema3', f: s => { s.cdr *= .75; }},
};
export const RELIQ = {
  pampa: {n: 'Colmillo del Lobizón', ic: 'colmillo'}, ibera: {n: 'Pluma de Mbói Tu’ĩ', ic: 'pluma'}, monte: {n: 'Cadena de la Alma Mula', ic: 'herradura'},
  ingenio: {n: 'Collar del Familiar', ic: 'cencerro'}, selva: {n: 'Escama del Teyú Yaguá', ic: 'gema'}, cuyo: {n: 'Pañuelo del Futre', ic: 'cinta'},
  puna: {n: 'Pluma de la Huayrapuca', ic: 'pluma'}, sur: {n: 'Piedra de Elëngásëm', ic: 'piedra'},
};
// mejoras del herrero (arma) y del talabartero (poncho): nivel 1 a 6
export const GRADOS = ['Común', 'Bueno', 'De plata', 'Criollo', 'Legendario', 'De la Salamanca'];
export const costoMejora = g => ({oro: Math.round(70 * Math.pow(g, 2.2)), retazos: 4 * g, nivel: g * 4 - 2});
// premio de cada bicho (el servidor tira los dados; la suerte de cada jugador se aplica en su pantalla)
export function botin(q, b) {
  const it = [], oro = Math.round(b.lv * 1.5 + q() * b.lv * 1.5 + 2) * (b.jefe ? 12 : b.camp ? 5 : 1);
  if (q() < (b.jefe ? 1 : b.camp ? 1 : .22)) it.push(['retazo', b.jefe ? 8 : b.camp ? 3 : 1]);
  if (q() < (b.jefe ? 1 : b.camp ? .5 : .05)) it.push(['mate', b.jefe ? 3 : 1]);
  if (q() < (b.jefe ? .35 : b.camp ? .12 : .004)) { const k = Object.keys(AMULETOS); it.push(['am:' + k[Math.floor(q() * k.length)], 1]); }
  return {oro, it};
}
export const xpBicho = b => b.xp;
