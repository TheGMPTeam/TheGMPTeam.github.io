// menu.js — right-click menu on mascot/intro/splash. All toggles persist
// via vgset. STOP/RESUME drive the engine seam; MUTE applies everywhere.

import { vg, on, booted, vgSet, vgSave, vgToggle } from './core.js';

if (!booted('menu')) init();

function init() {
  var MENU = document.createElement('div');
  MENU.id = 'vgmenu';
  MENU.innerHTML =
    '<div class="vgmi" data-a="skip">SKIP WELCOME</div>' +
    '<div class="vgmi" data-a="portal">PORTAL FX</div>' +
    '<div class="vgmi" data-a="stop">STOP</div>' +
    '<div class="vgmi" data-a="resume">RESUME</div>' +
    '<div class="vgmi" data-a="mute">MUTE</div>';
  document.body.appendChild(MENU);

  function close() { MENU.style.display = 'none'; }
  function open(x, y) {
    var s = vgSet();
    MENU.querySelector('[data-a="skip"]').textContent = 'SKIP WELCOME' + (s.skipWelcome ? ' \u2713' : '');
    MENU.querySelector('[data-a="portal"]').textContent = 'PORTAL FX' + (s.portalFx === false ? '' : ' \u2713');
    MENU.querySelector('[data-a="mute"]').textContent = (s.muted ? 'UNMUTE' : 'MUTE') + (s.muted ? ' \u2713' : '');
    MENU.style.display = 'block';
    MENU.style.left = Math.min(x, window.innerWidth - MENU.offsetWidth - 8) + 'px';
    MENU.style.top = Math.min(y, window.innerHeight - MENU.offsetHeight - 8) + 'px';
  }
  MENU.addEventListener('click', function (e) {
    var it = e.target && e.target.closest ? e.target.closest('.vgmi') : null;
    if (!it) return;
    var a = it.getAttribute('data-a');
    if (a === 'skip') vgToggle('skipWelcome');
    else if (a === 'portal') { var s = vgSet(); s.portalFx = s.portalFx === false; vgSave(s); }
    else if (a === 'stop') vg.pause && vg.pause();
    else if (a === 'resume') vg.resume && vg.resume();
    else { vgToggle('muted'); vg.setMuted && vg.setMuted(!!vgSet().muted); }
    close();
  });
  document.addEventListener('mousedown', function (e) {
    if (MENU.style.display === 'block' && !MENU.contains(e.target)) close();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  document.addEventListener('contextmenu', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('#mascot,#intro,#splash') : null;
    if (!t) return;
    e.preventDefault();
    open(e.clientX, e.clientY);
  });
}
