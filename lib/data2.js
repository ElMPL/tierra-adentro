// Contenido nuevo: armas, reliquias, personajes, monstruos, jefes, destrezas, amuletos y promesas
import {WEAPONS,PASS,CHARS,ENEMIES,BOSSES,SHOP,DICHOS,PICK} from './data.js';
Object.assign(WEAPONS,{
 lazo:{n:'Lazo',d:'Enlaza hacia adelante y arrastra a los enemigos hacia vos.',b:{dmg:17,cd:1.6,n:1,area:6},u:[{dmg:6},{area:.8},{n:1},{dmg:8},{cd:-.25},{area:1},{n:1}],ev:'cabresto',en:'Lazo de la Yerra',ed:'Enlaza en redondo, junta a todos y los revienta contra el piso.',lk:1},
 kultrun:{n:'Kultrún',d:'Cada golpe despierta un espíritu que persigue.',b:{dmg:12,cd:1.5,n:2,spd:9,pierce:1,dur:2.2},u:[{n:1},{dmg:4},{pierce:1},{n:1},{dmg:5},{cd:-.25},{n:2}],ev:'cencerro',en:'Rogativa',ed:'Los espíritus estallan y te devuelven vida.',lk:1},
 acordeon:{n:'Acordeón',d:'Abre y empuja, cierra y chupa. Siempre para adelante.',b:{dmg:14,cd:1.3,n:1,area:5},u:[{dmg:4},{area:.6},{cd:-.15},{dmg:4},{n:1},{area:.7},{dmg:5}],ev:'fuelle',en:'Chamamé Maceta',ed:'Suena para los cuatro lados y aturde.',lk:1},
 machete:{n:'Machete',d:'Dos tajos cruzados. Crítico alto.',b:{dmg:19,cd:1.15,n:2,area:2.7},u:[{dmg:6},{area:.35},{cd:-.12},{n:1},{dmg:8},{area:.4},{n:1}],ev:'azucar',en:'La Zafra',ed:'Cada golpe larga astillas de caña que atraviesan.',lk:1},
 garras:{n:'Garras',d:'Salta al más cercano y lo destroza. Cura un poco.',b:{dmg:10,cd:.85,n:3,area:2.3},u:[{dmg:4},{n:1},{area:.3},{dmg:5},{n:1},{cd:-.15},{dmg:7}],ev:'colmillo',en:'Séptimo Hijo',ed:'Tajos enormes que desangran y curan el doble.',lk:1},
 talco:{n:'Talco de Carnaval',d:'Bombas de talco que ciegan y frenan.',b:{dmg:7,cd:2.3,n:1,area:2.3,dur:3},u:[{n:1},{dmg:3},{area:.35},{dur:.8},{n:1},{dmg:4},{cd:-.5}],ev:'espejo',en:'Carnaval Grande',ed:'Cada nube revienta en serpentinas.',lk:1},
 trabuco:{n:'Trabuco',d:'Perdigonada corta con un empujón bárbaro.',b:{dmg:9,cd:1.7,n:5,spd:20,pierce:0},u:[{n:1},{dmg:3},{n:2},{cd:-.2},{pierce:1},{dmg:4},{n:2}],ev:'polvora',en:'Trabuco Naranjero',ed:'Cada perdigón explota.',lk:1},
 honda:{n:'Honda',d:'Una piedra que rebota de enemigo en enemigo.',b:{dmg:19,cd:1.35,n:1,pierce:3,spd:15},u:[{pierce:1},{dmg:7},{n:1},{pierce:2},{dmg:8},{cd:-.25},{n:1}],ev:'piedrita',en:'Honda de la Puna',ed:'La piedra se parte en dos cada vez que pega.',lk:1},
 hornero:{n:'Hornero',d:'Planta un nido que tira barro solo.',b:{dmg:9,cd:5,n:1,dur:7,area:9},u:[{dmg:3},{dur:1.5},{n:1},{dmg:4},{cd:-.8},{dmg:5},{n:1}],ev:'barro',en:'Casal de Horneros',ed:'Tiran doble y a quien se acerca le dan un escudo.',lk:1},
 zonda:{n:'Remolino del Zonda',d:'Un remolino que arrastra lo que toca.',b:{dmg:7,cd:3.6,n:1,area:1.7,dur:4,spd:5},u:[{dmg:3},{n:1},{area:.3},{dur:1},{dmg:4},{n:1},{cd:-.7}],ev:'pluma',en:'Viento Blanco',ed:'Remolinos enormes que congelan.',lk:1},
});
Object.assign(PASS,{
 cabresto:{n:'Cabresto',d:'+6% área, +8% duración',m:5,f:s=>{s.area+=.06;s.dur+=.08},lk:1},
 cencerro:{n:'Cencerro',d:'+25% imán, +6% experiencia',m:5,f:s=>{s.mag*=1.25;s.xp+=.06},lk:1},
 fuelle:{n:'Fuelle de Herrero',d:'+5% área, −4% recarga',m:5,f:s=>{s.area+=.05;s.cdr*=.96},lk:1},
 azucar:{n:'Terrón de Azúcar',d:'+6% velocidad, +6% daño',m:5,f:s=>{s.spd*=1.06;s.might+=.06},lk:1},
 colmillo:{n:'Colmillo',d:'Robás 0,6% del daño como vida',m:5,f:s=>s.leech+=.006,lk:1},
 espejo:{n:'Espejito',d:'+5% esquive, +10% suerte',m:5,f:s=>{s.dodge+=.05;s.luck+=.1},lk:1},
 polvora:{n:'Cuerno de Pólvora',d:'Los críticos pegan 18% más fuerte',m:5,f:s=>{s.cdmg+=.18;s.crit+=.02},lk:1},
 piedrita:{n:'Piedra de Apacheta',d:'+1 armadura, +12 vida',m:5,f:s=>{s.armor+=1;s.hp+=12},lk:1},
 barro:{n:'Barro de Hornero',d:'Un escudo que frena un golpe cada tanto',m:5,f:s=>s.shield+=1,lk:1},
 pluma:{n:'Pluma de Ñandú',d:'Esquivás 12% más seguido, +4% velocidad',m:5,f:s=>{s.dash*=.88;s.spd*=1.04},lk:1},
});
CHARS.malambista.lock='Vencé a la Alma Mula';CHARS.asador.lock='Vencé al Lobizón';CHARS.carpincho.lock='Sacá un JACKPOT';
Object.assign(CHARS,{
 domadora:{n:'La Juana',t:'Domadora',w:'lazo',d:'+8% velocidad, +12% área. Monta de memoria.',f:s=>{s.spd*=1.08;s.area+=.12},ult:'Tropilla',ud:'Siete caballos pasan por arriba de todo',lock:'Ganá La Pampa en Criollo'},
 chamamecero:{n:'Chirú Pintos',t:'Chamamecero',w:'acordeon',d:'+15% área, +10% vida a los compañeros cerca.',f:s=>{s.area+=.15;s.aura=1},ult:'Sapucay Correntino',ud:'Empuja todo y acelera las armas de todos',lock:'Ganá los Esteros del Iberá'},
 zafrera:{n:'Crisanta',t:'Pelacaña',w:'machete',d:'+12% crítico, +8% daño.',f:s=>{s.crit+=.12;s.might+=.08},ult:'Desmonte',ud:'Tajos por todo el campo',lock:'Ganá El Ingenio'},
 pujllay:{n:'Pujllay',t:'Diablito del carnaval',w:'talco',d:'+25% suerte, +8% esquive. Se ríe de todo.',f:s=>{s.luck+=.25;s.dodge+=.08},ult:'Desentierro',ud:'Los enemigos bailan y se pegan entre ellos',lock:'Ganá La Puna y la Quebrada'},
 machi:{n:'Ayelén',t:'Machi',w:'kultrun',d:'+15% duración, +0,6 vida/s.',f:s=>{s.dur+=.15;s.regen+=.6},ult:'Nguillatún',ud:'Espíritus, curación y escudo para todos',lock:'Ganá La Patagonia'},
 septimo:{n:'El Séptimo',t:'Séptimo hijo varón',w:'garras',d:'Con menos vida pega más fuerte. +6% velocidad.',f:s=>{s.spd*=1.06;s.rage=1},ult:'Luna Llena',ud:'Se transforma: rápido, feroz y se cura pegando',lock:'Vencé al Lobizón en Matrero'},
});
Object.assign(ENEMIES,{
 chancha:{n:'Chancha con Cadenas',d:'Sale de noche cerca de las estaciones y hace un ruido infernal con lo que arrastra.',hp:46,spd:2.9,dmg:13,r:.65,xp:3,s:1.05,ai:'charge',tip:'Cuando para y brilla, va a embestir. Correte de costado.'},
 jinete:{n:'Jinete de Ánimas',d:'Resero que murió sin llegar. Sigue al galope buscando la tropa.',hp:44,spd:6.2,dmg:13,r:.65,xp:4,s:1,ai:'ride',tip:'No dobla bien. Dejalo pasar.'},
 kakuy:{n:'Kakuy',d:'Muchacha egoísta que se volvió pájaro. Llama a su hermano toda la noche: “¡turay!”.',hp:34,spd:3.4,dmg:11,r:.5,xp:3,s:1.05,ai:'dive',fly:1,tip:'Se queda quieta un instante antes de caer.'},
 telesita:{n:'Ánima de la Telesita',d:'Baila prendida fuego por el monte de Figueroa.',hp:58,spd:3.2,dmg:11,r:.5,xp:5,s:1.05,ai:'dance',fly:1,tip:'Deja fuego donde baila. Cortale la ronda.'},
 sachayoj:{n:'Sachayoj',d:'El dueño del monte santiagueño. Castiga al que tala de más.',hp:190,spd:1.7,dmg:20,r:.9,xp:9,s:1,ai:'root',tip:'Sus raíces salen donde estás parado.'},
 mbarigui:{n:'Mbarigüí',d:'La plaga chiquita del estero. De a uno no es nada.',hp:9,spd:4.4,dmg:5,r:.4,xp:1,s:1,fly:1,ai:'float'},
 yacare:{n:'Yacaré de Ánimas',d:'Viejo como el estero. En el agua es el doble de rápido.',hp:74,spd:2.2,dmg:17,r:.75,xp:5,s:1,ai:'snap',tip:'Peleálo en tierra seca.'},
 irupe:{n:'Irupé Hambriento',d:'La flor que fue muchacha. Cuando la luna no baja, se cobra con el que pasa.',hp:60,spd:0,dmg:11,r:.75,xp:5,s:1,ai:'plant',bc:[1,.5,.85],tip:'No camina, pero se hunde y sale en otro lado.'},
 carau:{n:'Carau',d:'Cambió el velorio de la madre por un baile. Desde entonces anda de luto.',hp:30,spd:3.6,dmg:10,r:.5,xp:3,s:1.05,ai:'dive',tip:'Corre, salta y pica. Tres tiempos.'},
 yasy:{n:'Yasy Yateré',d:'Chico rubio de bastón de oro. Silba a la siesta y el que escucha lo sigue.',hp:52,spd:3,dmg:9,r:.42,xp:6,s:1.1,ai:'charm',tip:'Salí del círculo antes de que termine el silbo.'},
 kurupi:{n:'Kurupí',d:'Petiso, feo y con los pies al revés. Enlaza con un bejuco larguísimo.',hp:48,spd:3,dmg:12,r:.5,xp:4,s:1.1,ai:'lasso',tip:'El lazo va derecho: esquivá de lado.'},
 caapora:{n:'Caá Porá',d:'Gigante peludo que fuma en pipa, montado en un chancho del monte.',hp:260,spd:2.3,dmg:22,r:1.05,xp:11,s:1,ai:'slam',tip:'Pega fuerte pero avisa.'},
 yaguarete:{n:'Yaguareté-Abá',d:'Hechicero viejo que se volvió tigre y ya no supo volver.',hp:64,spd:4,dmg:16,r:.65,xp:5,s:1.05,ai:'leap',tip:'El círculo marca dónde cae.'},
 zafrero:{n:'Zafrero en Pena',d:'Peón que no volvió de la zafra. El pacto se lo llevó.',hp:18,spd:2.6,dmg:9,r:.5,xp:1,s:1},
 mikilo:{n:'Mikilo',d:'Mitad perro, mitad pájaro. Anda a la siesta por el cañaveral.',hp:36,spd:4.6,dmg:10,r:.45,xp:3,s:1.1,ai:'hop',tip:'Va a los saltos y es difícil de apuntar.'},
 uturunco:{n:'Runa Uturunco',d:'Se revuelca en un cuero de tigre y deja de ser cristiano.',hp:90,spd:3.6,dmg:17,r:.65,xp:6,s:1.1,ai:'leap',tip:'Herido se pone más rápido.'},
 capataz:{n:'Capataz sin Sombra',d:'Firmó por el patrón. Su látigo apura a los muertos.',hp:110,spd:2.2,dmg:15,r:.55,xp:7,s:1.1,ai:'whip',buff:1,tip:'Mientras viva, los que están cerca corren más.'},
 diablito:{n:'Diablito de Carnaval',d:'Baja del cerro cuando se desentierra a Pujllay. Espejos, cascabeles y talco.',hp:17,spd:3,dmg:8,r:.48,xp:1,s:1,ai:'talc'},
 huaca:{n:'Huaca Despierta',d:'Piedra sagrada que nadie tendría que haber movido.',hp:230,spd:1.6,dmg:22,r:.95,xp:9,s:1,ai:'slam',arm:.55,tip:'De frente aguanta. Dale por la espalda.'},
 arriero:{n:'Arriero Helado',d:'Lo agarró el viento blanco en el paso y sigue cruzando.',hp:20,spd:2.4,dmg:9,r:.5,xp:1,s:1,ai:'cold'},
 remolino:{n:'Remolino',d:'Adentro anda el diablo, dicen. Cuchillo en cruz y se deshace.',hp:40,spd:3.3,dmg:9,r:.6,xp:4,s:1,ai:'whirl',fly:1,tip:'Te chupa si estás cerca.'},
 condor:{n:'Cóndor Agorero',d:'Da vueltas alto y baja cuando nadie mira.',hp:56,spd:4,dmg:15,r:.7,xp:5,s:1,ai:'dive',fly:1,tip:'Mirá la sombra.'},
 minero:{n:'Minero Enterrado',d:'Se le vino el cerro encima y salió por otro lado.',hp:60,spd:2.6,dmg:15,r:.5,xp:4,s:1.05,ai:'dig',tip:'Sale de abajo tuyo. No te quedes quieto.'},
 pericana:{n:'Pericana',d:'Vieja altísima de dientes largos. Con lanas de colores junta a los chicos que no duermen la siesta.',hp:150,spd:2.4,dmg:17,r:.6,xp:8,s:1.05,ai:'whip',tip:'Su látigo llega lejos.'},
 chonchon:{n:'Chonchón',d:'Cabeza de brujo que vuela con las orejas. Grita “tué, tué”.',hp:16,spd:3.4,dmg:8,r:.45,xp:1,s:1,ai:'float',fly:1},
 gualicho:{n:'Bola del Gualicho',d:'Corre al lado del viajero leguas enteras. Dicen que no hay que tenerle miedo.',hp:40,spd:3,dmg:13,r:.6,xp:4,s:1,ai:'roll',tip:'Rueda derecho y deja fuego.'},
 anchimallen:{n:'Anchimallén',d:'Lucecita con forma de nena. Presagio malo.',hp:22,spd:4.4,dmg:16,r:.4,xp:3,s:1,ai:'kami',fly:1,tip:'Explota. Matala de lejos.'},
 cuero:{n:'Cuero',d:'Pellejo con uñas que se hace el tronco en la orilla y envuelve al que lo pisa.',hp:84,spd:2,dmg:16,r:.9,xp:6,s:1,ai:'ambush',tip:'Si ves un cuero en el piso, no lo pises.'},
 kalku:{n:'Kalku',d:'Brujo que trabaja con los espíritus malos. Manda chonchones.',hp:100,spd:2.2,dmg:13,r:.5,xp:8,s:1.1,ai:'summon',bc:[.6,1,.3],tip:'Matalo primero.'},
 condenado:{n:'Condenado',d:'Firmó por bailar lindo. Ahora no puede parar.',hp:22,spd:2.8,dmg:11,r:.5,xp:2,s:1},
 chivo:{n:'Chivo Hediondo',d:'Primera prueba de la cueva: aguantarle el olor y los ojos.',hp:80,spd:3.2,dmg:16,r:.65,xp:5,s:1,ai:'charge',stink:1,tip:'Donde frena deja una nube.'},
 culebron:{n:'Culebrón',d:'Serpiente peluda. Hay que aguantar el apretón para seguir.',hp:130,spd:2.6,dmg:18,r:.75,xp:8,s:1,ai:'spit',bc:[.8,1,.2],tip:'Escupe charcos. No te quedes en el verde.'},
 bruja:{n:'Salamanquera',d:'Aprendió todo lo que quería. No hace sombra.',hp:76,spd:2.8,dmg:13,r:.5,xp:6,s:1.05,ai:'curse',fly:1,bc:[1,.4,.1],tip:'Sus fuegos te siguen: rompelos esquivando.'},
});
ENEMIES.vinchuca.d='Sale del techo de paja y no perdona. Es la plaga del monte chaqueño.';
ENEMIES.familiar.n='Cachorro del Familiar';ENEMIES.familiar.d='Cría del perro del diablo. Huele el miedo del peón.';ENEMIES.familiar.hp=56;ENEMIES.familiar.xp=4;
ENEMIES.aoao.hp=24;ENEMIES.aoao.xp=1;ENEMIES.umita.xp=2;
ENEMIES.basilisco.d='Gusano con un solo ojo que encandila. Es la última prueba de la Salamanca: si te mira primero, perdiste.';
Object.assign(BOSSES,{
 mboitui:{n:'Mbói Tu’ĩ',d:'Segundo hijo de Tau y Keraná. Serpiente enorme con cabeza de loro, dueña de los esteros y de todo bicho de agua. Su graznido se oye a leguas.',sub:'Señor de los esteros',hp:1,spd:2.8,dmg:22,r:1.7,s:1.05,col:[.3,1,.5]},
 elfamiliar:{n:'El Familiar',d:'El diablo del ingenio. Perro negro del tamaño de un toro, ojos de fuego y cadenas. Se come un peón por zafra y a cambio el patrón se hace rico.',sub:'Un peón por zafra',hp:1,spd:4,dmg:24,r:1.5,s:1.05,col:[1,.3,.1]},
 huayrapuca:{n:'Huayrapuca',d:'La madre del viento de los diaguitas. Dos cabezas, plumas y un capricho: cuando se enoja no queda techo en el valle.',sub:'Madre del viento',hp:1,spd:3.4,dmg:22,r:1.6,s:1,col:[.75,.55,1]},
 elengassen:{n:'Elëngásëm',d:'Gigante tehuelche con coraza de piedra en el lomo. Autor de las pinturas y dueño de los huesos enormes de la meseta. Solo se lo hiere en el vientre.',sub:'El padre de las piedras',hp:1,spd:2.2,dmg:28,r:1.8,s:1,col:[1,.6,.25]},
 nahuelito:{n:'Nahuelito',d:'Lo que sea que vive en el Nahuel Huapi. Los del lugar lo vieron siempre. Los de afuera, desde 1922.',sub:'Lo que hay en el lago',hp:1,spd:2.4,dmg:24,r:1.8,s:1,col:[.4,.85,1]},
 torosupay:{n:'El Toro Súpay',d:'Toro negro de aspas de oro y fuego en la nariz. Aparece cuando alguien firmó un pacto, y siempre viene a cobrar.',sub:'Aspas de oro, aliento de fuego',hp:1,spd:3.6,dmg:26,r:1.5,s:1.05,col:[1,.65,.1]},
 monai:{n:'Moñái',d:'Tercer hijo de Tau y Keraná. Serpiente con dos cuernos de colores que hipnotizan. Robaba de todo y lo escondía en una cueva; Porâsý se sacrificó para vencerlo.',sub:'El de los cuernos de colores',hp:1,spd:3,dmg:24,r:1.7,s:1.05,col:[1,.5,.15]},
});
export const ALLB=['lobizon','almamula','mboitui','elfamiliar','teyu','huayrapuca','futre','elengassen','mandinga','torosupay','monai','nahuelito'];
BOSSES.almamula.d='Mujer castigada a ser mula. Galopa echando fuego por la boca, con un llanto de mujer mezclado con rebuzno, y arrastra cadenas que pesan como sus pecados.';
// ---- TIENDA: íconos propios ----
SHOP.vida.i='puchero';SHOP.vel.i='alpargata';SHOP.xp.i='libro';SHOP.oro.i='tirador';SHOP.dano.i='piedra';
Object.assign(SHOP,{
 reg:{n:'Yuyos',i:'yerba',d:'+0,2 vida por segundo',m:4,c:110,f:(s,l)=>s.regen+=.2*l},
 arm:{n:'Coleto',i:'escudo',d:'+0,6 armadura',m:4,c:120,f:(s,l)=>s.armor+=.6*l},
 rec:{n:'Reloj del Ferrocarril',i:'cuerdas',d:'−3% recarga',m:4,c:140,f:(s,l)=>s.cdr*=1-.03*l},
 mez:{n:'Mazo Usado',i:'naipe',d:'+1 mezcla por partida',m:3,c:150,f:(s,l)=>s.rer+=l},
});
// ---- DESTREZAS (segunda habilidad, con recarga) ----
export const SKILLS={
 pialada:{n:'Pialada',i:'lazo',cd:11,d:'Enlaza a todos los de cerca, los junta y los aturde.'},
 poncho:{n:'Poncho al brazo',i:'escudo',cd:13,d:'Dos segundos sin recibir daño. Devuelve las balas.'},
 cebar:{n:'Cebar mate',i:'mate',cd:22,d:'Cura 25% a vos y 15% a los que estén cerca.'},
 caballo:{n:'¡Al galope!',i:'caballoI',cd:20,d:'Montás cuatro segundos: veloz, invencible y atropellás.',lk:1},
 trampera:{n:'Trampera',i:'trampa',cd:9,d:'Deja tres cepos que muerden y explotan.',lk:1},
 fogon:{n:'Armar fogón',i:'brasa',cd:20,d:'Un fuego que cura a los tuyos y quema al resto.',lk:1},
 espanta:{n:'Espantapájaros',i:'espantajo',cd:18,d:'Los enemigos van a él. Después revienta.',lk:1},
 grito:{n:'Vuelta y media',i:'grito',cd:12,d:'Un grito que empuja, asusta y rompe balas.',lk:1},
 paso:{n:'Paso del Pombero',i:'sombra',cd:8,d:'Aparecés más allá y dejás humo que lastima.',lk:1},
 pampero:{n:'Llamar al Pampero',i:'rayo',cd:15,d:'Una línea de rayos hacia donde mirás.',lk:1},
 toreada:{n:'Toreada',i:'toroI',cd:17,d:'Un toro cruza la arena llevándose todo.',lk:1},
 tabita:{n:'Tabeada',i:'taba',cd:16,d:'Tirás la taba: daño, cura, plata, o te sale culo.',lk:1},
};
// ---- AMULETOS (uno por jugador) ----
export const AMULETS={
 nada:{n:'Sin amuleto',i:'estampita',d:'Confiás en tu suerte.'},
 gauchito:{n:'Cinta del Gauchito',i:'cinta',d:'Una vez por partida te levanta solo.'},
 herr:{n:'Herradura Torcida',i:'herradura',d:'+40% imán y +10% experiencia.',f:s=>{s.mag*=1.4;s.xp+=.1}},
 rosario:{n:'Rosario de Plata',i:'rosario',d:'Los jefes te pegan 30% menos.',lk:1},
 kakuyp:{n:'Pluma de Kakuy',i:'pluma',d:'Si te golpean, todos los de cerca quedan frenados.',lk:1},
 siete:{n:'Siete Bravo',i:'naipe',d:'+3 mezclas y +2 descartes.',f:s=>{s.rer+=3;s.ban+=2},lk:1},
 plomo:{n:'Taba de Plomo',i:'taba',d:'+40% suerte.',f:s=>s.luck+=.4,lk:1},
 ojob:{n:'Ojo de Basilisco',i:'ojo',d:'+14% crítico.',f:s=>s.crit+=.14,lk:1},
 yerbas:{n:'Yerba de la Salamanca',i:'yerba',d:'+25% daño, −20% vida.',f:s=>{s.might+=.25;s.hp*=.8},lk:1},
 gemelos:{n:'Gemelos de Mandinga',i:'gemelo',d:'Arrancás con dos niveles de ventaja.',lk:1},
 difunta:{n:'Agua de la Difunta',i:'agua',d:'Con poca vida te cura 40%. Una vez por minuto.',lk:1},
 botas:{n:'Botas de Potro',i:'bota',d:'Esquivás 35% más seguido.',f:s=>s.dash*=.65,lk:1},
 plata:{n:'Plata Yvyguy',i:'plata',d:'+60% patacones.',f:s=>s.gold+=.6,lk:1},
 luna:{n:'Colmillo de Luna',i:'colmillo',d:'Robás 1% del daño. Sube al 2% con luna de sangre.',f:s=>s.leech+=.01,lk:1},
};
// ---- PROMESAS (condiciones que suben la paga) ----
export const PROMESAS={
 ayuno:{n:'Ayuno',d:'No caen mates ni asados.',g:.25},
 luto:{n:'Luto',d:'−40% de vida máxima.',g:.3},
 apuro:{n:'Apuro',d:'Los enemigos son 20% más rápidos.',g:.25},
 niebla:{n:'Neblina',d:'Se ve cerca nomás.',g:.15},
 manco:{n:'Manos atadas',d:'Solo cuatro armas.',g:.25},
 mudo:{n:'Voto de silencio',d:'Sin sapucay ni destreza.',g:.2},
 malaria:{n:'Malaria',d:'La taba nunca cae de suerte.',g:.15},
 tropel:{n:'Tropel',d:'50% más de enemigos.',g:.35},
 dorados:{n:'Noche dorada',d:'El triple de enemigos dorados.',g:.3},
 penitencia:{n:'Penitencia',d:'Sin vidas extra ni amuletos.',g:.25},
};
export const AFIX={
 veloz:{n:'Veloz',c:[.4,.9,1.2]},duro:{n:'Acorazado',c:[.8,.8,.9]},vampiro:{n:'Vampiro',c:[1.2,.15,.3]},explosivo:{n:'Explosivo',c:[1.3,.5,.1]},helado:{n:'Helado',c:[.4,.7,1.3]},padre:{n:'Paridor',c:[.5,1.2,.3]},bravo:{n:'Bravo',c:[1.3,.9,.15]},
};
PICK.baul={n:'Entierro',d:'Plata yvyguy'};PICK.gema3={n:'Luz grande',d:'Mucha experiencia'};
DICHOS.push('En la puerta del horno se quema el pan, y en la de la Salamanca, el cristiano.','Mal de muchos, consuelo del Familiar.','El que nace para pito nunca llega a corneta.','A la siesta, el Pombero. A la noche, el Lobizón. Vos elegís.','Al que madruga, el Futre lo ayuda a cobrar.','Cuando el río suena, Mbói Tu’ĩ lleva.','El diablo sabe por diablo, pero más sabe por la taba.','Perro que ladra no es el Familiar.','Si la luz te sigue, no la sigas.','Más vale mate lavado que sangre derramada.','Piedra que dejás en la apacheta, cansancio que no llevás.','Cría cuervos y te sacarán los chonchones.');
