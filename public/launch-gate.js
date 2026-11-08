/* A small, independent document gate. It runs before the app/module graph and
   keeps optional animation downloads from exposing, then covering, a workspace.
   No financial data, network, persisted playback flag or animation clock. */
(function () {
  'use strict';
  var view = window, doc = document, html = doc.documentElement;
  if (view.__neonworthLaunchGate) return;
  var phase = html.getAttribute('data-launch-gate') === 'done' ? 'done' : 'pending';
  var deadline = view.performance.now() + 5000;
  var timer, workspace, cover;
  var removers = [];
  var shell = '.app.unified-dashboard.personal-workspace.personal-experience';
  function mark(name) { try { view.performance.mark('neonworth-opening:' + name); } catch (_) {} }
  function listen(target, type, fn, options) {
    target.addEventListener(type, fn, options);
    removers.push(function () { target.removeEventListener(type, fn, options); });
  }
  function connect() {
    workspace = doc.querySelector('[data-launch-workspace]') || doc.querySelector(shell);
    cover = doc.getElementById('launch-gate');
    if (workspace) workspace.inert = phase !== 'done';
    if (cover) {
      cover.hidden = phase === 'done';
      if (phase === 'playing') { cover.setAttribute('aria-hidden', 'true'); cover.tabIndex = -1; }
    }
  }
  function finish(reason) {
    if (phase === 'done') return;
    // Capture before hiding a focused cover or notifying React to unmount it.
    var focused = doc.activeElement, previousCover = cover || doc.getElementById('launch-gate');
    var restoreFocus = (previousCover && previousCover.contains(focused))
      || (focused && focused.closest && focused.closest('.launch-intro'));
    phase = 'done';
    view.clearTimeout(timer);
    html.setAttribute('data-launch-gate', 'done');
    connect();
    while (removers.length) { try { removers.pop()(); } catch (_) {} }
    mark(reason === 'complete' ? 'complete' : 'skip');
    doc.dispatchEvent(new CustomEvent('neonworth-launch-finished'));
    // A skip never leaves focus inside a hidden cover. Do not steal an existing
    // workspace focus after automatic completion or a visibility/page change.
    if (restoreFocus) {
      var main = doc.getElementById('main-content');
      if (main) main.focus({ preventScroll: true });
    }
  }
  function allowed() {
    return !doc.hidden && !view.matchMedia('print').matches
      && view.matchMedia('(prefers-reduced-motion: no-preference)').matches
      && view.matchMedia('(forced-colors: none)').matches;
  }
  function shieldReady() {
    connect();
    if (!workspace || !cover) return false;
    var shield = view.getComputedStyle(cover);
    return view.getComputedStyle(workspace).visibility === 'hidden'
      && shield.display !== 'none' && shield.position === 'fixed'
      && shield.visibility !== 'hidden' && shield.opacity === '1';
  }
  function canStart() {
    return phase !== 'done' && view.performance.now() <= deadline && allowed()
      && Boolean(doc.querySelector(shell)) && shieldReady();
  }
  function arm(milliseconds) {
    view.clearTimeout(timer);
    deadline = view.performance.now() + milliseconds;
    timer = view.setTimeout(function () { finish('timeout'); }, milliseconds);
  }
  view.__neonworthLaunchGate = {
    get phase() { return phase; },
    claim: function () {
      connect();
      if (phase !== 'pending') return false;
      if (!canStart()) { finish('unavailable'); return false; }
      phase = 'claimed';
      return true;
    },
    canStart: canStart,
    started: function () {
      if (phase === 'playing') return;
      if (!canStart()) { finish('timeout'); return; }
      phase = 'playing';
      html.setAttribute('data-launch-phase', 'playing');
      connect();
      arm(8600);
      mark('start');
    },
    finish: finish
  };
  if (phase === 'done') { connect(); return; }
  try {
    // A parser-blocking head script can own first paint. A delayed/reordered
    // execution must never introduce a cover after a body has been exposed.
    if (doc.body || doc.readyState !== 'loading') { finish('unavailable'); return; }
    // The stylesheet is parser-blocking before this classic head script. If it
    // failed to load, do not arm a late cover over an unshielded workspace.
    if (view.getComputedStyle(html).getPropertyValue('--neonworth-launch-gate').trim() !== 'ready') { finish('unavailable'); return; }
    html.setAttribute('data-launch-gate', 'pending');
    mark('pending');
    var quiet = false;
    try {
      var saved = view.localStorage.getItem('neonworth-display-v2');
      if (saved && saved.length <= 1024) {
        var value = JSON.parse(saved);
        var reports = ['overview', 'spending', 'budget', 'goals', 'year-in-review', 'review', 'transactions', 'bills', 'movements', 'income', 'cash', 'net-worth', 'retirement', 'data'];
        quiet = value && typeof value === 'object' && !Array.isArray(value)
          && Object.keys(value).length === 4 && ['version', 'density', 'motion', 'pinnedReports'].every(function (key) { return Object.hasOwn(value, key); })
          && value.version === 2 && value.motion === 'quiet' && ['comfortable', 'compact'].includes(value.density)
          && Array.isArray(value.pinnedReports) && value.pinnedReports.length <= 3
          && value.pinnedReports.every(function (id) { return reports.includes(id); })
          && new Set(value.pinnedReports).size === value.pinnedReports.length;
      }
    } catch (_) { /* Blocked preference storage retains the expressive default. */ }
    if (quiet || !allowed()) { finish('policy'); return; }
    arm(5000);
    listen(doc, 'DOMContentLoaded', connect, { once: true });
    listen(doc, 'click', function (event) {
      connect();
      if (cover && cover.contains(event.target)) {
        event.preventDefault(); event.stopPropagation(); finish('input');
      }
    }, true);
    // Consume the completed keyboard action before releasing inert, so Enter
    // and Space cannot activate a newly revealed financial control.
    listen(doc, 'keydown', function (event) {
      if (event.metaKey || event.ctrlKey || event.altKey || event.key === 'Shift' || /^F\d{1,2}$/.test(event.key)) return;
      // Preserve browser defaults such as reload/fullscreen. Only keys that
      // can activate or scroll newly revealed content need consumption.
      if (['Enter', ' ', 'Spacebar', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End'].includes(event.key)) {
        event.preventDefault(); event.stopPropagation();
      }
      finish('input');
    }, true);
    listen(doc, 'wheel', function (event) { event.preventDefault(); finish('input'); }, { capture: true, passive: false });
    listen(doc, 'visibilitychange', function () { if (doc.hidden) finish('hidden'); });
    listen(view, 'pagehide', function () { finish('pagehide'); });
    listen(view, 'pageshow', function (event) { if (event.persisted) finish('restore'); });
    listen(view, 'beforeprint', function () { finish('print'); });
    for (var query of ['(prefers-reduced-motion: no-preference)', '(forced-colors: none)']) {
      listen(view.matchMedia(query), 'change', function () { if (!allowed()) finish('policy'); });
    }
    connect();
  } catch (_) { finish('unavailable'); }
})();
