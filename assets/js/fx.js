// fx.js — WebAudio SFX: cached decode, gesture-unlocked context.
// window.vg.fx(url, vol) / vg.fxLoop(url) / vg.fxStop(id) / vg.fxN counter.

import { vg, booted } from './core.js';

if (!booted('fx')) {
  var ctx = null, bufs = {}, loops = {}, loopId = 0;

  function ac() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { return null; }
    }
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
    return ctx;
  }
  // unlock on first gesture; keeps working for all later, gestureless fires
  document.addEventListener('pointerdown', function u() {
    var c = ac();
    if (c) vg.fxN = vg.fxN || 0;
  }, { once: true, capture: true });

  function getBuf(url, cb) {
    if (bufs[url]) { cb(bufs[url]); return; }
    if (!ctx) { cb(null); return; }
    fetch(url).then(function (r) { return r.arrayBuffer(); })
      .then(function (ab) { return ctx.decodeAudioData(ab); })
      .then(function (b) { bufs[url] = b; cb(b); })
      .catch(function () { bufs[url] = null; cb(null); });
  }

  vg.fx = function (url, vol) {
    var c = ac();
    if (!c || !url) return false;
    getBuf(url, function (b) {
      if (!b) return;
      try {
        var s = c.createBufferSource();
        s.buffer = b;
        var g = c.createGain();
        g.gain.value = (vol === undefined ? 1 : vol);
        s.connect(g); g.connect(c.destination);
        s.start();
        vg.fxN = (vg.fxN || 0) + 1;
      } catch (e) {}
    });
    return true;
  };

  vg.fxLoop = function (url, vol) {
    var c = ac();
    if (!c || !url) return -1;
    var id = ++loopId;
    getBuf(url, function (b) {
      if (!b || loops[id] === 'killed') return;
      try {
        var s = c.createBufferSource();
        s.buffer = b; s.loop = true;
        var g = c.createGain();
        g.gain.value = (vol === undefined ? 0.5 : vol);
        s.connect(g); g.connect(c.destination);
        s.start();
        loops[id] = { s: s, g: g };
      } catch (e) {}
    });
    return id;
  };

  vg.fxStop = function (id) {
    var l = loops[id];
    if (l === 'killed' || !l) { loops[id] = 'killed'; return; }
    try { l.s.stop(); } catch (e) {}
    loops[id] = 'killed';
  };
}
