// Execute the exact independently shipped bootstrap, not a duplicate policy.
// DOM/native paint and focus behavior still require the separate Chrome gate.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { parseStoredWorkspacePreferences } from '../lib/workspace-preferences.ts';
const source = await readFile('public/launch-gate.js', 'utf8');
class Events {
  listeners = new Map();
  addEventListener(type, fn) { if (!this.listeners.has(type)) this.listeners.set(type, new Set()); this.listeners.get(type).add(fn); }
  removeEventListener(type, fn) { this.listeners.get(type)?.delete(fn); }
  emit(type, value = {}) { const event = { type, target: this, preventDefault() { this.prevented = true; }, stopPropagation() { this.stopped = true; }, ...value }; for (const fn of [...(this.listeners.get(type) ?? [])]) fn(event); return event; }
  dispatchEvent(event) { this.emit(event.type, event); }
  count() { return [...this.listeners.values()].reduce((total, set) => total + set.size, 0); }
}
function browser({ saved = null, blockedStorage = false, reduced = false, forced = false, hidden = false, mounted = true, styles = true, late = false } = {}) {
  const window = new Events(), document = new Events(), attrs = new Map(), marks = [], timers = new Map(), media = new Map();
  let now = 100, id = 0, present = mounted, shell = mounted, focus = 0;
  const workspace = { inert: false }, cover = { get hidden() { return this.isHidden ?? false; }, set hidden(value) { this.isHidden = value; if (value && document.activeElement === this) document.activeElement = null; }, attributes: new Map(), setAttribute(k, v) { this.attributes.set(k, v); }, contains: target => target === cover };
  document.documentElement = { setAttribute: (k, v) => attrs.set(k, v), getAttribute: k => attrs.get(k) ?? null };
  document.body = late === true || late === 'body' ? {} : null; document.readyState = late === true || late === 'ready' ? 'interactive' : 'loading';
  document.hidden = hidden;
  document.querySelector = selector => selector === '[data-launch-workspace]' ? present ? workspace : null : shell ? workspace : null;
  document.getElementById = name => present ? name === 'launch-gate' ? cover : name === 'main-content' ? { focus() { focus++; } } : null : null;
  window.getComputedStyle = target => target === document.documentElement ? { getPropertyValue: () => styles ? 'ready' : '' } : target === workspace ? { visibility: attrs.get('data-launch-gate') === 'pending' && styles ? 'hidden' : 'visible' } : { display: styles ? 'grid' : 'inline', position: styles ? 'fixed' : 'static', visibility: 'visible', opacity: '1' };
  window.performance = { now: () => now, mark: name => marks.push(name) };
  window.setTimeout = (fn, delay) => { timers.set(++id, { fn, due: now + delay }); return id; };
  window.clearTimeout = key => timers.delete(key);
  Object.defineProperty(window, 'sessionStorage', { get() { assert.fail('Document playback never reads or writes session storage'); } });
  Object.defineProperty(window, 'localStorage', { get() { if (blockedStorage) throw new Error('Blocked'); return { getItem: key => { assert.equal(key, 'neonworth-display-v2'); return saved; } }; } });
  window.matchMedia = query => { if (!media.has(query)) { const event = new Events(); event.matches = query === 'print' ? false : query.includes('forced') ? !forced : !reduced; media.set(query, event); } return media.get(query); };
  const context = vm.createContext({ window, document, CustomEvent: class { constructor(type) { this.type = type; } } });
  const execute = () => vm.runInContext(source, context);
  execute();
  return { window, document, attrs, workspace, cover, media, marks, timers, execute, gate: window.__neonworthLaunchGate,
    mount() { present = shell = true; }, noShell() { shell = false; }, focusCover() { document.activeElement = cover; }, focusScene() { document.activeElement = { closest: selector => selector === '.launch-intro' ? {} : null }; }, focuses: () => focus,
    age(ms) { now += ms; }, advance(ms) { now += ms; for (const [key, timer] of [...timers]) if (timer.due <= now) { timers.delete(key); timer.fn(); } },
    listeners: () => window.count() + document.count() + [...media.values()].reduce((n, item) => n + item.count(), 0) };
}
const first = browser();
assert.equal(first.attrs.get('data-launch-gate'), 'pending');
assert.equal(first.workspace.inert, true, 'The workspace is isolated before React or optional chunks');
assert.equal(first.gate.claim(), true); first.gate.started();
assert.equal(first.gate.phase, 'playing'); assert.equal(first.cover.attributes.get('aria-hidden'), 'true');
assert.equal(first.cover.tabIndex, -1, 'The native scene owns the one active skip control');
assert.equal(first.gate.claim(), false, 'A second component cannot claim the active document');
first.execute(); assert.equal(first.gate.phase, 'playing', 'Repeated bootstrap evaluation does not restart playback');
assert.equal(first.workspace.inert, true, 'The workspace stays isolated through the entire cinematic fade');
first.gate.finish('complete');
assert.equal(first.gate.phase, 'done'); assert.equal(first.workspace.inert, false); assert.equal(first.cover.hidden, true);
assert.equal(first.listeners(), 0); assert.equal(first.timers.size, 0);
assert.deepEqual(first.marks, ['neonworth-opening:pending', 'neonworth-opening:start', 'neonworth-opening:complete']);
for (const type of ['pageshow', 'visibilitychange', 'click', 'keydown']) first.document.emit(type);
assert.equal(first.gate.claim(), false, 'Internal returns and later interaction cannot replay a completed document');
assert.equal(browser().gate.claim(), true, 'A full reload/reopen creates a new eligible document');

