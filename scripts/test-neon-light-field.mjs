// App timing and adapter ownership tests, not shader/GPU or visual acceptance.
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { LAUNCH_LIGHTING, sampleLaunchLighting } from '../app/launch-lighting.ts';

assert.equal(typeof globalThis.window, 'undefined');
assert.equal(typeof globalThis.document, 'undefined');
const actualOgl = await import('ogl');
for (const name of ['Renderer', 'Program', 'Triangle', 'Mesh']) assert.equal(typeof actualOgl[name], 'function', 'Pinned OGL imports without creating a browser context');

const { duration, fadeStart, strikes, catch: catchTime } = LAUNCH_LIGHTING;
assert.equal(strikes.length, 2);
assert.ok(0 < strikes[0] && strikes[0] < strikes[1] && strikes[1] < catchTime && catchTime < fadeStart && fadeStart < duration);
assert.ok(duration <= 10, 'The launch clock has a bounded, finite duration');
const fields = ['power', 'extent', 'reach', 'room', 'rim', 'scene'];
let aboveStrike = false, strikeWindows = 0, previous;
for (let tick = 0; tick <= Math.ceil(duration * 500); tick++) {
  const time = tick / 500, sample = sampleLaunchLighting(time);
  assert.deepEqual(Object.keys(sample).sort(), [...fields].sort());
  for (const field of fields) assert.ok(Number.isFinite(sample[field]) && sample[field] >= 0 && sample[field] <= (field === 'power' ? 1.25 : 1), `${field} stays bounded at ${time}`);
  if (time <= catchTime) {
    assert.equal(sample.room, 0, 'Room illumination does not inherit either ignition strike');
    assert.equal(sample.reach, 0, 'The broad field waits for the stable lamp catch');
    const high = sample.power > 1.05;
    if (high && !aboveStrike) strikeWindows++;
    aboveStrike = high;
  }
  if (previous && time <= fadeStart) for (const field of ['extent', 'reach', 'room', 'scene']) assert.ok(sample[field] + 1e-12 >= previous[field], `${field} grows without repeated global flashes`);
  if (previous && time > fadeStart) assert.ok(sample.scene <= previous.scene + 1e-12, 'The whole-scene dissolve never flashes back up');
  if (time >= 1.5 && time <= fadeStart) assert.equal(sample.power, 1, 'The caught lamp is stable, with no continuing flicker');
  previous = sample;
}
assert.equal(strikeWindows, 2, 'Exactly two bounded local ignition strikes precede the stable field');
for (const peak of strikes) {
  assert.ok(sampleLaunchLighting(peak).power > 1);
  assert.ok(sampleLaunchLighting(peak - .1).power < sampleLaunchLighting(peak).power);
  assert.ok(sampleLaunchLighting(peak + .13).power < sampleLaunchLighting(peak).power);
}
assert.equal(sampleLaunchLighting(0).scene, 0);
assert.equal(sampleLaunchLighting(fadeStart).scene, 1);
assert.equal(sampleLaunchLighting(duration).scene, 0);
assert.equal(sampleLaunchLighting(duration + 100).scene, 0, 'No late scene replay');
for (const invalidTime of [-10, NaN, Infinity, -Infinity]) for (const value of Object.values(sampleLaunchLighting(invalidTime))) assert.ok(Number.isFinite(value));

