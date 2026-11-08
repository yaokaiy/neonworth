# Neonworth design principles

Neonworth is a personal finance workspace with a distinct artistic identity. Its neon atmosphere should feel considered and memorable. Judge composition, light, depth and pacing together; utility alone is not the visual brief.

## Light and shadow

The opening is led by the overhead lamp, with a much weaker, recessed echo near the bottom. Compose illumination at the scale of the page: a clean core, natural bloom and a diminishing field, with dark space between the two sources. The lower echo supports the composition without becoming an equally bright frame. **NeonWorth** remains barely visible in that shadow, with only a faint upper rim. Low-contrast or partly occluded decorative brand type is intentional; it need not behave like a report heading or financial table.

Preserve clear light and controlled falloff. A broad purple fog, stretched blur or glowing title would erase the depth this scene needs. Judge the secondary light's displayed brightness, not only its shader input: tone mapping must not turn a weak echo into a second dominant lamp.

Color roles provide a shared vocabulary, not a checklist of hues. A focused violet/pink scene can carry the whole composition. Keep semantic status colors and their words/icons distinct from decorative lighting; no component needs to display the entire palette.

## Deliberate motion

Allow generous, finite opening choreography: two localized ignition strikes, a sustained atmosphere and a slow fade into the selected workspace view. The strikes belong to the lamp's core and nearby halo; the wider room illumination settles smoothly. Choose timing for the scene's rhythm instead of imposing a tiny universal transition budget. This latitude does not authorize full-screen flashes, repeated surprise covers or delayed financial loading.

The launch remains once per tab session, immediately skippable through native controls, and excluded by Quiet and reduced-motion preferences. Preserve the existing visibility, forced-color, print and failure behavior. Loading and rendering reports proceed independently. Animate the isolated artwork, never financial values, chart geometry, the workspace shell or ancestors of dialogs. Existing background motion keeps its own pause and lifecycle policy.

## Financial clarity

Amounts, dates, controls, evidence and status meanings remain readable and stable. Artistic shadow must not obscure a financial decision, a review requirement or the way to dismiss the opening. Preserve amounts-only privacy, source uncertainty, keyboard behavior and responsive controls. Apply financial readability requirements to information people must use, without flattening decorative artwork into the same visual treatment.

## Implementation and review

Reuse Motion for the finite clock and native browser behavior for controls. The original analytic light field uses OGL with a CSS fallback, keeping rendering separate from timing and application state. Retain dependency licenses; public inspiration does not authorize redistribution of React Bits Pro source. No visual treatment changes credentials, saved data, accounting rules or deployment authority.

Evaluate the full opening and its transition into the actual workspace at desktop and narrow widths. Source and terminal checks do not establish artistic appearance or browser acceptance. The [launch guide](LAUNCH_INTRO.md) records implementation details and the remaining desktop checks.
