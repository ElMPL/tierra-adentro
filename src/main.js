// Arranque: pantalla 3D, mundo, partida, pantallas y el bucle de cada cuadro.
import {THREE, U, GroundFX, Particles, makeComposer} from '../lib/gfx.js';
import {audio} from '../lib/audio.js';
import {Mundo3D} from './mundo3d.js';
import {Juego} from './juego.js';
import {UI} from './ui.js';
import {Red} from './red.js';
import {leer, lienzo, ctl} from './controles.js';
import {REG} from '../shared/mapa.js';

const $ = s => document.querySelector(s);
function boot() {
  const cv = $('#c'); let renderer;
  try { renderer = new THREE.WebGLRenderer({canvas: cv, antialias: false, powerPreference: 'high-performance'}); } catch (e) { $('#boot').textContent = 'Tu navegador no pudo iniciar los gráficos 3D. Activá la aceleración por hardware y recargá.'; return; }
  let cfgq = 'media'; try { cfgq = JSON.parse(localStorage.getItem('tierra-adentro') || '{}').cfg?.q || 'media'; } catch (e) { }
  if (!localStorage.getItem('tierra-adentro') && (/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent))) cfgq = 'baja';
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12; renderer.shadowMap.enabled = cfgq !== 'baja'; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(40, 1, .5, 420);
  const mundo = new Mundo3D(scene, cfgq);
  const fx = new GroundFX(scene, 600), parts = new Particles(scene, cfgq === 'baja' ? 1200 : 2600); parts.k = cfgq === 'baja' ? .45 : 1;
  const red = new Red(), cfg = {q: cfgq};
  const juego = new Juego({scene, camera, mundo, fx, parts, cfg});
  const ui = new UI({juego, red, mundo, cfg}); juego.ui = ui;
  lienzo(cv);
  let post = null; const maxPr = Math.min(devicePixelRatio || 1, cfgq === 'alta' ? 2 : cfgq === 'media' ? 1.4 : .9); let pr = maxPr;
  function size() { const W = innerWidth, H = innerHeight; renderer.setPixelRatio(pr); renderer.setSize(W, H, false); camera.aspect = W / H; camera.fov = W < H ? 50 : 40; camera.updateProjectionMatrix(); if (post) { post.comp.renderTarget1.dispose(); post.comp.renderTarget2.dispose(); } post = cfgq === 'baja' ? null : makeComposer(renderer, scene, camera); const h = renderer.getDrawingBufferSize(new THREE.Vector2()).y; const px = h / (2 * Math.tan(camera.fov * Math.PI / 360)); parts.mat.uniforms.uPx.value = px; mundo.aU.px.value = px; }
  size(); let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(size, 120); });
  // en el menú la cámara pasea alrededor de Pueblo Ombú
  const P0 = REG.pampa.pueblo; let mt = 0, ant = performance.now(), fpsT = 0, fpsN = 0;
  window.__T = {juego, ui, red, mundo};
  function frame() {
    requestAnimationFrame(frame);
    const t = performance.now(), dt = Math.min(.05, (t - ant) / 1000); ant = t; U.uTime.value += dt; mt += dt;
    const c = leer();
    red.procesar(m => { if (m.t === 'corte') ui.toast('Se cortó la conexión con el mundo. Reconectando…', null, 4); else if (m.t === 'vuelve') { ui.toast('¡Volviste al mundo!', null, 2); juego.enviar(true); } else if (juego.activo) juego.mensaje(m); });
    fx.begin();
    if (juego.activo) {
      if (!ui.panel && !ctl.escribe) {
        if (c.mapa) ui.mapa(); else if (c.inv) ui.inventario(); else if (c.mis) ui.listaMis(); else if (c.chat) ui.abrirChat(); else if (c.esc) ui.opciones();
      } else if (ui.panel && (c.esc || c.mapa && ui.panel.id === 'mapa' || c.inv && ui.panel.id === 'inv' || c.mis && ui.panel.id === 'mis')) { ui.cerrarPanel(); c.esc = false; }
      ui.pausa = !!ui.panel && ui.panel.id !== 'mapa';
      juego.update(dt, ui.panel ? {mx: 0, mz: 0, h: [], atk: false} : c);
      mundo.update(dt, U.uTime.value, juego.cam, juego.horaAhora());
      juego.dibujar(dt);
      ui.hud();
    } else {
      const a = mt * .05; camera.position.set(P0.x + Math.sin(a) * 30, 16, P0.z + Math.cos(a) * 30); camera.lookAt(P0.x, 1.5, P0.z);
      mundo.update(dt, U.uTime.value, {x: P0.x, z: P0.z}, .62);
      for (const k in juego.B) { juego.B[k].begin(); juego.B[k].end(); }
    }
    // los árboles se vuelven transparentes si tapan a tu personaje
    camera.updateMatrixWorld(); const q = mundo.u.pv.value; if (juego.activo) q[0].set(juego.yo.x, 1, juego.yo.z).applyMatrix4(camera.matrixWorldInverse); else q[0].set(0, 0, 99);
    fx.end(dt); parts.update(dt);
    if (post) { post.grade.uniforms.uHurt.value = juego.activo ? Math.max(juego.herido || 0, juego.yo.vivo ? Math.max(0, .3 - juego.yo.hp / juego.stats().vida) : .6) : 0; post.comp.render(); } else renderer.render(scene, camera);
    ui.dibujarOv(dt, camera);
    // si anda lento, bajar la resolución
    fpsT += dt; fpsN++; if (fpsT > 2) { const fps = fpsN / fpsT; fpsT = 0; fpsN = 0; if (fps < 40 && pr > .6) { pr = Math.max(.6, pr - .15); size(); } else if (fps > 57 && pr < maxPr) { pr = Math.min(maxPr, pr + .1); size(); } }
  }
  $('#boot').remove(); ui.inicio(); frame();
  addEventListener('pointerdown', () => audio.init(), {once: true}); addEventListener('keydown', () => audio.init(), {once: true});
  document.addEventListener('visibilitychange', () => { if (document.hidden) ui.guardar(); });
}
boot();