class Events {
  listeners = new Map();
  addEventListener(type, handler) {
    if (this.rejectRegistration) throw new Error('Synthetic event registration failure');
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(handler);
  }
  removeEventListener(type, handler) { this.listeners.get(type)?.delete(handler); }
  emit(type) { for (const handler of [...(this.listeners.get(type) || [])]) handler({ type, target: this }); }
  count() { return [...this.listeners.values()].reduce((total, handlers) => total + handlers.size, 0); }
}
function fixture({ width = 390, height = 844, dpr = 2, hardware = 4096, failure = '', observer = true } = {}) {
  const state = { width, height, hardware, failure, lost: false, measures: 0, draws: [], sizes: [], programs: [], geometries: [], observers: [], deletedShaders: [], anchors: { top: .18, bottom: .88 } };
  const view = new Events();
  view.devicePixelRatio = dpr;
  for (const name of ['requestAnimationFrame', 'setTimeout', 'setInterval', 'fetch']) view[name] = () => assert.fail('The light adapter must not own a clock or network access');
  const canvas = new Events();
  canvas.style = { width: '100%', height: '100%' };
  canvas.width = 300; canvas.height = 150;
  canvas.ownerDocument = { defaultView: view, hidden: false };
  canvas.getBoundingClientRect = () => ({ width: state.width, height: state.height });
  canvas.fixture = state;
  state.canvas = canvas; state.view = view;
  state.gl = {
    canvas, MAX_RENDERBUFFER_SIZE: 1, LINK_STATUS: 2, COMPILE_STATUS: 3,
    isContextLost: () => state.lost,
    clearColor() {},
    getParameter: () => state.hardware,
    getProgramParameter: () => state.failure !== 'link',
    getShaderParameter: shader => state.failure !== shader.kind,
    deleteShader: shader => state.deletedShaders.push(shader),
    getExtension: name => { assert.notEqual(name, 'WEBGL_lose_context', 'Ordinary cleanup must leave the StrictMode canvas context reusable'); return null; },
  };
  if (observer) view.ResizeObserver = class {
    constructor(callback) { this.callback = callback; this.disconnections = 0; state.observers.push(this); }
    observe(target) { assert.equal(target, canvas); if (state.failure === 'observe') throw new Error('Synthetic observation failure'); }
    disconnect() { this.disconnections++; }
  };
  const measure = () => { state.measures++; if (state.failure === 'measure') throw new Error('Synthetic geometry failure'); return { ...state.anchors }; };
  return { ...state, state, canvas, view, measure };
}
class Renderer {
  constructor(options) {
    const state = options.canvas.fixture;
    if (state.failure === 'renderer') throw new Error('Synthetic unavailable renderer');
    this.state = state; this.gl = state.gl; this.gl.renderer = this; this.dpr = options.dpr;
    state.rendererOptions = options;
    assert.equal(options.alpha, true); assert.equal(options.depth, false); assert.notEqual(options.preserveDrawingBuffer, true, 'The decorative field does not retain an unnecessary drawing buffer');
    this.setSize(options.width, options.height);
  }
  setSize(width, height) { const { canvas } = this.state; canvas.width = width * this.dpr; canvas.height = height * this.dpr; canvas.style.width = `${width}px`; canvas.style.height = `${height}px`; this.state.sizes.push([canvas.width, canvas.height]); }
  render({ scene }) {
    if (this.state.failure === 'render') throw new Error('Synthetic draw failure');
    this.state.draws.push(Object.fromEntries(Object.entries(scene.program.uniforms).map(([key, uniform]) => [key, ArrayBuffer.isView(uniform.value) ? Array.from(uniform.value) : uniform.value])));
  }
}
class Program {
  constructor(gl, options) {
    const state = gl.canvas.fixture;
    if (state.failure === 'program') throw new Error('Synthetic program construction failure');
    this.gl = gl; this.uniforms = options.uniforms; this.vertexShader = { kind: 'vertex' }; this.fragmentShader = { kind: 'fragment' }; this.program = {}; this.removals = 0;
    state.programs.push(this);
  }
  remove() { this.removals++; if (this.gl.canvas.fixture.failure === 'program-remove') throw new Error('Synthetic program cleanup failure'); }
}
class Triangle {
  constructor(gl) { if (gl.canvas.fixture.failure === 'geometry') throw new Error('Synthetic geometry construction failure'); this.gl = gl; this.removals = 0; gl.canvas.fixture.geometries.push(this); }
  remove() { this.removals++; if (this.gl.canvas.fixture.failure === 'geometry-remove') throw new Error('Synthetic geometry cleanup failure'); }
}
class Mesh { constructor(gl, { geometry, program }) { if (gl.canvas.fixture.failure === 'mesh') throw new Error('Synthetic mesh construction failure'); this.geometry = geometry; this.program = program; } }

