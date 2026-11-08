# Neonworth design principles

Neonworth is a personal finance workspace with a distinct artistic identity. Its neon atmosphere should feel considered and memorable. Judge composition, light, depth and pacing together; utility alone is not the visual brief. The [reference study](NEON_REVEAL_STUDY.md) records the observed optical qualities behind the current opening.

## Light and shadow

Compose illumination at the scale of the viewport. Both edge lamps need convincing luminous cores, approximately three CSS pixels thick, with concentrated bloom around them. Establish the relationship between the lamps through the strength and reach of their inward-facing light fields, rather than making the entire lower lamp almost invisible.

The tube remains straight. Curvature belongs to the light it casts: a layered elliptical footprint reaches deeper in the centre and retreats at the sides. Bright pink near the lamp should pass continuously through violet into a low-energy tail and the dark room. The field may be broad and intense; judge its shape and falloff rather than imposing the previous candidate's darkness. A flat purple fill, hard reveal cutoff or bright outline around the ellipse loses depth. At narrow widths, the strong footprint must not stretch into a tall column merely because the viewport is portrait.

**NeonWorth** is a flat, dark silhouette seen against received light. It should not appear as an independently glowing purple label or raised plastic lettering. A faint edge is acceptable when it supports the illumination; the title's presence comes primarily from the light behind it. Low-contrast or partly obscured decorative brand type is intentional and need not behave like a report heading or financial table.

Color roles provide a shared vocabulary, not a checklist of hues. A focused violet/pink scene can carry the whole composition. Keep semantic status colors and their words/icons distinct from decorative lighting; no component needs to display the entire palette.

## Deliberate motion

Allow generous, finite opening choreography: two localized ignition strikes, a growing light footprint, a sustained atmosphere and a slow fade into the selected workspace view. The strikes belong to the lamp's core and nearby halo; the wider field settles smoothly as the lit length expands. Choose timing for the scene's rhythm instead of imposing a tiny universal transition budget. This latitude does not authorize full-screen flashes, repeated surprise covers or delayed financial loading.

The launch remains once per tab session, immediately skippable through native controls, and excluded by Quiet and reduced-motion preferences. Preserve the existing visibility, forced-color, print and failure behavior. Loading and rendering reports proceed independently. Animate the isolated artwork, never financial values, chart geometry, the workspace shell or ancestors of dialogs. Existing background motion keeps its own pause and lifecycle policy.

## Financial clarity

Amounts, dates, controls, evidence and status meanings remain readable and stable. Artistic shadow must not obscure a financial decision, a review requirement or the way to dismiss the opening. Preserve amounts-only privacy, source uncertainty, keyboard behavior and responsive controls. Apply financial readability requirements to information people must use, without flattening decorative artwork into the same visual treatment.

## Implementation and review

Reuse Motion for the finite clock and native browser behavior for controls. The original layered elliptical light field uses OGL with a two-dimensional CSS fallback, keeping rendering separate from timing and application state. Retain dependency licenses; public inspiration does not authorize redistribution of React Bits Pro source. No visual treatment changes credentials, saved data, accounting rules or deployment authority.

Observe the actual reference before defining optical work, then compare the full new opening and its transition into the workspace at desktop and narrow widths. Source and terminal checks do not establish artistic appearance or browser acceptance. Earlier sampled approval does not override the user's rejection of an appearance. The [launch guide](LAUNCH_INTRO.md) records implementation details, available native Chrome control and the separate acceptance gates.
