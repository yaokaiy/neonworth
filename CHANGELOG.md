# Changelog

## Unreleased

- Clarified refresh history semantics in the task prompt, workflow, collection guide and returned contract: valid source revisions replace overlapping net-worth observations, omitted dates remain, and MAX chart points take precedence. Added a production-merge regression for revised/retained/new dates, both source layouts, stable replay and unchanged inputs. The merge algorithm and validation rules are unchanged.
- Documented saving and reading back actual scheduler model/effort settings, keeping model choice configurable, and repairing existing copied task instructions in place. Repository or plugin updates do not automatically update saved cloud tasks.

- Corrected the opening lifecycle to make a new decision on each full page open/reload and keep the workspace concealed and isolated until completion or skip. A first-paint document gate replaces the persisted seen flag; internal report navigation and tab return do not replay it. Quiet/reduced-motion and bounded failure recovery remain part of the contract. Reviewed application checkpoint `0383b1a` and PR #4 have passing local checks and bounded native Chrome evidence; exact CI and Pages publication remain separate gates recorded in `docs/TASKS.md` and the PR release receipt.

- Made pinned secret-scanner downloads resilient to release-endpoint failures with bounded retries and a separately pinned official GitHub Assets API fallback. Every downloaded or cached archive still requires its original SHA256; operational failures identify their safe stage/status without printing response content or credentials.
- Reworked the opening after observing the public reference in desktop Chrome: two bright pink-white edge lamps cast layered elliptical pink/violet light around a flat, dark NeonWorth title. Width-bounded light depths retain their shape on phones. Corrected early spill seams, visible ignition contrast and CSS fallback gradient validity/clipping; sampled rendering and native Chrome application checks are recorded separately.
- Added an atmospheric, once-per-session NeonWorth opening with two localized ignition strikes. An original OGL light field supplies the light while Motion drives the 7.6-second sequence and its final 2.2-second fade, with a softer CSS fallback. Native skipping and Quiet/reduced-motion support remain available while financial data loads independently.
- Documented flexible neon design principles that give original artwork room for focused color, shadow and deliberate pacing while preserving readable financial information and stable controls.
- Refined the project introduction around its cyberpunk neon design, Matrix-inspired binary rain and personal finance workflows; clarified the demo and ChatGPT entry points.

## 0.2.0-alpha.1

- Added a separate owner-private ChatGPT Sites runtime and build profile, sanitized instance export/setup, and native-hosting instructions without changing standalone Access authentication.
- Added a GPT Finance collection contract and deterministic initial/refresh/readback harness around the existing financial models, storage and MCP operations.
- Added atomic first-import protection and high-confidence source salary/interest normalization without employer assumptions.
- Added setup, refresh, upgrade and recovery prompts, a routed skill, an instructions-only plugin and a repository plugin catalog.
- Added private Site HTTP verification and saved-record hash comparisons; code publication, financial refresh and scheduling remain distinct operations.
- Routed Sites-built JavaScript and CSS through the private Worker response boundary, with artifact checks for initial and lazy-loaded chunks.

## 0.1.0-alpha.2

- Put spending, budgets and financial goals first in the README and package description, with deployment instructions kept in the technical guide.
- Added CI, MIT license and alpha status badges to the README.
- Added a separate read-only GitHub Pages demo that reuses the real interface with synthetic records, isolated transport and subdirectory-safe links.
- Added opt-in demo publication after CI checks, plus concise bug report and pull request templates.
- Generalized remaining deployment-specific UI references and made optional spending-policy descriptions accurate for ordinary datasets.
- Added actual synthetic Overview and Spending screenshots and a direct demo link to the README.
- Rebuilt public Git history from the audited current source and withdrew the earlier prerelease distribution.

## 0.1.0-alpha.1

- Introduced Neonworth as an open-source, single-user finance workspace under the MIT license.
- Retained the neon interface, reports, transaction review, budget, planning, FIRE and year-review features.
- Replaced personal accounting assumptions with explicit general defaults and configurable policies.
- Added owner authentication, a synthetic local demo and public development documentation.
- Removed private deployment bindings, personal case records and private operational history from the distribution.
- Added a generated dataset schema, canonical source validator, offline CSV adapter, API/extension contracts and a portable AI integration skill.
- Validation: 80 regression suites, types, schema/skill checks, source scanning and a fail-closed production build passed.
- Browser and hosted deployment acceptance are tracked separately in `docs/RELEASE_STATUS.md`.
