// Controles: teclado y mouse, pantalla táctil (joystick y botones) y joystick de consola.
const keys = {}, down = {};
let mouse = {x: 0, y: 0, on: false, btn: false, bdown: false, mov: 0};
export const ctl = {tactil: false, pad: false, joy: {on: false, id: -1, x0: 0, y0: 0, x: 0, z: 0}, mira: {on: false, id: -1, x: 0, y: 0}, btn: {}, bdn: {}, escribe: false, vista: 'arriba'};
// cuánto se movió la vista desde el último cuadro (mouse trabado o dedo en la mitad derecha)
const look = {dx: 0, dy: 0};
addEventListener('mousemove', e => { if (document.pointerLockElement) { look.dx += e.movementX || 0; look.dy += e.movementY || 0; } }, {passive: true});
const typing = () => { const a = document.activeElement; return a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA'); };
addEventListener('keydown', e => {
  if (typing()) return;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
  if (!e.repeat) { keys[e.code] = 1; down[e.code] = 1; }
  if (/^(Key[WASD]|Arrow)/.test(e.code)) ctl.tactil = false;
});
addEventListener('keyup', e => { keys[e.code] = 0; });
addEventListener('blur', () => { for (const k in keys) keys[k] = 0; mouse.btn = false; });
addEventListener('pointermove', e => { if (e.pointerType === 'mouse') { mouse.x = e.clientX; mouse.y = e.clientY; mouse.on = true; mouse.mov = performance.now(); } }, {passive: true});
// táctil: cualquier toque hace aparecer los botones
addEventListener('pointerdown', e => { if (e.pointerType === 'touch') { ctl.tactil = true; document.body.classList.add('tactil'); } else if (e.pointerType === 'mouse') { ctl.tactil = false; document.body.classList.remove('tactil'); } }, {capture: true});
export function lienzo(cv) {
  cv.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse') { if (ctl.vista !== 'arriba' && !document.pointerLockElement) { try { cv.requestPointerLock?.(); } catch (er) { } } if (e.button === 0) { mouse.btn = true; mouse.bdown = true; } if (e.button === 2) down.Mouse2 = 1; return; }
    // en primera persona y desde atrás, el dedo en la mitad derecha mueve la vista
    if (e.clientX >= innerWidth * .5 && ctl.vista !== 'arriba' && !ctl.mira.on) { const m = ctl.mira; m.on = true; m.id = e.pointerId; m.x = e.clientX; m.y = e.clientY; cv.setPointerCapture?.(e.pointerId); return; }
    // joystick: mitad izquierda de la pantalla
    if (e.clientX < innerWidth * .5 && !ctl.joy.on) { const j = ctl.joy; j.on = true; j.id = e.pointerId; j.x0 = e.clientX; j.y0 = e.clientY; j.x = j.z = 0; cv.setPointerCapture?.(e.pointerId); mostrarJoy(); }
  });
  cv.addEventListener('pointermove', e => { const mi = ctl.mira; if (mi.on && e.pointerId === mi.id) { look.dx += (e.clientX - mi.x) * 2.2; look.dy += (e.clientY - mi.y) * 2.2; mi.x = e.clientX; mi.y = e.clientY; return; } const j = ctl.joy; if (!j.on || e.pointerId !== j.id) return; let dx = e.clientX - j.x0, dy = e.clientY - j.y0; const R = 56, l = Math.hypot(dx, dy); if (l > R) { j.x0 += dx * (1 - R / l); j.y0 += dy * (1 - R / l); dx *= R / l; dy *= R / l; } j.x = dx / R; j.z = dy / R; mostrarJoy(); });
  const fin = e => { if (e.pointerType === 'mouse') { if (e.button === 0) mouse.btn = false; return; } if (e.pointerId === ctl.mira.id) { ctl.mira.on = false; ctl.mira.id = -1; } const j = ctl.joy; if (e.pointerId === j.id) { j.on = false; j.id = -1; j.x = j.z = 0; mostrarJoy(); } };
  cv.addEventListener('pointerup', fin); cv.addEventListener('pointercancel', fin);
  cv.addEventListener('contextmenu', e => e.preventDefault());
}
function mostrarJoy() {
  const j = ctl.joy, b = document.getElementById('joy'); if (!b) return; b.hidden = !j.on; if (!j.on) return;
  b.style.transform = `translate(${j.x0 - 60}px,${j.y0 - 60}px)`; b.firstElementChild.style.transform = `translate(${j.x * 46}px,${j.z * 46}px)`;
}
// botones táctiles: data-b="atk|h0|h1|h2|esq|mate|usar"
export function botones(root) {
  for (const el of root.querySelectorAll('[data-b]')) {
    const k = el.dataset.b;
    el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); ctl.btn[k] = true; ctl.bdn[k] = true; el.classList.add('on'); el.setPointerCapture?.(e.pointerId); });
    const up = () => { ctl.btn[k] = false; el.classList.remove('on'); };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('lostpointercapture', up);
  }
}
const pads = () => { try { return [...(navigator.getGamepads?.() || [])].filter(Boolean); } catch (e) { return []; } };
let padAnt = {};
// estado de este cuadro
export function leer() {
  const k = c => !!keys[c], d = c => !!down[c];
  let mx = (k('KeyD') || k('ArrowRight') ? 1 : 0) - (k('KeyA') || k('ArrowLeft') ? 1 : 0), mz = (k('KeyS') || k('ArrowDown') ? 1 : 0) - (k('KeyW') || k('ArrowUp') ? 1 : 0);
  if (ctl.joy.on) { mx = ctl.joy.x; mz = ctl.joy.z; }
  const s = {mx, mz, atk: mouse.btn || k('KeyK') || !!ctl.btn.atk, h: [d('KeyQ') || d('Digit1') || !!ctl.bdn.h0, d('KeyE') || d('Digit2') || !!ctl.bdn.h1, d('KeyR') || d('Digit3') || !!ctl.bdn.h2],
    esq: d('Space') || d('ShiftLeft') || d('Mouse2') || !!ctl.bdn.esq, mate: d('KeyH') || d('Digit4') || !!ctl.bdn.mate, usar: d('KeyF') || !!ctl.bdn.usar,
    mapa: d('KeyM'), prog: d('KeyP'), inv: d('KeyI') || d('Tab'), mis: d('KeyL'), chat: d('Enter') || d('KeyT'), esc: d('Escape'), mouse: mouse.on && !ctl.tactil && !document.pointerLockElement && performance.now() - mouse.mov < 60000 ? mouse : null, pad: false,
    cam: d('KeyV') || !!ctl.bdn.cam, caballo: d('KeyG') || !!ctl.bdn.caballo, look: {dx: look.dx, dy: look.dy}, stick: [0, 0], trabado: !!document.pointerLockElement};
  look.dx = look.dy = 0;
  for (const p of pads()) {
    const b = i => !!p.buttons[i]?.pressed, bd = i => b(i) && !padAnt[p.index + ':' + i]; let x = p.axes[0] || 0, z = p.axes[1] || 0;
    if (Math.hypot(x, z) > .2) { s.mx = x; s.mz = z; ctl.pad = true; }
    if (b(14)) s.mx = -1; if (b(15)) s.mx = 1; if (b(12)) s.mz = -1; if (b(13)) s.mz = 1;
    if (b(0)) s.atk = true; if (bd(2)) s.h[0] = true; if (bd(5)) s.h[1] = true; if (bd(7)) s.h[2] = true; if (bd(1)) s.esq = true; if (bd(4)) s.mate = true; if (bd(3)) s.usar = true; if (bd(8)) s.mapa = true; if (bd(9)) s.esc = true; if (bd(10)) s.caballo = true; if (bd(11)) s.cam = true;
    const rx = p.axes[2] || 0, rz = p.axes[3] || 0; if (Math.hypot(rx, rz) > .2) { s.stick = [rx, rz]; ctl.pad = true; }
    for (let i = 0; i < 17; i++) padAnt[p.index + ':' + i] = b(i); if (p.buttons.some(x => x?.pressed)) ctl.pad = true;
  }
  const l = Math.hypot(s.mx, s.mz); if (l > 1) { s.mx /= l; s.mz /= l; }
  for (const c in down) delete down[c]; for (const c in ctl.bdn) delete ctl.bdn[c]; mouse.bdown = false;
  return s;
}
