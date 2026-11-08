import { transform } from 'motion';

/** One authored clock, consumed by the light field and DOM fallback together.
 * Motion supplies interpolation; this module never schedules frames or timers. */
export const LAUNCH_LIGHTING = Object.freeze({
  duration: 7.6,
  fadeStart: 5.4,
  strikes: [.18, .58] as const,
  catch: 1.0,
});
export type LaunchLightingSample = {
  power: number;
  extent: number;
  reach: number;
  room: number;
  rim: number;
  scene: number;
};

// The two voltage strikes affect the primary core/near halo only. All spatial
// growth and room illumination are independent, smooth and non-flashing.
const power = transform([0, .08, .18, .31, .43, .58, .73, 1, 1.5], [0, .02, 1.15, .08, .08, 1.25, .16, .72, 1]);
const extent = transform([0, .18, .58, 1, 2.6], [0, .055, .13, .22, 1], { ease: t => t * t * (3 - 2 * t) });
const reach = transform([0, 1, 3.6], [0, 0, 1], { ease: t => t * t * (3 - 2 * t) });
const room = transform([0, 1, 3.5], [0, 0, 1], { ease: t => t * t * (3 - 2 * t) });
const rim = transform([0, 1.4, 3.8, LAUNCH_LIGHTING.duration], [0, 0, .42, .42], { ease: t => t * t * (3 - 2 * t) });
const scene = transform([0, .12, LAUNCH_LIGHTING.fadeStart, LAUNCH_LIGHTING.duration], [0, 1, 1, 0], { ease: t => t * t * (3 - 2 * t) });

export function sampleLaunchLighting(seconds: number): LaunchLightingSample {
  const time = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  return { power: power(time), extent: extent(time), reach: reach(time), room: room(time), rim: rim(time), scene: scene(time) };
}
