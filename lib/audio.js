// Musica y efectos 100% sintetizados: guitarra Karplus-Strong, bombo legüero (aro en 6/8, parche en 3/4), quena en terceras
let ac,master,mus,sfx,rev,noiseB;const ks={};
const A={vol:{m:.6,s:.8},on:false,track:'menu',next:0,bar:0,intensity:0};
const mtof=m=>440*Math.pow(2,(m-69)/12);
function ksBuf(m){if(ks[m])return ks[m];const sr=ac.sampleRate,f=mtof(m),N=Math.max(2,Math.round(sr/f)),L=Math.floor(sr*1.5),b=ac.createBuffer(1,L,sr),d=b.getChannelData(0);const r=new Float32Array(N);let lp=0;for(let i=0;i<N;i++){const w=Math.random()*2-1;lp=lp*.45+w*.55;r[i]=lp;}for(let i=0,p=0;i<L;i++){const n=(p+1)%N;d[i]=r[p]*(1-i/L);r[p]=(r[p]*.5+r[n]*.5)*.9965;p=n;}return ks[m]=b;}
function init(){if(ac){ac.state==='suspended'&&ac.resume();return;}const X=window.AudioContext||window.webkitAudioContext;if(!X)return;ac=new X();master=ac.createDynamicsCompressor();master.threshold.value=-14;master.ratio.value=5;master.connect(ac.destination);mus=ac.createGain();sfx=ac.createGain();mus.connect(master);sfx.connect(master);
  rev=ac.createConvolver();const L=ac.sampleRate*1.6,ib=ac.createBuffer(2,L,ac.sampleRate);for(let c=0;c<2;c++){const d=ib.getChannelData(c);for(let i=0;i<L;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/L,3);}rev.buffer=ib;const rg=ac.createGain();rg.gain.value=.22;rev.connect(rg);rg.connect(master);
  noiseB=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);const d=noiseB.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  setVol();A.next=ac.currentTime+.1;setInterval(tick,60);A.on=true;document.addEventListener('visibilitychange',()=>{document.hidden?ac.suspend():ac.resume();});}
