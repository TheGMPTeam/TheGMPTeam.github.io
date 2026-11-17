// core.js — bus, settings, single probe seam. No globals beyond window.vg.
// Bus = document CustomEvents namespaced vg:*; on() returns the wrapped
// listener so off() can remove it. Late-cue rule and pairing live in the
// modules that own them, not here.

var SET_KEY = 'vgset';

export function vgSet() {
  try { return JSON.parse(localStorage.getItem(SET_KEY) || '{}'); }
  catch (e) { return {}; }
}
export function vgSave(s) {
  try { localStorage.setItem(SET_KEY, JSON.stringify(s)); } catch (e) {}
}
export function vgToggle(key) {
  var s = vgSet();
  s[key] = !s[key];
  vgSave(s);
  return s[key];
}

export function on(evt, fn, opts) {
  document.addEventListener(evt, fn, opts);
  return fn;
}
export function off(evt, fn) {
  document.removeEventListener(evt, fn);
}
export function emit(evt, detail) {
  try { document.dispatchEvent(new CustomEvent(evt, { detail: detail })); }
  catch (e) {}
}

export function reduced() {
  return window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// The ONLY probe surface. CDP verification reads/writes here.
export var vg = window.vg = window.vg || {};
vg.why = vg.why || {};
vg.state = vg.state || {};

vg._booted = vg._booted || {};
export function booted(name) {
  if (vg._booted[name]) return true;   // idempotent under double-boot
  vg._booted[name] = true;
  return false;
}
