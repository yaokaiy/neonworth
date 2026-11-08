/** Document-owned state is deliberately not persisted across reloads or tabs. */
export type LaunchGate = {
  readonly phase: 'pending' | 'claimed' | 'playing' | 'done';
  claim: () => boolean;
  canStart: () => boolean;
  started: () => void;
  finish: (reason: string) => void;
};
declare global { interface Window { __neonworthLaunchGate?: LaunchGate } }

export function finishLaunchGate(view: Window, doc: Document, reason: string) {
  const gate = view.__neonworthLaunchGate;
  if (gate) { gate.finish(reason); return; }
  // The independently served bootstrap can itself fail. Never replace an
  // already exposed workspace with a late cover, or leave its SSR gate closed.
  doc.documentElement.setAttribute('data-launch-gate', 'done');
  const workspace = doc.querySelector<HTMLElement>('[data-launch-workspace]')
    ?? doc.querySelector<HTMLElement>('.app.unified-dashboard.personal-workspace.personal-experience');
  if (workspace) workspace.inert = false;
  const cover = doc.getElementById('launch-gate');
  if (cover) cover.hidden = true;
}
