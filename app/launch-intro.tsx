"use client";

import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import { useWorkspaceMotion } from './workspace-preferences';
import type { IntroSceneProps } from './launch-intro-scene';

// Standard lazy/Suspense keeps decoration out of returning/Quiet visits. A
// missing optional chunk must never take down the financial workspace.
const LazyIntroScene = lazy<ComponentType<IntroSceneProps>>(() => import('./launch-intro-scene')
  .then(module => ({ default: module.IntroScene }))
  .catch(() => ({ default: UnavailableIntro })));
function UnavailableIntro({ onDone }: IntroSceneProps) {
  useEffect(() => { onDone(); }, [onDone]);
  return null;
}
export const LAUNCH_INTRO_KEY = 'neonworth-launch-intro-seen';
const START_GRACE_MS = 2500;
const SHELL = '.app.unified-dashboard.personal-workspace.personal-experience';

export function launchIntroEligible(view: Window, doc: Document) {
  try {
    const age = view.performance.now();
    return Number.isFinite(age) && age >= 0 && age <= START_GRACE_MS
      && !doc.hidden && doc.hasFocus() && !view.matchMedia('print').matches
      && !view.navigator.userActivation?.hasBeenActive && Boolean(doc.querySelector(SHELL));
  } catch { return false; }
}

export function consumeLaunchIntro(view: Window) {
  try { view.sessionStorage.setItem(LAUNCH_INTRO_KEY, '1'); } catch { /* Storage failure always skips. */ }
}

/** Called only once by the parent after saved display policy is ready. */
export function claimLaunchIntro(view: Window, doc: Document, enabled: boolean) {
  try {
    const storage = view.sessionStorage;
    if (storage.getItem(LAUNCH_INTRO_KEY) !== null) return false;
    storage.setItem(LAUNCH_INTRO_KEY, '1');
    if (storage.getItem(LAUNCH_INTRO_KEY) !== '1') return false;
    return enabled && launchIntroEligible(view, doc);
  } catch { return false; }
}

export function LaunchIntro() {
  const motion = useWorkspaceMotion();
  const [visible, setVisible] = useState(false);
  const [finished, setFinished] = useState(false);
  const decided = useRef(false);
  const terminal = useRef(false);
  const playing = useRef(false);
  const canStart = useCallback(() => launchIntroEligible(window, document), []);
  const onStart = useCallback(() => { playing.current = true; }, []);
  const dismiss = useCallback(() => {
    if (terminal.current) return;
    terminal.current = true;
    if (!decided.current) { decided.current = true; consumeLaunchIntro(window); }
    setVisible(false);
    setFinished(true);
  }, []);

  useEffect(() => {
    if (finished || terminal.current) return;
    let active = true;
    const removers: Array<() => void> = [];
    const listen = (target: EventTarget, type: string, callback: EventListener) => {
      const options = { capture: true, passive: true };
      const guarded: EventListener = event => { if (active && !terminal.current) callback(event); };
      removers.push(() => target.removeEventListener(type, guarded, options));
      target.addEventListener(type, guarded, options);
    };
    try {
      // Before the decision these only record that the user has started work.
      // During playback the native button consumes the completed pointer click.
      for (const event of ['pointerdown', 'touchstart']) listen(document, event, () => { if (!playing.current) dismiss(); });
      for (const event of ['keydown', 'wheel']) listen(document, event, dismiss);
      for (const event of ['blur', 'pagehide', 'beforeprint']) listen(window, event, dismiss);
      listen(window, 'pageshow', event => { if ((event as PageTransitionEvent).persisted) dismiss(); });
      listen(document, 'visibilitychange', () => { if (document.hidden) dismiss(); });
    } catch { dismiss(); }
    return () => { active = false; for (const remove of removers) { try { remove(); } catch { /* Stale callbacks are inert. */ } } };
  }, [dismiss, finished]);

  useEffect(() => {
    if (terminal.current) return;
    if (!motion.ready) { if (decided.current) dismiss(); return; }
    if (!decided.current) {
      decided.current = true;
      if (claimLaunchIntro(window, document, motion.enabled)) setVisible(true);
      else dismiss();
    } else if (!motion.enabled) dismiss();
  }, [motion.ready, motion.enabled, dismiss]);

  return visible && !finished && motion.ready && motion.enabled ? <Suspense fallback={null}><LazyIntroScene onDone={dismiss} onStart={onStart} canStart={canStart}/></Suspense> : null;
}
