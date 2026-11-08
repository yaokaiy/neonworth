# NeonWorth launch reveal

The launch reveal lights the viewport as one environment. Two straight, full-width lamps sit near opposite viewport edges, using a responsive inset of `clamp(24px, 5svh, 56px)`. Both have luminous pink-white cores approximately three CSS pixels thick. The upper and lower inward-facing fields have separately calibrated depth and strength; the lower lamp is not reduced to a faint hairline.

Layered elliptical light spreads deeper in the centre and falls away earlier at the sides. Concentrated bloom passes from a bright pink near field through a violet shoulder into a long, low-energy tail. **NeonWorth** rests near 54% as a flat, dark silhouette against that received light, with only minimal edge detail. See [the native-observed reference study](NEON_REVEAL_STUDY.md) and [design principles](NEON_DESIGN.md) for the optical brief and rejection criteria.

Two localized startup strikes peak at approximately 0.18 and 0.58 seconds. The primary lamp catches and expands; the lower lamp follows the smooth room envelope rather than duplicating those strikes. The sequence lasts 7.6 seconds, with its final dissolve running from 5.4 to 7.6 seconds. Light and veil fade into the existing selected report in place while financial loading proceeds independently. These timings are Neonworth's choreography, not measured timing claims about the reference.

The earlier `f7fa0e3` appearance was rejected by the user. Its passing technical checks and earlier sampled-art review remain historical evidence; they do not approve this optical revision. New implementation, sampled rendering, desktop interaction, merge and deployment have separate gates.

## Implementation boundary

