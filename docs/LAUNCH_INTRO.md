# NeonWorth launch reveal

The launch reveal lights the viewport as one environment. Its dominant violet/pink lamp sits near 18% of the viewport height; a recessed violet echo sits near 88%. The echo has shorter reach and approximately 0.18 of the primary light's displayed brightness, applied after tone mapping so it cannot become a second white-hot horizon. **NeonWorth** rests near 54%, barely visible in the dark interval with a faint upper rim. Clean tube cores, concentrated bloom and smooth falloff preserve depth instead of filling the screen with purple fog.

Two localized startup strikes peak at approximately 0.18 and 0.58 seconds. The primary lamp then catches, expands across the scene and settles; the lower echo follows the smooth room illumination rather than duplicating the strikes. The sequence lasts 7.6 seconds, with its final dissolve running from 5.4 to 7.6 seconds. There is no centered card or fixed-width light frame. The existing selected report appears in place as light and veil fade together, while financial loading proceeds independently. See [the design principles](NEON_DESIGN.md) for why artistic type and opening rhythm have different requirements from financial information.

The current candidate has the bounded headless composition and sequence evidence below. Interaction, rendering performance and the existing desktop Chrome acceptance gate remain pending.

## Implementation boundary

- Motion drives one finite authored clock for the light field, title, veil and CSS fallback. Standard React effect cleanup stops the returned animation controls; the renderer has no independent animation clock or perpetual frame loop.
- OGL **1.0.11**, distributed under the **Unlicense**, supplies WebGL rendering primitives. The shader is an original analytic finite-line light model with separate core, near halo and spatial falloff. It does not stretch a blurred image. A CSS fallback retains the broad composition when WebGL is unavailable; it is an approximation, not a claim of identical rendering. Initialization or rendering failure must preserve that fallback or expose the workspace, never leave a blocking cover.
- The shader uses calibrated decorative radiance for this violet/pink artwork; its room, title and CSS fallback use the shared design roles.
- Standard React lazy/Suspense loads the scene and renderer only for an eligible first opening. Returning visits and Quiet mode do not request that animation chunk. A failed chunk resolves to no introduction; interaction during loading cancels the pending cover.
- The glow and composition are original artwork inspired by the public [Neon Reveal concept](https://pro.reactbits.dev/docs/components/neon-reveal). No React Bits or React Bits Pro shader/component source is copied. Dependency notices remain in [third-party notices](../THIRD_PARTY_NOTICES.md).
- The reveal mounts as a sibling of the workspace, inside the existing display-preference provider. It never animates a financial value, chart, dialog ancestor or page shell, and never redirects a deep link to another report.
- Only the first eligible visit in a tab session can play. Refreshing, switching reports or changing display settings does not replay it. Missing session storage, prior interaction, late initialization and unsupported motion capabilities leave the workspace visible.
- A deferred scene rechecks startup timing. If first contentful paint is reported more than 1 second ago, it skips the cover rather than interrupting an already-readable page. This bounded window allows cold GPU preparation, with a second eligibility check before playback. The absolute navigation-age ceiling is 2.5 seconds; no paint entry means the initial content has not yet been observed by that API.
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

Current authorized synthetic headless frames at 1440×900 and 390×844 were independently inspected, including a mobile fade frame. They show a clean dominant upper lamp, restrained lower echo, deep central shadow and a dark title without visible clipping; the fade exposes the existing report in place. Earlier passive frames also established this composition at 320×720.

The current trace covers 1440×900, 390×844 and 320×720, with 470–475 renderer samples per run. It records a ready renderer, two power peaks near 183ms and 583ms while room illumination remains zero, a fade to near-zero opacity and removal after approximately 7.6 seconds of playback. Every recorded overflow check is false. Returning reloads request no scene chunks and show no cover. These are observed development-render and sequence results, not desktop interaction or performance acceptance. The desktop-sized capture log includes GPU `ReadPixels` stall warnings; smoothness is not established by stills or sampled state. Capture evidence remains outside the public source distribution.

## Desktop Chrome acceptance

Keep this gate pending until observations from the user's existing Chrome session return. Build, source and mocked-policy checks do not establish appearance or native event behavior. Any separately authorized synthetic headless captures are developmental evidence and must be recorded separately; they do not complete this gate. Do not silently substitute a separate browser profile or headless session.

1. **Fresh opening:** expect two distinct, localized strikes near 0.18 and 0.58 seconds, followed by a stable upper lamp and a delayed, much weaker lower echo. The wide illumination should settle smoothly without flashing. The exact title `NeonWorth` remains shadowed between the lamps. At 5.4 seconds the whole scene begins a slow dissolve into the original report, finishing around 7.6 seconds. Judge clean cores, bloom, falloff and the dark interval together; neither the lower light nor the title should compete with the upper lamp. No full-screen strobe or forced navigation.
2. **Once:** reload and switch reports in the same tab. Expect no replay. In a fresh tab, expect a new first-visit decision.
3. **Skip safely:** during the cover, click where a navigation item would be. Expect only the cover to disappear; the first click must not select an unseen report or save a financial record. A subsequent deliberate click works normally.
4. **Keyboard and scroll:** press Tab during the reveal. Expect the cover to disappear and native focus progression to reach the page. Wheel input or the browser taking over a touch pan dismisses it. After completion, inputs behave normally and no invisible hit target remains.
5. **Preferences:** choose Quiet, then open a fresh tab. Expect no introduction. Re-enabling Expressive in that tab does not replay it. Repeat with system reduced motion and forced colors; printing must exclude the cover.
6. **Interruption:** background the tab or change its motion policy during playback. Expect immediate dismissal and no replay on return. Opening a report in a background tab must not produce a late surprise cover after interaction.
7. **Responsive and privacy:** at 320px and 390px, expect the lights to continue through both viewport edges, the weak lower echo to retain its hierarchy and the shadowed title to fit. The scene clips its own glow without adding page overflow. After dismissal, check navigation/date-control collisions, dialogs and amount hiding; existing financial geometry and text remain unchanged.
8. **Fallback and failure:** check the CSS fallback separately from WebGL rendering. Record console errors, failed initialization, delayed cover or focus/input interference. A failed or skipped animation must not obstruct the page; the fallback must retain the same skip and motion policies.

Record viewport, reduced-motion/Quiet state, candidate revision and actual observations. Use synthetic data only. Until this gate passes, keep the UI candidate off the main deployment path.
