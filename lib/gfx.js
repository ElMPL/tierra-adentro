import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass.js';
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass.js';
export {THREE};
export const U={uTime:{value:0},uRim:{value:new THREE.Color(.5,.6,1)},uRimK:{value:.8}};
export const clamp=(x,a,b)=>x<a?a:x>b?b:x, lerp=(a,b,t)=>a+(b-a)*t, rnd=(a=1,b)=>b===undefined?Math.random()*a:a+Math.random()*(b-a), pick=a=>a[Math.random()*a.length|0], TAU=Math.PI*2;
const _e=new THREE.Euler(),_q=new THREE.Quaternion(),_v=new THREE.Vector3(),_c=new THREE.Color(),_p=new THREE.Vector3(),_s=new THREE.Vector3();
export function compose(p=[0,0,0],r=[0,0,0],s=1){const S=Array.isArray(s)?s:[s,s,s];return new THREE.Matrix4().compose(new THREE.Vector3(...p),new THREE.Quaternion().setFromEuler(new THREE.Euler(...r)),new THREE.Vector3(...S));}
// ---------- geometrias base ----------
export let DET={v:1};
const q=n=>Math.max(4,Math.round(n*DET.v));
export const sph=(r=1,w=14,h=10)=>new THREE.SphereGeometry(r,q(w),q(h));
export const hemi=(r=1,w=14,h=7,t=Math.PI/2)=>new THREE.SphereGeometry(r,q(w),q(h),0,TAU,0,t);
export const box=(x,y,z,rd=.02)=>new RoundedBoxGeometry(x,y,z,1,Math.min(rd,x/2.1,y/2.1,z/2.1));
export const cyl=(a,b,h,s=12,open=false)=>new THREE.CylinderGeometry(a,b,h,q(s),1,open);
export const cone=(r,h,s=10)=>new THREE.ConeGeometry(r,h,q(s));
export const tor=(R,r,a=7,b=20,arc=TAU)=>new THREE.TorusGeometry(R,r,q(a),q(b),arc);
export const cap=(r,l,s=10)=>new THREE.CapsuleGeometry(r,l,q(4),q(s));
export const lat=(pts,s=18)=>new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(p[0],p[1])),q(s));
export const oct=(r,d=0)=>new THREE.OctahedronGeometry(r,d);
export const ico=(r,d=0)=>new THREE.IcosahedronGeometry(r,d);
export function tub(pts,r0,r1,seg=10,rad=7,f){const c=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)));const g=new THREE.TubeGeometry(c,seg,1,q(rad),false);const P=g.attributes.position,n=q(rad)+1;
  for(let i=0;i<=seg;i++){const t=i/seg;c.getPointAt(t,_p);const r=f?f(t):lerp(r0,r1,t);for(let j=0;j<n;j++){const k=i*n+j;_v.fromBufferAttribute(P,k).sub(_p).multiplyScalar(r).add(_p);P.setXYZ(k,_v.x,_v.y,_v.z);}}g.computeVertexNormals();return g;}
