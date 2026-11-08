"use client";

import { useEffect } from 'react';
import { useAnimate } from 'motion/react-mini';
import './launch-intro.css';

// Original artwork inspired only by the public Neon Reveal visual concept:
// https://pro.reactbits.dev/docs/components/neon-reveal
// Motion owns scoped native animation; standard controls.stop() cleanup below
// also covers the pinned mini implementation's unregistered scope controls:
// https://motion.dev/docs/react-use-animate
export type IntroSceneProps = { onDone: () => void; onStart: () => void; canStart: () => boolean };
export function IntroScene({ onDone, onStart, canStart }: IntroSceneProps) {
  const [scope, animate] = useAnimate<HTMLButtonElement>();
  useEffect(() => {
    let active = true;
    const controls: Array<ReturnType<typeof animate>> = [];
    const stop = () => { for (const control of controls) { try { control.stop(); } catch { /* Finish cleaning the remaining controls. */ } } };
    try {
      if (!canStart()) { onDone(); return; }
      // Root is always the last animation to finish. Its native endpoint is
      // hidden, so the hit surface disappears even if JS cannot finish cleanup.
      // Per-keyframe easing preserves the authored 4.6s-to-6.8s dissolve.
      const end = animate(scope.current, {
        opacity: [0, 1, 1, 0],
        visibility: ['visible', 'visible', 'visible', 'hidden'],
      }, { duration: 6.8, times: [0, .04, 4.6 / 6.8, 1], ease: ['easeOut', 'linear', 'easeInOut', 'linear'] });
      controls.push(end);
      controls.push(animate('.launch-intro__tube', { transform: ['scaleX(0)', 'scaleX(1)'], opacity: [0, 1] }, { duration: 2.5, ease: 'easeInOut' }));
      controls.push(animate('.launch-intro__spill', { transform: ['scaleY(.03)', 'scaleY(1)'], opacity: [0, 1] }, { delay: .35, duration: 3, ease: 'easeOut' }));
      controls.push(animate('.launch-intro__title', { opacity: [0, .78] }, { delay: 1.2, duration: 2.15, ease: 'easeInOut' }));
      controls.push(animate('.launch-intro__title-light', { opacity: [0, .34, .55, .4] }, { delay: 1.4, duration: 2.3, times: [0, .4, .76, 1], ease: 'easeInOut' }));
      onStart();
      Promise.resolve(end).then(() => { if (active) onDone(); }, () => { if (active) onDone(); });
    } catch { stop(); onDone(); }
    return () => { active = false; stop(); };
  }, [animate, onDone, onStart, canStart, scope]);

  return <button ref={scope} type="button" tabIndex={-1} className="launch-intro" aria-label="Skip introduction"
    onPointerCancel={onDone}
    onClick={event => { event.preventDefault(); event.stopPropagation(); onDone(); }}>
    <span className="launch-intro__light" aria-hidden="true">
      <span className="launch-intro__tube" />
      <span className="launch-intro__spill" />
      <span className="launch-intro__title">
        <span className="launch-intro__title-shadow">NeonWorth</span>
        <span className="launch-intro__title-light">NeonWorth</span>
      </span>
    </span>
  </button>;
}

