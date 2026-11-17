// enter.js — home/videos entry theater: splash (always, click to enter) ->
// glitch -> collapse into port circle -> centered intro ignite -> welcome
// clip with one-click SKIP -> FLIP shrink to corner -> ignite -> vg:enter.
// SKIP WELCOME saved = auto-dismiss, straight to the idle corner.

import { vg, on, emit, booted, vgSet, vgSave, reduced } from './core.js';
import './fx.js';

if (!booted('enter')) {
  var s = document.getElementById('splash');
  if (!s) { vg.state.entered = true; }
  else init(s);
}

function init(s) {
  document.body.classList.add('vg-pre');
  on('vg:enter', function () { document.body.classList.remove('vg-pre'); });

  var hint = s.querySelector('.splash-hint');
  if (hint) hint.textContent = 'LOADING SYSTEM...';
  var ready = 0, opened = false;
  var PRELOADS = ['/assets/status/idle1.mp4', '/assets/status/idle5.mp4', '/assets/status/action1.mp4'];
  function prog() { ready++; if (ready >= PRELOADS.length) open(); }
  function open() {
    if (opened) return;
    opened = true;
    vg.state.vidReady = true;
    if (hint) hint.textContent = 'CLICK TO ENTER';
    if (vgSet().skipWelcome) setTimeout(function () {
      if (!s.dataset.leaving) { s.dataset.leaving = '1'; fastExit(); }
    }, 1500);
  }
  function fastExit() {
    vg.fx('/assets/sfx/whoosh.mp3', 0.75);
    s.style.transition = 'opacity .25s';
    s.classList.add('collapse');
    setTimeout(function () {
      s.remove();
      var mm = document.getElementById('mascot');
      if (mm) mm.classList.add('ignite');
      vg.state.entered = true;
      emit('vg:enter');
    }, 280);
  }
  if (vgSet().skipWelcome) {
    open();
  } else {
    PRELOADS.forEach(function (u) {
      var v = document.createElement('video');
      v.preload = 'auto'; v.muted = true;
      v.addEventListener('loadeddata', prog);
      v.addEventListener('error', prog);
      v.src = u;
    });
  }
  setTimeout(open, 6000);

  s.addEventListener('click', function () {
    if (s.dataset.leaving) return;
    s.dataset.leaving = '1';
    vg.fx('/assets/sfx/glitch.mp3', 0.75);
    var m = document.getElementById('mascot');
    if (reduced()) { s.remove(); vg.state.entered = true; emit('vg:enter'); return; }
    if (vgSet().skipWelcome) { fastExit(); return; }
    s.classList.add('glitch');
    setTimeout(function () {
      vg.fx('/assets/sfx/whoosh.mp3', 0.75);
      var mc = m ? m.getBoundingClientRect() : { left: window.innerWidth - 120, top: 96, width: 190, height: 190 };
      var cx = mc.left + mc.width / 2, cy = mc.top + mc.height / 2;
      s.style.transformOrigin = '50% 50%';
      s.style.transform = 'translate(' + (cx - window.innerWidth / 2) + 'px,' + (cy - window.innerHeight / 2) + 'px) scale(.06)';
      s.classList.add('collapse');
    }, 580);
    setTimeout(function () {
      s.remove();
      var intro = document.getElementById('intro');
      if (!intro) {
        if (m) m.classList.add('ignite');
        vg.state.entered = true; emit('vg:enter');
        return;
      }
      var iv = document.getElementById('iv');
      intro.style.display = 'flex';
      vg.fx('/assets/sfx/ignite.mp3', 0.8);
      // SKIP lives on <body>: fixed inside a transformed circle gets clipped
      var skb = intro.querySelector('.iskip');
      if (skb) document.body.appendChild(skb);
      (function tryP(mm) {
        iv.muted = mm;
        var p = iv.play();
        if (p && p.catch) p.catch(function () { if (!mm) tryP(true); });
      })(!!vgSet().muted);
      var fin = false;
      function finish() {
        if (fin) return;
        fin = true;
        if (skb) skb.style.display = 'none';
        if (!m) { intro.remove(); vg.state.entered = true; emit('vg:enter'); return; }
        var small = window.innerWidth <= 720;
        var size = small ? 120 : 190, top = small ? 84 : 88, right = small ? 12 : 24;
        var r0 = intro.getBoundingClientRect();
        intro.classList.add('parked');
        intro.style.left = 'auto'; intro.style.inset = 'auto';
        intro.style.transform = 'none';
        intro.style.top = top + 'px'; intro.style.right = right + 'px';
        intro.style.width = size + 'px'; intro.style.height = size + 'px';
        var r1 = intro.getBoundingClientRect();
        intro.style.transformOrigin = 'top left';
        intro.style.transition = 'none';
        intro.style.transform = 'translate(' + (r0.left - r1.left) + 'px,' + (r0.top - r1.top) + 'px) scale(' + (r0.width / r1.width) + ')';
        requestAnimationFrame(function () { requestAnimationFrame(function () {
          intro.style.transition = 'transform .9s cubic-bezier(.2,.7,.2,1)';
          intro.style.transform = 'translate(0px,0px) scale(1)';
        }); });
        setTimeout(function () {
          intro.style.transition = 'opacity .5s';
          intro.style.opacity = '0';
          setTimeout(function () { intro.remove(); }, 550);
          m.classList.add('ignite');
          var vs = document.querySelectorAll('#mascot video');
          if (vs[0]) vs[0].classList.add('flick');
          vg.state.entered = true;
          emit('vg:enter');
        }, 1000);
      }
      iv.addEventListener('ended', finish);
      iv.addEventListener('click', function () {
        var st = vgSet(); st.muted = !st.muted; vgSave(st);
        iv.muted = st.muted;
      });
      if (skb) {
        skb.style.cursor = 'pointer';
        skb.addEventListener('click', function (e) {
          e.stopPropagation(); e.preventDefault();
          iv.currentTime = (iv.duration || 15.0) - 0.02;
        });
      }
    }, 1150);
  });
}
