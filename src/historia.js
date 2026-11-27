// La historia, capítulo por capítulo. Cada pueblo tiene gente con nombre y su propia leyenda que explica
// por qué ese jefe se quedó con una reliquia. Un forastero de poncho negro te sigue los pasos y te ofrece tratos.
import {REG, PUEBLOS, LUGARES, FIJOS, GUARIDAS, SALA, SALTO, dentro, agua, barranco, cerca, camino} from '../shared/mapa.js';

// un lugar libre cerca de (x, z): seco, sin barrancos ni árboles encima (sale siempre igual)
export function sitio(x, z, r = 1.2) {
  const L = [];
  for (let k = 0; k < 400; k++) {
    const a = k * 2.399, d = Math.sqrt(k) * 1.6, px = x + Math.sin(a) * d, pz = z + Math.cos(a) * d;
    if (!dentro(px, pz, 5) || agua(px, pz) > .03 || barranco(px, pz, 2.5)) continue;
    if (cerca(px, pz, r, L).some(o => Math.hypot(o.x - px, o.z - pz) < o.r + o.len + r)) continue;
    return [Math.round(px * 10) / 10, Math.round(pz * 10) / 10];
  }
  return [x, z];
}
const P = k => REG[k].pueblo;
const cercano = (tipo, x, z) => LUGARES.filter(l => l.tipo === tipo).sort((a, b) => Math.hypot(a.x - x, a.z - z) - Math.hypot(b.x - x, b.z - z))[0];
const G = k => GUARIDAS.find(g => g.reg === k);

// ---------- la gente de cada pueblo: [vecino, baqueano, cantor] ----------
export const NOMBRES = {
  pampa: [['Doña Eulogia', 'curandera de Pueblo Ombú'], ['Don Segundo Arrieta', 'resero de Pueblo Ombú'], ['El Negro Ledesma', 'payador de Pueblo Ombú']],
  ibera: [['Don Celestino', 'chamamecero de Puerto Irupé'], ['Tito Aguirre', 'boleador de Puerto Irupé'], ['Ña Lucía', 'cantora de Puerto Irupé']],
  monte: [['Don Anselmo', 'hachero viejo del Quebrachal'], ['El Carpincho Ríos', 'baqueano del Quebrachal'], ['Benjamín Suárez', 'séptimo hijo, apadrinado por el Presidente']],
  ingenio: [['Doña Zulema', 'zafrera de Villa Zafra'], ['El Turco Asad', 'excapataz del ingenio'], ['La Chola Ibarra', 'domadora de Villa Zafra']],
  selva: [['Ña Isabel', 'vecina de la Misión'], ['Don Aurelio Benítez', 'mensú de la Misión'], ['El Mbaracá', 'músico de la Misión']],
  cuyo: [['Doña Pura Videla', 'puestera de la Posta'], ['Don Cosme', 'arriero de la Posta'], ['El Tuerto Funes', 'payador de la Posta']],
  puna: [['Don Tiburcio Mamaní', 'diablero del carnaval'], ['Doña Quispe', 'pastora del Abra'], ['El Coplero Cruz', 'coplero del Abra']],
  sur: [['La Machi Ayelén', 'machi del Fortín'], ['Nahuel', 'boleador del Fortín'], ['Doña Rosa Cayul', 'tejedora del Fortín']],
};
export const ROLES = ['vecino', 'baqueano', 'cantor'];
// lo que dicen cuando ya los ayudaste
export const AGRADECE = {
  pampa: 'Ramón ya ayuda en la yerra. Usted es de la familia, que no se le olvide.', ibera: 'Volvieron las canoas. Esta noche hay chamamé en el puerto, y usted invita.',
  monte: 'El monte nos deja hachar lo justo. Sachayoj está conforme, y nosotros también.', ingenio: 'Esta zafra no desapareció nadie. Primera vez en años.',
  selva: 'Tobías ya no sale a la siesta. Y el arcoíris de la cascada sale todos los días.', cuyo: 'La Difunta tiene agua y el paso está libre. Los arrieros le mandan saludos.',
  puna: 'El carnaval quedó enterrado y las vicuñas bajaron otra vez a la vega.', sur: 'El viento se calmó. El kultrún suena todas las mañanas.',
};

// ---------- gente que vive afuera de los pueblos ----------
export const PERSONAJES = [
  {k: 'cirilo', nom: 'Don Cirilo', titulo: 'puestero de las Lomas del Tala', mod: 'h_gaucho', reg: 'pampa', at: [75, 58], dice: ['Acá en el puesto no pasa nada... salvo de noche.', 'Desde la loma se ve todo el pago. Suba, suba.']},
  {k: 'coquena', nom: 'Coquena', titulo: 'dueño de las vicuñas', mod: 'm_coquenaM', reg: 'puna', at: [-184, -208], s: .9, dice: ['Las vicuñas son mías. El que caza de más, se las ve conmigo.', 'Shh. Escuche el viento de la puna.']},
  {k: 'baqueana', nom: 'La Baqueana del Mirador', titulo: 'cuida el mirador del Aconcagua', mod: 'h_domadora', reg: 'cuyo', at: [-210, -22], dice: ['Desde acá se ve el techo de América.', 'Cuando el viento blanco baja, no hay mirador que valga.']},
];
for (const p of PERSONAJES) [p.x, p.z] = sitio(...p.at);