const quiet = JSON.stringify({ version: 2, density: 'comfortable', motion: 'quiet', pinnedReports: [] });
for (const config of [{ saved: quiet }, { reduced: true }, { forced: true }, { hidden: true }]) {
  const b = browser(config); assert.equal(b.gate.phase, 'done'); assert.equal(b.workspace.inert, false); assert.equal(b.gate.claim(), false); assert.equal(b.listeners(), 0);
}
for (const saved of ['invalid', '{"version":2,"motion":"quiet"}', JSON.stringify({ version: 2, density: 'compact', motion: 'quiet', pinnedReports: ['unknown'] }), JSON.stringify({ version: 2, density: 'comfortable', motion: 'quiet', pinnedReports: ['goals', 'goals'] })]) {
  assert.equal(parseStoredWorkspacePreferences(saved), null);
  const b = browser({ saved }); assert.equal(b.gate.claim(), true, 'Malformed settings retain the same expressive default as the provider');
}
assert.equal(browser({ blockedStorage: true }).gate.claim(), true, 'Storage failure does not suppress document playback');
for (const stage of ['body', 'ready']) { const late = browser({ late: stage }); assert.equal(late.gate.phase, 'done'); assert.equal(late.gate.claim(), false, 'Delayed bootstrap cannot arm a new cover after body parsing/readiness'); assert.ok(!late.marks.includes('neonworth-opening:pending')); assert.equal(late.workspace.inert, false); }
const noStyles = browser({ styles: false }); assert.equal(noStyles.gate.phase, 'done'); assert.equal(noStyles.gate.claim(), false, 'Failed critical CSS cannot create a late cover'); assert.equal(noStyles.workspace.inert, false);
const waiting = browser(); waiting.advance(5001);
assert.equal(waiting.gate.phase, 'done'); assert.equal(waiting.workspace.inert, false); assert.equal(waiting.gate.claim(), false, 'A delayed chunk cannot cover the already released workspace');
assert.ok(!waiting.marks.includes('neonworth-opening:complete'), 'Timeouts are not labeled successful choreography');
const stale = browser(); stale.gate.claim(); stale.age(5001); stale.gate.started(); assert.equal(stale.gate.phase, 'done', 'Synchronous GPU preparation cannot revive an expired gate');
const stalled = browser(); stalled.gate.claim(); stalled.gate.started(); stalled.advance(8601); assert.equal(stalled.workspace.inert, false); assert.equal(stalled.gate.phase, 'done', 'A stalled animation cannot leave an invisible input trap');
const early = browser({ mounted: false }); early.mount();
const click = early.document.emit('click', { target: early.cover });
assert.equal(click.prevented, true); assert.equal(click.stopped, true); assert.equal(early.gate.phase, 'done', 'The native completed click skips before DOMContentLoaded/app download');
assert.equal(early.workspace.inert, false); assert.equal(early.gate.claim(), false);
for (const type of ['keydown', 'wheel']) {
  const b = browser(); b.focusCover(); const event = b.document.emit(type, { key: 'Enter' });
  assert.equal(event.prevented, true); assert.equal(b.workspace.inert, false); assert.equal(b.focuses(), 1);
  assert.equal(b.gate.phase, 'done', `${type} safely dismisses without activating the revealed workspace`);
}
for (const key of ['F5', 'F11', 'F1']) {
  const b = browser(); const event = b.document.emit('keydown', { key });
  assert.equal(event.prevented, undefined, `${key} keeps its native browser default`); assert.equal(event.stopped, undefined); assert.equal(b.gate.phase, 'pending'); b.gate.finish('test');
}
const ordinaryKey = browser(); const typed = ordinaryKey.document.emit('keydown', { key: 'a' }); assert.equal(typed.prevented, undefined, 'A normal skip key preserves unrelated browser defaults'); assert.equal(ordinaryKey.gate.phase, 'done');
const focusedScene = browser(); focusedScene.gate.claim(); focusedScene.gate.started(); focusedScene.focusScene(); focusedScene.gate.finish('complete'); assert.equal(focusedScene.focuses(), 1, 'A focused cinematic skip control returns focus to the revealed main content');
const untouchedFocus = browser(); untouchedFocus.gate.claim(); untouchedFocus.gate.started(); untouchedFocus.gate.finish('complete'); assert.equal(untouchedFocus.focuses(), 0, 'Automatic completion never steals unrelated focus');
for (const type of ['pagehide', 'beforeprint', 'pageshow']) {
  const b = browser(); b.gate.claim(); b.window.emit(type, { persisted: true }); assert.equal(b.gate.phase, 'done'); assert.equal(b.workspace.inert, false); assert.equal(b.gate.claim(), false);
}
const background = browser(); background.document.hidden = true; background.document.emit('visibilitychange'); background.document.hidden = false;
assert.equal(background.gate.claim(), false, 'Tab visibility restoration cannot replay');
const policy = browser(); policy.gate.claim(); const reduced = policy.media.get('(prefers-reduced-motion: no-preference)'); reduced.matches = false; reduced.emit('change'); reduced.matches = true; reduced.emit('change'); assert.equal(policy.gate.claim(), false);