function setVol(){if(!ac)return;mus.gain.value=A.vol.m*.55;sfx.gain.value=A.vol.s*.7;}
function pluck(m,t,g=.3,pan=0,dst=mus){const s=ac.createBufferSource();s.buffer=ksBuf(m);const v=ac.createGain();v.gain.value=g;s.connect(v);let o=v;if(ac.createStereoPanner){const p=ac.createStereoPanner();p.pan.value=pan;v.connect(p);o=p;}o.connect(dst);o.connect(rev);s.start(t);}
function noise(t,dur,f,q,g,type='bandpass',dst=mus,f2){const s=ac.createBufferSource();s.buffer=noiseB;s.loop=true;const b=ac.createBiquadFilter();b.type=type;b.frequency.setValueAtTime(f,t);if(f2)b.frequency.exponentialRampToValueAtTime(f2,t+dur);b.Q.value=q;const v=ac.createGain();v.gain.setValueAtTime(g,t);v.gain.exponentialRampToValueAtTime(.0008,t+dur);s.connect(b);b.connect(v);v.connect(dst);s.start(t,Math.random()*.5);s.stop(t+dur+.02);}
function tone(t,dur,f,f2,g,type='sine',dst=sfx,att=.005){const o=ac.createOscillator();o.type=type;o.frequency.setValueAtTime(f,t);if(f2&&f2!==f)o.frequency.exponentialRampToValueAtTime(Math.max(20,f2),t+dur);const v=ac.createGain();v.gain.setValueAtTime(.0001,t);v.gain.exponentialRampToValueAtTime(g,t+att);v.gain.exponentialRampToValueAtTime(.0006,t+dur);o.connect(v);v.connect(dst);o.start(t);o.stop(t+dur+.03);}
const parche=(t,g=1)=>{tone(t,.42,105,52,.85*g,'sine',mus);noise(t,.06,300,.8,.25*g,'lowpass');};
const aro=(t,g=1)=>{noise(t,.045,2300,5,.5*g);tone(t,.04,900,700,.12*g,'square',mus);};
function quena(m,t,d,g=.1){const o=ac.createOscillator();o.type='triangle';const f=mtof(m);o.frequency.setValueAtTime(f*.97,t);o.frequency.linearRampToValueAtTime(f,t+.06);const l=ac.createOscillator(),lg=ac.createGain();l.frequency.value=5.2;lg.gain.setValueAtTime(0,t);lg.gain.linearRampToValueAtTime(f*.009,t+d*.7);l.connect(lg);lg.connect(o.frequency);const v=ac.createGain();v.gain.setValueAtTime(.0001,t);v.gain.linearRampToValueAtTime(g,t+.05);v.gain.setValueAtTime(g*.85,t+d*.7);v.gain.linearRampToValueAtTime(.0001,t+d);o.connect(v);v.connect(mus);v.connect(rev);o.start(t);l.start(t);o.stop(t+d+.05);l.stop(t+d+.05);noise(t,d*.8,f*2,3,g*.12);}
// acordes como grados midi [bajo, voces]
const CH={Em:[40,[52,55,59,64]],Am:[45,[52,57,60,64]],B7:[47,[51,57,59,63]],C:[48,[52,55,60,64]],D:[50,[54,57,62,66]],G:[43,[55,59,62,67]],F:[41,[53,57,60,65]],E7:[40,[52,56,59,62]],Dm:[50,[53,57,62,65]],Gm:[43,[55,58,62,67]],A7:[45,[52,55,61,64]],Bb:[46,[53,58,62,65]],Bm:[47,[54,59,62,66]]};
const TR={
 menu:{e:.2,style:'milonga',pr:['Em','Em','Am','Am','B7','B7','Em','Em','C','G','Am','Em','B7','B7','Em','Em'],sc:[64,66,67,69,71,72,74,75,76],lead:.45},
 a0:{e:.152,style:'chacarera',pr:['Em','Em','D','D','C','C','B7','Em','Am','Am','Em','Em','B7','B7','Em','Em'],sc:[64,67,69,71,74,76,79],lead:.6},
 a1:{e:.16,style:'chamame',pr:['Am','Am','E7','E7','Am','Dm','E7','Am','F','C','E7','Am'],sc:[69,71,72,74,76,77,80,81],lead:.6},
 a2:{e:.165,style:'chacarera',pr:['Dm','Dm','Gm','Gm','A7','A7','Dm','Dm','Bb','F','A7','Dm'],sc:[62,65,67,69,72,74,77],lead:.55},
 a3:{e:.14,style:'carnavalito',pr:['Am','Am','C','C','G','G','E7','Am','F','C','E7','Am'],sc:[69,72,74,76,79,81,84],lead:.85},
 a4:{e:.138,style:'malambo',pr:['Em','Em','F','F','Em','Em','B7','B7'],sc:[64,65,68,69,71,72,75,76],lead:.45},
 ing:{e:.2,style:'zamba',pr:['Am','Am','Dm','Dm','E7','E7','Am','Am','F','C','E7','Am'],sc:[69,71,72,74,76,77,80,81],lead:.7},
 sel:{e:.135,style:'chamame',pr:['C','C','G','G','F','C','G','C','Am','Dm','G','C'],sc:[72,74,76,77,79,81,84],lead:.75},
 cuy:{e:.136,style:'chacarera',pr:['D','D','A7','A7','G','D','A7','D','Bm','Em','A7','D'],sc:[62,66,69,71,74,76,78],lead:.75},
 sur:{e:.17,style:'loncomeo',pr:['Em','Em','D','Em','Am','Em','D','Em'],sc:[64,67,69,71,74,76,79],lead:.7},
 boss:{e:.122,style:'malambo',pr:['Em','Em','Em','D','C','C','B7','B7'],sc:[64,67,69,70,71,74,76],lead:.4},
 final:{e:.112,style:'malambo',pr:['Em','F','Em','F','Am','Am','B7','B7','Em','F','G','F','Em','Em','B7','B7'],sc:[64,65,68,69,71,72,75,76],lead:.75},
};
let mel=4,lastTrack='';
function bar(t,T){const e=T.e,ch=CH[T.pr[A.bar%T.pr.length]],hi=A.intensity,st=T.style;const strum=(tt,g,up)=>{const v=up?[...ch[1]].reverse():ch[1];v.forEach((m,i)=>pluck(m,tt+i*.011,g*(.8+.2*Math.random()),-.25));};
  if(st==='milonga'){const pat=[0,3,6],arp=[0,2,1,3,2,1,2,3];for(let i=0;i<8;i++)pluck(ch[1][arp[i]%4],t+i*e,.16,i%2?.3:-.3);pat.forEach((p,i)=>pluck(i===1?ch[0]+7:ch[0],t+p*e,.34));if(A.bar%2===0)parche(t,.28);aro(t+3*e,.1);aro(t+6*e,.14);
    if(Math.random()<T.lead){const n=[2,3][Math.random()*2|0];for(let i=0;i<n;i++){mel=Math.max(0,Math.min(T.sc.length-1,mel+(Math.random()*5|0)-2));pluck(T.sc[mel],t+(i*(8/n)|0)*e,.3,.25);if(Math.random()<.5&&mel>1)pluck(T.sc[mel-2],t+(i*(8/n)|0)*e,.2,.25);}}return 8*e;}
  if(st==='loncomeo'){for(let i=0;i<8;i++){if(i%2===0)parche(t+i*e,i%4===0?1:.6);if(i%4===3)parche(t+i*e,.35);if(hi>.4&&i%2)aro(t+i*e,.25);}if(A.bar%2===0){ch[1].forEach((m,i)=>pluck(m,t+i*.05,.2,-.2));}pluck(ch[0],t,.42);pluck(ch[0],t+4*e,.3);if(Math.random()<.3)noise(t+6*e,.5,2400,3,.05,'bandpass',mus,600);
    if(Math.random()<T.lead){let k=0;while(k<8){const d=[2,2,3,1,4][Math.random()*5|0];mel=Math.max(0,Math.min(T.sc.length-1,mel+(Math.random()*5|0)-2));quena(T.sc[mel],t+k*e,d*e*.95,.1);k+=d;}}return 8*e;}
  if(st==='carnavalito'){for(let i=0;i<8;i++){if(i%4===0)parche(t+i*e,.9);if(i%4===2||i%4===3)parche(t+i*e,.4);if(i%2)aro(t+i*e,.35);strum(t+i*e,i%4===0?.15:i%4===2||i%4===3?.11:.05,i%2);}pluck(ch[0],t,.4);pluck(ch[0]+7,t+4*e,.35);
    if(Math.random()<T.lead){let k=0;while(k<8){const d=[1,2,2,1,4][Math.random()*5|0];mel=Math.max(0,Math.min(T.sc.length-1,mel+(Math.random()*5|0)-2));quena(T.sc[mel],t+k*e,d*e*.95,.09);if(hi>.4)quena(T.sc[mel]-5,t+k*e,d*e*.95,.04);k+=d;}}return 8*e;}
  // 6/8 + 3/4 (hemiola)
  for(let i=0;i<6;i++){const tt=t+i*e;
    if(st==='malambo'){if(i===0||i===3)parche(tt,1);if(i===2||i===5)parche(tt,.55);if(hi>.3&&(i===4))parche(tt,.45);aro(tt,i%3===0?.5:.25);if(hi>.6)aro(tt+e/2,.15);}
    else{if(i===2||i===4)parche(tt,.95);if(i===0)parche(tt,.35);if(i===0||i===1||i===3||i===4)aro(tt,i%3===0?.55:.3);if(hi>.5&&i===5)parche(tt,.4);}
    const sg=st==='zamba'?[.1,.06,.08,.1,.07,.06]:st==='malambo'?[.17,.06,.1,.17,.06,.12]:st==='chamame'?[.13,0,.13,0,.15,0]:[.15,.05,.12,.07,.14,.05];if(sg[i])strum(tt,sg[i],i%2);}
  pluck(ch[0],t,.42);pluck(ch[0]+7,t+2*e,.3);pluck(ch[0],t+4*e,.32);
  if(st==='malambo'&&hi>.2){for(let i=0;i<6;i++)if(Math.random()<.7){pluck(ch[0]+12+[0,0,3,0,7,5][i],t+i*e,.22,.15);}}
  if(Math.random()<T.lead){let k=0;while(k<6){const d=[1,1,2,2,3][Math.random()*5|0];mel=Math.max(0,Math.min(T.sc.length-1,mel+(Math.random()*5|0)-2));const f=st==='chamame'?quena:null;if(f){f(T.sc[mel],t+k*e,d*e*.9,.07);f(T.sc[Math.max(0,mel-2)],t+k*e,d*e*.9,.05);}else{pluck(T.sc[mel]+(st==='malambo'?0:0),t+k*e,.34,.3);pluck(T.sc[Math.max(0,mel-2)],t+k*e,.22,.3);if(st==='malambo'&&hi>.7)quena(T.sc[mel]+12,t+k*e,d*e,.03);}k+=d;}}
  return 6*e;}
