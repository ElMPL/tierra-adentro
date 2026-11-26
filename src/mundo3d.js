// Cómo se ve el mundo: cielo con día y noche, piso pintado por territorio, agua, pasto y decorado por pedazos.
import {THREE, B, DET, U, TAU, clamp, lerp, charMaterial, Batch} from '../lib/gfx.js';
import {KIT} from '../lib/deco.js';
import {MISC, model} from '../lib/models.js';
import {RG, palette} from '../lib/regions.js';
import {REG, ORDEN, CH, NORTE, SUR, bordeX, agua, camino, regionEn, pedazo, dentro} from '../shared/mapa.js';
import {mul, hash} from '../shared/azar.js';
import {esNoche} from '../shared/sim.js';

const C = h => new THREE.Color(h);
const NOISE = `float h21(vec2 p){p=fract(p*vec2(123.34,345.45));p+=dot(p,p+34.345);return fract(p.x*p.y);}float ns(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*ns(p);p=p*2.03+7.1;a*=.5;}return s;}`;
// momentos del día
const DIA = {top: 0x2f7acc, mid: 0x86c0ee, hor: 0xeef2e0, sun: 0xfff0d0, sunI: 2.9, hs: 0xdcecff, hg: 0x6a6a4a, hi: 1.0, fog: 0xc4d8e4, star: 0, rim: 0xfff4e0, rk: .45};
const TARDE = {top: 0x2a3a78, mid: 0xd8705a, hor: 0xffc46a, sun: 0xffc48a, sunI: 2.6, hs: 0xffdcc0, hg: 0x55563a, hi: 1.05, fog: 0xd8966a, star: .12, rim: 0xffb070, rk: .75};
const NOCHE = {top: 0x050a22, mid: 0x142450, hor: 0x46588e, sun: 0xb4caff, sunI: 1.9, hs: 0xa8bcff, hg: 0x30343a, hi: 1.3, fog: 0x1e2e5a, star: 1, rim: 0x9ac0ff, rk: .95};
const RES = 3, X0 = -500, Z0 = NORTE - 30, TW = Math.ceil(1000 / RES), TH = Math.ceil((SUR - NORTE + 60) / RES);
const PALS = Object.fromEntries(ORDEN.map(k => [k, palette(k, 0)]));