// ---------- puntos de la historia ----------
const lin = (a, b, t, o = 0) => { const dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz); return sitio(a.x + dx * t - dz / l * o, a.z + dz * t + dx / l * o); };
const ronda = (x, z, r, n, a0 = 0) => Array.from({length: n}, (_, i) => sitio(x + Math.sin(a0 + i / n * 6.283) * r, z + Math.cos(a0 + i / n * 6.283) * r));
const PT = {
  huellas: [lin(P('pampa'), G('pampa'), .42, 5), lin(P('pampa'), G('pampa'), .6, -4), lin(P('pampa'), G('pampa'), .76, 4)],
  santo: cercano('santuario', P('pampa').x, P('pampa').z),
  remos: ronda(142, -62, 21, 4, .4),
  lucio: sitio(-8, -182), quebracho: sitio(-14, -230), panales: [sitio(-2, -214), sitio(-24, -222), sitio(-6, -244)],
  contrato: sitio(-158, -136),
  tobias: sitio(214, -236), piedras: ronda(P('selva').x + 4, P('selva').z - 4, 44, 4, 1),
  difunta: cercano('difunta', P('cuyo').x, P('cuyo').z), mirador: sitio(-214, -26),
  apacheta: cercano('apacheta', P('puna').x, P('puna').z),
  kultrun: sitio(-100, 178), rehue: FIJOS.find(o => o.t === 'rehue'), nahuel: sitio(-143, 236),
  salto: SALTO ? sitio(SALTO.x - SALTO.dx * 10 + SALTO.dz * 13, SALTO.z - SALTO.dz * 10 - SALTO.dx * 13) : sitio(150, -170),
};
export const PUNTOS = PT;
const xz = o => Array.isArray(o) ? o : [o.x, o.z];