const html = await readFile('demo/index.html', 'utf8'), layout = await readFile('app/layout.tsx', 'utf8'), css = await readFile('public/launch-gate.css', 'utf8');
assert.doesNotMatch(html + layout, /<html[^>]*data-launch-gate="pending"/, 'A failed bootstrap fails open instead of leaving an unowned static gate');
assert.match(html, /<script src="%BASE_URL%launch-gate\.js"><\/script>/, 'The independent bootstrap is a parser-blocking self script before modules');
assert.ok(html.indexOf('launch-gate.js') < html.indexOf('id="root"'));
assert.match(html, /<div id="launch-scene"><\/div>\s*<div id="root" data-launch-workspace>/, 'Cinematic DOM is outside the inert demo root');
assert.match(layout, /<script src="\/launch-gate\.js" nonce=\{nonce\}/, 'Hosted classic parser script explicitly retains its trusted CSP nonce');
assert.doesNotMatch(css, /:target/, 'Hash navigation cannot bypass a successfully owned opening gate');
assert.doesNotMatch(css, /animation\s*:|transition\s*:/, 'The workspace/gate ancestors are never animated');
console.log('Launch gate: exact public bootstrap isolates pending/playing workspace; new documents replay; internal returns, StrictMode-style reevaluation and bfcache do not; native early skip, policy, blocked storage and bounded failure recovery passed. Paint remains Chrome acceptance.');
