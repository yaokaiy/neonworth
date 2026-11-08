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
      const end = animate(scope.current, {
        opacity: [0, 1, 1, 0],
        visibility: ['visible', 'visible', 'visible', 'hidden'],
      }, { duration: 1.8, times: [0, .08, .69, 1], ease: 'linear' });
      controls.push(end);
      controls.push(animate('.launch-intro__tube', { transform: ['scaleX(0)', 'scaleX(1)'], opacity: [0, 1] }, { duration: .42, ease: 'easeOut' }));
      controls.push(animate('.launch-intro__spill', { transform: ['scaleY(0)', 'scaleY(1)'], opacity: [0, 1] }, { delay: .25, duration: .55, ease: 'easeOut' }));
      controls.push(animate('.launch-intro__title', { opacity: [0, 1] }, { delay: .4, duration: .4, ease: 'easeOut' }));
      onStart();
      Promise.resolve(end).then(() => { if (active) onDone(); }, () => { if (active) onDone(); });
    } catch { stop(); onDone(); }
    return () => { active = false; stop(); };
  }, [animate, onDone, onStart, canStart, scope]);

  return <button ref={scope} type="button" tabIndex={-1} className="launch-intro" aria-label="Skip introduction"
    onClick={event => { event.preventDefault(); event.stopPropagation(); onDone(); }}>
    <span className="launch-intro__light" aria-hidden="true">
      <span className="launch-intro__tube" />
      <span className="launch-intro__spill" />
      <span className="launch-intro__title">NeonWorth</span>
    </span>
  </button>;
}