function tick(){if(!ac||ac.state!=='running')return;if(A.track!==lastTrack){lastTrack=A.track;A.bar=0;A.next=Math.max(A.next,ac.currentTime+.05);}if(A.next<ac.currentTime-.5)A.next=ac.currentTime+.05;while(A.next<ac.currentTime+.25){const T=TR[A.track]||TR.menu;if(A.vol.m>0)A.next+=bar(A.next,T);else A.next+=T.e*6;A.bar++;}}
const last={};
const S={
 hit:t=>{noise(t,.07,900+Math.random()*500,1.4,.22,'bandpass',sfx);tone(t,.06,190,90,.16,'triangle');},
 crit:t=>{noise(t,.12,2400,2,.3,'bandpass',sfx);tone(t,.12,520,160,.2,'square');},
 slash:t=>noise(t,.16,1400,1.2,.2,'bandpass',sfx,4200),
 throw:t=>noise(t,.2,500,1.4,.14,'bandpass',sfx,1400),
 whip:t=>{noise(t,.07,3600,1,.3,'highpass',sfx);noise(t,.14,800,1,.12,'bandpass',sfx,3000);},
 pluck:t=>{[52,59,64,67,71].forEach((m,i)=>pluck(m,t+i*.014,.3,0,sfx));},
 splash:t=>noise(t,.3,1800,.7,.16,'lowpass',sfx,300),
 cascada:t=>noise(t,1.9,700,.5,.11,'lowpass',sfx,420),
 fire:t=>noise(t,.3,700,.6,.16,'lowpass',sfx,200),
 boom:t=>{noise(t,.45,600,.5,.5,'lowpass',sfx,60);tone(t,.4,120,34,.55);},
 stomp:t=>{tone(t,.3,130,40,.6);noise(t,.08,250,.8,.3,'lowpass',sfx);},
 thunder:t=>{noise(t,.1,5000,.5,.4,'highpass',sfx);noise(t,1.1,500,.4,.5,'lowpass',sfx,50);tone(t,.6,90,28,.5);},
 bark:t=>{tone(t,.09,420,220,.16,'sawtooth');tone(t+.11,.08,460,240,.13,'sawtooth');},
 gem:t=>{const n=A.gk=(((A.gk||0)+1)%8);tone(t,.1,mtof(76+[0,2,4,7,9,12,14,16][n]),0,.07,'sine');},
 coin:t=>{tone(t,.07,1320,0,.1,'square');tone(t+.06,.16,1980,0,.09,'square');},
 heal:t=>[64,67,71,76].forEach((m,i)=>tone(t+i*.06,.25,mtof(m),0,.11,'triangle')),
 hurt:t=>{tone(t,.2,240,80,.4,'sawtooth');noise(t,.12,400,.8,.3,'lowpass',sfx);},
 die:t=>{tone(t,.12,300,70,.13,'triangle');noise(t,.16,700,.7,.12,'bandpass',sfx,200);},
 down:t=>{[64,62,59,52].forEach((m,i)=>pluck(m,t+i*.16,.6,0,sfx));tone(t,.8,200,50,.3,'sawtooth');},
 level:t=>{[52,59,64,68,71,76].forEach((m,i)=>pluck(m,t+i*.05,.5,0,sfx));[76,80,83,88].forEach((m,i)=>tone(t+.1+i*.07,.35,mtof(m),0,.1,'triangle'));},
 pick:t=>{pluck(64,t,.5,0,sfx);pluck(71,t+.05,.5,0,sfx);pluck(76,t+.1,.5,0,sfx);},
 move:t=>tone(t,.05,620,540,.07,'triangle'),ok:t=>{pluck(67,t,.4,0,sfx);pluck(71,t+.04,.35,0,sfx);},back:t=>pluck(55,t,.35,0,sfx),
 dash:t=>noise(t,.18,700,1,.2,'bandpass',sfx,2600),
 sapucay:t=>{const o=ac.createOscillator(),v=ac.createGain(),f=ac.createBiquadFilter();o.type='sawtooth';f.type='bandpass';f.frequency.value=1500;f.Q.value=1.6;o.frequency.setValueAtTime(330,t);o.frequency.exponentialRampToValueAtTime(900,t+.18);o.frequency.setValueAtTime(820,t+.3);o.frequency.exponentialRampToValueAtTime(1250,t+.5);o.frequency.exponentialRampToValueAtTime(1050,t+.85);o.frequency.exponentialRampToValueAtTime(420,t+1.15);const l=ac.createOscillator(),lg=ac.createGain();l.frequency.value=9;lg.gain.value=55;l.connect(lg);lg.connect(o.frequency);v.gain.setValueAtTime(.001,t);v.gain.linearRampToValueAtTime(.55,t+.08);v.gain.setValueAtTime(.5,t+.85);v.gain.linearRampToValueAtTime(.001,t+1.2);o.connect(f);f.connect(v);v.connect(sfx);v.connect(rev);o.start(t);l.start(t);o.stop(t+1.25);l.stop(t+1.25);},
 roar:t=>{const o=ac.createOscillator(),v=ac.createGain(),f=ac.createBiquadFilter();o.type='sawtooth';f.type='lowpass';f.frequency.setValueAtTime(400,t);f.frequency.linearRampToValueAtTime(1400,t+.3);f.frequency.linearRampToValueAtTime(250,t+1.2);o.frequency.setValueAtTime(70,t);o.frequency.linearRampToValueAtTime(125,t+.3);o.frequency.linearRampToValueAtTime(42,t+1.3);v.gain.setValueAtTime(.001,t);v.gain.linearRampToValueAtTime(.7,t+.12);v.gain.exponentialRampToValueAtTime(.001,t+1.35);o.connect(f);f.connect(v);v.connect(sfx);v.connect(rev);o.start(t);o.stop(t+1.4);noise(t,1,500,.6,.35,'lowpass',sfx,120);},
 warn:t=>{tone(t,.18,440,0,.12,'square');tone(t+.22,.18,440,0,.12,'square');},
 wave:t=>{parche(t,.9);parche(t+.18,.6);parche(t+.36,1.1);[40,47,52,55,59,64].forEach((m,i)=>pluck(m,t+.36+i*.02,.5,0,sfx));},
 reel:t=>tone(t,.03,900+Math.random()*300,0,.06,'square'),
 reelstop:t=>{tone(t,.1,300,200,.2,'square');pluck(64,t,.5,0,sfx);},
 jackpot:t=>{for(let k=0;k<4;k++)[64,68,71,76,80,83].forEach((m,i)=>tone(t+k*.42+i*.06,.3,mtof(m+k*2),0,.1,'square'));for(let i=0;i<26;i++)tone(t+i*.07,.08,1300+Math.random()*1400,0,.06,'square');},
 evo:t=>{[52,56,59,64,68,71,76,80,83,88].forEach((m,i)=>{pluck(m,t+i*.045,.5,0,sfx);tone(t+i*.045,.5,mtof(m+12),0,.06,'triangle');});S.boom(t+.45);},
 truco:t=>{pluck(45,t,.7,0,sfx);parche(t,.8);parche(t+.15,.8);},
 win:t=>{[[64,68,71],[69,73,76],[71,75,78],[76,80,83]].forEach((c,i)=>c.forEach(m=>{pluck(m,t+i*.28,.5,0,sfx);tone(t+i*.28,.5,mtof(m),0,.08,'triangle');}));},
 lose:t=>[[64,67,71],[62,65,69],[60,64,67],[59,63,66]].forEach((c,i)=>c.forEach(m=>pluck(m,t+i*.38,.5,0,sfx))),
 moo:t=>{const o=ac.createOscillator(),v=ac.createGain(),f=ac.createBiquadFilter();o.type='sawtooth';f.type='lowpass';f.frequency.value=600;o.frequency.setValueAtTime(130,t);o.frequency.linearRampToValueAtTime(165,t+.3);o.frequency.linearRampToValueAtTime(105,t+1);v.gain.setValueAtTime(.001,t);v.gain.linearRampToValueAtTime(.35,t+.15);v.gain.linearRampToValueAtTime(.001,t+1.05);o.connect(f);f.connect(v);v.connect(sfx);o.start(t);o.stop(t+1.1);},
 ufo:t=>{for(let i=0;i<6;i++)tone(t+i*.16,.18,400+(i%2)*300,600,.1,'sine');},
 wail:t=>{tone(t,.5,500,900,.14,'sine');tone(t+.45,.9,900,380,.14,'sine');},
 whistle:t=>{tone(t,.16,1400,2000,.1,'sine');tone(t+.2,.3,2000,1300,.1,'sine');},
};
const GAP={cascada:1.6,hit:.045,gem:.035,die:.06,slash:.07,throw:.08,coin:.06,splash:.1,fire:.12,crit:.08,boom:.09,hurt:.15,pluck:.15,bark:.25,whip:.1,stomp:.12,thunder:.12,reel:.04};
function play(n){if(!ac||ac.state!=='running'||A.vol.s<=0||!S[n])return;const t=ac.currentTime;if(last[n]&&t-last[n]<(GAP[n]||.02))return;last[n]=t;try{S[n](t+.003);}catch(e){}}
export const audio={init,play,setVol,vol:A.vol,track:n=>{A.track=n;},intensity:v=>{A.intensity=v;}};