// ---------- las misiones de la historia ----------
// pide / fin pueden ser varias páginas. diario: cómo lo contás vos en tu libreta.
export function historia(M) {
  const pre = ['h2']; // los capítulos de cada territorio se abren después del primero
  // Capítulo 1: La noche colorada
  M('h1', {hist: 1, cap: 1, de: 'pampa:vecino', n: 'La noche colorada', reg: 'pampa', obj: {tipo: 'matar', bichos: ['anima'], n: 5},
    pide: ['Ay, m’hijo, menos mal que llegó. Anoche tembló la tierra para el lado del norte y el cielo se puso colorado como brasa.', 'Eso tiene un solo nombre: Mandinga abrió la Salamanca. Desde entonces las ánimas andan sueltas por los caminos. Despache cinco, que acá no se puede ni ir a buscar agua.'],
    fin: 'Bien hecho. Pero esto recién empieza: si las ánimas andan sueltas, lo peor viene atrás.', premio: {xp: 90, oro: 40, it: [['mate', 3]]},
    diario: 'Llegué a Pueblo Ombú la mañana después de la noche colorada. Doña Eulogia dice que Mandinga abrió la Salamanca. Despaché cinco ánimas en el camino.'});
  M('p_ledesma', {hist: 1, cap: 1, de: 'pampa:vecino', req: ['h1'], n: 'Lo que vio el payador', reg: 'pampa', obj: {tipo: 'hablar', a: 'pampa:cantor'},
    pide: 'El Negro Ledesma estuvo de guitarreada hasta el amanecer, la noche colorada. Dice que vio algo raro por el camino. Hable con él, del otro lado del fogón.',
    fin: ['¿Que qué vi? Le voy a decir, pero no se ría.', 'Pasó un jinete de poncho negro, con espuelas de plata que no sonaban. Me saludó con el sombrero y siguió para el norte.', 'Atrás venía aullando algo… y ese aullido yo lo conozco. Es Ramón, el séptimo hijo de los Arrieta.'],
    premio: {xp: 60, oro: 20}, diario: 'El Negro Ledesma vio a un forastero de poncho negro la noche colorada. Atrás venía aullando Ramón Arrieta, el séptimo hijo.'});
  M('p_segundo', {hist: 1, cap: 1, de: 'pampa:cantor', req: ['p_ledesma'], n: 'El séptimo hijo', reg: 'pampa', obj: {tipo: 'hablar', a: 'pampa:baqueano'},
    pide: 'Vaya a ver a Don Segundo Arrieta, el padre. No le va a gustar lo que tiene para contarle, pero es mejor que lo sepa por usted.',
    fin: ['Ya sé lo que me va a decir. Mi Ramón nació séptimo varón y nunca le conseguimos padrino, como manda la costumbre.', 'Desde la noche colorada se volvió lobizón del todo. No lo mate, se lo pido por favor: si lo vence con un facón bendecido, el mal se le sale del cuerpo.'],
    premio: {xp: 60}, diario: 'Don Segundo me pidió que no mate a su hijo: hay que vencerlo con un facón bendecido.'});
  M('p_vela', {hist: 1, cap: 1, de: 'pampa:baqueano', req: ['p_segundo'], n: 'El facón bendecido', reg: 'pampa', obj: {tipo: 'accion', x: PT.santo.x, z: PT.santo.z, que: 'Pedir por Ramón al Gauchito Gil', lugar: 'El santuario del camino', ve: 'La vela se prende sola. Por un momento, el facón te pesa distinto en la mano.'},
    pide: 'En el santuario del Gauchito Gil, sobre el camino, prenda una vela y pida por mi Ramón. El Gauchito bendice el facón del que pide por otro.',
    fin: '¿Se prendió sola? Entonces el Gauchito escuchó. Ahora falta encontrarlo.', premio: {xp: 80, it: [['cana', 1]]}, diario: 'Prendí una vela en el santuario del Gauchito Gil y se encendió sola. El facón quedó bendecido.'});
  M('p_huellas', {hist: 1, cap: 1, de: 'pampa:baqueano', req: ['p_vela'], n: 'Huellas con garras', reg: 'pampa', obj: {tipo: 'buscar', pts: PT.huellas, n: 3, item: 'huella', que: 'Mirar la huella'},
    pide: 'Ramón se esconde en el rancho viejo de la familia, al sureste, pasando el río. Siga sus huellas: son grandes como las de un ternero, pero con garras.',
    fin: 'Sí, va para el rancho viejo. Ahora es cosa suya. Que Dios lo acompañe.', premio: {xp: 90, oro: 30}, diario: 'Seguí las huellas del lobizón hacia el rancho viejo de los Arrieta.'});
  M('h2', {hist: 1, cap: 1, de: 'pampa:baqueano', req: ['p_huellas'], n: 'Ramón, el lobizón', reg: 'pampa', obj: {tipo: 'jefe', reg: 'pampa'},
    pide: 'Es ahora o nunca. Cuando lo tenga contra las cuerdas, no afloje. Y acuérdese: no es un bicho, es mi hijo.',
    fin: ['¡Volvió! Ramón volvió a ser Ramón. Está flaco y no se acuerda de nada, pero está vivo.', 'Y mire lo que se le cayó de la boca: un colmillo que brilla. Llévele eso a Doña Eulogia, ella sabe de estas cosas.'],
    premio: {xp: 320, oro: 160, am: 'ruda'}, diario: 'Vencí al lobizón y Ramón volvió a ser hombre. Se le cayó un colmillo que brilla: la primera reliquia.'});
  M('h3', {hist: 1, cap: 9, de: 'pampa:vecino', req: ['h2'], n: 'Las ocho reliquias', reg: 'pampa', obj: {tipo: 'reliquias', n: 8},
    pide: ['Ese colmillo es una reliquia. Cuando Mandinga abrió la Salamanca, ocho leyendas se quedaron con un pedazo de su llave, y la cueva no se cierra hasta juntarlas todas.', 'Mbói Tu’ĩ en los esteros, la Alma Mula en el monte, el Familiar en el ingenio, el Teyú Yaguá en la selva, el Futre en la cordillera, la Huayrapuca en la puna y Elëngásëm en la Patagonia.', 'En cada pueblo hay gente que lo va a necesitar. Y otra cosa: si se cruza al de poncho negro, no le acepte nada.'],
    fin: '¡Las ocho! No lo puedo creer. La puerta de la Salamanca ya lo deja pasar.', premio: {xp: 2000, oro: 1500, am: 'luna'}, diario: 'Junté las ocho reliquias. La puerta de la Salamanca está abierta para mí.'});
  M('h4', {hist: 1, cap: 9, de: 'pampa:vecino', req: ['h3'], n: 'Cerrar la Salamanca', reg: 'salamanca', obj: {tipo: 'jefe', reg: 'salamanca'},
    pide: p => (p.pactos || 0) >= 3 ? ['Lo noto distinto, m’hijo. Usted le aceptó cosas al de poncho negro, ¿no? No me lo niegue: se le ve en los ojos.', 'Adentro de la cueva lo espera el mismísimo Mandinga. Va a querer cobrarle. Usted no le debe nada: péguele igual.'] : ['Adentro de la cueva lo espera el mismísimo Mandinga, sentado en su trono. Le va a ofrecer de todo.', 'Usted ya le dijo que no muchas veces. Una más y listo. Y vuelva, que acá le tenemos un asado.'],
    fin: p => p.final === 'socio' ? ['Volvió… pero con olor a azufre. Dicen que Mandinga le dio la mano y le dejó la cueva cerrada, con usted de llavero.', 'Siéntese igual, que el asado está listo. En este pueblo no se le niega un plato a nadie.'] : ['Volvió. La Salamanca está cerrada y las leyendas vuelven a ser cuentos de fogón.', 'Siéntese, que el asado está listo. Y cuéntenos todo, desde el principio.'],
    premio: {xp: 5000, oro: 5000}, diario: 'Entré a la Salamanca y vencí a Mandinga en su trono.'});

  // la carta que te lleva al norte
  M('carta', {hist: 1, cap: 2, de: 'pampa:vecino', req: ['h2'], n: 'Carta para Puerto Irupé', reg: 'ibera', obj: {tipo: 'hablar', a: 'ibera:vecino'},
    pide: 'Llévele esta carta a mi compadre Celestino, en Puerto Irupé, al norte. Él le va a contar qué pasa en los esteros.',
    fin: '¿Carta de la Eulogia? A ver… Así que es cierto lo de la Salamanca. Acá también se nos puso fea la cosa, mire.', premio: {xp: 120, oro: 40}, diario: 'Le llevé la carta de Doña Eulogia a Don Celestino, en Puerto Irupé.'});

  // Capítulo 2: Agua que traga (Iberá)
  M('i1', {hist: 1, cap: 2, de: 'ibera:vecino', req: pre, n: 'Las canoas que no vuelven', reg: 'ibera', obj: {tipo: 'buscar', pts: PT.remos, n: 4, item: 'remo', que: 'Levantar el remo'},
    pide: ['Desde la noche colorada, las canoas que salen a la laguna no vuelven. Aparecen los remos, nomás, flotando en la orilla.', 'Junte los remos que encuentre alrededor de la laguna grande. Quiero saber de quién son.'],
    fin: 'Este es de los Ojeda, este de Ramírez… Todos de gente que salió de noche. Algo se los tragó.', premio: {xp: 240, oro: 60}, diario: 'Junté cuatro remos en la orilla de la laguna Iberá. Eran de canoeros que salieron de noche y no volvieron.'});
  M('i2', {hist: 1, cap: 2, de: 'ibera:vecino', req: ['i1'], n: 'Lo que canta Ña Lucía', reg: 'ibera', obj: {tipo: 'hablar', a: 'ibera:cantor'},
    pide: 'Ña Lucía sabe los cantos viejos de los esteros. Pregúntele a ella qué es lo que traga canoas.',
    fin: ['Eso es la serpiente con cabeza de loro: Mbói Tu’ĩ. Es hija de Tau y Keraná, y cuida a los bichos del bañado.', 'Pero nunca se comió a nadie. Algo la enojó: le robaron los huevos del nido. Y yo sé quién anda robando huevos de noche: los mbarigüí.'],
    premio: {xp: 120}, diario: 'Ña Lucía dice que es Mbói Tu’ĩ, y que está furiosa porque los mbarigüí le robaron los huevos.'});
  M('i3', {hist: 1, cap: 2, de: 'ibera:cantor', req: ['i2'], n: 'Los huevos del nido', reg: 'ibera', obj: {tipo: 'juntar', bichos: ['mbarigui'], n: 3, p: .45, item: 'huevo de Mbói Tu’ĩ'},
    pide: 'Recupere los huevos. Los mbarigüí los llevan de un lado al otro. Si se los devolvemos a la serpiente, capaz que se calma… o capaz que no.',
    fin: 'Están tibios todavía. Lléveselos a su nido. Si no se calma, ya sabe lo que hay que hacer.', premio: {xp: 260, oro: 70, it: [['asado', 1]]}, diario: 'Les quité tres huevos a los mbarigüí.'});
  M('j_ibera', {hist: 1, cap: 2, de: 'ibera:cantor', req: ['i3'], n: 'Mbói Tu’ĩ', reg: 'ibera', obj: {tipo: 'jefe', reg: 'ibera'},
    pide: 'El nido está en el embalsado del sureste. Vaya con nivel 9 por lo menos, que el graznido hiela la sangre.',
    fin: ['Volvieron las canoas. ¡Volvieron todas! Mbói Tu’ĩ agarró sus huevos y se hundió en el estero.', 'Y le dejó esta pluma, ¿vio? Es la segunda reliquia.'], premio: {xp: 900, oro: 500, it: [['asado', 2], ['retazo', 6]]},
    diario: 'Devolví los huevos y vencí a Mbói Tu’ĩ. Las canoas volvieron a Puerto Irupé.'});

  // Capítulo 3: El monte te mira
  M('m1', {hist: 1, cap: 3, de: 'monte:vecino', req: pre, n: 'El hachero perdido', reg: 'monte', obj: {tipo: 'escoltar', nombre: 'Lucio', mod: 'h_asador', desde: PT.lucio, hasta: [P('monte').x, P('monte').z], dice: ['¿Usted me viene a buscar? Hace tres días que doy vueltas y vuelvo al mismo quebracho.', '¡Espéreme, no camine tan ligero!', 'Ya se ve el humo del pueblo…']},
    pide: ['Lucio, mi sobrino, se fue a hachar quebracho hace tres días y no volvió. Lo vieron dando vueltas en el monte, al oeste.', 'Al que hachea de más, Sachayoj le hace perder el rumbo. Búsquelo y tráigalo de vuelta, por favor.'],
    fin: '¡Lucio! Gracias, gracias. Dice que un viejo de barba de quimil le hablaba entre los árboles.', premio: {xp: 420, oro: 120}, diario: 'Encontré a Lucio, el hachero perdido, y lo traje al Quebrachal.'});
  M('m2', {hist: 1, cap: 3, de: 'monte:vecino', req: ['m1'], n: 'Miel para el dueño del monte', reg: 'monte', obj: {tipo: 'buscar', pts: PT.panales, n: 3, item: 'panal de lechiguana', que: 'Bajar el panal'},
    pide: 'Para que Sachayoj nos deje en paz hay que pagarle al monte con miel de lechiguana, que es lo que más le gusta. Hay panales colgando en la picada del oeste.',
    fin: 'Buena miel. Ahora falta lo más difícil: entregársela.', premio: {xp: 300, oro: 80}, diario: 'Bajé tres panales de lechiguana en la picada.'});
  M('m3', {hist: 1, cap: 3, de: 'monte:vecino', req: ['m2'], n: 'Pedir permiso', reg: 'monte', obj: {tipo: 'accion', x: PT.quebracho[0], z: PT.quebracho[1], que: 'Dejar la miel y pedir permiso', lugar: 'El quebracho viejo', ve: 'El viento se queda quieto. Entre las ramas, algo con barba de quimil te mira… y asiente.'},
    pide: 'Lleve la miel al quebracho viejo, el más grande de la picada, y pida permiso. Con respeto, eh.',
    fin: 'Sachayoj aceptó. Pero me dijo algo más, en sueños: que la Alma Mula anda suelta por el camino viejo, y que eso no es cosa del monte.', premio: {xp: 300, am: 'higa'}, diario: 'Le dejé la miel a Sachayoj en el quebracho viejo. El monte nos dio permiso.'});
  M('j_monte', {hist: 1, cap: 3, de: 'monte:vecino', req: ['m3'], n: 'La Alma Mula', reg: 'monte', obj: {tipo: 'jefe', reg: 'monte'},
    pide: ['La Alma Mula era una mujer que hizo algo muy malo y quedó condenada a galopar echando fuego.', 'Anda por el camino viejo, al sur. Cuando la venza, sáquele la cadena que arrastra: eso la libera.'],
    fin: 'Se escuchó un relincho largo, y después silencio. Por fin descansa. ¿Y esa cadena? Es la tercera reliquia.', premio: {xp: 1400, oro: 800, it: [['asado', 2], ['retazo', 6]]}, diario: 'Vencí a la Alma Mula y le saqué la cadena. Por fin descansa.'});

  // Capítulo 4: Azúcar, humo y pacto
  M('g1', {hist: 1, cap: 4, de: 'ingenio:vecino', req: pre, n: 'Los que no volvieron de la zafra', reg: 'ingenio', obj: {tipo: 'matar', bichos: ['zafrero'], n: 6},
    pide: ['Acá todos saben que el patrón del ingenio firmó con el diablo: riqueza a cambio de un peón por zafra.', 'Los que se llevó el Familiar andan en pena por los cañaverales. Despénelos: seis, por lo menos, para que descansen.'],
    fin: 'Que Dios los tenga en la gloria. Ahora hay que ir a la raíz del asunto: hable con el Turco Asad.', premio: {xp: 520, oro: 140}, diario: 'Despené a seis zafreros que se llevó el Familiar.'});
  M('g2', {hist: 1, cap: 4, de: 'ingenio:vecino', req: ['g1'], n: 'El excapataz', reg: 'ingenio', obj: {tipo: 'hablar', a: 'ingenio:baqueano'},
    pide: 'El Turco Asad fue capataz del ingenio veinte años. Si alguien sabe dónde guarda el patrón sus papeles, es él.',
    fin: ['El contrato… sí, yo lo vi una vez. Papel amarillo, firmado con sangre. El patrón lo escondió en la casona, entre el pueblo y el galpón viejo.', 'Yo no voy a ir. Hice cosas de las que no me enorgullezco. Vaya usted.'],
    premio: {xp: 200}, diario: 'El Turco Asad me dijo que el contrato del patrón está escondido en la casona.'});
  M('g3', {hist: 1, cap: 4, de: 'ingenio:baqueano', req: ['g2'], entrega: 'ingenio:vecino', n: 'El contrato', reg: 'ingenio', obj: {tipo: 'buscar', pts: [PT.contrato], n: 1, item: 'contrato del patrón', que: 'Agarrar el contrato'},
    pide: 'Busque el contrato y lléveselo a Doña Zulema. Ella va a saber qué hacer.',
    fin: '¿Este es el contrato? Firmado con sangre, mire… ¿Y ahora qué hacemos con esto?',
    elegir: [{t: 'Quemarlo en el fogón', dec: 'quemado', txt: '¡Que arda! Mire cómo chilla el papel. Ahora el Familiar no tiene a quién cobrarle… y va a estar furioso.', fama: 15},
      {t: 'Vendérselo al forastero', dec: 'vendido', txt: 'Ahí en la puerta… es el de poncho negro. Le dio una bolsa de plata y se llevó el contrato sin decir nada. Dios sabrá lo que hizo usted.', oro: 400, pacto: 1}],
    premio: {xp: 520}, diario: p => p.dec?.contrato === 'vendido' ? 'Le vendí el contrato al forastero de poncho negro. Pagó bien.' : 'Quemé el contrato del patrón en el fogón de Villa Zafra.', dk: 'contrato'});
  M('j_ingenio', {hist: 1, cap: 4, de: 'ingenio:vecino', req: ['g3'], n: 'El Familiar', reg: 'ingenio', obj: {tipo: 'jefe', reg: 'ingenio'},
    pide: p => p.dec?.contrato === 'vendido' ? 'Usted le vendió el contrato al forastero. Igual el Familiar sigue cobrando: hay que pararlo. Está en el galpón del oeste.' : 'Con el contrato quemado, el Familiar no tiene a quién cobrarle y está furioso. Lo encuentra en el galpón del oeste.',
    fin: 'El perro negro ya no ladra. Esta noche, por primera vez en años, nadie va a desaparecer de la zafra.', premio: {xp: 1800, oro: 1000, it: [['asado', 2], ['retazo', 6]]}, diario: 'Vencí al Familiar en el galpón viejo del ingenio.'});

  // Capítulo 5: Tierra colorada
  M('s1', {hist: 1, cap: 5, de: 'selva:vecino', req: pre, n: 'El chico que siguió al Yasy', reg: 'selva', obj: {tipo: 'escoltar', nombre: 'Tobías', mod: 'h_gaucho', esc: .62, desde: PT.tobias, hasta: [P('selva').x, P('selva').z], dice: ['El Yasy me mostró una cueva llena de oro… ¿Usted me lleva a mi casa?', '¡No me deje solo!', 'Mi mamá me va a retar…']},
    pide: ['A la hora de la siesta, el Yasy Yateré sale con su bastón de oro y silba. Los chicos lo siguen como dormidos.', 'Mi Tobías lo siguió ayer. Lo vieron por la picada guaraní, al sureste. Tráigamelo, por lo que más quiera.'],
    fin: '¡Tobías! … Dice que el Yasy le mostró una cueva llena de oro, cuidada por un lagarto con siete cabezas de perro.', premio: {xp: 700, oro: 160}, diario: 'Encontré a Tobías en la picada y lo traje a la Misión.'});
  M('s2', {hist: 1, cap: 5, de: 'selva:vecino', req: ['s1'], n: 'La Garganta del Diablo', reg: 'selva', obj: {tipo: 'ir', x: PT.salto[0], z: PT.salto[1], r: 10, lugar: 'La Garganta del Diablo',
    ve: ['Dicen los guaraníes que M’Boi, la gran serpiente, quería casarse con Naipí. Pero Naipí se escapó en canoa con Tarobá, río abajo.', 'M’Boi, furioso, partió el río en dos: Naipí quedó convertida en roca, abajo de la cascada, y Tarobá en palmera, arriba, sin poder tocarse nunca más.', 'Cuando sale el arcoíris, dicen, es el abrazo de los dos.']},
    pide: 'Para entender lo que pasa tiene que ver la Garganta del Diablo, al oeste, donde el río se cae de la selva. Ahí empezó todo, hace mucho.',
    fin: '¿Vio el arcoíris? Entonces Naipí y Tarobá están de su lado. M’Boi es pariente del Teyú Yaguá: ojo con él.', premio: {xp: 600, oro: 100}, diario: 'Fui a la Garganta del Diablo. Ahí M’Boi partió el río para separar a Naipí y Tarobá.'});
  M('s3', {hist: 1, cap: 5, de: 'selva:baqueano', req: ['s2'], n: 'Las piedras de la misión', reg: 'selva', obj: {tipo: 'buscar', pts: PT.piedras, n: 4, item: 'piedra tallada', que: 'Levantar la piedra tallada'},
    pide: 'En los alrededores de la misión hay piedras talladas que los guaraníes usaban para espantar al Teyú Yaguá. Junte cuatro: con eso no le va a poder echar fuego a la cara.',
    fin: 'Estas son. Mire los dibujos: un lagarto con siete cabezas, y un sol encima.', premio: {xp: 700, oro: 150}, diario: 'Junté cuatro piedras talladas de la misión.'});
  M('j_selva', {hist: 1, cap: 5, de: 'selva:baqueano', req: ['s3'], n: 'El Teyú Yaguá', reg: 'selva', obj: {tipo: 'jefe', reg: 'selva'},
    pide: 'La cueva del Teyú está al sur, en lo más cerrado del monte. Lleve las piedras y no se deje encandilar por el oro.',
    fin: 'Se apagó el brillo de la cueva. Dicen que el Teyú se fue a dormir para siempre. Y esa escama es la quinta reliquia, ¿no?', premio: {xp: 2200, oro: 1200, it: [['asado', 2], ['retazo', 6]]}, diario: 'Vencí al Teyú Yaguá en su cueva.'});

  // Capítulo 6: Viento blanco
  M('c1', {hist: 1, cap: 6, de: 'cuyo:vecino', req: pre, n: 'Agua para la Difunta', reg: 'cuyo', obj: {tipo: 'juntar', bichos: ['arriero'], n: 3, p: .5, item: 'botella de agua'},
    pide: ['Deolinda Correa siguió a su marido por el desierto con el hijo en brazos. Murió de sed, pero el chico sobrevivió prendido a ella.', 'Desde entonces se le deja agua en el camino. Los arrieros helados que bajan de la cordillera le robaron las botellas al santuario. Recupere tres.'],
    fin: 'Ahora llévelas usted mismo al santuario. Así se hace.', premio: {xp: 700, oro: 160}, diario: 'Les quité tres botellas de agua a los arrieros helados.'});
  M('c2', {hist: 1, cap: 6, de: 'cuyo:vecino', req: ['c1'], n: 'La promesa', reg: 'cuyo', obj: {tipo: 'accion', x: PT.difunta.x, z: PT.difunta.z, que: 'Dejar las botellas', lugar: 'El santuario de la Difunta', ve: 'Acomodás las botellas. Una brisa tibia te pasa por la cara, como un gracias.'},
    pide: 'Déjelas en el santuario de la Difunta Correa, sobre el camino. Y pida algo, que ella cumple.',
    fin: 'Ahora sí. La Difunta lo va a cuidar en la cordillera. Hable con Don Cosme, que conoce el paso.', premio: {xp: 500, am: 'estampita'}, diario: 'Les devolví el agua a la Difunta Correa.'});
  M('c3', {hist: 1, cap: 6, de: 'cuyo:vecino', req: ['c2'], n: 'El Futre sin cabeza', reg: 'cuyo', obj: {tipo: 'hablar', a: 'cuyo:baqueano'},
    pide: 'Don Cosme cruzó la cordillera cien veces. Pregúntele por el Futre.',
    fin: ['El Futre era un minero rico, de levita y bastón de plata, al que mataron por avaro. Ahora pasea sin cabeza por el paso, buscando su oro.', 'Desde el mirador del oeste se ve el paso entero. Vaya y mire bien antes de bajar.'],
    premio: {xp: 300}, diario: 'Don Cosme me contó la historia del Futre, el minero avaro sin cabeza.'});
  M('c4', {hist: 1, cap: 6, de: 'cuyo:baqueano', req: ['c3'], n: 'El techo de América', reg: 'cuyo', obj: {tipo: 'ir', x: PT.mirador[0], z: PT.mirador[1], r: 9, lugar: 'El mirador del Aconcagua', ve: ['Desde el mirador se ve el Aconcagua, blanco y enorme, el cerro más alto de América.', 'Y abajo, en el paso, una figura de levita sin cabeza camina en círculos, contando monedas que no tiene.']},
    pide: 'Suba al mirador del Aconcagua, al oeste. Desde ahí se ve el paso del Futre.',
    fin: 'Entonces sigue ahí, contando su plata. Vaya a buscarlo: el paso está al norte del mirador.', premio: {xp: 600, oro: 140}, diario: 'Desde el mirador vi el Aconcagua y al Futre caminando en círculos por el paso.'});
  M('j_cuyo', {hist: 1, cap: 6, de: 'cuyo:baqueano', req: ['c4'], n: 'El Futre', reg: 'cuyo', obj: {tipo: 'jefe', reg: 'cuyo'},
    pide: 'Al Futre no le importa nada más que su oro. Péguele y no le mire el bastón.',
    fin: 'Dicen que encontraron su cabeza, por fin, y que descansa. Y ese pañuelo de seda es la sexta reliquia.', premio: {xp: 2600, oro: 1400, it: [['asado', 2], ['retazo', 6]]}, diario: 'Vencí al Futre en el paso de la cordillera.'});

  // Capítulo 7: Siete colores
  M('u1', {hist: 1, cap: 7, de: 'puna:vecino', req: pre, n: 'Los diablitos del carnaval', reg: 'puna', obj: {tipo: 'matar', bichos: ['diablito'], n: 6},
    pide: ['Terminó el carnaval y los diablitos no quieren volver a enterrarse. Andan bailando por los cerros, con espejos y cascabeles.', 'Ayúdenos a juntarlos: despache seis.'],
    fin: 'Ya se cansaron de bailar. Ahora hay que enterrar el carnaval como corresponde.', premio: {xp: 900, oro: 200}, diario: 'Despaché seis diablitos que no querían volver a enterrarse.'});
  M('u2', {hist: 1, cap: 7, de: 'puna:vecino', req: ['u1'], n: 'Enterrar el carnaval', reg: 'puna', obj: {tipo: 'accion', x: PT.apacheta.x, z: PT.apacheta.z, que: 'Enterrar al Pujllay', lugar: 'La apacheta', ve: 'Ponés la piedra. A lo lejos se escucha una caja y una copla que se apaga despacito.'},
    pide: 'Hay que enterrar al Pujllay en la apacheta, con una piedra y un pedido a la Pachamama.',
    fin: 'Hasta el año que viene, Pujllay. Ahora Doña Quispe lo necesita: algo pasa con las vicuñas.', premio: {xp: 600}, diario: 'Enterramos el carnaval en la apacheta.'});
  M('u3', {hist: 1, cap: 7, de: 'puna:baqueano', req: ['u2'], n: 'El dueño de las vicuñas', reg: 'puna', obj: {tipo: 'hablar', a: 'campo:coquena'},
    pide: 'Coquena, el que cuida las vicuñas, quiere hablar con usted. Lo va a encontrar cerca de las Salinas Grandes, al oeste. Es chiquito, no lo pise.',
    fin: ['Yo cuido las vicuñas y las llamas de estos cerros. Al que caza de más, se lo cobro.', 'La Huayrapuca, la de las alas de fuego, me espanta los animales. Véncela, y cualquier vicuña te va a dejar subir. Y trepan por donde nadie trepa.'],
    premio: {xp: 700, oro: 150}, diario: 'Coquena, el dueño de las vicuñas, me pidió que venza a la Huayrapuca.'});
  M('j_puna', {hist: 1, cap: 7, de: 'puna:baqueano', req: ['u3'], n: 'La Huayrapuca', reg: 'puna', obj: {tipo: 'jefe', reg: 'puna'},
    pide: 'El nido de la Huayrapuca está al oeste, entre los cerros. Abríguese, que allá arriba el viento corta.',
    fin: 'Las vicuñas bajaron a la vega. Coquena le manda decir gracias. Y esa pluma colorada es la séptima reliquia.', premio: {xp: 3000, oro: 1600, it: [['asado', 2], ['retazo', 6]]}, diario: 'Vencí a la Huayrapuca. Las vicuñas volvieron.'});

  // Capítulo 8: Viento, piedra y lago
  M('z1', {hist: 1, cap: 8, de: 'sur:vecino', req: pre, n: 'El kultrún robado', reg: 'sur', obj: {tipo: 'buscar', pts: [PT.kultrun], n: 1, item: 'kultrún', que: 'Levantar el kultrún'},
    pide: ['El kalku me robó el kultrún, el tambor sagrado. Sin él no puedo hacer la rogativa, y el viento no para.', 'Lo escondió entre los chenques, las tumbas de piedra del valle, al norte.'],
    fin: 'Mi kultrún. Escuche: todavía suena.', premio: {xp: 900, oro: 200}, diario: 'Recuperé el kultrún de la machi Ayelén entre los chenques.'});
  M('z2', {hist: 1, cap: 8, de: 'sur:vecino', req: ['z1'], n: 'La rogativa', reg: 'sur', obj: PT.rehue ? {tipo: 'accion', x: PT.rehue.x, z: PT.rehue.z, que: 'Acompañar la rogativa', lugar: 'El rehue', ve: 'La machi toca el kultrún. El viento se calma de golpe… y en el lago algo enorme asoma el lomo y se vuelve a hundir.'} : {tipo: 'hablar', a: 'sur:cantor'},
    pide: 'Acompáñeme al rehue, el poste sagrado. Vamos a pedirle al viento que se calme.',
    fin: 'Elëngásëm despertó en la meseta, al sur. Es el dueño de las piedras y del frío. Para cerrar la Salamanca, va a tener que enfrentarlo.', premio: {xp: 800, am: 'luna'}, diario: 'Acompañé la rogativa en el rehue. El viento se calmó.'});
  M('j_sur', {hist: 1, cap: 8, de: 'sur:vecino', req: ['z2'], n: 'Elëngásëm', reg: 'sur', obj: {tipo: 'jefe', reg: 'sur'},
    pide: 'La meseta de Elëngásëm está al suroeste. Vaya con el corazón tranquilo: el kultrún lo acompaña.',
    fin: 'La piedra de Elëngásëm es la última reliquia que le faltaba a más de uno. Vaya, que la Salamanca lo espera.', premio: {xp: 3400, oro: 1800, it: [['asado', 2], ['retazo', 6]]}, diario: 'Vencí a Elëngásëm en la meseta.'});
  // curiosidades
  M('x_nahuel', {cap: 8, de: 'sur:cantor', n: '¿Existe el Nahuelito?', reg: 'sur', obj: {tipo: 'ir', x: PT.nahuel[0], z: PT.nahuel[1], r: 9, noche: 1, lugar: 'La orilla del lago del Arrayán', ve: ['Al principio, nada. Después, unas burbujas.', 'Y de golpe, en el medio del lago, asoma un cuello larguísimo, te mira un segundo y se hunde sin ruido.']},
    pide: 'Mi abuelo juraba que en el lago grande del oeste vive el Nahuelito. Vaya de noche a la orilla y mire bien. Si lo ve, no le cuente a nadie… bueno, a mí sí.',
    fin: '¿Lo vio? ¡Lo vio! Yo sabía. Tome, por guardar el secreto.', premio: {xp: 700, oro: 220, am: 'carbunclo'}, diario: 'Vi al Nahuelito asomar en el lago del Arrayán. Nadie me va a creer.'});
  M('x_cirilo', {cap: 1, de: 'campo:cirilo', n: 'Desde la loma', reg: 'pampa', obj: {tipo: 'ir', x: 88, z: 46, r: 8, lugar: 'La cima de las Lomas del Tala', ve: 'Desde la loma se ve el pago entero: el ombú del pueblo, el río, y bien al norte, un resplandor colorado sobre la Salamanca.'},
    pide: 'Suba a la loma de acá atrás y mire para el norte. Después me cuenta si se ve lo que yo veo todas las noches.',
    fin: '¿Vio el resplandor? Desde la noche colorada no se apaga. Tome, para el camino.', premio: {xp: 120, oro: 40, it: [['mate', 2]]}, diario: 'Desde las Lomas del Tala se ve el resplandor colorado de la Salamanca.'});
  M('x_baqueana', {cap: 6, de: 'campo:baqueana', n: 'Viento blanco', reg: 'cuyo', obj: {tipo: 'matar', bichos: ['remolino'], n: 4},
    pide: 'Los remolinos de viento blanco bajan del paso y tiran abajo las pircas. Despache cuatro y le cuento un secreto del cerro.',
    fin: 'El secreto: cuando cae la tarde, desde acá arriba el Aconcagua se pone rosado. Quédese a verlo alguna vez.', premio: {xp: 900, oro: 200, it: [['cana', 1]]}, diario: 'Despaché cuatro remolinos para la Baqueana del Mirador.'});
}

