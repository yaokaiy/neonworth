"use client";

import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import { createPortal } from 'react-dom';
import { useWorkspaceMotion } from './workspace-preferences';
import { finishLaunchGate } from './launch-gate';
import type { IntroSceneProps } from './launch-intro-scene';

// The first-paint gate is already present while this optional graph downloads.
// Quiet visits never import Motion/OGL; a missing chunk releases the gate.
const LazyIntroScene = lazy<ComponentType<IntroSceneProps>>(() => import('./launch-intro-scene')
  .then(module => ({ default: module.IntroScene }))
  .catch(() => ({ default: UnavailableIntro })));
function UnavailableIntro({ onDone }: IntroSceneProps) {
  useEffect(() => { onDone('unavailable'); }, [onDone]);
  return null;
}

export function LaunchIntro({ externalGate = false }: { externalGate?: boolean }) {
  const motion = useWorkspaceMotion();
  const [visible, setVisible] = useState(false);
  const [finished, setFinished] = useState(false);
  const decided = useRef(false);
  const terminal = useRef(false);
  const canStart = useCallback(() => window.__neonworthLaunchGate?.canStart() === true, []);
  const onStart = useCallback(() => { window.__neonworthLaunchGate?.started(); }, []);
  const dismiss = useCallback((reason = 'skip') => {
    if (terminal.current) return;
    terminal.current = true;
    finishLaunchGate(window, document, reason);
    setVisible(false);
    setFinished(true);
  }, []);

  useEffect(() => {
    const complete = () => {
      terminal.current = true;
      setVisible(false);
      setFinished(true);
    };
    document.addEventListener('neonworth-launch-finished', complete);
    if (!window.__neonworthLaunchGate || window.__neonworthLaunchGate.phase === 'done') dismiss();
    return () => document.removeEventListener('neonworth-launch-finished', complete);
  }, [dismiss]);

  useEffect(() => {
    if (terminal.current || !motion.ready) return;
    if (!decided.current) {
      decided.current = true;
      if (motion.enabled && window.__neonworthLaunchGate?.claim()) setVisible(true);
      else dismiss('policy');
    } else if (!motion.enabled) dismiss('policy');
  }, [motion.ready, motion.enabled, dismiss]);

  if (finished) return null;
  const scene = visible && motion.ready && motion.enabled
    ? <Suspense fallback={null}><LazyIntroScene onDone={dismiss} onStart={onStart} canStart={canStart}/></Suspense> : null;
  // The demo React root is the concealed/inert workspace. Its scene must live
  // outside that root so the native skip button remains visible and usable.
  const presentation = externalGate && scene
    ? createPortal(scene, document.getElementById('launch-scene') ?? document.body) : scene;
  return <>
    {!externalGate && <button id="launch-gate" className="launch-gate" type="button" aria-label="Skip introduction"
      onClick={event => { event.preventDefault(); event.stopPropagation(); dismiss('input'); }}>
      <span className="launch-gate__preparing">Opening your workspace</span>
      <span className="launch-gate__skip">Skip opening</span>
    </button>}
    {presentation}
  </>;
}
