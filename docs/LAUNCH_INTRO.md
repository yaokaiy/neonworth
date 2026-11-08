# NeonWorth document opening

The opening is an app-open experience. Every full document open, reload or reopen gets a new decision. Internal report changes, returning to Overview, tab visibility changes and restoration of the same document from back/forward cache never replay it. Reset view performs a full navigation and therefore makes a new decision. Quiet, reduced motion, forced colors, print and background-document policies skip it.

The selected workspace is concealed and unavailable to pointer, keyboard and assistive-technology interaction until the opening completes or is skipped. Financial loading and report rendering proceed concurrently. An opaque first-paint gate remains beneath the artwork through its final fade; the workspace appears only after the sequence ends. No financial values, chart geometry, shell or dialog ancestors are animated.

## Artwork

Two straight, full-width lamps sit near opposite viewport edges, using a responsive inset of `clamp(24px, 5svh, 56px)`. Both have luminous pink-white cores approximately three CSS pixels thick. Their inward-facing elliptical fields have separately calibrated depth and strength. Concentrated pink bloom passes through a violet shoulder into a long, low-energy tail. **NeonWorth** rests near 54% as a flat, dark silhouette against that received light, with minimal edge detail. See the [reference study](NEON_REVEAL_STUDY.md) and [design principles](NEON_DESIGN.md).

The primary core strikes near 0.18 and 0.58 seconds. The lower lamp follows the smooth room envelope. Motion drives the finite 7.6-second light clock and final 5.4–7.6-second fade; OGL 1.0.11 renders the original light field. The CSS fallback shares that clock and approximates the curved spill. Artwork and dependency notices remain original and unchanged; no paid React Bits source is incorporated. These authored timings are not measured reference timings.

## Startup ownership and recovery

A small same-origin classic head script owns the document gate before the application module graph starts. Its CSS is a separate critical resource. The demo keeps `script-src 'self'` and `connect-src 'none'`; hosted builds emit an ordinary classic script after the stylesheet, using the trusted response nonce. The pinned Vinext `beforeInteractive` helper hoists scripts ahead of stylesheet markup, so it is deliberately not used for this ordering-sensitive bootstrap.

Playback state lives in that document, with no persisted seen flag. The bootstrap reads display-only preferences and native motion policy; the application policy can also dismiss it. Quiet decisions are validated against the application's saved-preference contract. Blocked preference storage retains the ordinary expressive default. Policy re-enabling cannot reopen a completed decision.

React lazy/Suspense still keeps Motion/OGL out of skipped visits. Pending downloads show the opening gate instead of the dashboard. The scene can start only while the existing gate is active, so a late chunk cannot cover a workspace that has already been exposed. Missing bootstrap, failed optional imports, initialization errors and bounded startup/playback watchdogs must expose an operable workspace. A skipped or completed decision removes gate isolation and input listeners. StrictMode effect cleanup must not spend a new document's decision or restart a completed one.

The cover supplies a native skip action. Completed pointer clicks and keyboard activation used to skip must not activate an unseen underlying control. Page hide, hidden visibility, print and policy changes dismiss; back/forward restoration stays dismissed. Static/no-JavaScript and partial-resource behavior are tested separately from the artistic clock.

## Diagnosis of the prior published behavior

The November 8 report was verified against public `main` at `726d5f8` and the actual assets served at https://yaokaiy.github.io/neonworth/. `sessionStorage['neonworth-launch-intro-seen']` deliberately suppressed same-tab reloads. The parent initially rendered nothing and the scene used `Suspense fallback={null}`, while the workspace rendered independently. Startup was allowed up to 1,000ms after first contentful paint and 2,500ms after navigation. The scene itself began transparent. Those rules allowed the dashboard-before-cover sequence and implemented the previous once-per-tab-session specification.

Single uncompressed HTTP samples returned the HTML, main JavaScript, scene JavaScript and scene CSS in roughly 115–145ms, with sizes 1,205 / 741,500 / 125,570 / 4,409 bytes. These are transfer diagnostics, not browser startup, parse or GPU timings. The prior native Chrome same-tab reload exposed the workspace without a new opening. The exact cold first-paint flash was established by source ordering and remains a separate frame-timing observation.

## Acceptance and evidence

Use the existing desktop Chrome profile and **⚡ Neonworth QA** group with synthetic records. The app browser-access host is unavailable in this session, while installed/running Chrome, its enabled extension and native-host manifest checks pass. Native CUA controls work in that same profile/group; this is the explicitly chosen fallback. No separate browser profile, DevTools transport, permission changes or browser-security bypass is used.

Required checks for this lifecycle revision:

1. Full open, repeated reload, hard reload and close/reopen: an opening on each new document; no visible or accessible workspace before completion/skip.
2. Overview → Spending → Overview, tab away/return, history and same-document restoration: no replay.
3. Click, Enter/Space, Tab and wheel skips: no hidden-control activation or stranded focus.
4. Quiet, reduced motion, forced colors and print: immediate usable workspace; re-enabling motion does not replay.
5. Slow or failed optional chunks, missing bootstrap, unavailable WebGL, blocked storage and stale callbacks: bounded recovery with no late cover or hidden/inert workspace left behind.
6. Amount hiding, modal focus/Escape and reporting/navigation controls at 320px and 390px: existing behavior remains usable.

Source regressions, synthetic state-machine checks, HTTP evidence and native browser observations are recorded independently. They do not certify every GPU, smoothness or power use. The prior optical revision's sampled-art and native application approvals are historical; its once-per-session reload expectation is superseded by this request. Current implementation, independent review, native acceptance, exact-SHA CI, merge and GitHub Pages deployment statuses belong in [the task register](TASKS.md).

### November 8 candidate observations

The coordinator reused the existing Chrome profile and **⚡ Neonworth QA** group through native CUA. Repeated reloads exposed only the skip control during the opening. A sampled ignition frame showed no report beneath it; normal completion exposed the workspace. Overview → Spending → Overview stayed in the workspace without replay. Clicking over a hidden navigation position dismissed without changing reports; Tab also skipped. Quiet persisted across a reload and skipped; resuming motion did not replay. Amount hiding removed figures and chart content. The preferences dialog's Tab/Shift-Tab wrapping was observed.

One unthrottled local 320px run recorded bootstrap pending at 65ms, lighting start at 494ms, and completion/release at 8,067ms from navigation. A separate key-skipped run recorded 34/439/966ms. These marks are single local observations, not production latency or frame-rate benchmarks. At both 320px and 390px, actual browser geometry measured 11 visible header/report controls with zero overlaps and document scroll width equal to viewport width.

The final built local Worker returned HTTP 200 with the stylesheet before the classic script, both before body markup, a script nonce matching the response CSP, and no unsafe-inline script allowance. This checks the real Vinext output separately from JSX source. The critical gate adds 2,668 gzip bytes of JavaScript and 590 gzip bytes of CSS; eager demo application JavaScript is 741,347 raw bytes versus 741,500 in the prior served build. Gzip sizes are artifact measurements.

Later native control reported that Chrome had been changed for another task. Further reopen, reduced/forced emulation, throttled-cold-load and modal Escape checks were deferred rather than attributing ambiguous native actions to the application. Source regressions cover these lifecycle/policy boundaries, but do not certify the deferred browser cases. No website permissions or browser security settings were changed.
