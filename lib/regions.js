// Regiones de la Patria: cada una con 3 mapas propios (más la Noche de Mandinga), paleta, relato, monstruos y jefes
import {KIT} from './deco.js';
const mul=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
export class Lay{
 constructor(m,seed){this.hx=m.hx;this.hz=m.hz;this.n=m.n||2;this.obs=[];this.pat=[];this.q=mul(seed);this.clear=m.clear||11;}
 rnd(a,b){return a+this.q()*(b-a);}
 pick(a){return a[this.q()*a.length|0];}
 k(x,z,mg=0){return Math.abs(x/(this.hx-mg))**this.n+Math.abs(z/(this.hz-mg))**this.n;}
 inP(x,z,kind,m=0){return this.pat.some(p=>(kind===undefined||p.kind===kind)&&Math.hypot(p.x-x,p.z-z)<p.r+m);}
 free(x,z,r,mg=3){if(this.k(x,z,mg)>1||Math.hypot(x,z)<this.clear+r)return false;for(const o of this.obs){const R=(o.len||0)+o.r+r;if((o.x-x)**2+(o.z-z)**2<R*R)return false;}return true;}
 o(t,x,z,ry=0,s=1){const d=KIT[t];this.obs.push({t,x,z,ry,s,r:(d.r||0)*s,len:(d.len||0)*s});return this;}
 sc(t,n,o={}){const d=KIT[t];let k=0,i=0;while(i<n&&k++<n*50){const x=this.rnd(-this.hx,this.hx),z=this.rnd(-this.hz,this.hz),s=this.rnd(o.s0??.88,o.s1??1.18);if(!this.free(x,z,((d.r||.3)+(d.len||0))*s+(o.gap??2.4),o.mg??4))continue;if(o.ok&&!o.ok(x,z))continue;if(o.dry&&this.inP(x,z,undefined,o.dry))continue;if(o.wet&&!this.inP(x,z,o.wet,-1.2))continue;this.o(t,x,z,o.ry??this.rnd(0,6.28),s);i++;}return this;}
 p(kind,x,z,r,fx=0,fz=0){if(this.pat.length<40)this.pat.push({kind,x,z,r,fx,fz});return this;}
 river(kind,pts,r,flow=0){for(let i=0;i<pts.length-1;i++){const[a,b]=pts[i],[c,d]=pts[i+1],L=Math.hypot(c-a,d-b),n=Math.max(1,Math.round(L/(r*1.15)));for(let j=0;j<n;j++){const t=j/n;this.p(kind,a+(c-a)*t,b+(d-b)*t,r,(c-a)/L*flow,(d-b)/L*flow);}}return this;}
 rows(t,x0,x1,dx,z0,z1,dz,skip=.15,ry=0){for(let z=z0;z<=z1;z+=dz)for(let x=x0;x<=x1;x+=dx){if(this.q()<skip)continue;const d=KIT[t];if(this.k(x,z,4)>1||Math.hypot(x,z)<this.clear+d.len+1)continue;this.o(t,x,z,ry,1);}return this;}
 ring(t,n,r,o={}){for(let i=0;i<n;i++){const a=i/n*6.2832+(o.a||0);this.o(t,Math.sin(a)*r,Math.cos(a)*r,o.ry!==undefined?a+o.ry:a,o.s||1);}return this;}
}
// ---- momentos del día (pisan la paleta base) ----
const NOCHE={top:0x050a22,mid:0x142450,hor:0x46588e,sun:0xb4caff,sunI:2.0,sd:[.4,.72,.3],hs:0xa8bcff,hg:0x30343a,hi:1.35,fog:0x1e2e5a,fn:46,ff:140,star:1,moon:1,rim:0x9ac0ff,rk:.95,tint:0xeef4ff};
const DIA={top:0x2f7acc,mid:0x86c0ee,hor:0xeef2e0,sun:0xfff0d0,sunI:2.9,sd:[.38,.82,.36],hs:0xdcecff,hg:0x6a6a4a,hi:1.0,fog:0xc4d8e4,fn:58,ff:190,star:0,moon:0,rim:0xfff4e0,rk:.45,tint:0xfffaf0};
const TORM={top:0x0c1018,mid:0x2a323e,hor:0x5e625c,sun:0xc0d0e0,sunI:1.7,sd:[-.3,.8,.3],hs:0xa8b8c8,hg:0x34363a,hi:1.5,fog:0x343c46,fn:40,ff:120,star:0,moon:0,rim:0xa8d0ff,rk:.95,tint:0xeef2f6};
const SANGRE={top:0x100106,mid:0x460810,hor:0xa02410,sun:0xff8a66,sunI:2.2,sd:[-.3,.8,-.3],hs:0xffa08c,hg:0x34181c,hi:1.35,fog:0x3e0c10,fn:40,ff:118,star:.3,moon:2,rim:0xff5a3a,rk:1.05,tint:0xffece6,part:[1,.3,.1,3],pv:[.2,1.4,.2]};
export const BLOOD=SANGRE;
const P={
 pampa:{top:0x2a3a78,mid:0xd8705a,hor:0xffc46a,sun:0xffc48a,sunI:2.7,sd:[-.75,.42,-.5],hs:0xffdcc0,hg:0x55563a,hi:1.05,fog:0xd8966a,fn:48,ff:165,gA:0x70803a,gB:0x8c7454,gC:0x000000,gr:0x8a9444,gr2:0xd8cc78,rim:0xffb070,rk:.75,star:.12,m:[0x6a4a6a,0x8a5a62,0xb8745e],band:0,part:[1,.75,.35,0],pv:[.8,.15,.3],tint:0xfff6ea,moon:0,grass:1},
 monte:{top:0x07131c,mid:0x12343a,hor:0x2f6a56,sun:0xd0ffe8,sunI:2.3,sd:[.5,.75,-.3],hs:0x9ad8c4,hg:0x2c3c30,hi:1.45,fog:0x1c443c,fn:36,ff:105,gA:0x3a5a3a,gB:0x665440,gC:0x000000,gr:0x3f7a40,gr2:0x86b866,rim:0x6affc0,rk:.9,star:.5,m:[0x0c2420,0x123028,0x1a4236],band:0,part:[.6,1,.4,1],pv:[.2,.25,.15],tint:0xeafff4,moon:1,grass:.9},
 ibera:{top:0x0a0f38,mid:0x243a8a,hor:0x6a8ad8,sun:0xa8c8ff,sunI:2.0,sd:[-.4,.7,.5],hs:0xa8c0ff,hg:0x2c3c4a,hi:1.35,fog:0x2a3f7a,fn:42,ff:130,gA:0x3a6656,gB:0x6a6250,gC:0x163a52,gr:0x3a8a6a,gr2:0x8ad0a0,rim:0x8ac0ff,rk:.95,star:1,m:[0x101c4a,0x1a2c66,0x2a4286],band:0,part:[.5,.9,1,1],pv:[.1,.3,.1],tint:0xeef4ff,moon:1,grass:1,out:1},
 selva:{top:0x3a86c8,mid:0x9ad4c8,hor:0xe8f2c0,sun:0xfff0c0,sunI:2.7,sd:[.4,.82,.3],hs:0xd8f4dc,hg:0x3a4a2c,hi:1.15,fog:0x9ac8a0,fn:40,ff:118,gA:0x3f7a34,gB:0xa4502c,gC:0x2a6a6a,gr:0x3f9a3a,gr2:0xa8d85a,rim:0xd8ffb0,rk:.55,star:0,m:[0x1f5a34,0x2f7a44,0x6aa868],band:0,part:[1,1,.6,0],pv:[.4,.1,.3],tint:0xfafff0,moon:0,grass:1},
 ingenio:{top:0x2a2a5a,mid:0xb85a4a,hor:0xffb45a,sun:0xffbe84,sunI:2.6,sd:[.7,.45,-.4],hs:0xffd8b4,hg:0x4e4630,hi:1.1,fog:0xb8804e,fn:40,ff:130,gA:0x6a7a30,gB:0x7a5638,gC:0x000000,gr:0x8a9a3a,gr2:0xd0c060,rim:0xffb060,rk:.8,star:.15,m:[0x3a4a5a,0x4a5a5a,0x6a6a4a],band:0,part:[.25,.22,.2,0],pv:[.6,-.5,.3],tint:0xfff4e4,moon:0,grass:.7},
 puna:{top:0x1c1a52,mid:0x7a4a9a,hor:0xffa0a8,sun:0xffd0b0,sunI:2.6,sd:[.7,.4,.4],hs:0xe6d4ff,hg:0x6a5a54,hi:1.0,fog:0xa07aa0,fn:48,ff:160,gA:0x9a7a5c,gB:0xb09a82,gC:0x000000,gr:0xb89a5a,gr2:0xe8d08a,rim:0xd8a0ff,rk:.8,star:.5,m:[0x8a3a3a,0xa85a3a,0x7a4a6a],band:1,part:[1,1,1,2],pv:[1.4,-1.2,.5],tint:0xfff2f8,moon:0,grass:.35},
 cuyo:{top:0x2a5a9a,mid:0xd89a6a,hor:0xffd88a,sun:0xffd49a,sunI:2.8,sd:[-.6,.5,.4],hs:0xffe4c4,hg:0x5a4a38,hi:1.05,fog:0xd8ae80,fn:50,ff:170,gA:0x7a7a44,gB:0xa88a62,gC:0x000000,gr:0xa89a4a,gr2:0xe0c870,rim:0xffd0a0,rk:.65,star:0,m:[0x5a5a7a,0x6e6a86,0xa8927a],band:.15,part:[1,.8,.4,0],pv:[1.4,.1,.4],tint:0xfff6e8,moon:0,grass:.5},
 sur:{top:0x4a7aa8,mid:0xa8c8dc,hor:0xf0e8dc,sun:0xfff4e4,sunI:2.5,sd:[-.5,.55,.5],hs:0xd8e8f8,hg:0x6a6a5c,hi:1.1,fog:0xb8c8d4,fn:50,ff:165,gA:0x8a8458,gB:0x948872,gC:0x000000,gr:0xb0a050,gr2:0xe8dc9a,rim:0xd8f0ff,rk:.6,star:0,m:[0x8aa0b8,0xa8bccc,0xb8b4a8],band:0,part:[1,1,1,0],pv:[2.6,.1,.8],tint:0xf4faff,moon:0,grass:.8},
 salamanca:{top:0x0c0206,mid:0x3a0a0e,hor:0xc8300e,sun:0xff9a6a,sunI:2.2,sd:[-.3,.8,-.35],hs:0xff9a78,hg:0x3a1a22,hi:1.25,fog:0x3a0c0c,fn:38,ff:115,gA:0x3a2a2e,gB:0x52383c,gC:0xff4a0a,gr:0x3a1414,gr2:0x8a2a1a,rim:0xff6a2a,rk:1.0,star:.15,m:[0x140406,0x22080a,0x360e0c],band:0,part:[1,.4,.1,3],pv:[.2,1.6,.2],tint:0xfff0ea,moon:2,grass:.25},
};
// parches de piso: 1 agua, 2 barro/miel, 3 lava, 4 hielo, 5 sal, 6 tierra, 7 nieve
const W=1,BARRO=2,LAVA=3,HIELO=4,SAL=5,TIERRA=6,NIEVE=7;
export const TIERS=[
 {id:'tranqui',n:'Tranqui',hp:.9,dmg:.9,g:.8,rounds:8,rate:.95,boss:11000,aff:0},
 {id:'criollo',n:'Criollo',hp:1.3,dmg:1.08,g:1.15,rounds:10,rate:1.1,boss:25000,aff:.45},
 {id:'matrero',n:'Matrero',hp:1.7,dmg:1.18,g:1.7,rounds:12,rate:1.2,boss:46000,aff:.9},
 {id:'mandinga',n:'Noche de Mandinga',hp:2.3,dmg:1.3,g:2.6,rounds:14,rate:1.3,boss:80000,aff:1},
];
export const REGIONS=[
{id:'pampa',n:'La Pampa',sub:'Donde el sol se acuesta en el pasto',ll:[-62.2,-36.6],tr:'a0',pal:P.pampa,boss:'lobizon',boss2:'torosupay',
 lore:'Llanura sin un solo reparo, donde de noche se ve venir todo, incluso lo que no querés ver. Los reseros juran que la luz mala baila sobre los huesos enterrados y que cerca de las estaciones muertas se oye una chancha arrastrando cadenas. Los viernes, el séptimo hijo varón no duerme en su cama.',
 dato:'En la Argentina el Presidente apadrina al séptimo hijo varón seguido. Mucha gente dice que la costumbre nació para espantar el mito del Lobizón.',
 foes:['anima','luzmala','jinete','chancha','viuda'],evs:['estampida','incendio','santarosa','luna','pena','ovni','gauchito','pacto','carbunclo','lucesbuenas','sortija'],
 border:[{t:'poste',sp:3},{t:'alambre',sp:3,half:1}],far:[['cortadera',26,1.06,1.6],['parva',8,1.12,1.45],['ombu',1,1.3,1.35],['molino',1,1.2,1.25],['rancho',1,1.22,1.3]],
 maps:[
  {n:'El casco de la estancia',d:'Campo abierto al atardecer. Parvas, un aljibe y el ombú.',hx:40,hz:40,n2:2,haz:[],
   lay(L){L.o('ombu',-23,-17,.3,.95).o('aljibe',19,-14).o('tranquera',24,12,.9).o('tranquera',-26,14,-.8).sc('parva',9).sc('barril',5).sc('tinaja',7).sc('cortadera',12,{gap:.6});},
   foes:[['anima',10,0],['luzmala',3,.25],['jinete',1.6,.4],['chancha',2,.5]],mid:[[4,'chancha','La Chancha con Cadenas']]},
  {n:'Estación vía muerta',d:'De noche, entre las vías. Si suena la campana, corré.',hx:62,hz:34,n2:3.2,pal:NOCHE,haz:[{k:'tren',z:13.5,every:24}],
   lay(L){for(let x=-64;x<=64;x+=4.5)L.o('rieles',x,13.5);L.o('estacion',-24,-13,.1).o('rancho',30,-16,-.4,.9).o('molino',44,-18).sc('tapera',7,{ok:(x,z)=>Math.abs(z-13.5)>5}).sc('vagon',3,{ry:0,ok:(x,z)=>z<9&&z>4}).sc('parva',8,{ok:(x,z)=>Math.abs(z-13.5)>4}).sc('barril',9,{ok:(x,z)=>Math.abs(z-13.5)>4}).sc('tinaja',7,{ok:(x,z)=>Math.abs(z-13.5)>4}).sc('cortadera',14,{gap:.6});},
   foes:[['anima',9,0],['luzmala',4,.1],['chancha',4,.2],['jinete',3,.3],['viuda',2,.5]],mid:[[5,'viuda','La Viuda del Andén']]},
  {n:'Tapera de los matreros',d:'Tormenta, lagunas y ruinas. El campo más grande de la región.',hx:66,hz:62,n2:2.4,pal:{...TORM,m:[0x2a3038,0x343c44,0x4a5054]},rain:1,haz:[{k:'rayos',every:5}],
   lay(L){L.river(W,[[-60,-34],[-34,-26],[-14,-34],[8,-42]],4.5).p(W,38,26,9).p(W,47,33,7).p(W,-36,34,8).p(W,-27,40,5).p(BARRO,30,-28,5).p(BARRO,-44,6,4.5);L.o('ombu',34,-12,1,1).o('rancho',-30,16,.6).o('aljibe',-20,22);L.sc('tapera',17,{dry:1}).sc('tranquera',6,{dry:1}).sc('parva',10,{dry:1}).sc('barril',12,{dry:1}).sc('tinaja',12,{dry:1}).sc('cortadera',26,{gap:.6}).sc('tronco',6,{dry:1});},
   foes:[['anima',8,0],['jinete',5,0],['luzmala',4,0],['chancha',5,.1],['viuda',4,.2]],mid:[[4,'chancha','La Chancha con Cadenas'],[8,'jinete','El Matrero sin Nombre']]},
 ]},
{id:'monte',n:'El Impenetrable',sub:'El monte te mira',ll:[-61.6,-25.6],tr:'a1',pal:P.monte,boss:'almamula',
 lore:'Quebracho, vinal y espinas entre el Chaco y Santiago. Acá el monte tiene dueño: Sachayoj castiga al que hachea de más. La Telesita murió quemada bailando y todavía se le ofrenda chacarera hasta caer rendido. Y por los caminos galopa la Alma Mula, mujer condenada a ser mula que echa fuego por la boca y arrastra cadenas.',
 dato:'A la Telesita se le pide un favor prometiendo bailarle chacareras. La fiesta se llama telesiada.',
 foes:['vinchuca','duende','pombero','kakuy','telesita','sachayoj'],evs:['manga','telesiada','santarosa','luna','pena','gauchito','pacto','carbunclo','lucesbuenas','incendio'],
 border:[{t:'quebracho',sp:5,off:2.5,s:[.9,1.3],jit:1.6},{t:'helecho',sp:3,off:.5,s:[.8,1.3]}],far:[['quebracho',26,1.14,1.7],['paloB',8,1.1,1.4],['helecho',24,1.03,1.4],['hongo',16,.95,1.2]],
 maps:[
  {n:'Picada de los hacheros',d:'Un claro abierto a hacha. Troncos para saltar esquivando.',hx:42,hz:40,n2:2,haz:[],
   lay(L){L.sc('tronco',11).sc('quebracho',9).sc('paloB',4).sc('tacuru',5).sc('tinaja',6).sc('barril',4).sc('hongo',12,{gap:.5}).sc('helecho',14,{gap:.5});},
   foes:[['vinchuca',10,0],['duende',1.5,0],['pombero',3,.2],['kakuy',2,.4],['sachayoj',.8,.6]],mid:[[4,'sachayoj','Sachayoj, dueño del monte']]},
  {n:'El baile de la Telesita',d:'Noche de fogatas. Las llamas bailan solas y se mueven.',hx:54,hz:50,n2:2.3,pal:{top:0x0a0814,mid:0x2a1830,hor:0x8a3a2a,sun:0xffc8a0,fog:0x2c1c28,rim:0xff9a5a,star:.9,part:[1,.6,.2,1]},haz:[{k:'fogatas',n:6}],
   lay(L){L.ring('tronco',8,17,{ry:Math.PI/2}).o('rancho',-32,-22,.7).sc('vinal',10).sc('quebracho',12).sc('paloB',6).sc('tacuru',7).sc('tinaja',12).sc('barril',6).sc('hongo',12,{gap:.5}).sc('helecho',18,{gap:.5});},
   foes:[['vinchuca',9,0],['telesita',3,.1],['pombero',4,.1],['duende',1.5,0],['kakuy',3,.3],['sachayoj',1.2,.5]],mid:[[5,'telesita','La Telesita']]},
  {n:'Corazón del Impenetrable',d:'Niebla espesa, árboles por todos lados y espinas.',hx:64,hz:64,n2:2,pal:{top:0x060c10,mid:0x0e2a2c,hor:0x24503e,fog:0x16382e,fn:22,ff:72,star:.1,sunI:1.9,hi:1.6},haz:[],
   lay(L){L.river(BARRO,[[-58,20],[-30,28],[-6,40],[20,34]],4).p(BARRO,36,-20,6).sc('quebracho',46,{gap:2.6}).sc('paloB',12).sc('vinal',20).sc('tronco',14).sc('tacuru',12).sc('tinaja',14).sc('barril',8).sc('hongo',26,{gap:.5}).sc('helecho',30,{gap:.5});},
   foes:[['vinchuca',9,0],['pombero',5,0],['kakuy',4,.1],['telesita',3,.1],['duende',2,0],['sachayoj',2.4,.2]],mid:[[4,'kakuy','La Kakuy'],[8,'sachayoj','Sachayoj, dueño del monte']]},
 ]},
{id:'ibera',n:'Esteros del Iberá',sub:'Agua que brilla, agua que traga',ll:[-57.3,-28.5],tr:'a2',pal:P.ibera,boss:'mboitui',
 lore:'Y berá, en guaraní, es agua brillante. Entre los embalsados que flotan vive Mbói Tu’ĩ, serpiente con cabeza de loro que protege a todo bicho de bañado y lanza un graznido que hiela. El carau llora desde que eligió seguir bailando mientras moría su madre. Y el irupé, dicen, es una muchacha que se tiró al agua para alcanzar la luna.',
 dato:'Mbói Tu’ĩ es el segundo de los siete hijos de Tau y Keraná, los monstruos de la mitología guaraní.',
 foes:['mbarigui','yacare','irupe','carau','llorona'],evs:['creciente','santarosa','luna','pena','ovni','gauchito','carbunclo','lucesbuenas','pacto'],
 border:[{t:'junco',sp:2.4,off:.8,s:[.9,1.4],jit:.8},{t:'palmera',sp:14,off:3,s:[.8,1.2],jit:2}],far:[['palmera',14,1.08,1.5],['irupeD',24,1.1,1.6],['junco',26,1.03,1.4]],
 maps:[
  {n:'La orilla del irupé',d:'Lagunas mansas. El agua te frena, pero frena más al que no nada.',hx:44,hz:40,n2:2,haz:[],
   lay(L){L.p(W,-22,-16,8).p(W,-14,-22,6).p(W,22,18,8.5).p(W,30,12,5).p(W,20,-22,6).p(W,-24,20,6.5).sc('irupeD',12,{wet:W,gap:.2}).o('canoa',-15,-13,.5).o('canoa',17,12,2).sc('palmera',12,{dry:.5}).sc('junco',20,{gap:.4}).sc('tinaja',6,{dry:.5}).sc('barril',5,{dry:.5});},
   foes:[['mbarigui',10,0],['carau',3,.1],['yacare',3,.25],['irupe',2,.35],['llorona',1.5,.5]],mid:[[4,'yacare','El Yacaré Viejo']]},
  {n:'Los embalsados',d:'Islas flotantes unidas por pasos angostos.',hx:58,hz:54,n2:2.5,pal:{top:0x0a1a3a,mid:0x2a5a8a,hor:0x9ab8d8,fog:0x3a5a8a,sunI:2.2},haz:[],
   lay(L){const isl=[[0,0,13],[-30,-20,9],[30,-22,9],[32,22,9],[-30,24,9],[0,-36,7],[0,36,7],[-44,2,6],[44,0,6]];for(let x=-50;x<=50;x+=12.5)for(let z=-46;z<=46;z+=12.5){if(isl.some(([a,b,r])=>Math.hypot(a-x,b-z)<r+2))continue;L.p(W,x+L.rnd(-2,2),z+L.rnd(-2,2),7.2);}L.sc('irupeD',22,{wet:W,gap:.2}).sc('canoa',6,{wet:W}).sc('palmera',16,{dry:0}).sc('junco',26,{gap:.4}).sc('tinaja',12,{dry:0}).sc('barril',8,{dry:0}).sc('tronco',4);},
   foes:[['mbarigui',9,0],['yacare',5,0],['carau',4,.1],['irupe',3,.2],['llorona',3,.3]],mid:[[5,'llorona','La Madre Llorona']]},
  {n:'Ojo de la laguna',d:'Un río que arrastra cruza el mapa en plena tormenta.',hx:66,hz:52,n2:2.4,pal:{...TORM,fog:0x2a3a52,mid:0x22324e,m:[0x141e34,0x1c2a44,0x2a3a54]},rain:1,haz:[{k:'rayos',every:6}],
   lay(L){L.river(W,[[-70,-30],[-40,-20],[-22,-24],[4,-32],[34,-22],[70,-30]],5.5,3.4).river(W,[[70,30],[40,24],[20,30],[-10,36],[-40,26],[-70,34]],5.5,3.4).p(W,-44,2,6).p(W,46,0,6).sc('irupeD',14,{wet:W,gap:.2}).sc('canoa',5,{wet:W}).sc('palmera',18,{dry:.5}).sc('junco',28,{gap:.4}).sc('tronco',6,{dry:.5}).sc('tinaja',12,{dry:.5}).sc('barril',10,{dry:.5});},
   foes:[['mbarigui',9,0],['yacare',6,0],['carau',5,0],['irupe',4,.1],['llorona',4,.2]],mid:[[4,'carau','El Carau Enlutado'],[8,'yacare','El Yacaré Viejo']]},
 ]},
{id:'ingenio',n:'El Ingenio',sub:'Azúcar, humo y pacto',ll:[-65.4,-27.1],tr:'ing',pal:P.ingenio,boss:'elfamiliar',boss2:'torosupay',
 lore:'En los ingenios del norte se decía que el patrón había firmado con el diablo: riqueza a cambio de un peón por zafra. El encargado de cobrar era el Familiar, perro negro enorme con mirada de fuego y cadenas, que a veces toma forma de viborón. En el cañaveral también andan el Mikilo, mitad bicho y mitad pájaro, y el Runa Uturunco, hombre que se revuelca en un cuero y se levanta tigre.',
 dato:'La leyenda suele ubicarse en el ingenio Santa Ana, en Tucumán, y sirvió para meter miedo a los peones que reclamaban.',
 foes:['zafrero','familiar','mikilo','uturunco','capataz'],evs:['quemazon','incendio','luna','pena','gauchito','pacto','carbunclo','lucesbuenas','santarosa'],
 border:[{t:'cana',sp:3.6,off:1.6,s:[1,1.25],jit:.6,face:1}],far:[['cana',30,1.08,1.4],['chimenea',2,1.15,1.3],['galpon',2,1.15,1.3]],
 maps:[
  {n:'El cañaveral',d:'Surcos de caña que tapan la vista. Se pueden cortar.',hx:46,hz:44,n2:2.8,haz:[],
   lay(L){L.rows('cana',-38,38,5.2,-36,36,7.2,.34).sc('barril',6).sc('tinaja',6).sc('bagazo',4).o('vagon',22,0,.1);},
   foes:[['zafrero',10,0],['familiar',3,.2],['mikilo',2,.3],['uturunco',1.6,.45],['capataz',1.2,.5]],mid:[[4,'capataz','El Capataz sin Sombra']]},
  {n:'El trapiche',d:'La molienda gira sin parar. Cuidado con la viga y la miel.',hx:52,hz:50,n2:2.6,pal:NOCHE,haz:[{k:'trapiche',x:0,z:-25,len:11},{k:'trapiche',x:26,z:22,len:8,rev:1}],
   lay(L){L.o('chimenea',-34,-24).o('galpon',-32,16,1.2).p(BARRO,0,-25,9).p(BARRO,26,22,7).p(BARRO,-14,28,5).p(BARRO,34,-14,5).sc('vagon',5,{dry:2}).sc('bagazo',8,{dry:2}).sc('barril',12,{dry:1}).sc('tinaja',8,{dry:1}).sc('cana',12,{dry:1});},
   foes:[['zafrero',9,0],['familiar',4,.1],['mikilo',3,.1],['uturunco',3,.25],['capataz',2,.3]],mid:[[5,'uturunco','El Runa Uturunco']]},
  {n:'Zafra de fuego',d:'Queman el cañaveral. El humo no deja ver y el fuego camina.',hx:64,hz:54,n2:2.6,pal:{top:0x1a0c10,mid:0x6a2a18,hor:0xff7a2a,sun:0xffa46a,fog:0x6a3420,fn:34,ff:100,star:0,rim:0xff8a3a,part:[1,.45,.12,3],pv:[.6,1.6,.3],hi:1.3},haz:[{k:'fuego',every:13}],
   lay(L){L.rows('cana',-56,56,5.2,-46,46,8.4,.48).o('chimenea',36,-28).o('galpon',-38,30,.4).sc('vagon',5).sc('bagazo',9).sc('barril',13).sc('tinaja',10);},
   foes:[['zafrero',9,0],['familiar',6,0],['mikilo',4,.1],['uturunco',4,.1],['capataz',3,.2]],mid:[[4,'capataz','El Capataz sin Sombra'],[8,'torosupay',null]]},
 ]},
{id:'selva',n:'Selva Misionera',sub:'La hora de la siesta es de ellos',ll:[-54.4,-26.6],tr:'sel',pal:P.selva,boss:'teyu',boss2:'monai',
 lore:'Tierra colorada y monte cerrado. Al mediodía, cuando nadie debe salir, Yasy Yateré sale de paseo: un chico rubio con bastón de oro y un silbo que hipnotiza. Kurupí enlaza al desobediente y Caá Porá, gigante peludo que fuma en pipa, defiende a los animales montado en un chancho del monte. Bajo las cataratas duerme Teyú Yaguá, señor de las cavernas, de las frutas y los tesoros.',
 dato:'Teyú Yaguá, Mbói Tu’ĩ, Moñái, Yasy Yateré, Kurupí, Ao Ao y Luisón son los siete hijos malditos de Tau y Keraná.',
 foes:['aoao','yasy','kurupi','caapora','yaguarete'],evs:['siesta','creciente','luna','pena','gauchito','pacto','carbunclo','lucesbuenas','santarosa','ovni'],
 border:[{t:'arbolote',sp:6.5,off:3,s:[.8,1.15],jit:2},{t:'tacuara',sp:5,off:1,s:[.9,1.2],jit:1},{t:'helecho',sp:2.6,off:.3,s:[.9,1.4]}],far:[['arbolote',20,1.16,1.6],['helecho',24,1.03,1.4],['tacuara',8,1.06,1.3]],
 maps:[
  {n:'Tacuaral de la siesta',d:'Pleno mediodía. Nadie debería andar afuera.',hx:42,hz:42,n2:2,haz:[],
   lay(L){L.sc('tacuara',15).sc('arbolote',6).sc('tronco',6).sc('tinaja',6).sc('helecho',24,{gap:.5}).p(TIERRA,-18,18,6).p(TIERRA,20,-16,7);},
   foes:[['aoao',10,0],['kurupi',3,.15],['yasy',1.6,.3],['yaguarete',2,.4],['caapora',.8,.6]],mid:[[4,'kurupi','Kurupí el Viejo']]},
  {n:'Ruinas de la misión',d:'Paredes de piedra roja para cubrirse y quedar encerrado.',hx:56,hz:52,n2:3,pal:{top:0x3a2a6a,mid:0xd86a4a,hor:0xffc07a,sun:0xffb07a,sunI:2.6,sd:[-.7,.45,.4],fog:0xb07050,hs:0xffd8bc,rim:0xffa06a,m:[0x2a3a44,0x3a4a44,0x7a5a4a]},haz:[],
   lay(L){for(const[x,z,r]of[[-26,-18,0],[-20,-18,0],[-30,-13,1.57],[-30,-6,1.57],[26,-18,0],[20,-20,0],[31,-12,1.57],[24,18,0],[30,18,0],[18,24,1.57],[-22,20,0],[-28,24,1.57],[-16,26,.2],[0,-26,0],[7,-27,.1],[-40,8,1.57],[42,8,1.5],[0,32,0]])L.o('ruina',x,z,r);for(const[x,z]of[[-16,-12],[16,-12],[-16,13],[16,13],[-8,-18],[8,-18]])L.o('columna',x,z,L.rnd(0,6));L.o('estatua',0,-19,0).o('estatua',38,-26,2).sc('arbolote',6).sc('tacuara',6).sc('tinaja',12).sc('barril',6).sc('helecho',24,{gap:.5});},
   foes:[['aoao',9,0],['kurupi',4,0],['yasy',3,.15],['yaguarete',3,.2],['caapora',1.6,.4]],mid:[[5,'yasy','Yasy Yateré']]},
  {n:'Garganta del Diablo',d:'La corriente te arrastra hacia el borde. Niebla y luna.',hx:66,hz:60,n2:2.2,pal:{...NOCHE,top:0x08141e,mid:0x1c4450,hor:0x8ab8b0,fog:0x3a6266,fn:30,ff:96,rim:0xa8fff0,gC:0x2a8a9a,m:[0x0e2a24,0x163a30,0x3a6a66]},haz:[],
   lay(L){L.river(W,[[-66,-12],[-44,-22],[-20,-28],[6,-34],[34,-26],[66,-18]],6,4.6).river(W,[[-40,56],[-30,36],[-34,18],[-50,4]],5,4).river(W,[[40,58],[34,38],[40,20],[60,10]],5,4).sc('arbolote',15,{dry:1}).sc('tacuara',12,{dry:1}).sc('ruina',6,{dry:1}).sc('pena',8,{dry:0}).sc('tronco',9,{dry:0}).sc('tinaja',12,{dry:1}).sc('barril',9,{dry:1}).sc('helecho',30,{gap:.5});},
   foes:[['aoao',8,0],['yaguarete',5,0],['kurupi',5,0],['yasy',4,.1],['caapora',2.6,.2]],mid:[[4,'caapora','Caá Porá'],[8,'monai',null]]},
 ]},
{id:'puna',n:'La Puna y la Quebrada',sub:'Siete colores y un frío que corta',ll:[-66.1,-23.4],tr:'a3',pal:P.puna,boss:'huayrapuca',
 lore:'Cerros pintados, apachetas y viento blanco. Al empezar el carnaval se desentierra a Pujllay y los diablitos bajan bailando con espejos y cascabeles. Coquena, enanito vestido de vicuña, cuida los rebaños: si cazás de más, te lo cobra. Arriba de todo sopla Huayrapuca, madre del viento, criatura de dos cabezas.',
 dato:'El viajero que pasa por una apacheta deja una piedra, coca o un trago para la Pachamama.',
 foes:['diablito','umita','ucumar','huaca'],evs:['carnaval','coquena','temblor','luna','pena','gauchito','carbunclo','lucesbuenas','ovni','ventisca'],
 border:[{t:'pirca',sp:4,face:1},{t:'cardon',sp:9,off:3,s:[.8,1.2],jit:2}],far:[['cardon',20,1.08,1.6],['pena',20,1.06,1.6],['apachetaD',4,1.05,1.25]],
 maps:[
  {n:'Quebrada de los colores',d:'Cardones que pinchan y pircas para saltar.',hx:44,hz:42,n2:2,haz:[],
   lay(L){L.sc('cardon',15).sc('pirca',9).sc('pena',8).o('apachetaD',-20,-18).o('capilla',24,-22,-.4,.9).sc('tinaja',8).sc('barril',3);},
   foes:[['diablito',10,0],['umita',4,.15],['huaca',1.4,.4],['ucumar',1.2,.5]],mid:[[4,'ucumar','El Ucumar de las Yungas']]},
  {n:'El salar',d:'Blanco infinito a pleno sol. Casi sin reparo y con géiseres.',hx:68,hz:64,n2:2,pal:{...DIA,top:0x1a5ac0,mid:0x6ab0f0,hor:0xe8f0ff,gA:0xd8dce4,gB:0xc8ccd6,gr:0xd8c890,gr2:0xf0e8c0,fog:0xd0dcec,hg:0xb0b4c0,hi:.8,sunI:2.4,grass:.05,hex:1,band:.8},haz:[{k:'geiser',n:11}],
   lay(L){L.p(W,-34,20,7).p(W,40,-22,8).sc('pena',8).sc('cardon',6,{ok:(x,z)=>Math.hypot(x,z)>40}).sc('pirca',4).sc('apachetaD',3).sc('tinaja',14).sc('barril',4);},
   foes:[['diablito',9,0],['umita',5,0],['huaca',3,.2],['ucumar',2,.3]],mid:[[5,'huaca','La Huaca Despierta']]},
  {n:'Cementerio de huacas',d:'Nevada de noche. Piedras viejas que se despiertan.',hx:62,hz:60,n2:2.4,pal:{...NOCHE,top:0x060824,mid:0x2a2a6a,hor:0x9a8ac8,fog:0x3a3a6a,gA:0x9aa4b8,gB:0x8a8a98,gr:0x9aa0a8,gr2:0xd8dce8,grass:.2,part:[1,1,1,2],pv:[1.8,-2.4,.8]},haz:[{k:'rocas',every:9}],
   lay(L){L.p(NIEVE,-30,-20,10).p(NIEVE,30,24,11).p(NIEVE,-26,32,8).p(HIELO,34,-26,8).p(HIELO,-44,8,6).sc('pena',17).sc('apachetaD',8).sc('pirca',13).sc('cardon',7).o('capilla',-30,20,.8).sc('tinaja',14).sc('barril',6);},
   foes:[['diablito',8,0],['umita',6,0],['huaca',4,.1],['ucumar',3.4,.15]],mid:[[4,'umita','La Umita Mayor'],[8,'ucumar','El Ucumar de las Yungas']]},
 ]},
{id:'cuyo',n:'Cuyo y la Cordillera',sub:'Viento caliente, nieve y minas',ll:[-69.0,-32.4],tr:'cuy',pal:P.cuyo,boss:'futre',
 lore:'Tierra de viñas y viento Zonda. A la siesta la Pericana, vieja altísima de dientes largos, persigue con su látigo a los chicos que no duermen. En la cordillera quedaron arrieros congelados y mineros que siguen picando. Y por las vías del Trasandino pasea el Futre, pagador inglés de galera, degollado con la plata de los sueldos.',
 dato:'La Difunta Correa murió de sed buscando a su marido. Al santuario de Vallecito le llevan botellas con agua.',
 foes:['arriero','remolino','condor','minero','pericana'],evs:['zonda','temblor','ventisca','luna','pena','gauchito','pacto','carbunclo','lucesbuenas','ovni'],
 border:[{t:'alamo',sp:3.4,off:1.5,s:[.85,1.2],jit:.5},{t:'pirca',sp:4,face:1}],far:[['penasco',22,1.1,1.6],['alamo',14,1.1,1.4]],
 maps:[
  {n:'El viñedo',d:'Hileras de vid para saltar. Sopla el Zonda.',hx:48,hz:42,n2:2.8,haz:[],
   lay(L){L.rows('vid',-38,38,6.2,-34,34,6.4,.32).o('difunta',-30,-28).sc('tonel',6).sc('barril',8).sc('tinaja',8).sc('alamo',6);},
   foes:[['arriero',10,0],['remolino',3,.15],['minero',2,.3],['condor',2,.4],['pericana',1.4,.5]],mid:[[4,'pericana','La Pericana']]},
  {n:'El Trasandino',d:'Cordillera nevada y dos vías. El tren no frena.',hx:68,hz:36,n2:3.2,pal:{...NOCHE,top:0x14204a,mid:0x5a6aa8,hor:0xd8c8d8,fog:0x7a86ac,gA:0xb0b8c8,gB:0x8a8890,gr:0x9aa0a0,gr2:0xd8dce0,grass:.15,star:.6,moon:1,m:[0xc8d0e0,0xa8b0c8,0x7a7a90],part:[1,1,1,2],pv:[2.2,-1.8,.4]},haz:[{k:'tren',z:-15,every:21},{k:'tren',z:17,every:27,rev:1}],
   lay(L){for(const z of[-15,17])for(let x=-70;x<=70;x+=4.5)L.o('rieles',x,z);const lib=(x,z)=>Math.abs(z+15)>4.6&&Math.abs(z-17)>4.6;L.p(HIELO,-34,0,7).p(HIELO,36,4,6.5).p(NIEVE,50,-4,7).sc('penasco',6,{ok:lib}).sc('pirca',8,{ok:lib}).sc('tapera',5,{ok:lib}).sc('barril',9,{ok:lib}).sc('tinaja',8,{ok:lib}).sc('tonel',4,{ok:lib});},
   foes:[['arriero',9,0],['condor',4,0],['minero',4,.15],['remolino',3,.2],['pericana',2,.4]],mid:[[5,'condor','El Cóndor Viejo']]},
  {n:'Mina del Paramillo',d:'Se desprenden piedras. Galerías, peñascos y oscuridad.',hx:62,hz:60,n2:2.3,pal:{...NOCHE,top:0x040612,mid:0x141c34,hor:0x3a3a5a,fog:0x1a1e34,fn:26,ff:84,sunI:1.6,hi:1.35,gA:0x5a5a5a,gB:0x6a625a,gr:0x6a6a5a,gr2:0x9a9a80,grass:.15,star:.5,rim:0xffc86a,m:[0x20203a,0x2a2a44,0x3a3848]},haz:[{k:'rocas',every:7},{k:'estal',every:3.2}],
   lay(L){L.sc('penasco',15).sc('pena',13).sc('tapera',5).sc('barril',14).sc('tinaja',9).sc('tonel',5).sc('antorcha',16,{gap:.8}).sc('rieles',8,{gap:1});},
   foes:[['arriero',8,0],['minero',6,0],['condor',4,.1],['remolino',4,.1],['pericana',3,.2]],mid:[[4,'minero','El Minero Enterrado'],[8,'pericana','La Pericana']]},
 ]},
{id:'sur',n:'La Patagonia',sub:'Viento, piedra y hielo',ll:[-70.2,-45.6],tr:'sur',pal:P.sur,boss:'elengassen',boss2:'nahuelito',
 lore:'En el Bajo del Gualicho corren bolas de fuego al lado de los viajeros. En la orilla de los lagos espera el Cuero, pellejo con uñas que se hace el tronco, envuelve y se lleva al fondo. Elëngásëm, gigante acorazado como un gliptodonte, grita tormentas desde su cueva, y a sus huesos se los encuentra petrificados por toda la meseta.',
 dato:'A Elëngásëm le atribuían los huesos fósiles y las pinturas rupestres. Dicen que solo se lo puede herir en el vientre.',
 foes:['chonchon','gualicho','anchimallen','cuero','kalku'],evs:['gualichera','ventisca','luna','pena','carbunclo','lucesbuenas','ovni','pacto','gauchito'],
 border:[{t:'basalto',sp:5,off:1,s:[.8,1.2],jit:1},{t:'coiron',sp:2,off:.4,s:[.8,1.5]}],far:[['basalto',20,1.1,1.6],['coiron',30,1.03,1.6],['lenga',12,1.08,1.4]],
 maps:[
  {n:'Estepa del Gualicho',d:'Viento parejo y troncos de piedra.',hx:48,hz:44,n2:2.2,haz:[{k:'viento'}],
   lay(L){L.sc('troncoP',10).sc('basalto',10).sc('chenque',4).sc('lenga',7).sc('coiron',30,{gap:.4}).sc('tinaja',6).sc('barril',5);},
   foes:[['chonchon',10,0],['gualicho',4,.1],['anchimallen',3,.25],['kalku',1.2,.45]],mid:[[4,'kalku','El Kalku']]},
  {n:'Arrayanes del Nahuel Huapi',d:'Un lago con algo adentro y un bosque color canela.',hx:60,hz:54,n2:2.3,pal:{top:0x1a2a5a,mid:0x6a6aa8,hor:0xf0b8a0,sun:0xffd8b8,sunI:2.4,sd:[.6,.45,.4],fog:0x8a86ac,gA:0x4a7044,gB:0x7a6a50,gr:0x4a8a4a,gr2:0xa8c870,rim:0xffc8d8,rk:.8,star:.5,grass:1,m:[0x5a6a94,0x7a84a8,0x9a94a8],gC:0x1a4a7a},haz:[],
   lay(L){for(const[x,z,r]of[[34,0,13],[44,-12,11],[46,12,11],[26,12,7],[28,-13,7]])L.p(W,x,z,r);L.p(W,-34,-28,6).sc('arrayan',22,{dry:1}).sc('lenga',9,{dry:1}).sc('troncoP',6,{dry:1}).o('rehue',-22,20).o('kultrunD',-20,23).o('canoa',20,4,1).sc('chenque',3,{dry:1}).sc('tinaja',10,{dry:1}).sc('barril',8,{dry:1}).sc('helecho',18,{gap:.5,dry:.5});},
   foes:[['chonchon',9,0],['cuero',4,0],['anchimallen',4,.1],['gualicho',4,.1],['kalku',2,.35]],mid:[[5,'cuero','El Cuero Uñudo']]},
  {n:'El glaciar',d:'Todo resbala. Bloques de hielo, grietas y viento blanco.',hx:64,hz:62,n2:2.2,pal:{top:0x2a6ab0,mid:0x9ad0f0,hor:0xf0faff,sun:0xf4faff,sunI:2.2,sd:[-.4,.6,.5],fog:0xc8e2f2,fn:36,ff:120,gA:0xc8dcea,gB:0xb0c8da,gr:0x9ab0b8,gr2:0xe0f0f4,grass:.03,rim:0xc8f0ff,hg:0xa8c0d0,hi:.85,m:[0xb8d8f0,0xc8e4f8,0xd8ecf8],part:[1,1,1,2],pv:[3,-1.6,1]},haz:[{k:'estal',every:3,ice:1},{k:'viento'}],
   lay(L){for(let i=0;i<26;i++){const a=L.rnd(0,6.28),r=L.rnd(14,54);L.p(HIELO,Math.cos(a)*r,Math.sin(a)*r,L.rnd(6,9.5));}L.sc('hieloB',19).sc('basalto',9).sc('chenque',3).sc('troncoP',5).sc('tinaja',12).sc('barril',9);},
   foes:[['chonchon',8,0],['gualicho',5,0],['anchimallen',5,0],['cuero',4,.1],['kalku',3,.2]],mid:[[4,'gualicho','El Gualicho'],[8,'nahuelito',null]]},
 ]},
{id:'salamanca',n:'La Salamanca',sub:'Acá se paga todo',ll:[-63.6,-29.0],tr:'a4',pal:P.salamanca,boss:'mandinga',boss2:'torosupay',
 lore:'La cueva de Salavina solo se ve si sabés la palabra. Para entrar hay que pasar pruebas: el chivo hediondo de ojos rojos, el culebrón peludo que aprieta y el basilisco de un ojo solo. Adentro hay música y baile que no terminan nunca, y los que bailan no hacen sombra. Al fondo espera el Zupay, bien empilchado y con adornos de plata. El pueblo le dice Mandinga.',
 dato:'Dicen que en la Salamanca se aprende a bailar, cantar, jugar o curar. El precio es siempre el mismo.',
 foes:['condenado','chivo','culebron','basilisco','bruja'],evs:['aquelarre','temblor','luna','pena','carbunclo','pacto','lucesbuenas'],
 border:[{t:'estal',sp:4.6,off:2.4,s:[.8,1.4],jit:1.4},{t:'antorcha',sp:11}],far:[['estal',34,1.12,1.7],['cara',5,1.22,1.3]],
 maps:[
  {n:'La boca de la cueva',d:'La primera prueba. Piedras, lava y un olor que voltea.',hx:44,hz:42,n2:2,haz:[],
   lay(L){L.p(LAVA,-24,-14,4.5).p(LAVA,22,20,5).p(LAVA,24,-20,3.5).sc('estal',11).sc('pilarH',6).sc('losa',5).sc('caldero',3).sc('tinaja',7).sc('barril',4);},
   foes:[['condenado',10,0],['chivo',3,.1],['bruja',2,.3],['culebron',1.6,.4],['basilisco',1.4,.5]],mid:[[4,'chivo','El Chivo Hediondo']]},
  {n:'El salón de los pactos',d:'Ríos de lava, calaveras y baile que no termina.',hx:56,hz:54,n2:2.5,haz:[{k:'estal',every:3.4}],
   lay(L){L.river(LAVA,[[-56,-20],[-36,-24],[-18,-32],[0,-40]],3.4).river(LAVA,[[56,20],[38,26],[18,30],[0,42]],3.4).o('craneo',-26,18,1).o('craneo',28,-18,-1.8).ring('losa',8,18.5,{ry:Math.PI/2}).sc('estal',12,{dry:1}).sc('pilarH',10,{dry:1}).sc('caldero',6,{dry:1}).sc('tinaja',12,{dry:1}).sc('barril',6,{dry:1});},
   foes:[['condenado',9,0],['chivo',4,0],['bruja',4,.1],['culebron',3,.2],['basilisco',2.6,.25]],mid:[[5,'culebron','El Culebrón']]},
  {n:'El trono del Zupay',d:'El corazón de la cueva. Todo quema y todo cae.',hx:66,hz:64,n2:2.2,pal:{top:0x060004,mid:0x2a0408,hor:0xff3a0a,fog:0x2a0608,fn:30,ff:95},haz:[{k:'estal',every:2.2},{k:'geiser',n:9,fuego:1}],
   lay(L){for(let i=0;i<6;i++){const a=i/6*6.283+.3;L.river(LAVA,[[Math.cos(a)*24,Math.sin(a)*24],[Math.cos(a)*40,Math.sin(a)*40]],3.2);}L.ring('craneo',3,34,{a:1,ry:Math.PI}).sc('estal',17,{dry:1}).sc('pilarH',15,{dry:1}).sc('caldero',8,{dry:1}).sc('losa',6,{dry:1}).sc('tinaja',12,{dry:1}).sc('barril',8,{dry:1});},
   foes:[['condenado',8,0],['chivo',5,0],['bruja',5,0],['culebron',4,.1],['basilisco',4,.1]],mid:[[4,'basilisco','El Basilisco Ciego'],[8,'torosupay',null]]},
 ]},
];
export const RG=Object.fromEntries(REGIONS.map((r,i)=>(r.i=i,[r.id,r])));
// qué abre cada región (cantidad de regiones ganadas)
export const OPEN={pampa:0,monte:0,ibera:1,ingenio:1,puna:2,selva:3,cuyo:4,sur:5,salamanca:7};
export function mapDef(r,t){const R=RG[r],m=R.maps[Math.min(2,t)];return{...m,n2:m.n2||2};}
export function buildLayout(r,t){const R=RG[r],m=R.maps[Math.min(2,t)];const L=new Lay({hx:m.hx,hz:m.hz,n:m.n2},1000+R.i*97+Math.min(2,t)*13);L.o('fogon',0,0,0);m.lay(L);return L;}
export function palette(r,t){const R=RG[r],m=R.maps[Math.min(2,t)];return{...R.pal,...(m.pal||{}),...(t>2?SANGRE:{})};}