// ---------- el forastero de poncho negro: después de cada jefe te ofrece un trato ----------
export const TRATOS = {
  pampa: {ofrece: 'Linda pelea, paisano. Le ofrezco que nunca más le falte la plata. Nada más tiene que darme la mano.', da: {oro: 500}, si: 'Le dio la mano. Estaba fría como una piedra de río.'},
  ibera: {ofrece: 'Las serpientes me hacen caso, ¿sabía? Puedo hacer que ningún bicho del agua lo moleste más. Solo le pido un favor… para más adelante.', da: {am: 'pata'}, si: 'Asintió. Sintió algo frío enroscándose en el tobillo, y después nada.'},
  monte: {ofrece: 'La Alma Mula era de las mías. Me la sacó, y yo no guardo rencor: tome esta caña que nunca se termina. Brinde conmigo.', da: {it: [['cana', 3]]}, si: 'Brindaron. La caña era dulce y quemaba como brasa.'},
  ingenio: {ofrece: 'El Familiar trabajaba para mí. Ahora me falta un cobrador… Usted tiene pasta. Le pago por adelantado.', da: {oro: 1200}, si: 'Agarró la bolsa. Pesaba más de lo que parecía.'},
  selva: {ofrece: 'El oro del Teyú es suyo si quiere. Toda la cueva. Solamente tiene que dejarme entrar a su sombra.', da: {oro: 1600}, si: 'Le dejó entrar. Desde entonces su sombra llega un poquito tarde.'},
  cuyo: {ofrece: 'El Futre era avaro, yo no. Le regalo su bastón de plata: con eso no lo para nadie. A cambio, un poquito de su suerte.', da: {am: 'cuerito'}, si: 'Le dio el bastón. Pesaba como un remordimiento.'},
  puna: {ofrece: 'Usted ya casi tiene la llave entera. ¿Para qué cerrar la Salamanca? Ábrala conmigo y repartimos.', da: {oro: 2000}, si: 'Le dio la mano. El cielo se puso colorado un segundo.'},
  sur: {ofrece: 'Última oportunidad, paisano. Firme acá y entra a la Salamanca como socio, no como enemigo.', da: {oro: 2500}, si: 'Firmó. La tinta era tibia.'},
};
export const NOMBRE_FORASTERO = 'El Forastero';

// para buscar a alguien por id (pueblo:rol o campo:nombre)
export function quien(id, npcs) { return npcs.find(n => n.id === id); }
export {xz};
