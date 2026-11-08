# NeonWorth launch reveal

The launch reveal is a short introduction to the existing workspace: a neon tube expands from the center, pours light down onto **NeonWorth**, holds briefly, then fades out. The full sequence is approximately 1.8 seconds. Loading financial records proceeds independently.

## Implementation boundary

- Motion's `motion/react-mini` API supplies scoped animation playback and cancellation. The scene uses standard React effect cleanup to stop its returned library controls; it does not rely on undocumented cancellation behavior. The project retains only its session and display-policy rules, with no general animation engine or gesture framework.
- Standard React lazy/Suspense loads the Motion scene only for an eligible first opening. Returning visits and Quiet mode do not request that animation chunk. A failed chunk resolves to no introduction; interaction during loading cancels the pending cover.
- The glow and composition are original artwork inspired by the public [Neon Reveal concept](https://pro.reactbits.dev/docs/components/neon-reveal). React Bits Pro component source is not redistributed.
- The reveal mounts as a sibling of the workspace, inside the existing display-preference provider. It never animates a financial value, chart, dialog ancestor or page shell, and never redirects a deep link to another report.
- Only the first eligible visit in a tab session can play. Refreshing, switching reports or changing display settings does not replay it. Missing session storage, prior interaction, late initialization and unsupported motion capabilities leave the workspace visible.
- Quiet, reduced-motion, forced-color and print policies skip the reveal. Visibility and preference changes can dismiss it. The effect requests no financial data or credentials and loads no extra font or media asset.
- The active cover is a native skip button. Its click dismisses the introduction without activating an unseen control beneath it. Keyboard and scroll interaction can also dismiss it; it never moves focus into a modal or holds up a data request.
- The resting artwork is hidden. The finite animation returns it to that hidden state, and the scene unmounts after completion. Animation failure must leave the original page exposed.

## Synthetic preview

From a reviewed candidate checkout with the pinned dependencies:

```sh
npm run demo:build
npm run demo:preview -- --port 4186 --strictPort
```

Open **http://127.0.0.1:4186/neonworth/** in a new, empty tab in the existing desktop Chrome task group. The preview reuses the actual application with synthetic records and a closed read-only transport. A fresh tab is needed to observe a once-per-session effect; duplicating or restoring an old tab may retain its session flag.

## Desktop Chrome acceptance

Keep this gate pending until observations from the user's existing Chrome session return. Build, source and mocked-policy checks do not establish appearance or native event behavior. Do not substitute a separate browser profile or headless session for this gate.

1. **Fresh opening:** expect center-out ignition, downlight, the exact title `NeonWorth`, then a smooth fade exposing the original report. No full-screen strobe, forced navigation or extended blank stage.
2. **Once:** reload and switch reports in the same tab. Expect no replay. In a fresh tab, expect a new first-visit decision.
3. **Skip safely:** during the cover, click where a navigation item would be. Expect only the cover to disappear; the first click must not select an unseen report or save a financial record. A subsequent deliberate click works normally.
4. **Keyboard and scroll:** press Tab during the reveal. Expect the cover to disappear and native focus progression to reach the page. Keyboard and wheel interaction after completion behave normally; no invisible hit target remains.
5. **Preferences:** choose Quiet, then open a fresh tab. Expect no introduction. Re-enabling Expressive in that tab does not replay it. Repeat with system reduced motion and forced colors; printing must exclude the cover.
6. **Interruption:** background the tab or change its motion policy during playback. Expect immediate dismissal and no replay on return. Opening a report in a background tab must not produce a late surprise cover after interaction.
7. **Responsive and privacy:** at 320px and 390px, expect the title and light to fit without overflow. After dismissal, check navigation/date-control collisions, dialogs and amount hiding; existing financial geometry and text remain unchanged.
8. **Failure:** record any console errors, delayed cover or focus/input interference. A failed or skipped animation must not obstruct the page.

Record viewport, reduced-motion/Quiet state, candidate revision and actual observations. Use synthetic data only. Until this gate passes, keep the UI candidate off the main deployment path.