- Motion drives one finite authored clock for the light field, title, veil and CSS fallback. Standard React effect cleanup stops both returned animation controls. The renderer has no independent animation clock or perpetual frame loop.
- OGL **1.0.11**, distributed under the **Unlicense**, supplies WebGL rendering primitives. The original shader separates a luminous capsule core, several bloom scales and two-dimensional elliptical spill. The broad field grows with the lit length and has a smooth chromatic shoulder and tail; it is not a stretched blurred image or a linear wash. Source centres are measured from the actual lamp elements.
- The lower field uses a different reach and broad-field strength while retaining a visible core. Compositing preserves the coloured shoulders without clipping the centre into a flat bright band. The shader uses calibrated decorative radiance; the room backdrop, title and CSS fallback use the shared design roles.
- The CSS fallback uses inward-facing radial lobes and layered bloom, with the strongest spill depths bounded by viewport width as well as height. It is an approximation of the WebGL artwork. Initialization or rendering failure must preserve that fallback or expose the workspace, never leave a blocking cover.
- Standard React lazy/Suspense loads the scene and renderer only for an eligible first opening. Returning visits and Quiet mode do not request that animation chunk. A failed chunk resolves to no introduction; interaction during loading cancels the pending cover.
- The artwork is inspired by the public [Neon Reveal preview](https://pro.reactbits.dev/docs/components/neon-reveal). No React Bits or React Bits Pro shader/component source is copied. Dependency notices remain in [third-party notices](../THIRD_PARTY_NOTICES.md).
- The reveal mounts as a sibling of the workspace, inside the existing display-preference provider. It never animates financial values, charts, dialog ancestors or the page shell, and never redirects a deep link to another report.
- Only the first eligible visit in a tab session can play. Refreshing, switching reports or changing display settings does not replay it. Missing session storage, prior interaction, late initialization and unsupported motion capabilities leave the workspace visible.
- A deferred scene rechecks startup timing. It skips when first contentful paint is reported more than one second ago, with an absolute navigation-age ceiling of 2.5 seconds. A second check after cold GPU preparation prevents preparation from bypassing that window. No paint entry means the initial content has not yet been observed by that API.
- Quiet, reduced-motion, forced-color and print policies skip the reveal. Visibility and preference changes can dismiss it. The effect requests no financial data or credentials and loads no extra font or media asset.
- The active cover is a native skip button. Its click dismisses the introduction without activating an unseen control beneath it. Keyboard and scroll interaction can also dismiss it; it never moves focus into a modal or holds up a data request.
- The resting artwork is hidden. An independent native visibility endpoint hides the hit surface after the finite sequence even if the JavaScript light clock stalls. Normal completion unmounts the scene and disposes its GPU resources.

## Reference research and preview

The coordinator observed the public reference in the user's existing desktop Chrome profile, including a slowed replay and its mirrored option. Native computer control can read the page, create and reuse the named **⚡ Neonworth** group, and operate harmless preview controls. The plugin browser-access host remains unavailable; that transport limitation does not make native Chrome control unavailable. Reference interaction is not acceptance of Neonworth's own keyboard, privacy or responsive behavior.

From a reviewed candidate checkout with the pinned dependencies:

```sh
npm run demo:build
npm run demo:preview -- --port 4186 --strictPort
```

Open **http://127.0.0.1:4186/neonworth/** in a new, empty tab in the existing **⚡ Neonworth** desktop Chrome group. The preview reuses the application with synthetic records and a closed read-only transport. Duplicating or restoring an old tab may retain its session flag and skip the opening.

Final synthetic samples at 1440×900, 390×844 and 320×720 received bounded coordinator and independent optical approval. Actual early frames show a bright first strike, near-dark trough and brighter second strike while the room remains dark. Growth and hold samples retain curved pink/violet shoulders without the earlier phantom spill seam or portrait column. Corrected fallback samples at 1440×900 and 390×844 render their lobes without early clip-box edges. The CSS fallback is intentionally softer and lower in exposure. Stills do not benchmark smoothness, power use or every GPU.

Actual scoped Claude CLI `claude-opus-5-5` direction and source-review runs informed the implementation; they received public code and observations only, with tools, MCP, hooks and session persistence disabled. They did not inspect private records or establish browser acceptance. Separate rendered-frame review closed the optical findings.

## Desktop Chrome acceptance

Use native computer control in the existing profile and named task group while plugin transport is unavailable. Keep application keyboard, privacy and responsive gates pending until actual observations return. Builds, source review and separately authorized synthetic headless captures do not complete these gates. Do not silently substitute another profile or browser, change permissions, or weaken browser security.

### Observed for this optical revision

The coordinator operated the actual read-only synthetic app at port 4186 in the existing desktop Chrome profile and **⚡ Neonworth QA** group. Native first openings displayed the cover over the requested report; Tab and a cover click dismissed it while preserving the Spending deep link. Reload did not replay. Leaving an active intro tab and returning removed the cover. Completion exposed the page without a remaining hit surface. The first ignition stub was also observed in desktop Chrome; precise early contrast and final composition were assessed from the separately recorded synthetic samples.

Quiet skipped a fresh-tab introduction; restoring Expressive did not replay it. DevTools in that same tab/profile emulated reduced motion and forced colors: the app reported that decorative motion was off, with the workspace still available. Both overrides were removed afterward. These observations verify the live preference response; they are not a claim that a new reduced-motion tab's startup was separately replayed. The startup exclusion also has regression coverage.

Amount hiding replaced financial text with bullets and concealed the chart while controls remained available. The preferences dialog kept Tab/Shift-Tab focus inside, Escape closed it and returned focus to its trigger. Actual 320px and 390px layouts showed separated reporting controls and no sampled header/date collisions. Original visible-amount/Expressive settings were restored; device width was restored to 320px, empty height, and DevTools closed.

Required native keyboard, privacy, motion and responsive observations for this change have returned and passed. Wheel/touch hardware behavior, print output, all GPUs and measured frame-rate/power performance were not separately certified in this native pass. An intentional `connect-src 'none'` rejection of Chrome's own local DevTools discovery probe was observed; the demo CSP was preserved. The injected no-WebGL capture logs its expected initialization error and then uses the CSS fallback. Full-product, hosted authorization and deployment acceptance remain separate.

### Repeatable checks

1. **Fresh opening:** expect two distinct local strikes near 0.18 and 0.58 seconds, then a stable primary lamp and a delayed lower lamp with its own luminous core. Check that the spreading light has curved shoulders, reaches deeper at the centre and falls continuously from pink into violet and darkness. Reject a thin laser line, flat purple rectangle, bright ellipse outline or abrupt cutoff. `NeonWorth` should read as a dark silhouette against received light, without an independent purple glow or raised-letter shadow. At 5.4 seconds the scene begins its slow dissolve into the original report, finishing around 7.6 seconds. No full-screen strobe or forced navigation.
2. **Once:** reload and switch reports in the same tab. Expect no replay. In a fresh empty tab, expect a new first-visit decision.
3. **Skip safely:** during the cover, click where a navigation item would be. Expect only the cover to disappear; the first click must not select an unseen report or save a record. A subsequent deliberate click works normally.
4. **Keyboard and scroll:** press Tab during the reveal. Expect dismissal and native focus progression into the page. Wheel input or the browser taking over a touch pan also dismisses it. After completion, inputs behave normally and no invisible hit target remains.
5. **Preferences:** choose Quiet, then open a fresh tab. Expect no introduction. Re-enabling Expressive in that tab does not replay it. Repeat with system reduced motion and forced colors; printing must exclude the cover.
6. **Interruption:** background the tab or change its motion policy during playback. Expect immediate dismissal and no replay on return. Opening a report in a background tab must not produce a late surprise cover after interaction.
7. **Responsive and privacy:** at 320px and 390px, expect both lamps to continue through the viewport edges, the strong light footprints to retain curvature without becoming tall columns, and the dark title to fit. Check actual horizontal overflow and the transition into the report. After dismissal, check navigation/date-control collisions, dialogs and amount hiding; financial geometry and text remain unchanged.
8. **Fallback and failure:** inspect the CSS fallback separately. It should retain two-dimensional curved spill and the same native skip and motion policies. Record console errors, failed initialization, delayed cover or focus/input interference. A failed or skipped animation must expose an operable page.

Record candidate revision, viewport, motion state, actual observations and remaining limitations using synthetic data only. Coordinator source and visual approval, exact-SHA checks/CI, merge and deployment remain distinct. Keep the candidate off the main deployment path until its required application acceptance gates pass.