// ---------- constructor de modelos (una sola malla con huesos por vertice) ----------
export class B{
  constructor(){this.d={p:[],n:[],c:[],v:[],a:[],e:[]};this.st=[new THREE.Matrix4()];this.g=null;this.ao=1;}
  push(p,r,s){this.st.push(this.st[this.st.length-1].clone().multiply(compose(p,r,s)));return this;}
  pop(){this.st.pop();return this;}
  // kind:1 caminar X,2 aleteo Z,3 vaiven Y,4 cabeceo X,5 giro Z,6 tela,7 giro Y,8 ataque X
  G(pv,kind,amp=0,ph=0,atk=0,fr=1){const w=new THREE.Vector3(...pv).applyMatrix4(this.st[this.st.length-1]);this.g=[w.x,w.y,w.z,kind,amp,ph,atk,fr];return this;}
  X(){this.g=null;return this;}
  add(geo,c,o={}){
    const g=geo.index?geo.toNonIndexed():geo;if(o.flat)g.computeVertexNormals();
    const m=this.st[this.st.length-1].clone().multiply(compose(o.p,o.r,o.s)),nm=new THREE.Matrix3().getNormalMatrix(m),flip=m.determinant()<0;
    const P=g.attributes.position,N=g.attributes.normal,d=this.d,gr=this.g||[0,0,0,0,0,0,0,0],em=o.e||0;
    for(let i=0;i<P.count;i+=3){
      if(typeof c==='function'){const x=(P.getX(i)+P.getX(i+1)+P.getX(i+2))/3,y=(P.getY(i)+P.getY(i+1)+P.getY(i+2))/3,z=(P.getZ(i)+P.getZ(i+1)+P.getZ(i+2))/3;_c.set(c(x,y,z));}else _c.set(c);
      for(let j=0;j<3;j++){const k=i+(flip?2-j:j);_v.fromBufferAttribute(P,k).applyMatrix4(m);const y=_v.y;d.p.push(_v.x,_v.y,_v.z);
        _v.fromBufferAttribute(N,k).applyMatrix3(nm).normalize();d.n.push(_v.x,_v.y,_v.z);
        const ao=em>0||!this.ao?1:(.66+.34*clamp(y/1.1,0,1))*(.84+.16*(_v.y*.5+.5));
        d.c.push(_c.r*ao,_c.g*ao,_c.b*ao);d.v.push(gr[0],gr[1],gr[2],gr[3]);d.a.push(gr[4],gr[5],gr[6],gr[7]);d.e.push(em);}
    }
    return this;
  }
  build(){const g=new THREE.BufferGeometry(),d=this.d,f=(n,a,k)=>g.setAttribute(n,new THREE.Float32BufferAttribute(a,k));
    f('position',d.p,3);f('normal',d.n,3);f('color',d.c,3);f('aPv',d.v,4);f('aAn',d.a,4);f('aEm',d.e,1);g.computeBoundingSphere();g.computeBoundingBox();return g;}
}
const VDECL=`attribute vec4 aPv;attribute vec4 aAn;attribute float aEm;attribute vec4 iA;attribute vec4 iB;uniform float uTime;
varying float vEm;varying vec4 vB;varying float vFl;varying vec3 vOP;
mat3 rX(float a){float c=cos(a),s=sin(a);return mat3(1.,0.,0.,0.,c,s,0.,-s,c);}
mat3 rY(float a){float c=cos(a),s=sin(a);return mat3(c,0.,-s,0.,1.,0.,s,0.,c);}
mat3 rZ(float a){float c=cos(a),s=sin(a);return mat3(c,s,0.,-s,c,0.,0.,0.,1.);}
mat3 gR;
vec3 animP(vec3 p){gR=mat3(1.);float k=aPv.w,t=iA.x;
 if(k>.5){
  if(k<1.5)gR=rX(sin(t*aAn.w+aAn.y)*aAn.x*iA.y+aAn.z*iA.z);
  else if(k<2.5)gR=rZ(sin(uTime*aAn.w+aAn.y+t)*aAn.x);
  else if(k<3.5)gR=rY(sin(uTime*aAn.w+aAn.y+t)*aAn.x);
  else if(k<4.5)gR=rX(sin(uTime*aAn.w+aAn.y+t)*aAn.x+aAn.z*iA.z);
  else if(k<5.5)gR=rZ(uTime*aAn.w+aAn.y);
  else if(k<6.5){float h=max(0.,aPv.y-p.y);p.x+=sin(uTime*aAn.w+p.y*3.5+aAn.y+t)*aAn.x*h;p.z+=cos(uTime*aAn.w*.9+p.y*3.+aAn.y+t)*aAn.x*h-h*aAn.z*iA.y;}
  else if(k<7.5)gR=rY(uTime*aAn.w+aAn.y);
  else gR=rX(aAn.z*iA.z);
  if(k<5.5||k>6.5)p=gR*(p-aPv.xyz)+aPv.xyz;
 }
 p.y+=abs(sin(t))*.07*iA.y+sin(uTime*2.2+t)*.012*p.y*(1.-iA.y);
 return p;}
`;
const VN=`gR=mat3(1.);vec3 aP0=animP(position);vec3 objectNormal=gR*vec3(normal);`;
const VB=`vec3 transformed=aP0;vEm=aEm;vB=iB;vFl=iA.w;vOP=position;`;
export function charMaterial(opt={}){
  const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:opt.rough??.78,metalness:opt.metal??.02,side:opt.side??THREE.DoubleSide,envMapIntensity:.4});
  m.onBeforeCompile=s=>{s.uniforms.uTime=U.uTime;s.uniforms.uRim=U.uRim;s.uniforms.uRimK=U.uRimK;if(opt.fade)s.uniforms.uPV=opt.fade;
    s.vertexShader=VDECL+s.vertexShader.replace('#include <beginnormal_vertex>',VN).replace('#include <begin_vertex>',VB);
    s.fragmentShader=`varying float vEm;varying vec4 vB;varying float vFl;varying vec3 vOP;uniform vec3 uRim;uniform float uRimK,uTime;${opt.fade?'uniform vec3 uPV[4];':''}\n`+s.fragmentShader
     .replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>
      ${opt.fade?'{vec3 V=-vViewPosition;float nz=fract(52.9829*fract(dot(gl_FragCoord.xy,vec2(.06711,.00584))));for(int i=0;i<4;i++){vec3 P=uPV[i];if(P.z<-.5&&V.z>P.z+1.2){float d=length(V.xy*(P.z/V.z)-P.xy);if(nz>smoothstep(1.3,3.1,d)+.1)discard;}}}':''}
      float dEdge=0.;if(vB.w>0.){vec3 cl=floor(vOP*9.);float dn=fract(sin(dot(cl,vec3(12.99,78.23,37.72)))*43758.5);dn=dn*.6+clamp(vOP.y*.18,0.,.4);if(dn<vB.w)discard;dEdge=smoothstep(.14,0.,dn-vB.w);}`)
     .replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
      float rimF=pow(1.-clamp(abs(dot(normalize(normal),normalize(vViewPosition))),0.,1.),2.6);
      totalEmissiveRadiance+=diffuseColor.rgb*vEm+uRim*rimF*uRimK*(1.-step(.01,vEm))*(diffuseColor.rgb*.8+.12)+vB.rgb*(.07+rimF*.95)+vec3(3.2,1.1,.2)*dEdge;
      totalEmissiveRadiance=mix(totalEmissiveRadiance,vec3(1.5,1.35,1.2),vFl);`);
  };
  m.customProgramCacheKey=()=>opt.fade?'chF':'ch';return m;
}
const CM=charMaterial();
const DM=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,side:THREE.DoubleSide});
DM.onBeforeCompile=s=>{s.uniforms.uTime=U.uTime;s.vertexShader=VDECL+s.vertexShader.replace('#include <begin_vertex>','vec3 aP0=animP(position);'+VB);};
export class Batch{
  constructor(scene,geo,max,o={}){const g=new THREE.BufferGeometry();for(const k in geo.attributes)g.setAttribute(k,geo.attributes[k]);
    this.a=new THREE.InstancedBufferAttribute(new Float32Array(max*4),4);this.b=new THREE.InstancedBufferAttribute(new Float32Array(max*4),4);this.a.setUsage(THREE.DynamicDrawUsage);this.b.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('iA',this.a);g.setAttribute('iB',this.b);
    this.m=new THREE.InstancedMesh(g,o.mat||CM,max);this.m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.m.customDepthMaterial=DM;this.m.frustumCulled=false;this.m.castShadow=o.shadow!==false;this.m.receiveShadow=o.recv!==false;this.max=max;this.n=0;this.m.count=0;scene.add(this.m);}
  begin(){this.n=0;}
  push(x,y,z,ry,s,ph=0,mv=0,at=0,fl=0,r=0,g=0,b=0,die=0,rx=0,rz=0,sy=0){if(this.n>=this.max)return;const i=this.n++,M=this.m.instanceMatrix.array,o=i*16;
    if(rx||rz){_e.set(rx,ry,rz,'YXZ');_q.setFromEuler(_e);_m.compose(_p.set(x,y,z),_q,_s.set(s,sy||s,s));_m.toArray(M,o);}
    else{const c=Math.cos(ry)*s,n=Math.sin(ry)*s;M[o]=c;M[o+1]=0;M[o+2]=-n;M[o+3]=0;M[o+4]=0;M[o+5]=sy||s;M[o+6]=0;M[o+7]=0;M[o+8]=n;M[o+9]=0;M[o+10]=c;M[o+11]=0;M[o+12]=x;M[o+13]=y;M[o+14]=z;M[o+15]=1;}
    const A=this.a.array,C=this.b.array,k=i*4;A[k]=ph;A[k+1]=mv;A[k+2]=at;A[k+3]=fl;C[k]=r;C[k+1]=g;C[k+2]=b;C[k+3]=die;}
  end(){this.m.count=this.n;this.m.visible=this.n>0;if(!this.n)return;const u=(a,s)=>{a.needsUpdate=true;};u(this.m.instanceMatrix);u(this.a);u(this.b);}
}
const _m=new THREE.Matrix4();
// ---------- FX de piso ----------
export const FX={RING:0,TCIRC:1,TLINE:2,PUD:3,SLASH:4,GLOW:5,BURN:6,RUNE:7,SHADOW:8,FIRE:9,SPIRAL:10};
export class GroundFX{
  constructor(scene,max=500){const g=new THREE.InstancedBufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([-1,0,-1,1,0,-1,1,0,1,-1,0,1],3));g.setIndex([0,2,1,0,3,2]);
    this.mx=new THREE.InstancedBufferAttribute(new Float32Array(max*4),4);this.sc=new THREE.InstancedBufferAttribute(new Float32Array(max*4),4);this.c=new THREE.InstancedBufferAttribute(new Float32Array(max*4),4);this.t=new THREE.InstancedBufferAttribute(new Float32Array(max*4),4);
    [this.mx,this.sc,this.c,this.t].forEach(a=>a.setUsage(THREE.DynamicDrawUsage));g.setAttribute('iP',this.mx);g.setAttribute('iS',this.sc);g.setAttribute('iC',this.c);g.setAttribute('iT',this.t);
    this.mat=new THREE.ShaderMaterial({uniforms:{uTime:U.uTime},transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.CustomBlending,blendSrc:THREE.OneFactor,blendDst:THREE.OneMinusSrcAlphaFactor,
     vertexShader:`attribute vec4 iP,iS,iC,iT;varying vec2 vU;varying vec4 vC,vT;varying vec2 vS;void main(){vU=position.xz;vC=iC;vT=iT;vS=iS.xy;float c=cos(iP.w),s=sin(iP.w);vec3 p=vec3(position.x*iS.x,0.,position.z*iS.y);p=vec3(p.x*c+p.z*s,0.,-p.x*s+p.z*c);p.y+=iS.z*0.;vec4 mv=modelViewMatrix*vec4(p+iP.xyz,1.);gl_Position=projectionMatrix*mv;gl_Position.z-=.0006*gl_Position.w;}`,
     fragmentShader:`precision highp float;varying vec2 vU;varying vec4 vC,vT;varying vec2 vS;uniform float uTime;
      float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float ns(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
      void main(){float r=length(vU),an=atan(vU.x,vU.y),a=0.,pr=vT.y;vec3 col=pow(max(vC.rgb,0.),vec3(1.9));float ad=vT.w;int ty=int(vT.x+.5);
       if(ty==0){float w=.05+.16*(1.-pr);a=smoothstep(w,0.,abs(r-pr*(1.-w)))*(1.-pr*pr);a*=.7+.5*ns(vec2(an*6.,uTime*3.));}
       else if(ty==1){float e=smoothstep(.06,0.,abs(r-.95));float f=step(r,.95)*.16+step(r,pr*.95)*.3;a=e+f;a*=.8+.2*sin(uTime*14.);}
       else if(ty==2){vec2 u=vU*.5+.5;float e=max(smoothstep(.9,1.,abs(vU.x)),smoothstep(.97,1.,abs(vU.y)));float f=.15+step(u.y,pr)*.28;float ch=step(.5,fract(u.y*vS.y*.5+abs(vU.x)*.4-uTime*2.5))*.12;a=e*.8+f+ch;}
       else if(ty==3){float n=ns(vU*3.+vT.z+uTime*.6)*.5+ns(vU*7.-uTime*.9)*.25;float ed=smoothstep(.98,.6,r+n*.35);a=ed*.62;float b=smoothstep(.62,.7,ns(vU*9.+vec2(uTime*1.7,vT.z)));col+=b*.8*col;col+=smoothstep(.2,0.,abs(r+n*.35-.75))*col*.4;a*=min(1.,(1.-pr)*5.);}
       else if(ty==4){float ha=vT.z;float sw=mix(-ha,ha,min(1.,pr*1.6));float d=an-sw;float trail=smoothstep(-ha*1.7,0.,d)*step(d,.02)*step(abs(an),ha);float bd=smoothstep(.42,.8,r)*smoothstep(1.,.93,r);float core=smoothstep(.8,.93,r)*smoothstep(1.,.95,r);a=bd*trail*(1.-smoothstep(.5,1.,pr))*.8;col=mix(col,col*.6+vec3(1.1),core*.75);}
       else if(ty==5){a=pow(max(0.,1.-r),2.)*(1.-pr);}
       else if(ty==6){float n=ns(vU*4.+vT.z)*.6+ns(vU*11.+vT.z)*.3;a=smoothstep(.9,.3,r+n*.5)*(1.-smoothstep(.6,1.,pr))*.75;}
       else if(ty==7){float an2=an+uTime*.5;float sg=24.;float u=fract(an2/6.28318*sg);float st=floor(abs(u-.5)*2.*4.)/4.;float band=step(.78+st*.12,r)*step(r,.97)*step(r,.97-.0);float ln=smoothstep(.02,0.,abs(r-.98))+smoothstep(.015,0.,abs(r-.73));float fl=step((an+3.14159)/6.28318,pr)*step(r,.73)*step(.62,r);a=band*.7+ln+fl*.95+smoothstep(1.,.0,r)*.12;a*=step(r,1.);}
       else if(ty==8){a=smoothstep(1.,.2,r)*.45;}
       else if(ty==9){float n=ns(vec2(an*5.+vT.z,r*5.-uTime*3.2));float n2=ns(vec2(an*11.,r*9.-uTime*5.));float b=smoothstep(.25,.85,r)*smoothstep(1.,.86,r);a=b*smoothstep(.25,.8,n*.7+n2*.45)*(1.-pr)+smoothstep(.05,0.,abs(r-.93))*.35*(1.-pr);col=mix(col,col*vec3(1.5,1.8,1.2),n2*n2);}
       else{float s=sin(an*5.+r*9.-uTime*9.);a=smoothstep(.2,1.,s)*smoothstep(1.,.6,r)*smoothstep(.05,.3,r)*(1.-pr);}
       a=min(a,1.25)*vC.a;if(a<.004)discard;gl_FragColor=vec4(col*a,min(1.,a*(1.-ad)));}`});
    this.m=new THREE.Mesh(g,this.mat);this.m.frustumCulled=false;this.m.renderOrder=2;scene.add(this.m);this.g=g;this.max=max;this.n=0;this.life=[];}
  begin(){this.n=0;}
  // dibuja este frame
  draw(type,x,y,z,rot,sx,sz,col,al,pr=0,seed=0,add=1){if(this.n>=this.max)return;const k=this.n++*4;const P=this.mx.array,S=this.sc.array,C=this.c.array,T=this.t.array;P[k]=x;P[k+1]=y;P[k+2]=z;P[k+3]=rot;S[k]=sx;S[k+1]=sz;C[k]=col[0];C[k+1]=col[1];C[k+2]=col[2];C[k+3]=al;T[k]=type;T[k+1]=pr;T[k+2]=seed;T[k+3]=add;}
  // efecto con vida propia
  spawn(type,x,z,r,col,dur,o={}){if(this.life.length>260)this.life.shift();this.life.push({type,x,y:o.y??.06,z,rot:o.rot||0,sx:r,sz:o.sz||r,col,al:o.al??1,t:0,dur,seed:o.seed??Math.random()*9,add:o.add??1,fol:o.fol});}
  end(dt){for(let i=this.life.length-1;i>=0;i--){const l=this.life[i];l.t+=dt;if(l.t>=l.dur){this.life.splice(i,1);continue;}if(l.fol){l.x=l.fol.x;l.z=l.fol.z;}this.draw(l.type,l.x,l.y,l.z,l.rot,l.sx,l.sz,l.col,l.al,l.t/l.dur,l.seed,l.add);}
    this.g.instanceCount=this.n;for(const a of[this.mx,this.sc,this.c,this.t])a.needsUpdate=true;}
}
// ---------- particulas ----------
export class Particles{
  constructor(scene,max=2600){this.max=max;this.n=0;const f=k=>new Float32Array(max*k);this.p=f(3);this.v=f(3);this.c=f(4);this.s=f(3);this.l=f(2);this.ex=f(3);
    const g=new THREE.BufferGeometry();g.setAttribute('position',this.aP=new THREE.BufferAttribute(this.p,3).setUsage(THREE.DynamicDrawUsage));g.setAttribute('aC',this.aC=new THREE.BufferAttribute(f(4),4).setUsage(THREE.DynamicDrawUsage));g.setAttribute('aS',this.aS=new THREE.BufferAttribute(f(3),3).setUsage(THREE.DynamicDrawUsage));
    this.mat=new THREE.ShaderMaterial({uniforms:{uPx:{value:800}},transparent:true,depthWrite:false,blending:THREE.CustomBlending,blendSrc:THREE.OneFactor,blendDst:THREE.OneMinusSrcAlphaFactor,
     vertexShader:`attribute vec4 aC;attribute vec3 aS;varying vec4 vC;varying vec2 vS;uniform float uPx;void main(){vC=aC;vS=aS.yz;vec4 m=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*m;gl_PointSize=min(220.,aS.x*uPx/-m.z);}`,
     fragmentShader:`varying vec4 vC;varying vec2 vS;void main(){vec2 u=gl_PointCoord*2.-1.;float r=length(u),a=0.,ad=1.;int t=int(vS.x+.5);float c=cos(vS.y),s=sin(vS.y);vec2 w=vec2(u.x*c-u.y*s,u.x*s+u.y*c);
      if(t==0)a=pow(max(0.,1.-r),1.6);else if(t==1){a=smoothstep(1.,.15,r);a*=a;a+=smoothstep(.35,0.,r);}else if(t==2){a=smoothstep(1.,.1,r)*.5;ad=0.;}
      else if(t==3){a=max(smoothstep(.16,0.,abs(w.x))*smoothstep(1.,.1,abs(w.y)),smoothstep(.16,0.,abs(w.y))*smoothstep(1.,.1,abs(w.x)));}
      else if(t==4){a=smoothstep(1.,.8,length(w*vec2(1.,2.4)));ad=0.1;}
      else if(t==5){float st=smoothstep(.12,.06,abs(w.x-.3))*step(-.8,w.y)*step(w.y,.5);float hd=smoothstep(.36,.28,length((w-vec2(.02,.5))*vec2(1.,1.25)));float fl=smoothstep(.14,.06,abs(w.y+.72-(w.x-.3)*.6))*step(.3,w.x)*step(w.x,.8);a=max(st,max(hd,fl));ad=.3;}
      else if(t==6){a=smoothstep(.18,0.,abs(r-.8));}
      else{float cr=smoothstep(.95,.85,r);float el=abs(c);float rr=length(vec2(u.x/max(.2,el),u.y));a=smoothstep(.95,.85,rr);ad=.15;}
      a*=vC.a;if(a<.005)discard;vec3 pc=pow(max(vC.rgb,0.),vec3(1.7))*1.15;gl_FragColor=vec4(pc*a,a*(1.-ad));}`});
    this.m=new THREE.Points(g,this.mat);this.m.frustumCulled=false;this.m.renderOrder=3;scene.add(this.m);this.head=0;this.g=g;this.k=1;}
  // ex: gravedad, arrastre, giro
  emit(x,y,z,vx,vy,vz,r,g,b,size,life,type=0,grav=0,drag=.0,spin=0,grow=0){const i=this.head;this.head=(i+1)%this.max;const k=i*3;this.p[k]=x;this.p[k+1]=y;this.p[k+2]=z;this.v[k]=vx;this.v[k+1]=vy;this.v[k+2]=vz;const c=i*4;this.c[c]=r;this.c[c+1]=g;this.c[c+2]=b;this.c[c+3]=1;this.s[k]=size;this.s[k+1]=type;this.s[k+2]=rnd(TAU);this.l[i*2]=life;this.l[i*2+1]=life;this.ex[k]=grav;this.ex[k+1]=drag;this.ex[k+2]=spin+grow*1000;}
  burst(x,y,z,n,col,o={}){n=Math.ceil(n*this.k);const sp=o.sp??5,sz=o.size??.35,lf=o.life??.6;for(let i=0;i<n;i++){const a=rnd(TAU),e=o.flat?rnd(-.1,.3):rnd(-.3,1.2),s=rnd(.3,1)*sp;this.emit(x+rnd(-.2,.2),y,z+rnd(-.2,.2),Math.cos(a)*s*Math.cos(e),Math.sin(e)*s+(o.up||0),Math.sin(a)*s*Math.cos(e),col[0],col[1],col[2],sz*rnd(.6,1.4),lf*rnd(.6,1.3),o.type??1,o.grav??-6,o.drag??1.5,o.spin??0,o.grow??0);}}
  update(dt){const C=this.aC.array,S=this.aS.array;for(let i=0;i<this.max;i++){const l=this.l[i*2];const c=i*4,k=i*3;if(l<=0){if(C[c+3]!==0){C[c+3]=0;S[k]=0;}continue;}const nl=l-dt;this.l[i*2]=nl;const f=Math.max(0,nl/this.l[i*2+1]);
      const gr=Math.round(this.ex[k+2]/1000),sp=this.ex[k+2]-gr*1000;const dr=Math.max(0,1-this.ex[k+1]*dt);this.v[k]*=dr;this.v[k+1]=this.v[k+1]*dr+this.ex[k]*dt;this.v[k+2]*=dr;this.p[k]+=this.v[k]*dt;this.p[k+1]+=this.v[k+1]*dt;this.p[k+2]+=this.v[k+2]*dt;if(this.p[k+1]<.06&&this.ex[k]<0){this.p[k+1]=.06;this.v[k+1]*=-.35;this.v[k]*=.7;this.v[k+2]*=.7;}
      this.s[k+2]+=sp*dt;C[c]=this.c[c];C[c+1]=this.c[c+1];C[c+2]=this.c[c+2];C[c+3]=Math.min(1,f*2.2);S[k]=this.s[k]*(gr?1+(1-f)*gr*.5:(.35+.65*f));S[k+1]=this.s[k+1];S[k+2]=this.s[k+2];}
    this.aP.needsUpdate=this.aC.needsUpdate=this.aS.needsUpdate=true;}
}
// ---------- postproceso ----------
export function makeComposer(renderer,scene,camera){
  const sz=renderer.getDrawingBufferSize(new THREE.Vector2());
  const rt=new THREE.WebGLRenderTarget(sz.x,sz.y,{type:THREE.HalfFloatType,samples:4});
  const comp=new EffectComposer(renderer,rt);comp.setPixelRatio(1);comp.setSize(sz.x,sz.y);
  const rp=new RenderPass(scene,camera);comp.addPass(rp);
  const bloom=new UnrealBloomPass(new THREE.Vector2(sz.x/2,sz.y/2),.5,.55,.95);comp.addPass(bloom);
  comp.addPass(new OutputPass());
  const grade=new ShaderPass({uniforms:{tDiffuse:{value:null},uTime:U.uTime,uHurt:{value:0},uWob:{value:0},uGold:{value:0},uSat:{value:.98},uTint:{value:new THREE.Color(1,1,1)},uRatio:{value:1}},
   vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
   fragmentShader:`varying vec2 vUv;uniform sampler2D tDiffuse;uniform float uTime,uHurt,uWob,uGold,uSat;uniform vec3 uTint;
    float h(vec2 p){return fract(sin(dot(p,vec2(12.9,78.2))+uTime)*43758.5);}
    void main(){vec2 u=vUv;vec2 c=u-.5;float d=dot(c,c);u+=vec2(sin(u.y*9.+uTime*3.),cos(u.x*8.+uTime*2.6))*.005*uWob;float ca=.0009+.0035*uWob+.004*uHurt;vec3 o;o.r=texture2D(tDiffuse,u+c*ca).r;o.g=texture2D(tDiffuse,u).g;o.b=texture2D(tDiffuse,u-c*ca).b;
    float l=dot(o,vec3(.3,.59,.11));o=mix(vec3(l),o,uSat);o*=uTint;o=mix(o,o*o*(3.-2.*o),.22);
    float vg=smoothstep(.95,.18,d*1.6);o*=mix(.62,1.,vg);o=mix(o,vec3(.65,.03,.02)*(l+.35),uHurt*smoothstep(.06,.5,d));o+=vec3(1.,.72,.2)*uGold*smoothstep(.02,.45,d)*.55;o+=(h(u)-.5)*.018;gl_FragColor=vec4(o,1.);}`});
  comp.addPass(grade);
  return {comp,bloom,grade,rp};
}
