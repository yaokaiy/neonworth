import { Renderer, Program, Triangle, Mesh } from 'ogl';
import type { LaunchLightingSample } from './launch-lighting';

// Original layered elliptical light model. OGL (Unlicense) provides the renderer,
// shader program and fullscreen triangle: https://github.com/oframe/ogl
// No React Bits/Pro shader or component implementation is incorporated.
export const NEON_FIELD_LIMITS = Object.freeze({ maxDpr: 2, maxPixels: 3_000_000, maxDimension: 4096 });
export type NeonLightFieldOptions = {
  /** Anchor positions in [0,1], measured from the top of the canvas. */
  measure: () => { top: number; bottom: number };
  /** Relative DISPLAY brightness after tone mapping, not HDR radiance. */
  secondaryStrength?: number;
};
export type NeonLightField = { render: (sample: LaunchLightingSample) => boolean; resize: () => void; dispose: () => void };

const vertex = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }
`;
const fragment = `
precision highp float;
varying vec2 vUv;
uniform vec2 uResolution;
uniform vec2 uCssSize;
uniform vec2 uSources;
uniform float uPower;
uniform float uExtent;
uniform float uReach;
uniform float uRoom;
uniform float uSecondary;
vec3 toDisplay(vec3 radiance) {
  vec3 mapped = max(radiance, vec3(0.0)) / (1.0 + max(radiance, vec3(0.0)));
  return mix(12.92 * mapped, 1.055 * pow(mapped, vec3(1.0 / 2.4)) - .055,
    step(vec3(.0031308), mapped));
}
float ellipticalLobe(vec2 p, vec2 radius, float shoulder) {
  vec2 q = p / max(radius, vec2(1.0));
  return exp(-shoulder * dot(q, q));
}
vec3 sourceLight(vec2 p, float origin, float direction, float voltage, float room, float echo) {
  float y = (p.y - origin * uCssSize.y) * direction;
  float halfLength = .54 * uCssSize.x * uExtent;
  float lateralExcess = max(abs(p.x) - halfLength, 0.0);
  float distanceToLine = length(vec2(lateralExcess, y));
  float pixel = max(.55, uCssSize.y / uResolution.y);
  // A three-CSS-pixel luminous capsule, not a one-pixel laser. Its halo has
  // several optical scales; bloom width does not stretch with the viewport.
  float core = 1.0 - smoothstep(1.5 - pixel * .5, 1.5 + pixel * .5, distanceToLine);
  float tight = exp(-.5 * pow(distanceToLine / 3.2, 2.0));
  float bloom = exp(-.5 * pow(distanceToLine / 10.0, 2.0));
  float haze = exp(-.5 * pow(distanceToLine / 28.0, 2.0));
  float segment = smoothstep(0.0, .015, uExtent);
  vec3 coreColor = vec3(1.0, .54, .96);
  vec3 haloColor = vec3(1.0, .11, .69);
  // Calibrate the primary's ignition before HDR exposure: linear .08 voltage
  // remains too bright after tone mapping. Cubic emission restores its deep
  // troughs while steady voltage1 and the smooth lower lamp stay unchanged.
  float emission = mix(voltage * voltage * voltage, voltage, echo);
  vec3 localLight = emission * segment * (coreColor * core * 16.0
    + haloColor * (tight * 1.9 + bloom * .27 + haze * .018));

  // The broad footprint is genuinely two-dimensional even when the tube
  // extends beyond both edges. Elliptical iso-illumination curves go deeper
  // at the centre and retreat at the sides. A mixture of smooth lobes gives
  // a bright pink near field, violet shoulder and a low-energy long tail;
  // there is no contour stroke, clipped reveal edge or linear colour band.
  float down = max(y, 0.0);
  float width = uCssSize.x * .64 * pow(max(uExtent, 0.0), .82);
  float spread = mix(.22, 1.0, uReach);
  // Bound vertical radii by width as well as height, so portrait viewports
  // retain a broad bowl instead of stretching the light into a tall column.
  float pinkDepth = min(uCssSize.y * mix(.16, .125, echo), uCssSize.x * mix(.24, .20, echo)) * spread;
  float violetDepth = min(uCssSize.y * mix(.37, .29, echo), uCssSize.x * mix(.68, .58, echo)) * spread;
  float tailDepth = min(uCssSize.y * mix(.70, .56, echo), uCssSize.x * mix(1.40, 1.15, echo)) * spread;
  vec2 fieldPoint = vec2(p.x, down);
  float pink = ellipticalLobe(fieldPoint, vec2(width, pinkDepth), 2.0);
  float violet = ellipticalLobe(fieldPoint, vec2(width * 1.025, violetDepth), 1.8);
  float tail = ellipticalLobe(fieldPoint, vec2(width * 1.08, tailDepth), 1.5);
  // Beyond the lit ends, soften onset into the room progressively. Keeping
  // an eight-pixel gate there would draw a phantom horizontal spill edge
  // across the still-unlit tube. Under the lit segment the gate stays tight.
  float inward = smoothstep(-4.0, 4.0 + .65 * lateralExcess, y);
  // The lower lamp keeps its bright core. Only its broad-field reach and
  // radiance are restrained, instead of dimming the entire lamp to a hairline.
  float field = room * segment * inward * mix(1.0, .65, echo);
  vec3 spill = vec3(1.0, .14, .72) * pink * 3.2
    + vec3(.28, .035, 1.0) * violet * .60
    + vec3(.19, .035, .60) * tail * .075;
  return localLight + spill * field;
}
void main() {
  vec2 p = vec2((vUv.x - .5) * uCssSize.x, (1.0 - vUv.y) * uCssSize.y);
  vec3 mainLight = toDisplay(sourceLight(p, uSources.x, 1.0, uPower, uRoom, 0.0));
  // The second lamp catches with the smooth room envelope, not the primary
  // ignition strikes. Display gain remains opt-in; use 1 for a lit mirror.
  vec3 echo = toDisplay(sourceLight(p, uSources.y, -1.0, uRoom, uRoom, 1.0)) * uSecondary;
  // Screen accumulation retains both coloured shoulders without adding two
  // already-exposed fields into a clipped, flat bright band between the lamps.
  vec3 color = 1.0 - (1.0 - mainLight) * (1.0 - echo);
  float peak = max(color.r, max(color.g, color.b));
  float dither = (fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(.06711056, .00583715)))) - .5) / 255.0;
  color = clamp(color + dither * smoothstep(0.0, .015, peak), 0.0, 1.0);
  float alpha = max(color.r, max(color.g, color.b));
  // Straight alpha reconstructs the tone-mapped light over the dark room.
  gl_FragColor = vec4(color / max(alpha, .00001), alpha);
}
`;

/** No clock, RAF or animation timer lives here. The owner's finite Motion
 * clock calls render; resize only updates geometry. A false render or null
 * creation asks the owner to keep its CSS fallback. Importing is SSR-safe. */
export function createNeonLightField(canvas: HTMLCanvasElement, options: NeonLightFieldOptions): NeonLightField | null {
  const view = canvas.ownerDocument?.defaultView;
  if (!view) return null;
  let renderer: Renderer | undefined, program: Program | undefined, geometry: Triangle | undefined, mesh: Mesh | undefined;
  let observer: ResizeObserver | undefined;
  let disposed = false, drawable = false, dirty = true;
  const removers: Array<() => void> = [];
  const cssWidth = canvas.style.width, cssHeight = canvas.style.height;
  const uniforms = {
    uResolution: { value: new Float32Array([1, 1]) }, uCssSize: { value: new Float32Array([1, 1]) },
    uSources: { value: new Float32Array([.18, .88]) }, uPower: { value: 0 }, uExtent: { value: 0 },
    uReach: { value: 0 }, uRoom: { value: 0 }, uSecondary: { value: 0 },
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true; drawable = false;
    try { observer?.disconnect(); } catch { /* A stale observer is inert. */ }
    for (const remove of removers.splice(0)) { try { remove(); } catch { /* Best effort on broken hosts. */ } }
    try { geometry?.remove(); } catch { /* Continue releasing other resources. */ }
    if (program && renderer) {
      try { program.remove(); } catch { /* Continue shader cleanup. */ }
      // OGL Program.remove deletes the program, not its shader objects.
      for (const shader of [program.vertexShader, program.fragmentShader]) {
        try { if (shader) renderer.gl.deleteShader(shader); } catch { /* A lost context already released GPU resources. */ }
      }
    }
    // Do not lose the canvas context: StrictMode may reuse the same canvas.
    mesh = undefined; program = undefined; geometry = undefined; renderer = undefined;
  };
  const lost = () => { if (!disposed) dispose(); };
  const resize = () => {
    if (disposed || !renderer) return;
    dirty = true;
    if (canvas.ownerDocument.hidden) return;
    try {
      const { width, height } = canvas.getBoundingClientRect();
      if (!Number.isFinite(width) || !Number.isFinite(height) || width < 0 || height < 0 || width > 1_000_000 || height > 1_000_000) throw new Error();
      if (!width || !height) { drawable = false; return; }
      const source = options.measure();
      if (![source.top, source.bottom].every(value => Number.isFinite(value) && value >= 0 && value <= 1) || source.bottom <= source.top) throw new Error();
      const nativeDpr = Number.isFinite(view.devicePixelRatio) && view.devicePixelRatio > 0 ? view.devicePixelRatio : 1;
      const hardware = Number(renderer.gl.getParameter(renderer.gl.MAX_RENDERBUFFER_SIZE));
      const side = Math.min(NEON_FIELD_LIMITS.maxDimension, Number.isFinite(hardware) && hardware >= 1 ? hardware : NEON_FIELD_LIMITS.maxDimension);
      const scale = Math.min(nativeDpr, NEON_FIELD_LIMITS.maxDpr, Math.sqrt(NEON_FIELD_LIMITS.maxPixels / (width * height)), side / width, side / height);
      const pixelWidth = Math.max(1, Math.floor(width * scale)), pixelHeight = Math.max(1, Math.floor(height * scale));
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        renderer.setSize(pixelWidth, pixelHeight);
        // Preserve CSS sizing so a later viewport resize can be measured.
        canvas.style.width = cssWidth; canvas.style.height = cssHeight;
      }
      uniforms.uResolution.value.set([pixelWidth, pixelHeight]); uniforms.uCssSize.value.set([width, height]);
      uniforms.uSources.value.set([source.top, source.bottom]);
      drawable = true; dirty = false;
    } catch { dispose(); }
  };
  try {
    if (typeof canvas.addEventListener !== 'function' || typeof canvas.removeEventListener !== 'function') return null;
    removers.push(() => canvas.removeEventListener('webglcontextlost', lost));
    canvas.addEventListener('webglcontextlost', lost);
    renderer = new Renderer({ canvas, width: 1, height: 1, dpr: 1, alpha: true, depth: false, stencil: false, antialias: false, premultipliedAlpha: false, powerPreference: 'low-power', webgl: 1 });
    canvas.style.width = cssWidth; canvas.style.height = cssHeight;
    const gl = renderer.gl;
    if (!gl || gl.isContextLost()) throw new Error();
    gl.clearColor(0, 0, 0, 0);
    const strength = options.secondaryStrength ?? 0;
    if (!Number.isFinite(strength)) throw new Error();
    uniforms.uSecondary.value = Math.max(0, Math.min(1, strength));
    program = new Program(gl, { vertex, fragment, uniforms, depthTest: false, depthWrite: false, cullFace: false });
    if (!gl.getProgramParameter(program.program, gl.LINK_STATUS)
      || !gl.getShaderParameter(program.vertexShader, gl.COMPILE_STATUS) || !gl.getShaderParameter(program.fragmentShader, gl.COMPILE_STATUS)) throw new Error();
    geometry = new Triangle(gl);
    mesh = new Mesh(gl, { geometry, program });
    const Observer = (view as Window & { ResizeObserver?: typeof ResizeObserver }).ResizeObserver;
    if (typeof Observer === 'function') {
      observer = new Observer(() => { if (!disposed) dirty = true; });
      observer.observe(canvas);
    }
    const changed = () => { if (!disposed) dirty = true; };
    removers.push(() => view.removeEventListener('resize', changed)); view.addEventListener('resize', changed);
    resize();
    if (disposed) return null;
  } catch { dispose(); return null; }

  return {
    resize, dispose,
    render(sample) {
      if (disposed || !renderer || !mesh) return false;
      if (canvas.ownerDocument.hidden) { dirty = true; return true; }
      try {
        if (renderer.gl.isContextLost()) { dispose(); return false; }
        if (dirty) resize();
        if (disposed || !renderer) return false;
        if (!drawable) return true;
        if (![sample.power, sample.extent, sample.reach, sample.room, sample.rim, sample.scene].every(Number.isFinite)) throw new Error();
        uniforms.uPower.value = Math.max(0, Math.min(1.25, sample.power));
        uniforms.uExtent.value = Math.max(0, Math.min(1, sample.extent));
        uniforms.uReach.value = Math.max(0, Math.min(1, sample.reach));
        uniforms.uRoom.value = Math.max(0, Math.min(1, sample.room));
        // scene fades the containing overlay; applying it here would fade twice.
        renderer.render({ scene: mesh, update: false, sort: false, frustumCull: false });
        return true;
      } catch { dispose(); return false; }
    },
  };
}
