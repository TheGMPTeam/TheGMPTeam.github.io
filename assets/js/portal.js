// portal.js — exit theater: engine emits vg:walkoff-ended on an empty
// stage; we pulse the port, open the page portal, play BOTH legs (enter
// then exit, mute-first per v61), poof, then vg:portal-complete so the
// engine resumes rotation with a walk-on in the corner.

import { vg, on, off, emit, booted, vgSet, reduced } from './core.js';
import './fx.js';

if (!booted('portal')) {
  if (!reduced()) init();
}

function init() {
  var lastPortal = 0, COOL = 20000;

  function clip(role) {
    var w = (vg.pool || []).filter(function (x) { return x.role === role; });
    return w.length ? w[Math.floor(Math.random() * w.length)].u : null;
  }

  function leg(v, u, cb) {
    // v61 lesson: gestureless unmuted play() can return a promise that
    // never settles. Start MUTED, roll, then attempt unmute once.
    v.muted = true;
    v.src = u;
    try { v.load(); } catch (e) {}
    var k = v.play(); if (k && k.catch) k.catch(function () {});
    var stalled = setTimeout(function () { var k2 = v.play(); if (k2 && k2.catch) k2.catch(function () {}); }, 6000);
    v.addEventListener('playing', function p() {
      v.removeEventListener('playing', p);
      clearTimeout(stalled);
      var st = vgSet();
      if (!st.muted) { try { v.muted = false; } catch (e) {} }
    }, { once: true });
    v.addEventListener('ended', function e() {
      v.removeEventListener('ended', e);
      clearTimeout(stalled);
      cb();
    }, { once: true });
  }

  on('vg:walkoff-ended', function () {
    var st = vgSet();
    if (st.portalFx === false) { emit('vg:portal-complete'); return; }
    var now = Date.now();
    if (now - lastPortal < COOL) { emit('vg:portal-complete'); return; }
    lastPortal = now;
    vg.state.portal = 1;

    var host = document.getElementById('mascot');
    if (host) {
      host.classList.add('vg-pulse');
      setTimeout(function () { host.classList.remove('vg-pulse'); }, 1500);
    }

    vg.fx('/assets/sfx/whoosh.mp3', 0.8);
    var hum = vg.fxLoop('/assets/sfx/hum.mp3', 0.35);

    var el = document.createElement('div');
    el.id = 'vgportal';
    var v = document.createElement('video');
    v.playsInline = true;
    el.appendChild(v);
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('open'); });
    vg.fx('/assets/sfx/ignite.mp3', 0.8);

    var inU = clip('walkon'), outU = clip('walkoff');
    function finish() {
      vg.fx('/assets/sfx/poof.mp3', 0.9);
      vg.fxStop(hum);
      el.classList.remove('open');
      el.classList.add('closed');
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
        vg.state.portal = 0;
        emit('vg:portal-complete');
      }, 700);
    }
    if (!inU || !outU) { setTimeout(finish, 2600); return; }
    leg(v, inU, function () {
      setTimeout(function () { leg(v, outU, finish); }, 350);
    });
  });
}