const mockKey = '__neonworthLightFieldOgl', previousMock = Object.getOwnPropertyDescriptor(globalThis, mockKey);
globalThis[mockKey] = { Renderer, Program, Triangle, Mesh };
const hook = registerHooks({ resolve(specifier, context, next) {
  if (specifier !== 'ogl') return next(specifier, context);
  return { url: 'data:text/javascript,const mock=globalThis.__neonworthLightFieldOgl;export const Renderer=mock.Renderer,Program=mock.Program,Triangle=mock.Triangle,Mesh=mock.Mesh;', shortCircuit: true };
} });
const approx = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-6, `${actual} differs from ${expected}`);
function released(f) {
  assert.equal(f.canvas.count() + f.view.count(), 0, 'All adapter listeners are removed');
  for (const item of [...f.state.programs, ...f.state.geometries]) assert.equal(item.removals, 1, 'Every initialized resource receives one cleanup');
  assert.equal(f.state.deletedShaders.length, f.state.programs.length * 2, 'Both shaders are explicitly deleted in addition to the OGL program');
  for (const item of f.state.observers) assert.equal(item.disconnections, 1);
}
try {
  const { createNeonLightField, NEON_FIELD_LIMITS } = await import('../app/neon-light-field.ts');
  assert.equal(typeof globalThis.window, 'undefined', 'The adapter imports on the server without browser globals');
  assert.equal(createNeonLightField({ ownerDocument: null }, { measure: () => assert.fail() }), null);
  const normal = fixture(), field = createNeonLightField(normal.canvas, { measure: normal.measure });
  assert.ok(field); assert.equal(normal.state.draws.length, 0, 'Initialization does not start a render loop');
  const sample = Object.freeze(sampleLaunchLighting(3));
  assert.equal(field.render(sample), true);
  let last = normal.state.draws.at(-1); assert.equal(last.uSecondary, 0, 'The lower source is opt-in');
  for (const [uniform, key] of [['uPower', 'power'], ['uExtent', 'extent'], ['uReach', 'reach'], ['uRoom', 'room']]) approx(last[uniform], sample[key]);
  assert.equal(Object.hasOwn(last, 'uScene'), false, 'The adapter leaves the single scene fade with its owner');
  assert.deepEqual(normal.canvas.style, { width: '100%', height: '100%' });
  const measures = normal.state.measures;
  field.render(sample); assert.equal(normal.state.measures, measures, 'Stable frames do not repeatedly measure layout');
  normal.state.anchors = { top: .22, bottom: .81 }; normal.state.width = 600;
  normal.state.observers[0].callback(); assert.equal(normal.state.draws.length, 2, 'Resize observation only invalidates geometry');
  assert.equal(field.render(sample), true); last = normal.state.draws.at(-1); approx(last.uSources[0], .22); approx(last.uSources[1], .81);
  normal.canvas.ownerDocument.hidden = true; const draws = normal.state.draws.length;
  field.resize(); assert.equal(field.render(sample), true); assert.equal(normal.state.draws.length, draws, 'Hidden documents perform no draw');
  normal.canvas.ownerDocument.hidden = false; assert.equal(field.render(sample), true);
  field.dispose(); field.dispose(); released(normal); assert.equal(field.render(sample), false);

  for (const [strength, expected] of [[undefined, 0], [-1, 0], [.24, .24], [5, 1]]) {
    const f = fixture(), light = createNeonLightField(f.canvas, { measure: f.measure, secondaryStrength: strength }); assert.ok(light); light.render(sample);
    approx(f.state.draws.at(-1).uSecondary, expected); light.dispose(); released(f);
  }
  const huge = fixture({ width: 10_000, height: 7000, dpr: 8, hardware: 2048 }), big = createNeonLightField(huge.canvas, { measure: huge.measure });
  assert.ok(big); assert.ok(huge.canvas.width * huge.canvas.height <= NEON_FIELD_LIMITS.maxPixels); assert.ok(Math.max(huge.canvas.width, huge.canvas.height) <= 2048); assert.ok(huge.canvas.width / huge.state.width <= NEON_FIELD_LIMITS.maxDpr);
  big.resize(); assert.equal(huge.state.draws.length, 0); big.dispose(); released(huge);
  const zero = fixture({ width: 0, height: 0, observer: false }), empty = createNeonLightField(zero.canvas, { measure: zero.measure });
  assert.ok(empty); assert.equal(empty.render(sample), true); assert.equal(zero.state.draws.length, 0);
  zero.state.width = 320; zero.state.height = 844; zero.view.emit('resize'); assert.equal(empty.render(sample), true); assert.equal(zero.state.draws.length, 1); empty.dispose(); released(zero);

  for (const failure of ['renderer', 'program', 'link', 'vertex', 'fragment', 'geometry', 'mesh', 'observe', 'measure']) {
    const f = fixture({ failure }); assert.equal(createNeonLightField(f.canvas, { measure: f.measure }), null, failure); released(f);
  }
  for (const mutate of [f => { f.state.anchors.bottom = f.state.anchors.top; }, f => { f.state.anchors.top = NaN; }, f => { f.state.width = -1; }, f => { f.state.width = Infinity; }, f => { f.state.lost = true; }]) {
    const f = fixture(); mutate(f); assert.equal(createNeonLightField(f.canvas, { measure: f.measure }), null); released(f);
  }
  for (const target of ['canvas', 'view']) {
    const f = fixture(); f[target].rejectRegistration = true; assert.equal(createNeonLightField(f.canvas, { measure: f.measure }), null); released(f);
  }
  const invalidStrength = fixture(); assert.equal(createNeonLightField(invalidStrength.canvas, { measure: invalidStrength.measure, secondaryStrength: NaN }), null); released(invalidStrength);
  for (const failure of ['render', 'program-remove', 'geometry-remove']) {
    const f = fixture(), light = createNeonLightField(f.canvas, { measure: f.measure }); assert.ok(light); f.state.failure = failure;
    if (failure === 'render') assert.equal(light.render(sample), false); else light.dispose();
    light.dispose(); released(f); assert.equal(light.render(sample), false);
  }
  const invalid = fixture(), invalidLight = createNeonLightField(invalid.canvas, { measure: invalid.measure });
  assert.equal(invalidLight.render({ ...sample, power: NaN }), false); released(invalid);
  const resizeFailure = fixture(), resizing = createNeonLightField(resizeFailure.canvas, { measure: resizeFailure.measure });
  resizeFailure.state.anchors.bottom = -1; resizing.resize(); assert.equal(resizing.render(sample), false); released(resizeFailure);
  const silent = fixture(), silentLight = createNeonLightField(silent.canvas, { measure: silent.measure }); silent.state.lost = true;
  assert.equal(silentLight.render(sample), false); released(silent);
  const lost = fixture(), first = createNeonLightField(lost.canvas, { measure: lost.measure }), oldLoss = [...lost.canvas.listeners.get('webglcontextlost')][0], oldObserver = lost.state.observers[0];
  lost.canvas.emit('webglcontextlost'); assert.equal(first.render(sample), false); released(lost);
  const replacement = createNeonLightField(lost.canvas, { measure: lost.measure }); assert.ok(replacement); oldLoss(); oldObserver.callback(); assert.equal(replacement.render(sample), true, 'Stale callbacks cannot dispose a replacement owner on the same canvas');
  replacement.dispose(); released(lost);
} finally {
  hook.deregister();
  if (previousMock) Object.defineProperty(globalThis, mockKey, previousMock); else delete globalThis[mockKey];
}
console.log('Neon light field: two bounded local strikes, independent stable room envelope, finite fade, SSR-safe imports, bounded resize, explicit OGL resource cleanup, context loss and stale-owner isolation passed. Scoped adapter mocks do not establish GPU compilation, optics or browser acceptance.');
