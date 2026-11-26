// Ayudas para la app de Android: botón "atrás" y actualizaciones del juego sin reinstalar.
(function () {
  const onTitle = () => !!document.getElementById('inicio');

  // La app llama a esto cuando tocás "atrás": en menús vuelve, en partida pausa, en el inicio sale.
  window.__appBack = function () {
    if (onTitle()) return 'exit';
    for (const t of ['keydown', 'keyup']) dispatchEvent(new KeyboardEvent(t, {code: 'Escape', key: 'Escape', keyCode: 27, bubbles: true}));
    return 'ok';
  };

  if (!('serviceWorker' in navigator) || !(location.protocol === 'https:' || location.hostname === 'localhost')) return;
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));

  // Si llega una versión nueva, se aplica en cuanto estés en la pantalla de inicio (nunca en medio de una partida).
  let had = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!had) { had = true; return; }
    const go = () => onTitle() ? location.reload() : setTimeout(go, 4000);
    go();
  });

  // Al volver a la app después de un rato, buscar si hay versión nueva.
  let hid = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { hid = Date.now(); return; }
    if (hid && Date.now() - hid > 10 * 60e3) navigator.serviceWorker.getRegistration().then(r => r && r.update()).catch(() => {});
  });
})();
