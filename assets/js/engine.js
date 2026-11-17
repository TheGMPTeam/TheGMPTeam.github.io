// engine.js — pool probe (naming contract v2), pairing, double-buffer
// swap driven by 'ended' (no polling), force-play seam. Emits vg:* bus
// events for cues/rig/portal modules. Exposes window.vg.{force,playing,pool}.

import { vg, on, off, emit, vgSet, vgSave, reduced, booted } from './core.js';

if (booted('engine')) {
  // already running; skip re-init
} else {
init();
}

function init() {
  if (reduced()) { vg.why.engine = 'reduced-motion'; return; }

  var host = document.getElementById('mascot');
  if (!host) {
    host = document.createElement('div');
    host.id = 'mascot';
    host.setAttribute('aria-hidden', 'true');
    var a = document.createElement('video'); a.id = 'mvid1';
    var b = document.createElement('video'); b.id = 'mvid2';
    a.muted = b.muted = true;
    a.playsInline = b.playsInline = true;
    a.preload = b.preload = 'auto';
    host.appendChild(a); host.appendChild(b);
    document.body.appendChild(host);
  }
  var shown = document.getElementById('mvid1') || host.children[0];
  var buf = document.getElementById('mvid2') || host.children[1];

  // ---- pool probe: naming contract v2 ----
  var SLOT = [], IV = [], i;
  for (i = 1; i <= 8; i++) SLOT.push(['idle', i]);
  for (i = 1; i <= 4; i++) SLOT.push(['walkon', i]);
  for (i = 1; i <= 4; i++) SLOT.push(['walkoff', i]);
  for (i = 1; i <= 4; i++) SLOT.push(['action', i]);
  vg.pool = IV;
  var probed = 0, mediaDead = false, started = false, engineOn = !document.getElementById('splash');
  var paused = false, exiting = false;
  var lastU = '', lastEndGone = false, pre = null, curEntry = null;

  [shown, buf].forEach(function (x) {
    x.addEventListener('error', function () { mediaDead = true; });
  });

  SLOT.forEach(function (s) {
    var u = '/assets/status/' + s[0] + s[1] + '.mp4';
    var v = document.createElement('video');
    v.preload = 'auto'; v.muted = true; v.playsInline = true;
    v.addEventListener('loadeddata', function () {
      IV.push({ u: u, endGone: s[0] === 'walkoff', role: s[0] });
      maybeStart();
    });
    v.addEventListener('error', function () { probed++; maybeStart(); });
    v.src = u;
  });

  function has(u) {
    for (var k = 0; k < IV.length; k++) if (IV[k].u === u) return IV[k];
    return null;
  }

  // Pairing: walkoff end -> walkon next; walkon only from empty stage;
  // actions never in random rotation; no immediate repeat.
  function pick() {
    if (!IV.length) return null;
    var pool;
    if (lastEndGone) pool = IV.filter(function (x) { return x.role === 'walkon'; });
    else pool = IV.filter(function (x) { return x.role === 'idle' || x.role === 'walkoff'; });
    if (!pool.length) pool = IV;
    var alt = pool.filter(function (x) { return x.u !== lastU; });
    if (alt.length) pool = alt;
    var e = pool[Math.floor(Math.random() * pool.length)];
    lastU = e.u; lastEndGone = e.endGone;
    return e;
  }

  function firstWalkon() {
    var w = IV.filter(function (x) { return x.role === 'walkon'; });
    return w.length ? w[Math.floor(Math.random() * w.length)].u : null;
  }

  // ---- swap machinery: 'ended' drives it, buffer pre-staged ----
  function ensurePre() {
    if (pre !== null) return;
    var e = pick();
    if (!e) return;
    buf.muted = true;
    if (buf.currentSrc.indexOf(e.u) < 0) buf.src = e.u;
    try { buf.load(); } catch (e2) {}
    pre = e;
  }

  function swapIn(e) {
    curEntry = e;
    buf.muted = true;
    buf.style.opacity = '0';
    if (buf.currentSrc.indexOf(e.u) < 0) { buf.src = e.u; }
    var pr = buf.play(); if (pr && pr.catch) pr.catch(function () {});
    buf.addEventListener('playing', function onr() {
      buf.removeEventListener('playing', onr);
      buf.style.opacity = '1';
      shown.style.opacity = '0';
      var t = shown; shown = buf; buf = t;
      try { shown.muted = !!vgSet().muted; } catch (e2) {}
      onClip(shown);
      setTimeout(function () { try { buf.pause(); } catch (e2) {} ensurePre(); }, 450);
      emit('vg:clip-start', { u: e.u, role: e.role, v: shown });
    }, { once: true });
  }

  // attach 'ended' per shown-video generation (listener is once:true,
  // re-attached each time an element becomes the shown one)
  function onClip(v) {
    v.addEventListener('ended', function () {
      var e = curEntry;
      emit('vg:clip-end', { u: e && e.u, role: e && e.role, endGone: e && e.endGone });
      if (e && e.endGone && vgSet().portalFx !== false && !exiting) {
        // hand exit-theater to portal.js; keep a watchdog so rotation
        // can never deadlock on a missing portal-complete
        exiting = true;
        emit('vg:walkoff-ended', { u: e.u });
        var done = false;
        function fin() {
          if (done) return; done = true;
          off('vg:portal-complete', fin);
          exiting = false; lastEndGone = false;
          var wu = firstWalkon();
          if (wu && force(wu)) { /* playing */ } else { tickOnce(); }
        }
        on('vg:portal-complete', fin);
        setTimeout(fin, 12000);
      } else {
        tickOnce();
      }
    }, { once: true });
  }

  function tickOnce() {
    if (!IV.length || paused || exiting || mediaDead) return;
    if (pre === null) ensurePre();
    if (pre === null) return;
    var e = pre; pre = null;
    swapIn(e);
  }

  function force(u) {
    var e = has(u);
    if (!e) return false;
    pre = e;
    tickOnce();
    return true;
  }

  function maybeStart() {
    if (probed === SLOT.length && !IV.length) { mediaDead = true; vg.why.engine = 'no-clips'; return; }
    if (IV.length && engineOn && !started) {
      started = true;
      vg.why.engine = 'running';
      var e0 = pick(); if (!e0) return;
      curEntry = e0;
      try { shown.muted = !!vgSet().muted; } catch (e) {}
      shown.src = e0.u;
      try { shown.load(); } catch (e) {}
      var p0 = shown.play(); if (p0 && p0.catch) p0.catch(function () {});
      onClip(shown);
      emit('vg:clip-start', { u: e0.u, role: e0.role, v: shown });
      setTimeout(ensurePre, 800);
    }
  }

  if (document.getElementById('splash')) {
    on('vg:enter', function () { engineOn = true; maybeStart(); }, { once: true });
  }

  // safety net only: 'ended' drives swaps; this rescues a stalled play
  // (autoplay gate etc). It never runs on the happy path.
  setInterval(function () {
    if (!started || mediaDead || paused || exiting) return;
    if (!shown.paused && !shown.ended && !shown.seeking) return;
    tickOnce();
  }, 3000);

  // unlock clip audio on first gesture (autoplay policy)
  function arm() { try { shown.muted = !!vgSet().muted; } catch (e) {} }
  on('click', arm, { once: true });
  on('keydown', arm, { once: true });

  // probe + inter-module seam
  vg.force = force;
  vg.playing = function () {
    if (!curEntry) return null;
    if (shown.paused && !shown.ended) return null;
    if (shown.seeking) return null;
    if (shown.readyState < 2) return null;
    if (shown.duration && shown.currentTime >= shown.duration - 0.05) return null;
    return { u: curEntry.u, role: curEntry.role, v: shown,
             t: shown.currentTime, d: shown.duration };
  };
  vg.setMuted = function (m) {
    var s = vgSet(); s.muted = m; vgSave(s);
    try { shown.muted = m; buf.muted = true; } catch (e) {}
  };
  vg.pause = function () { paused = true; try { shown.pause(); buf.pause(); } catch (e) {} };
  vg.resume = function () {
    paused = false;
    if (!shown.paused && !shown.ended) return;
    tickOnce();
  };
}
