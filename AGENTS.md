# Working on Neonworth

Neonworth is an open-source, single-user personal finance workspace. It imports snapshots; it never connects to bank or brokerage credentials.

- Keep source evidence, derived interpretations and saved corrections separate. Preserve amounts, date scopes, unknown coverage and optimistic-concurrency safeguards.
- Personal merchant exceptions, employers, budgets and planning assumptions do not belong in shared defaults. Document policy options in `lib/finance-config.ts` and test both default and optional behavior.
- Use synthetic data in source, tests, screenshots and issues. Never commit real financial exports, credentials, deployment IDs or local databases.
- Authentication must protect every hosted UI, API and MCP route. One deployment belongs to one owner; this is not a multi-tenant application.
- The separate public demo bundles invented data only. It must never import user records, contact a financial backend, or weaken the authenticated application's boundary.
- Follow the [Neonworth design principles](docs/NEON_DESIGN.md). Atmospheric artwork and expressive opening choreography are part of this personal workspace: decorative brand type may be low-contrast or partly obscured, and a generous finite reveal may end with a slow fade. Keep financial figures, controls and status meanings readable and stable; do not apply table contrast or tiny interaction-duration budgets to every artistic element.
- Preserve Quiet/reduced-motion behavior, once-per-document launch playback on full opens/reloads, without replay on internal navigation or tab return and native skipping. Keep financial loading independent; never animate financial values, chart geometry or workspace/dialog ancestors.
- Use the pinned toolchain. Run regression, type, credential-scan and build checks for releases. Record browser verification separately from terminal checks.
- Prefer bounded changes and mature installed components. Do not replace financial rules with visual shortcuts or hide unresolved accounting issues.
- For new animated interactions, reuse installed Motion APIs and native browser controls before adding custom playback, presence or gesture machinery. Measure the emitted bundle cost and preserve the shared motion/privacy policies.
