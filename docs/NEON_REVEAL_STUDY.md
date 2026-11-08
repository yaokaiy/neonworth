# Neon reveal reference study

## Observation before implementation

The coordinator inspected the public [Neon Reveal preview](https://pro.reactbits.dev/docs/components/neon-reveal) in the existing desktop Chrome profile using native computer control on 2026-11-08. The task tab belongs to **⚡ Neonworth**. The plugin browser-access host remains unavailable; native Chrome reading, named grouping and harmless interactions work. This is a working native fallback, not a claim that the plugin transport was repaired.

The public default, a five-second slowed replay and mirrored lighting were observed. Only public preview controls were used; no paid shader/component source was extracted. Public documentation describes independent tube colour, spill colour, thickness, glow, reach and feather controls. The visible animation, rather than these names alone, determines this brief.

| Observed feature | Required visual result | Failure in candidate `f7fa0e3` |
| --- | --- | --- |
| Straight lamp, rounded spill | Curved, bowl-like illumination below a straight tube: deeper in the centre, shallower at the sides | Near-uniform horizontal field reads as a vertical gradient |
| Bright pink-white core | A substantial luminous tube, about the reference's documented 3 CSS pixels, surrounded by several scales of glow | Approximately one-pixel core reads as a thin laser line |
| Pink into violet into darkness | A bright near field and a long continuous chromatic shoulder; no visible cutoff or flat purple rectangle | Weak broad-field gain and short local halo leave most of the scene unlit |
| Expanding ignition | A small bright segment stutters, then both the lit length and its curved light footprint grow together | Lamp growth and room growth do not convincingly share a footprint |
| Dark lettering inside light | The title is a dark silhouette against received light, with restrained edge detail | Independently coloured bevel-like lettering sits over an almost-black field |
| Mirrored option | Both lamps have clear luminous cores and their own inward-facing light lobes | Multiplying the entire lower source by 0.18 turns it into a nearly invisible hairline |

These are visual observations, not recovered shader equations or measured reference frame timings. Two startup strikes, the 7.6-second total duration and the 2.2-second final dissolve are Neonworth's existing authored choices. No exact reference flicker count is asserted.

## Coordinator direction

Keep installed **OGL** for rendering and **Motion** for the finite clock. Rebuild the original optical model around a layered, anisotropic elliptical light footprint; increasing the old line model's gain is insufficient. Separate the tube core, near bloom, broad coloured lobe and long low-energy tail. Their contributions must decay smoothly into the same dark room. No bright contour stroke may outline the ellipse.

Use viewport-edge lamps instead of treating the old 18%/88% positions as a principle. Both lamps need visible cores; control their broad-field reach/strength separately to retain depth around the title. Keep the title dark and remove the exaggerated raised-letter treatment. Full-width continuation, finite playback, native skipping, lazy session policy, bounded rendering and financial-loading independence remain required.

The CSS fallback must use a two-dimensional elliptical footprint too. It may simplify optics, but should not revert to the rejected linear wash. A real rendered result must be compared with the observations above before aesthetic approval. Passing lifecycle tests alone does not satisfy this comparison.

## Workflow and gates

1. **Research checkpoint:** commit this study and the task record before implementation. The old candidate's technical checks remain historical evidence; its appearance was rejected and is not the new visual baseline.
2. **Optical renderer:** bounded ownership of `app/neon-light-field.ts`; preserve its lifecycle/resource API and installed dependencies. Produce the new original field and explain its spatial/exposure choices.
3. **Scene composition:** bounded ownership of `app/launch-intro.css`; align lamp positions, dark lettering and approximate fallback with the study. Coordinate any DOM/API needs with the root agent.
4. **Independent challenge:** inspect the new model against this brief, exercise existing lifecycle checks, and run a bounded actual Claude CLI review where useful. Record actual model/output; do not label a failed invocation as review.
5. **Coordinator integration:** resolve API/CSS mismatches, inspect actual development frames, and perform native Chrome checks in the named task group. Reject a remaining horizontal band, dim hairline, hard light cutoff, blown-out title or stretched mobile light footprint.
6. **Source checkpoint:** update the changelog/task states and commit the reviewed candidate. Run exact-SHA regressions, types, secret scanning, audit and Worker/Sites/demo builds; require CI before merging or publication. Preserve the existing private instance, records and schedule.

Reference research, implementation, sampled visual inspection, desktop interaction, merge and deployment are separate states. Native control availability alone does not complete the application acceptance checks.