export class Mundo3D {
  constructor(scene, q) {
    this.scene = scene; this.q = q; this.bts = {}; this.geos = {}; this.rotos = new Map(); this.clave = ''; this.vis = [];
    this.u = {top: {value: C(0)}, mid: {value: C(0)}, hor: {value: C(0)}, sunC: {value: C(0)}, sunD: {value: new THREE.Vector3(0, 1, 0)}, star: {value: 0}, moon: {value: 0}, fogC: {value: C(0)}, flash: {value: 0}, red: {value: 0},
      pv: {value: [0, 1, 2, 3].map(() => new THREE.Vector3(0, 0, 99))}, uO: {value: new THREE.Vector2(X0, Z0)}, uS: {value: new THREE.Vector2(TW * RES, TH * RES)}};
    scene.fog = new THREE.Fog(0, 60, 170);
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1); scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xffffff, 2); this.sun.castShadow = q !== 'baja';
    const s = this.sun.shadow; s.mapSize.set(q === 'alta' ? 2048 : 1536, q === 'alta' ? 2048 : 1536); s.camera.left = s.camera.bottom = -38; s.camera.right = s.camera.top = 38; s.camera.near = 1; s.camera.far = 170; s.bias = -.0006; s.normalBias = .05;
    scene.add(this.sun, this.sun.target);
    this.fill = new THREE.DirectionalLight(0xfff0e2, .8); this.fill.position.set(.35, .75, 1); scene.add(this.fill);
    this.fuego = new THREE.PointLight(0xff8a3a, 0, 20, 1.6); scene.add(this.fuego);
    this.fxL = new THREE.PointLight(0xffffff, 0, 30, 1.6); scene.add(this.fxL);
    this.mat = charMaterial({rough: .9, fade: this.u.pv});
    this.texturas(); this.cielo(); this.piso(); this.pasto(); this.bichitos(); this.borde();
  }
  // ---------- texturas del piso: color del pasto y de la tierra, caminos, agua ----------
  texturas() {
    const N = TW * TH, A = new Uint8Array(N * 4), Bt = new Uint8Array(N * 4), Cc = new Uint8Array(N * 4);
    this.reg = new Uint8Array(N); const idx = Object.fromEntries(ORDEN.map((k, i) => [k, i]));
    const col = ORDEN.map(k => ({a: C(PALS[k].gA), b: C(PALS[k].gB), g: C(PALS[k].gr), g2: C(PALS[k].gr2), gr: PALS[k].grass ?? 1}));
    const tierra = {pampa: .1, ibera: .05, monte: .25, ingenio: .3, selva: .35, cuyo: .55, puna: .75, sur: .45, salamanca: .7};
    for (let j = 0; j < TH; j++) for (let i = 0; i < TW; i++) {
      const x = X0 + (i + .5) * RES, z = Z0 + (j + .5) * RES, k = j * TW + i, o = k * 4;
      const r = dentro(x, z, -40) ? regionEn(x, z) : (z > 0 ? 'sur' : x < 0 ? 'puna' : 'selva'); const c = col[idx[r]]; this.reg[k] = idx[r];
      A[o] = c.a.r * 255; A[o + 1] = c.a.g * 255; A[o + 2] = c.a.b * 255; A[o + 3] = clamp((3.4 - camino(x, z)) / 3.4, 0, 1) * 255;
      Bt[o] = c.b.r * 255; Bt[o + 1] = c.b.g * 255; Bt[o + 2] = c.b.b * 255; Bt[o + 3] = Math.min(1.5, agua(x, z)) / 1.5 * 255;
      const out = !dentro(x, z, 0); Cc[o] = (tierra[r] + (out ? .3 : 0)) * 255; Cc[o + 1] = clamp((z - 470) / 120, 0, 1) * 255; Cc[o + 2] = r === 'salamanca' ? 255 : 0; Cc[o + 3] = c.gr * 255;
    }
    // suavizar el cambio de color entre territorios
    for (const T of [A, Bt]) { const t = new Uint8Array(T); for (let p = 0; p < 2; p++) for (let j = 1; j < TH - 1; j++) for (let i = 1; i < TW - 1; i++) { const k = (j * TW + i) * 4; for (let c = 0; c < 3; c++) T[k + c] = (t[k + c] * 4 + t[k + c - 4] + t[k + c + 4] + t[k + c - TW * 4] + t[k + c + TW * 4]) / 8; } }
    const tex = d => { const t = new THREE.DataTexture(d, TW, TH, THREE.RGBAFormat); t.magFilter = t.minFilter = THREE.LinearFilter; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.needsUpdate = true; return t; };
    this.tA = tex(A); this.tB = tex(Bt); this.tC = tex(Cc); this.dA = A; this.dB = Bt; this.dC = Cc; this.col = col;
  }
  muestra(x, z) { const i = clamp(Math.floor((x - X0) / RES), 0, TW - 1), j = clamp(Math.floor((z - Z0) / RES), 0, TH - 1); return j * TW + i; }
  cielo() {
    const m = new THREE.ShaderMaterial({side: THREE.BackSide, depthWrite: false, fog: false, uniforms: {...this.u, uTime: U.uTime},
      vertexShader: `varying vec3 vD;void main(){vD=normalize(position);vec4 p=projectionMatrix*mat4(mat3(modelViewMatrix))*vec4(position,1.);gl_Position=p.xyww;}`,
      fragmentShader: `varying vec3 vD;uniform vec3 top,mid,hor,sunC,sunD;uniform float star,moon,uTime,flash,red;${NOISE}
      void main(){vec3 d=normalize(vD);float y=max(d.y,0.);vec3 c=mix(hor,mid,smoothstep(0.,.22,y));c=mix(c,top,smoothstep(.16,.75,y));
       vec2 sp=vec2(atan(d.x,d.z),asin(clamp(d.y,-1.,1.)));vec2 g=sp*70.;vec2 id=floor(g);float h=h21(id);vec2 o=vec2(h21(id+3.),h21(id+7.))-.5;float tw=.6+.4*sin(uTime*(1.+h*4.)+h*40.);
       c+=star*step(.86,h)*smoothstep(.12,0.,length(fract(g)-.5-o*.7))*tw*vec3(.9,.95,1.1)*smoothstep(.02,.2,y);
       float cl=fbm(sp*vec2(2.2,9.)+vec2(uTime*.012,0.));c=mix(c,mix(hor,sunC,.35)*1.05,smoothstep(.5,.85,cl)*.5*smoothstep(0.,.08,y)*smoothstep(.6,.15,y));
       vec3 sd=normalize(sunD);float s2=max(dot(d,normalize(vec3(sd.x,max(sd.y,.1),sd.z))),0.);
       if(moon<.5)c+=sunC*(pow(s2,24.)*.35+pow(s2,260.)*.7);else{float md=dot(d,normalize(vec3(sd.x,.35,sd.z)));c=mix(c,vec3(1.2,1.25,1.35)*(.75+.35*fbm(sp*26.)),smoothstep(.9968,.9974,md));c+=vec3(.6,.65,.8)*pow(max(md,0.),60.)*.2;}
       c=mix(c,c*vec3(1.4,.45,.4),red*.6);c+=flash*vec3(.6,.7,.9);if(d.y<0.)c=mix(hor,hor*.5,smoothstep(0.,-.3,d.y));gl_FragColor=vec4(c,1.);}`});
    const s = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 20), m); s.frustumCulled = false; s.renderOrder = -10; this.scene.add(s); this.sky = s;
  }
  piso() {
    const m = new THREE.MeshStandardMaterial({color: 0xffffff, roughness: .95}); const u = this.u;
    m.onBeforeCompile = s => {
      Object.assign(s.uniforms, {tA: {value: this.tA}, tB: {value: this.tB}, tC: {value: this.tC}, uO: u.uO, uS: u.uS, uTime: U.uTime, flash: u.flash});
      s.vertexShader = 'varying vec3 vW;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvW=(modelMatrix*vec4(position,1.)).xyz;');
      s.fragmentShader = `varying vec3 vW;uniform sampler2D tA,tB,tC;uniform vec2 uO,uS;uniform float uTime,flash;${NOISE}
       vec2 vor(vec2 p){vec2 i=floor(p),f=fract(p);float d1=8.,d2=8.;for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 g=vec2(x,y);vec2 o=vec2(h21(i+g),h21(i+g+9.));float d=length(g+o-f);if(d<d1){d2=d1;d1=d;}else if(d<d2)d2=d;}return vec2(d1,d2);}\n` + s.fragmentShader
        .replace('#include <color_fragment>', `#include <color_fragment>
         vec2 w=vW.xz;vec2 uv=(w-uO)/uS;vec4 A=texture2D(tA,uv),Bt=texture2D(tB,uv),Ct=texture2D(tC,uv);
         float n=fbm(w*.12),n2=fbm(w*.6+4.),n3=ns(w*3.2);
         float dirt=smoothstep(.42,.62,n+Ct.r*.7-.12+.25*(n2-.5));
         vec3 g=mix(A.rgb*(.72+.5*n2),Bt.rgb*(.74+.46*n2),dirt);g*=.86+.26*n3;g=mix(g,g*.62,smoothstep(.62,.75,ns(w*1.3+20.))*.5*dirt);
         g=mix(g,g*1.35,smoothstep(.78,.85,ns(w*5.+60.))*dirt*.6);g+=step(.93,ns(w*8.))*(1.-dirt)*A.rgb*.8;
         float road=smoothstep(.38,.6,A.a+(n2-.5)*.3);g=mix(g,mix(Bt.rgb,vec3(.62,.5,.36),.45)*(.88+.22*n3)*(1.-.25*smoothstep(.55,.9,ns(w*vec2(1.6,.4)))),road*.92);
         float nieve=smoothstep(.3,.7,Ct.g+(n-.5)*.5);vec2 vi=vor(w*.3+3.);g=mix(g,vec3(.86,.9,.96)*(.92+.1*n3),nieve);g=mix(g,vec3(.95,.98,1.),nieve*smoothstep(.04,.0,vi.y-vi.x)*.5);
         vec2 v=vor(w*.34+n*1.2);float crack=smoothstep(.06,.0,v.y-v.x)*smoothstep(.45,.75,n+n2*.3)*Ct.b;
         vec3 lav=crack*vec3(1.,.3,.05)*(.8+.4*sin(uTime*1.6+n*20.));g=mix(g,vec3(.02),crack*.5);
         float wd=Bt.a*1.5;float wat=smoothstep(.1,.2,wd+(n2-.5)*.08);float hondo=smoothstep(.3,1.3,wd);
         vec3 wc=mix(vec3(.12,.34,.38),vec3(.04,.14,.3),hondo);float shore=wat*(1.-smoothstep(.2,.42,wd+(n2-.5)*.08));
         g=mix(g,wc*(.75+.5*ns(w*.8+uTime*.3)),wat*.93);float gl=smoothstep(.7,.86,ns(w*vec2(.55,1.7)+uTime*.55));lav+=wat*(wc*1.2+.03)*gl*.9+shore*vec3(.35,.45,.5)*(.4+.6*ns(w*2.2+uTime*.8))*.55;
         diffuseColor.rgb=g;`)
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance+=lav+flash*vec3(.05,.06,.08);');
    };
    const g = new THREE.Mesh(new THREE.PlaneGeometry(340, 340), m); g.rotation.x = -Math.PI / 2; g.receiveShadow = true; this.scene.add(g); this.suelo = g;
  }
  // ---------- pasto ----------
  pasto() {
    const n = this.gn = {alta: 22000, media: 13000, baja: 4000}[this.q] || 13000; const bp = [];
    for (const a of [0, 1.57]) { const c = Math.cos(a) * .065, s = Math.sin(a) * .065; bp.push(-c, 0, -s, c, 0, s, c * .5, .5, s * .5, -c, 0, -s, c * .5, .5, s * .5, -c * .5, .5, -s * .5, -c * .5, .5, -s * .5, c * .5, .5, s * .5, 0, 1, 0); }
    const g = this.gg = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3));
    g.setAttribute('iO', new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4)); g.setAttribute('iV', new THREE.InstancedBufferAttribute(new Float32Array(n * 2), 2)); g.setAttribute('iC', new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3)); g.instanceCount = 0;
    this.lite = {value: C(0xffffff)};
    const m = new THREE.ShaderMaterial({side: THREE.DoubleSide, fog: true, uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]),
      vertexShader: `attribute vec4 iO;attribute vec2 iV;attribute vec3 iC;uniform float uTime;uniform vec3 pv[4];varying float vH;varying vec3 vC;varying float vL;
       #include <fog_pars_vertex>
       void main(){float h=position.y;vH=h;vC=iC;float c=cos(iO.w),s=sin(iO.w);vec3 p=vec3(position.x*c-position.z*s,h*iO.z,position.x*s+position.z*c);p.xz*=iV.y*(.8+iO.z*.6);vec3 w=vec3(iO.x,0.,iO.y)+p;
        float wv=sin(uTime*1.6+w.x*.35+w.z*.28)+.5*sin(uTime*3.1+w.x*.9);w.xz+=h*h*iO.z*vec2(.16,.1)*wv;
        vL=.7+.3*sin(iO.x*.4)*cos(iO.y*.4);vec4 mvPosition=viewMatrix*vec4(w,1.);
        for(int i=0;i<4;i++){vec3 P=pv[i];if(P.z<-.5){float d=length(mvPosition.xyz-P);mvPosition.xyz+=normalize(mvPosition.xyz-P+.001)*smoothstep(1.4,.2,d)*h*.5;}}
        gl_Position=projectionMatrix*mvPosition;
       #include <fog_vertex>
       }`,
      fragmentShader: `varying float vH,vL;varying vec3 vC;uniform vec3 lite;
       #include <fog_pars_fragment>
       void main(){vec3 c=mix(vC*.35,vC,vH);c*=lite*vL*1.45;gl_FragColor=vec4(c,1.);
       #include <fog_fragment>
       }`});
    Object.assign(m.uniforms, {uTime: U.uTime, lite: this.lite, pv: this.u.pv});
    const me = new THREE.Mesh(g, m); me.frustumCulled = false; this.scene.add(me); this.pastoC = {x: 1e9, z: 1e9};
  }
  crecer(cx, cz) {
    const g = this.gg, n = this.gn, o = g.attributes.iO.array, v = g.attributes.iV.array, cc = g.attributes.iC.array; const q = mul(hash(Math.round(cx), Math.round(cz), 3));
    let i = 0, t = 0; const R = 34, c1 = new THREE.Color(), c2 = new THREE.Color();
    while (i < n && t++ < n * 3) {
      const x = cx + (q() * 2 - 1) * R, z = cz - 8 + (q() * 2 - 1) * R * 1.25, k = this.muestra(x, z), dens = this.dC[k * 4 + 3] / 255;
      if (q() > dens * .9 + .05 || this.dB[k * 4 + 3] > 20 || this.dA[k * 4 + 3] > 90) continue;
      const nz = Math.sin(x * .21 + 1) * Math.cos(z * .19 + 2) + .6 * Math.sin(x * .47 + z * .33); if (nz < -.2 && q() < .7) continue;
      const cl = this.col[this.reg[k]]; c1.copy(cl.g).lerp(c2.copy(cl.g2), q() * .7);
      o[i * 4] = x; o[i * 4 + 1] = z; o[i * 4 + 2] = .3 + q() * .45 + (q() < .1 ? .5 : 0); o[i * 4 + 3] = q() * TAU; v[i * 2] = q(); v[i * 2 + 1] = .7 + q() * .7; cc[i * 3] = c1.r; cc[i * 3 + 1] = c1.g; cc[i * 3 + 2] = c1.b; i++;
    }
    g.instanceCount = i; for (const a of ['iO', 'iV', 'iC']) g.attributes[a].needsUpdate = true; this.pastoC = {x: cx, z: cz};
  }
  // luciérnagas de noche y polvito de día
  bichitos() {
    const n = 360, g = new THREE.BufferGeometry(), p = new Float32Array(n * 3), s = new Float32Array(n); const q = mul(5);
    for (let i = 0; i < n; i++) { p[i * 3] = q() * 80 - 40; p[i * 3 + 1] = q() * 10; p[i * 3 + 2] = q() * 80 - 40; s[i] = q(); }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('aS', new THREE.BufferAttribute(s, 1));
    this.aU = {uTime: U.uTime, col: {value: C(0xffffff)}, noche: {value: 0}, ctr: {value: new THREE.Vector3()}, px: {value: 700}};
    const m = new THREE.ShaderMaterial({transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: this.aU,
      vertexShader: `attribute float aS;uniform float uTime,noche,px;uniform vec3 ctr;varying float vA;void main(){vec3 p=position+vec3(.4,.05,.2)*uTime*(.5+aS);p.x+=sin(uTime*(.5+aS)+aS*40.)*1.2;p.z+=cos(uTime*(.6+aS)+aS*30.)*1.2;p.x=mod(p.x-ctr.x+40.,80.)-40.+ctr.x;p.z=mod(p.z-ctr.z+40.,80.)-40.+ctr.z;p.y=mod(p.y,10.);
       vA=mix(.35,pow(max(0.,sin(uTime*(1.+aS*2.)+aS*60.)),2.),noche)*smoothstep(0.,1.,p.y)*smoothstep(10.,7.,p.y);vec4 mv=viewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=min(20.,.14*(.5+aS)*px/-mv.z);}`,
      fragmentShader: `uniform vec3 col;varying float vA;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(col*vA*smoothstep(.5,.1,d),0.);}`});
    const pt = new THREE.Points(g, m); pt.frustumCulled = false; pt.renderOrder = 3; this.scene.add(pt);
  }
  // ---------- afuera del mapa: cordillera al oeste y al norte, selva al noreste, hielo al sur ----------
  borde() {
    const L = this.fuera = [], q = mul(91);
    for (let z = NORTE - 40; z < SUR + 40; z += 22) { const [o] = bordeX(z); for (let k = 0; k < 3; k++) L.push({t: 'cerro', x: o - 16 - k * 26 - q() * 10, z: z + q() * 12, ry: q() * 6.28, s: 2.2 + q() * 1.6 + k * .8}); }
    for (let x = -520; x < 520; x += 22) { const sel = x > 120; for (let k = 0; k < 3; k++) L.push(sel ? {t: k ? 'arbolote' : 'tacuara', x: x + q() * 10, z: NORTE - 6 - k * 9 - q() * 6, ry: q() * 6.28, s: 1.3 + q() * .5} : {t: 'cerro', x: x + q() * 10, z: NORTE - 18 - k * 26, ry: q() * 6.28, s: 2.2 + q() * 1.5 + k * .8}); }
    for (let z = NORTE; z < -70; z += 9) { const [, e] = bordeX(z); for (let k = 0; k < 3; k++) L.push({t: q() < .3 ? 'tacuara' : 'arbolote', x: e + 4 + k * 9 + q() * 5, z: z + q() * 6, ry: q() * 6.28, s: 1.2 + q() * .5}); }
    for (let x = -480; x < 120; x += 14) for (let k = 0; k < 2; k++) L.push({t: 'hieloB', x: x + q() * 8, z: SUR + 4 + k * 10 + q() * 4, ry: q() * 6.28, s: 2 + q() * 1.5});
    this.fueraCh = new Map(); for (const o of L) { const k = Math.floor(o.x / CH) + ',' + Math.floor(o.z / CH); (this.fueraCh.get(k) || this.fueraCh.set(k, []).get(k)).push(o); }
  }
  geo(t) {
    if (this.geos[t]) return this.geos[t];
    let g;
    if (t === 'cerro') { DET.v = .8; const b = new B(); const q = mul(7); for (let i = 0; i < 4; i++) { const r = 6 - i * .9, h = 9 + q() * 6 - i, x = (q() - .5) * 6, z = (q() - .5) * 6; b.add(new THREE.ConeGeometry(r, h, 7, 3), (px, py, pz) => py > h * .32 ? 0xeef2f6 : py > -h * .1 ? 0x8a7a6a : 0x6a5a4a, {p: [x, h / 2 - 1, z], r: [0, q() * 3, 0], flat: 1}); } DET.v = 1; g = b.build(); }
    else if (KIT[t]) { const d = KIT[t]; DET.v = d.det || .85; const b = new B(); d.f(b); DET.v = 1; g = b.build(); }
    else if (MISC[t]) g = model(MISC[t], .85);
    else g = model(b => b.add(new THREE.BoxGeometry(1, 1, 1), 0xff00ff));
    return this.geos[t] = g;
  }
  // arma el decorado que se ve alrededor de (x, z)
  decorar(x, z, forzar) {
    const cx = Math.floor(x / CH), cz = Math.floor((z - 10) / CH), clave = cx + ',' + cz;
    if (!forzar && clave === this.clave) return; this.clave = clave;
    const R = 3, lista = {}; this.vis = [];
    for (let j = cz - R; j <= cz + R; j++) for (let i = cx - R; i <= cx + R; i++) {
      for (const o of pedazo(i, j)) { if (this.rotos.has(o)) continue; (lista[o.misc ? 'M:' + o.t : o.t] ||= []).push(o); if (KIT[o.t]?.brk) this.vis.push(o); }
      for (const o of this.fueraCh.get(i + ',' + j) || []) (lista[o.t] ||= []).push(o);
    }
    for (const k in this.bts) if (!lista[k]) { this.bts[k].begin(); this.bts[k].end(); }
    for (const k in lista) {
      const l = lista[k], t = k.startsWith('M:') ? k.slice(2) : k; let bt = this.bts[k];
      if (!bt || bt.max < l.length) { if (bt) { this.scene.remove(bt.m); bt.m.dispose(); } bt = this.bts[k] = new Batch(this.scene, this.geo(t), Math.ceil(l.length * 1.5) + 8, {mat: this.mat, shadow: !(KIT[t]?.noSh) && t !== 'cerro' && t !== 'hieloB'}); }
      bt.begin(); for (const o of l) { o.bt = bt; o.bi = bt.n; bt.push(o.x, 0, o.z, o.ry, o.s, (o.x * 7.3 + o.z * 3.1) % 9); } bt.end();
    }
  }
  romper(o) { this.rotos.set(o, performance.now()); this.clave = ''; }
  // ---------- luz según la hora y el territorio ----------
  luz(hora, reg, k = 1) {
    const dia = clamp((Math.sin((hora - .25) * TAU) + .15) * 2.2, 0, 1), tarde = Math.max(0, 1 - Math.abs(Math.sin((hora - .25) * TAU)) * 3.2) * .9;
    const P = PALS[reg] || PALS.pampa, mix = (a, b, c, key) => { const x = C(NOCHE[key]).lerp(C(DIA[key]), dia); return x.lerp(C(TARDE[key]), tarde * (1 - Math.abs(dia - .5) * .4)); };
    const u = this.u, set = (n, key, tint = 0) => { const c = mix(0, 0, 0, key); if (tint) c.lerp(C(P[key] ?? P.fog), tint); u[n].value.lerp(c, k); };
    set('top', 'top', reg === 'salamanca' ? .7 : .12); set('mid', 'mid', reg === 'salamanca' ? .7 : .15); set('hor', 'hor', reg === 'salamanca' ? .7 : .2); set('sunC', 'sun', .15); set('fogC', 'fog', reg === 'salamanca' ? .75 : .3);
    u.star.value = lerp(NOCHE.star, 0, dia); u.moon.value = dia < .35 ? 1 : 0; u.red.value = reg === 'salamanca' ? .4 : 0;
    const a = (hora - .25) * TAU; const sd = dia > .02 ? new THREE.Vector3(Math.cos(a) * .7, Math.max(.28, Math.sin(a)), -.45).normalize() : new THREE.Vector3(-.4, .75, -.35).normalize();
    u.sunD.value.lerp(sd, k); this.sd = u.sunD.value.clone().normalize();
    this.sun.color.copy(u.sunC.value); this.sunI = lerp(NOCHE.sunI, DIA.sunI, dia) * (reg === 'salamanca' ? .85 : 1);
    this.hemi.color.copy(C(NOCHE.hs).lerp(C(DIA.hs), dia)); this.hemi.groundColor.copy(C(NOCHE.hg).lerp(C(P.hg), dia * .6 + .2)); this.hi = lerp(NOCHE.hi, DIA.hi, dia);
    this.scene.fog.color.copy(u.fogC.value); this.scene.fog.near = reg === 'salamanca' ? 40 : 62; this.scene.fog.far = reg === 'salamanca' ? 120 : 175;
    U.uRim.value.copy(C(NOCHE.rim).lerp(C(DIA.rim), dia)); U.uRimK.value = lerp(NOCHE.rk, DIA.rk, dia);
    this.aU.col.value.copy(dia > .5 ? C(0xfff0c0) : C(0xc8ff80)); this.aU.noche.value = 1 - dia; this.dia = dia;
  }
  update(dt, t, foco, hora) {
    const reg = regionEn(foco.x, foco.z); this.region = reg;
    this.luz(hora, reg, this.listo ? Math.min(1, dt * 1.5) : 1); this.listo = true;
    this.u.flash.value = Math.max(0, this.u.flash.value - dt * 2.6);
    this.sun.intensity = this.sunI + this.u.flash.value * 3; this.hemi.intensity = this.hi + this.u.flash.value;
    const sx = Math.round(foco.x / 2) * 2, sz = Math.round(foco.z / 2) * 2; this.sun.target.position.set(sx, 0, sz - 6); this.sun.position.copy(this.sd).multiplyScalar(80); this.sun.position.x += sx; this.sun.position.z += sz - 6;
    this.suelo.position.set(Math.round(foco.x / 8) * 8, 0, Math.round(foco.z / 8) * 8 - 30);
    this.aU.ctr.value.set(foco.x, 0, foco.z);
    this.lite.value.copy(this.sun.color).multiplyScalar(this.sun.intensity * .2).add(C(0xffffff).lerp(this.hemi.color, .6).multiplyScalar(this.hemi.intensity * .42));
    this.fxL.intensity *= Math.max(0, 1 - dt * 5);
    if (Math.abs(foco.x - this.pastoC.x) > 10 || Math.abs(foco.z - this.pastoC.z) > 10) this.crecer(foco.x, foco.z);
    this.decorar(foco.x, foco.z);
    // tinajas rotas vuelven a los 5 minutos
    if ((this.rt = (this.rt || 0) + dt) > 5) { this.rt = 0; const now = performance.now(); let ch = false; for (const [o, tt] of this.rotos) if (now - tt > 300e3) { this.rotos.delete(o); ch = true; } if (ch) this.decorar(foco.x, foco.z, true); }
  }
  lightAt(x, z, col, i) { this.fxL.position.set(x, 3.5, z); this.fxL.color.setRGB(col[0], col[1], col[2]); this.fxL.intensity = Math.max(this.fxL.intensity, i); }
}
export {esNoche};
