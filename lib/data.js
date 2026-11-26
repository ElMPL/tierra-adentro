export const PCOL=['#e8453c','#4aa8ff','#f2b33d','#5fd68a'];
export const PCOLF=[[1,.27,.23],[.29,.66,1],[.95,.7,.24],[.37,.84,.54]];
// ---- ARMAS ---- base nivel 1 + mejoras niveles 2..8
export const WEAPONS={
 facon:{n:'Facón',d:'Tajos veloces hacia donde mirás.',b:{dmg:15,cd:.95,n:1,area:2.9},u:[{dmg:6},{area:.4},{n:1},{dmg:8},{cd:-.15},{area:.5,dmg:6},{n:1}],ev:'piedra',en:'Facón Caronero',ed:'Tajo en redondo que te devuelve vida.'},
 boleadoras:{n:'Boleadoras',d:'Vuelan al enemigo más cercano y lo traban.',b:{dmg:13,cd:1.35,n:1,spd:13,pierce:2,dur:1.6},u:[{n:1},{dmg:6},{pierce:2},{n:1},{dmg:8},{cd:-.25},{n:1}],ev:'espuela',en:'Las Tres Marías',ed:'Tres estrellas que persiguen y no se gastan.'},
 rebenque:{n:'Rebenque',d:'Chicotazo largo a los costados.',b:{dmg:19,cd:1.2,n:1,area:5},u:[{n:1},{dmg:7},{area:.8},{dmg:8},{cd:-.2},{area:1},{dmg:10}],ev:'cincha',en:'Látigo de Rayo',ed:'Cada golpe salta en cadena.'},
 guitarra:{n:'Guitarra Criolla',d:'Ondas de música que empujan.',b:{dmg:14,cd:2,n:1,area:4.4},u:[{area:.6},{dmg:6},{cd:-.25},{n:1},{dmg:7},{area:.8},{n:1}],ev:'cuerdas',en:'Payada Infernal',ed:'Las ondas largan notas perforantes.'},
 mate:{n:'Mate Hirviendo',d:'Charcos de agua a cien grados.',b:{dmg:8,cd:2.4,n:1,area:1.8,dur:3.2},u:[{n:1},{dmg:3},{area:.3},{dur:1},{n:1},{dmg:4},{cd:-.5}],ev:'yerba',en:'Termo Sin Fondo',ed:'Charcos enormes que curan a los tuyos.'},
 brasas:{n:'Brasas del Asado',d:'Un círculo de fuego que camina con vos.',b:{dmg:6,cd:.45,n:1,area:2.2},u:[{dmg:2},{area:.35},{dmg:2},{area:.4},{dmg:3},{area:.45},{dmg:4}],ev:'quebracho',en:'Asado con Cuero',ed:'Fuego gigante. Los quemados pueden soltar asado.'},
 perro:{n:'Perro Cimarrón',d:'Un perro fiel que caza solo.',b:{dmg:14,cd:.55,n:1,spd:8},u:[{dmg:5},{n:1},{spd:2},{dmg:6},{n:1},{cd:-.12},{dmg:8}],ev:'hueso',en:'La Jauría',ed:'Cinco perros enormes que muerden en área.'},
 naipe:{n:'Naipes de Truco',d:'Cartas filosas. El ancho pega triple.',b:{dmg:11,cd:.9,n:2,spd:16,pierce:1,dur:1.2},u:[{n:1},{dmg:4},{pierce:1},{n:1},{dmg:5},{cd:-.2},{n:2}],ev:'taba',en:'Ancho de Espadas',ed:'Casi la mitad son anchos, y alguno mata de un saque.'},
 vela:{n:'Velas del Gauchito',d:'Giran alrededor y queman.',b:{dmg:11,cd:.5,n:2,area:2.7,spd:2.2},u:[{n:1},{dmg:4},{spd:.5},{n:1},{area:.4},{dmg:6},{n:1}],ev:'cinta',en:'Santuario del Gauchito',ed:'Ocho velas que frenan balas y largan fuego.'},
 zapateo:{n:'Zapateo',d:'Pisotón que sacude el suelo y aturde.',b:{dmg:18,cd:1.75,n:1,area:2.9},u:[{dmg:6},{area:.4},{cd:-.2},{dmg:8},{n:1},{area:.5},{dmg:10}],ev:'sombrero',en:'Malambo Sísmico',ed:'La mudanza abre grietas a tu alrededor.'},
 tormenta:{n:'Rayo Pampero',d:'Rayos sobre enemigos al azar.',b:{dmg:30,cd:2.2,n:1,area:1.6},u:[{n:1},{dmg:10},{n:1},{area:.3},{dmg:12},{cd:-.5},{n:1}],ev:'poncho',en:'Tormenta de Santa Rosa',ed:'Cada rayo deja el piso electrizado.'},
 empanada:{n:'Empanadas',d:'Recién sacadas del horno. Explotan.',b:{dmg:26,cd:2.1,n:1,area:2.2},u:[{dmg:8},{n:1},{area:.35},{dmg:10},{n:1},{cd:-.4},{area:.45}],ev:'grasa',en:'La Docena',ed:'Cada una revienta en empanaditas.'},
};
export const PASS={
 piedra:{n:'Piedra de Afilar',d:'+10% daño',m:5,f:s=>s.might+=.1},
 espuela:{n:'Espuelas de Plata',d:'+12% velocidad de proyectil, +4% crítico',m:5,f:s=>{s.pspd+=.12;s.crit+=.04}},
 cincha:{n:'Cincha Pampa',d:'+10% área',m:5,f:s=>s.area+=.1},
 cuerdas:{n:'Cuerdas de Tripa',d:'−7% recarga',m:5,f:s=>s.cdr*=.93},
 yerba:{n:'Yerba Buena',d:'+0,4 vida por segundo',m:5,f:s=>s.regen+=.4},
 quebracho:{n:'Corazón de Quebracho',d:'+20 vida máxima',m:5,f:s=>s.hp+=20},
 hueso:{n:'Hueso con Caracú',d:'+12% experiencia',m:5,f:s=>s.xp+=.12},
 taba:{n:'Taba Cargada',d:'+20% suerte, +3% crítico',m:5,f:s=>{s.luck+=.2;s.crit+=.03}},
 cinta:{n:'Cinta Colorada',d:'+1,5 armadura',m:5,f:s=>s.armor+=1.5},
 sombrero:{n:'Chambergo',d:'+7% velocidad, +15% imán',m:5,f:s=>{s.spd*=1.07;s.mag*=1.15}},
 poncho:{n:'Poncho Salteño',d:'+12% duración, +4% esquive',m:5,f:s=>{s.dur+=.12;s.dodge+=.04}},
 grasa:{n:'Grasa de Pella',d:'+1 proyectil',m:2,f:s=>s.amt+=1},
};
// ---- PERSONAJES ----
export const CHARS={
 gaucho:{n:'Don Zoilo',t:'Gaucho matrero',w:'facon',d:'+10% daño. Equilibrado y bravo.',f:s=>s.might+=.1,ult:'Duelo Criollo',ud:'Remolino de facones'},
 paisana:{n:'Rosaura',t:'Bailarina de zamba',w:'vela',d:'+12% velocidad, +5% esquive.',f:s=>{s.spd*=1.12;s.dodge+=.05},ult:'Zamba del Alma',ud:'Cura y empuja con el pañuelo'},
 payador:{n:'Santos Luna',t:'Payador',w:'guitarra',d:'−8% recarga, +10% suerte.',f:s=>{s.cdr*=.92;s.luck+=.1},ult:'Contrapunto',ud:'Ocho ondas de música'},
 curandera:{n:'Doña Eulogia',t:'Curandera',w:'mate',d:'+0,8 vida/s. Cura al subir de nivel.',f:s=>{s.regen+=.8;s.lvheal=8},ult:'Tirar el Cuerito',ud:'Cura a todos y revive'},
 boleador:{n:'Nahuel',t:'Boleador tehuelche',w:'boleadoras',d:'+15% velocidad de proyectil, +10% crítico.',f:s=>{s.pspd+=.15;s.crit+=.1},ult:'Cacería',ud:'Lluvia de boleadoras'},
 malambista:{n:'Ceferino',t:'Malambista',w:'zapateo',d:'+12% área. Esquiva más seguido.',f:s=>{s.area+=.12;s.dash*=.7},ult:'Malambo Final',ud:'Diez pisotones en cadena',lock:'Vencé a la Alma Mula'},
 asador:{n:'El Tano Aldo',t:'Asador',w:'brasas',d:'+40 vida, +2 armadura, más lento.',f:s=>{s.hp+=40;s.armor+=2;s.spd*=.93},ult:'Parrillada',ud:'Prende fuego media arena',lock:'Vencé al Lobizón'},
 carpincho:{n:'Don Carpi',t:'Carpincho tranquilo',w:'empanada',d:'+30% suerte, +20% imán. Nada lo altera.',f:s=>{s.luck+=.3;s.mag*=1.2},ult:'Paz Interior',ud:'Nadie puede lastimar a nadie',lock:'Sacá un JACKPOT'},
};
// ---- ENEMIGOS ----
export const ENEMIES={
 anima:{n:'Ánima en Pena',d:'Gaucho que murió sin confesarse. Vuelve todas las noches a cobrar lo que le deben.',hp:15,spd:2.5,dmg:8,r:.5,xp:1,s:.95},
 vinchuca:{n:'Vinchuca Gigante',d:'Baja del techo de paja. De a una molesta, de a cien te seca.',hp:8,spd:4.1,dmg:5,r:.45,xp:1,s:.85},
 duende:{n:'Duende Sombrerudo',d:'Una mano de hierro y otra de lana. Roba tus luces y sale corriendo.',hp:22,spd:4.6,dmg:6,r:.42,xp:2,s:1,ai:'thief'},
 luzmala:{n:'Luz Mala',d:'Brilla sobre el pastizal. Dicen que abajo hay huesos enterrados.',hp:18,spd:3,dmg:9,r:.45,xp:2,s:1,ai:'float',fly:1},
 aoao:{n:'Ao Ao',d:'Bestia guaraní, mitad oveja y mitad jabalí. Embiste en manada.',hp:36,spd:3,dmg:13,r:.65,xp:2,s:1.05,ai:'charge'},
 pombero:{n:'Pombero',d:'Petiso, peludo, con los pies al revés. Silba y aparece atrás tuyo.',hp:42,spd:3.2,dmg:12,r:.5,xp:3,s:1.05,ai:'blink'},
 umita:{n:'Umita',d:'Cabeza sin cuerpo que llora por los caminos del norte y escupe pena.',hp:32,spd:2.8,dmg:9,r:.5,xp:3,s:1,ai:'shoot',fly:1,bc:[.5,.8,1]},
 llorona:{n:'La Llorona',d:'Busca a sus hijos en la orilla. Su lamento te deja pesado.',hp:62,spd:1.9,dmg:10,r:.5,xp:4,s:1.1,ai:'wail',fly:1},
 familiar:{n:'El Familiar',d:'Perro negro del ingenio. Come un peón por zafra.',hp:80,spd:3.9,dmg:17,r:.75,xp:5,s:1,ai:'charge'},
 basilisco:{n:'Basilisco',d:'Nace de huevo de gallo. No lo mires: si él te ve primero, perdiste.',hp:72,spd:2,dmg:14,r:.6,xp:5,s:1.1,ai:'beam'},
 ucumar:{n:'Ucumar',d:'Hombre oso de los cerros de Salta. Aplasta primero y pregunta después.',hp:210,spd:2,dmg:24,r:.95,xp:9,s:1,ai:'slam'},
 viuda:{n:'La Viuda',d:'Se sube en ancas del que anda solo de noche. Sus maldiciones te siguen.',hp:85,spd:2.3,dmg:12,r:.5,xp:6,s:1.1,ai:'curse',fly:1,bc:[1,.25,.6]},
 carbunclo:{n:'Carbunclo',d:'Lleva una piedra encendida en la frente. Quien lo agarra se hace rico.',hp:160,spd:6.4,dmg:0,r:.5,xp:30,s:1.1,ai:'flee'},
};
export const BOSSES={
 almamula:{n:'La Alma Mula',d:'Alma condenada que galopa arrastrando cadenas y echando fuego.',sub:'Arrastra cadenas desde Santiago del Estero',hp:1900,spd:3.6,dmg:18,r:1.3,s:1.15,col:[1,.45,.1]},
 lobizon:{n:'El Lobizón',d:'El séptimo hijo varón. Los viernes de luna llena no es más persona.',sub:'El séptimo hijo varón',hp:4400,spd:4.2,dmg:22,r:1.2,s:1.1,col:[1,.8,.2]},
 teyu:{n:'Teyú Yaguá',d:'Lagarto guaraní de siete cabezas de perro, guardián de frutas y tesoros.',sub:'Siete cabezas, siete hambres',hp:11000,spd:2.6,dmg:24,r:1.9,s:1.1,col:[1,.35,.1]},
 futre:{n:'El Futre',d:'Pagador inglés del ferrocarril, decapitado en la cordillera. Todavía busca a sus asesinos.',sub:'Caballero sin cabeza de la cordillera',hp:20000,spd:3.2,dmg:24,r:1,s:1.1,col:[.4,.8,1]},
 mandinga:{n:'Mandinga',d:'El Zupay, dueño de la Salamanca. Te enseña lo que quieras, a cambio de todo.',sub:'Patrón de la Salamanca',hp:42000,spd:3,dmg:28,r:1.5,s:1.15,col:[1,.25,.1]},
};
export const BOSS_ORDER=['almamula','lobizon','teyu','futre','mandinga'];
// composición por región: [tipo, peso, ronda mínima dentro de la región]
export const ACT_FOES=[
 [['anima',10,0],['vinchuca',6,1],['luzmala',3,2],['duende',1,2]],
 [['anima',4,0],['aoao',6,0],['pombero',4,1],['vinchuca',5,0],['duende',1.5,0],['luzmala',3,0]],
 [['luzmala',5,0],['llorona',3,0],['aoao',4,0],['umita',4,1],['vinchuca',6,0],['basilisco',2,2],['duende',1.5,0]],
 [['anima',5,0],['umita',4,0],['ucumar',2,0],['basilisco',3,1],['familiar',3,1],['duende',1.5,0],['pombero',4,0]],
 [['familiar',5,0],['viuda',4,0],['ucumar',2.5,0],['basilisco',3,0],['llorona',3,0],['anima',8,0],['umita',3,0],['duende',1,0]],
];
export const PICK={
 mate:{n:'Mate',d:'+30 de vida'},asado:{n:'Asado',d:'+60 de vida a todos'},herradura:{n:'Herradura',d:'Atrae todas las luces'},bombo:{n:'Bombo Legüero',d:'Barre a todos los enemigos'},alfajor:{n:'Alfajor',d:'Invencible y veloz'},fernet:{n:'Fernet con Coca',d:'Daño doble, mirada doble'},mano:{n:'La Mano',d:'Un manotazo de otro mundo'},plata:{n:'Patacones',d:'Plata'},cofre:{n:'Taba',d:'Tirala y fijate'},
};
export const SHOP={
 vida:{n:'Puchero',i:'corazon',d:'+10 vida máxima',m:5,c:60,f:(s,l)=>s.hp+=10*l},
 dano:{n:'Filo',i:'piedra',d:'+5% daño',m:5,c:80,f:(s,l)=>s.might+=.05*l},
 vel:{n:'Alpargatas',i:'sombrero',d:'+3% velocidad',m:4,c:70,f:(s,l)=>s.spd*=1+.03*l},
 iman:{n:'Herradura',i:'herradura',d:'+15% imán',m:4,c:50,f:(s,l)=>s.mag*=1+.15*l},
 suerte:{n:'Trébol',i:'trebol',d:'+10% suerte',m:5,c:90,f:(s,l)=>s.luck+=.1*l},
 xp:{n:'Refranero',i:'hueso',d:'+5% experiencia',m:5,c:90,f:(s,l)=>s.xp+=.05*l},
 vidaX:{n:'Estampita',i:'estampita',d:'+1 vida extra para el equipo',m:2,c:300,f:()=>{}},
 oro:{n:'Tirador Ancho',i:'plata',d:'+15% patacones',m:4,c:80,f:(s,l)=>s.gold+=.15*l},
};
// La quiniela: números y sus sueños
export const QUINI=[['00','Huevos'],['07','Revólver'],['14','Borracho'],['15','La niña bonita'],['17','La desgracia'],['22','El loco'],['33','Cristo'],['48','Muerto que habla'],['77','Piernas de mujer'],['88','El Papa'],['90','El miedo']];
export const DICHOS=['Al que nace barrigón es al ñudo que lo fajen.','No hay que andar cazando chanchos con rifle de aire comprimido.','El que se quema con leche, ve una vaca y llora.','Más perdido que turco en la neblina.','Hacete amigo del juez, pero del Zupay nunca.','Mate dulce, llegada segura.','Donde hay humo, hay asado.','De noche todos los gatos son pardos, y algunos son Lobizón.','La taba vuela alto, pero cae en tierra.','Ande o no ande, caballo grande.'];
