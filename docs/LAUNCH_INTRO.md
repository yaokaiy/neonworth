# NeonWorth launch reveal

The launch reveal lights the entire viewport as one environment. A violet/pink neon horizon expands across the page and pours a broad, softly diminishing wash downward. **NeonWorth** sits below it as dark relief: mostly shadow, with a faint upper rim catching the light. The lamp is the focal point; the lettering is intentionally elusive. The full sequence is approximately 6.8 seconds, including a 2.2-second dissolve into the workspace. Loading financial records proceeds independently.

There is no centered card or fixed-width lamp frame. The light source extends beyond both viewport edges, its wash occupies the full scene, and the title rests lower in that same field. The existing workspace appears in place as the light and dark veil fade together. See [the design principles](NEON_DESIGN.md) for why artistic type and opening rhythm have different requirements from financial information.

## Implementation boundary

- Motion's `motion/react-mini` API supplies scoped animation playback and cancellation. The scene uses standard React effect cleanup to stop its returned library controls; it does not rely on undocumented cancellation behavior. The project retains only its session and display-policy rules, with no general animation engine or gesture framework.
- Standard React lazy/Suspense loads the Motion scene only for an eligible first opening. Returning visits and Quiet mode do not request that animation chunk. A failed chunk resolves to no introduction; interaction during loading cancels the pending cover.
- The glow and composition are original artwork inspired by the public [Neon Reveal concept](https://pro.reactbits.dev/docs/components/neon-reveal). React Bits Pro component source is not redistributed.
- The reveal mounts as a sibling of the workspace, inside the existing display-preference provider. It never animates a financial value, chart, dialog ancestor or page shell, and never redirects a deep link to another report.
- Only the first eligible visit in a tab session can play. Refreshing, switching reports or changing display settings does not replay it. Missing session storage, prior interaction, late initialization and unsupported motion capabilities leave the workspace visible.
- A deferred scene rechecks startup timing. If first contentful paint is reported more than 350ms ago, it skips the cover rather than interrupting an already-readable page. The absolute navigation-age ceiling is 2.5 seconds; no paint entry means the initial content has not yet been observed by that API.
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

1. **Fresh opening:** expect a full-width overhead light to ignite over about 2.5 seconds, illuminating the page-wide field. The exact title `NeonWorth` should emerge faintly as shadowed lettering beneath it. Around 4.6 seconds, the whole scene begins a slow dissolve into the original report, finishing around 6.8 seconds. Judge the lamp, field and shadow together; the title must not become a competing bright sign. No full-screen strobe or forced navigation.
2. **Once:** reload and switch reports in the same tab. Expect no replay. In a fresh tab, expect a new first-visit decision.
3. **Skip safely:** during the cover, click where a navigation item would be. Expect only the cover to disappear; the first click must not select an unseen report or save a financial record. A subsequent deliberate click works normally.
4. **Keyboard and scroll:** press Tab during the reveal. Expect the cover to disappear and native focus progression to reach the page. Wheel input or the browser taking over a touch pan dismisses it. After completion, inputs behave normally and no invisible hit target remains.
5. **Preferences:** choose Quiet, then open a fresh tab. Expect no introduction. Re-enabling Expressive in that tab does not replay it. Repeat with system reduced motion and forced colors; printing must exclude the cover.
6. **Interruption:** background the tab or change its motion policy during playback. Expect immediate dismissal and no replay on return. Opening a report in a background tab must not produce a late surprise cover after interaction.
7. **Responsive and privacy:** at 320px and 390px, expect the light to continue through both viewport edges, the field to fill the screen and the shadowed title to fit. The scene clips its own glow without adding page overflow. After dismissal, check navigation/date-control collisions, dialogs and amount hiding; existing financial geometry and text remain unchanged.
8. **Failure:** record any console errors, delayed cover or focus/input interference. A failed or skipped animation must not obstruct the page.

Record viewport, reduced-motion/Quiet state, candidate revision and actual observations. Use synthetic data only. Until this gate passes, keep the UI candidate off the main deployment path.
