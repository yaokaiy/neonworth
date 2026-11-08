"use client";

import { useEffect } from 'react';
import { useAnimate } from 'motion/react-mini';
import { animate as animateValue } from 'motion';
import { createNeonLightField } from './neon-light-field';
import { LAUNCH_LIGHTING, sampleLaunchLighting } from './launch-lighting';
import './launch-intro.css';

// Original light composition; OGL renders it and Motion owns its finite clock.
// No paid component source is incorporated. Explicit control cleanup also
// covers the pinned mini implementation's unregistered scope controls.
export type IntroSceneProps = { onDone: () => void; onStart: () => void; canStart: () => boolean };
export function IntroScene({ onDone, onStart, canStart }: IntroSceneProps) {
  const [scope, animate] = useAnimate<HTMLButtonElement>();
  useEffect(() => {
    let active = true;
    let field: ReturnType<typeof createNeonLightField> = null;
    const controls: Array<{ stop: () => void }> = [];
    const stop = () => {
      for (const control of controls) { try { control.stop(); } catch { /* Continue cleanup. */ } }
      field?.dispose();
      field = null;
    };
    try {
      if (!canStart() || !scope.current) { onDone(); return; }
      const root = scope.current;
      const canvas = root.querySelector<HTMLCanvasElement>('.launch-intro__canvas');
      const top = root.querySelector<HTMLElement>('.launch-intro__tube--primary');
      const bottom = root.querySelector<HTMLElement>('.launch-intro__tube--echo');
      if (canvas && top && bottom) {
        field = createNeonLightField(canvas, {
          secondaryStrength: 1,
          measure: () => {
            const frame = canvas.getBoundingClientRect();
            const upper = top.getBoundingClientRect(), lower = bottom.getBoundingClientRect();
            return { top: (upper.top + upper.height / 2 - frame.top) / frame.height,
              bottom: (lower.top + lower.height / 2 - frame.top) / frame.height };
          },
        });
      }
      const paint = (seconds: number) => {
        if (!active) return;
        const sample = sampleLaunchLighting(seconds);
        // The scene dissolves once, above both the canvas and DOM fallback.
        root.style.opacity = String(sample.scene);
        for (const key of ['power', 'extent', 'reach', 'room', 'rim'] as const) {
          root.style.setProperty(`--launch-${key}`, String(sample[key]));
        }
        const ready = field?.render(sample) ?? false;
        root.dataset.lightField = ready ? 'ready' : 'fallback';
        if (!ready && field) { field.dispose(); field = null; }
      };
      // Compile and draw before starting either clock, so initial compilation
      // cannot eat the ignition strikes. Missing WebGL uses the same CSS clock.
      paint(0);
      if (!canStart()) { stop(); onDone(); return; }
      const end = animate(root, { visibility: ['visible', 'visible', 'hidden'] },
        { duration: LAUNCH_LIGHTING.duration, times: [0, .999, 1], ease: 'linear' });
      controls.push(end);
      controls.push(animateValue(0, LAUNCH_LIGHTING.duration, {
        duration: LAUNCH_LIGHTING.duration, ease: 'linear', onUpdate: paint,
      }));
      onStart();
      // The independent native endpoint hides the hit surface even if the JS
      // light clock stalls. No overlay can remain as an invisible click trap.
      Promise.resolve(end).then(() => { if (active) onDone(); }, () => { if (active) onDone(); });
    } catch { stop(); onDone(); }
    return () => { active = false; stop(); };
  }, [animate, onDone, onStart, canStart, scope]);

  return <button ref={scope} type="button" tabIndex={-1} className="launch-intro" aria-label="Skip introduction"
    onPointerCancel={onDone}
    onClick={event => { event.preventDefault(); event.stopPropagation(); onDone(); }}>
    <span className="launch-intro__light" aria-hidden="true">
      <canvas className="launch-intro__canvas" />
      <span className="launch-intro__tube launch-intro__tube--primary" />
      <span className="launch-intro__spill" />
      <span className="launch-intro__tube launch-intro__tube--echo" />
      <span className="launch-intro__title">
        <span className="launch-intro__title-shadow">NeonWorth</span>
        <span className="launch-intro__title-light">NeonWorth</span>
      </span>
    </span>
  </button>;
}
