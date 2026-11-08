import { Renderer, Program, Triangle, Mesh } from 'ogl';
import type { LaunchLightingSample } from './launch-lighting';

// Original finite-line light model. OGL (Unlicense) provides the renderer,
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
const float PI = 3.14159265359;

vec3 toDisplay(vec3 radiance) {
  vec3 mapped = max(radiance, vec3(0.0)) / (1.0 + max(radiance, vec3(0.0)));
  return mix(12.92 * mapped, 1.055 * pow(mapped, vec3(1.0 / 2.4)) - .055,
    step(vec3(.0031308), mapped));
}
vec3 sourceLight(vec2 p, float origin, float direction, float voltage, float room, float echo) {
  float y = (p.y - origin * uCssSize.y) * direction;
  float halfLength = .54 * uCssSize.x * uExtent;
  float distanceToLine = length(vec2(max(abs(p.x) - halfLength, 0.0), y));
  float pixel = max(.55, uCssSize.y / uResolution.y);
  float core = 1.0 - smoothstep(.52, .52 + pixel, distanceToLine);
  float nearHalo = exp(-distanceToLine / 3.3);
  float tail = exp(-distanceToLine / 17.0);
  float segment = smoothstep(0.0, .015, uExtent);
  vec3 coreColor = mix(vec3(1.0, .78, .94), vec3(.36, .12, 1.0), echo);
  vec3 haloColor = mix(vec3(1.0, .025, .32), vec3(.28, .035, 1.0), echo);
  vec3 localLight = voltage * segment * (coreColor * core * 3.1 + haloColor * nearHalo * .48 + haloColor * tail * .036);

  // Angular extent of a finite line, with inverse-square-like attenuation.
  // The broad field follows room, never the two ignition voltage strikes.
  float down = max(y, 0.0);
  float angular = (atan((halfLength - p.x) / max(down, 2.0)) + atan((halfLength + p.x) / max(down, 2.0))) / PI;
  float scale = uCssSize.y * mix(.19, .065, echo);
  float attenuation = 1.0 / (1.0 + pow(down / max(scale, 1.0), 2.0));
  float reach = max(20.0, uCssSize.y * mix(.76, .18, echo) * uReach);
  float directionGate = smoothstep(-1.0, 9.0, y);
  float reachGate = 1.0 - smoothstep(reach * .65, reach, down);
  float field = room * max(angular, 0.0) * directionGate * attenuation * reachGate * exp(-down / max(scale * 2.0, 1.0));
  return localLight + vec3(.21, .055, 1.0) * field * .078;
}
void main() {
  vec2 p = vec2((vUv.x - .5) * uCssSize.x, (1.0 - vUv.y) * uCssSize.y);
  vec3 mainLight = toDisplay(sourceLight(p, uSources.x, 1.0, uPower, uRoom, 0.0));
  // The recessed echo catches only after the main lamp stabilises. Applying
  // its strength AFTER tone mapping prevents a white-hot second horizon.
  vec3 echo = toDisplay(sourceLight(p, uSources.y, -1.0, uRoom * .72, uRoom, 1.0)) * uSecondary;
  vec3 color = clamp(mainLight + echo, 0.0, 1.0);
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
