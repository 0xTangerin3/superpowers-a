# Superpower-A Plan

Date: 2026-06-10

## Objective

Create `superpower-a`: an adaptive Superpowers variant that keeps verification discipline where it matters and removes workflow ceremony where it does not.

The advanced path is not a greenfield rewrite. Start from the useful ideas in `REPOZY/superpowers-optimized`, then replace its coarse `micro / lightweight / full` policy with a more explicit risk-weighted Planning Depth Gate.

Primary change:

```text
Smallest sufficient workflow. Escalate for real risk, not for vague "maybe a skill applies" pressure.
```

## Reference Baseline

Use `REPOZY/superpowers-optimized` as the reference implementation to study and selectively borrow from:

- Repository: `https://github.com/REPOZY/superpowers-optimized`
- Router: `skills/using-superpowers/SKILL.md`
- Prompt hook: `hooks/skill-activator.js`
- Rule table: `hooks/skill-rules.json`
- Tests: `tests/skill-triggering`

Useful features to preserve or adapt:

- 3-tier proportional routing: `micro / lightweight / full`
- micro-task bypass in `skill-activator.js`
- confidence threshold for prompt-to-skill matches
- max 3 suggested skills per prompt
- explicit instruction priority: user conversation, repo instructions, skill defaults
- verification-only fast path for small changes
- `known-issues.md` and `session-log.md` recall, but only when bounded
- test fixtures for prompt routing
- Codex plugin structure and partial Codex hook support

Behaviors to avoid inheriting as-is:

- mandatory router for nearly all technical work
- "when in doubt, full" as the default tie-breaker
- broad memory setup prompt before ordinary work
- recommendation to disable/remove existing `AGENTS.md` or other repo instructions
- routing that treats all new behavior as full without considering reversibility and blast radius
- no explicit source/license/live-data/trading depth

## Problem

Current Superpowers behavior is too heavy for many interactions:

- simple Q&A triggers skill ceremony
- credential/env updates feel over-planned
- status checks and file opens get extra workflow
- plan artifacts can become longer than the task justifies
- repo-specific style can be overridden by plugin ceremony
- `trade-agent` style preference is terse, low-overhead, and caveman-friendly

But full discipline is still valuable for:

- implementation
- debugging
- code review
- security/secrets
- source/license/live data
- trading-adjacent behavior
- storage schemas
- irreversible actions

## Design Decision

Build Superpower-A as an optimized-fork-informed router layer.

Do not remove Superpowers discipline. Put a Planning Depth Gate in front of heavy skill invocation, and make the gate explicit enough to test.

The optimized fork proves the main premise: proportional routing works. Superpower-A should go further by making the routing policy:

- risk-scored, not only complexity-scored
- mode-aware
- repo-instruction preserving
- explicit about high-stakes domains
- testable with prompt fixtures
- quiet by default on low-depth tasks

## Planning Depth Gate

Compute depth from five dimensions:

- `scope`: files/modules touched
- `risk`: security, source/license, money, trading, data leakage, external side effects
- `unknowns`: unclear requirements, external docs/API/account state, blockers
- `blast_radius`: shared schemas, storage, CLI, providers, hooks, routing rules
- `reversibility`: easy revert vs persistent data, policy, account, or user-facing effect

Each dimension is scored `0-2`.

```text
0 = absent or trivial
1 = present but bounded
2 = material risk or unknown
```

Scoring table:

| Dimension | `0` | `1` | `2` |
| --- | --- | --- | --- |
| `scope` | read-only, no files, or answer-only | 1-2 files, single local command, small docs/config edit | 3+ files, new subsystem, broad refactor, multi-phase work |
| `risk` | no security/source/license/money/trading/data exposure | local-only credential or bounded security-sensitive edit with no exposure | source/license/legal, live data, trading, user money, secret exposure, production credential |
| `unknowns` | known answer or obvious local action | one bounded unknown resolved by reading local files/tests | unclear requirements, external docs/API/account state, missing access, uncertain policy |
| `blast_radius` | isolated answer/file/command | one feature path or one non-shared module | hooks, router, skill policy, schema/storage, provider, CLI, CI/CD, shared config |
| `reversibility` | no mutation or trivial revert | local file change, easy rollback | irreversible/external side effect, persistent data/policy/account state, destructive command |

Depth mapping:

| Depth | Name | Use When | Required Workflow |
| --- | --- | --- | --- |
| `0` | direct | Q&A, status, open/list/check, explain known fact | answer or action only; no skill, no plan |
| `1` | tiny | one-step local action, env/key update, one command, typo | direct action plus concise verification |
| `2` | standard | small code/docs change with bounded behavior | short chat checklist, focused tests, verification |
| `3` | structured | multi-step work, shared behavior, routing/hooks, schema, broad debug | structured plan, tests, review, verification |
| `4` | gated | source/license/live data/security/secrets/trading/money/irreversible | full workflow plus explicit human approval before risky step |

Default mapping:

- total score `0`: depth `0`
- total score `1-2`: depth `1`
- total score `3-4`: depth `2`
- total score `5-7`: depth `3`
- total score `8+`: depth `4`

Overrides can only raise depth, except user-selected `fast mode` can lower depth for non-risky tasks. Forced depth `4` always wins over mode shortcuts.

## Trigger Policy

Replace the original rule:

```text
If you think there is even a 1% chance a skill might apply, invoke it.
```

Replace the optimized fork's broad mandatory-router posture:

```text
Invoke using-superpowers before nearly all technical work; when in doubt, full.
```

With:

```text
Run the Planning Depth Gate before invoking heavy skills. Invoke only skills required by the resulting depth and task risk. User instructions and repo AGENTS.md/CLAUDE.md override plugin ceremony unless doing so would create security, data-loss, legal, or high-stakes risk. If a request falls into forced depth `4`, the user may still choose to proceed, but only after the agent states the concrete risk and receives explicit approval for the risky action.
```

## Routing Policy

Depth `0`:

- Do not invoke workflow skills.
- Do not create or update plan files.
- Give a direct answer or run the requested read-only check.

Depth `1`:

- Do not invoke brainstorming/planning.
- Do the action directly.
- Verify only the actual outcome.
- Keep response terse.

Depth `2`:

- Use a short chat checklist only.
- Use TDD/debug/review skills only if directly relevant.
- Run focused tests or equivalent verification.
- Do not create plan docs unless the user asks.

Depth `3`:

- Use structured planning.
- Prefer existing Superpowers skills for debugging, TDD, execution, and review.
- Include owner/reviewer mapping only when useful.
- Run verification before completion.

Depth `4`:

- Use full gated workflow.
- State the risk and requested approval in concrete terms.
- Do not perform live data, licensed-source, money, trading, secret-exposure, production-secret, destructive, or irreversible actions without explicit approval.
- Record durable decisions if memory is enabled.

## Skip List

Default depth `0`, unless an override raises depth:

- simple Q&A
- status check
- open file/folder
- list files
- explain one known fact
- short comment on a plan
- one-command read-only verification
- "did you create X?"
- "what changed?"
- "where is this file?"

Default depth `1`, unless an override raises depth:

- add/update an ignored local `.env` secret without displaying it
- check whether local/non-production endpoint returns 200
- run a single local smoke command
- typo correction
- small docs wording correction
- single-line config update

## Forced Higher Depth

Force at least depth `3` for:

- shared routing rules
- hooks
- skill activation policy
- storage schema or migrations
- broad refactors
- CI/CD/release changes
- cross-module behavior
- production-facing behavior
- persistent memory format changes

Force depth `4` for:

- live data import
- source/license decisions
- API terms/legal rights
- reading, displaying, exfiltrating, committing, or moving secrets
- production secret or credential changes
- security exposure
- trading-adjacent behavior
- paid market data
- licensed article bodies
- destructive commands
- user money or high-stakes decisions
- external side effects that cannot be easily undone

## Modes

Add user-selectable modes:

- `fast mode`: prefer depth `0-1`; raise only for forced-risk cases.
- `normal mode`: use the Planning Depth Gate.
- `strict mode`: closer to original Superpowers / optimized-fork full discipline.
- `caveman mode`: terse responses; depth gate still applies.
- `audit mode`: read-only unless user explicitly authorizes edits.

Mode precedence:

1. Forced risk overrides for depth `4` approval gates
2. Direct user instruction in the current conversation
3. Repo instructions: `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, local plugin config
4. Selected Superpower-A mode
5. Superpower-A defaults

Mode cannot suppress a depth `4` approval gate. User instructions can authorize the action only after the risk is named.

Important: unlike `superpowers-optimized`, do not recommend disabling repo instructions. Superpower-A must coexist with repo-local rules.

## Architecture

Use three layers.

### Layer 1: Prompt Gate

Adapt the optimized fork's `hooks/skill-activator.js`.

Required changes:

- classify prompt into depth `0-4`
- keep confidence threshold for skill suggestions
- keep max 3 suggestions
- add skip-list detection beyond typo-style micro-tasks
- add forced-risk keyword/regex patterns
- return no extra context for depth `0`
- return concise verification hint for depth `1`
- return risk/depth context for depth `3-4`
- emit a deterministic JSON object before any prose context

Prompt gate output schema:

```json
{
  "depth": 0,
  "mode": "normal",
  "scores": {
    "scope": 0,
    "risk": 0,
    "unknowns": 0,
    "blast_radius": 0,
    "reversibility": 0
  },
  "forcedReasons": [],
  "suggestedSkills": [],
  "approvalRequired": false,
  "additionalContext": ""
}
```

Schema rules:

- `depth`: integer `0-4`
- `mode`: one of `fast`, `normal`, `strict`, `caveman`, `audit`
- `scores`: all five dimensions, each integer `0-2`
- `forcedReasons`: concise strings naming any depth override
- `suggestedSkills`: max 3 skill names after confidence filtering
- `approvalRequired`: `true` only for depth `4`
- `additionalContext`: empty for depth `0`; under 500 characters for depth `1-2`; under 1200 characters for depth `3-4`

### Layer 2: Router Skill

Patch `skills/using-superpowers/SKILL.md`.

Required changes:

- remove "1% chance" eager rule
- remove "do not skip even if simple" language
- replace 3-tier classifier with Planning Depth Gate
- add modes
- add skip list and forced-depth list
- preserve explicit user and repo instruction priority
- route to existing skills by depth
- keep verification-before-completion mandatory for implementation claims

### Layer 3: Tests And Fixtures

Create fixture-driven tests for prompt classification and routing hints.

Required fixtures:

- depth examples from this plan
- optimized-fork compatibility examples
- false-positive examples where no skill should trigger
- forced-depth examples
- mode override examples

## Files To Create Or Patch

Implementation source:

- Primary source: fork or vendor `REPOZY/superpowers-optimized`.
- Fallback source: copy from installed Superpowers only if the optimized fork cannot be fetched or imported cleanly.
- Port selected router/hook/test ideas, but keep Superpower-A policy separate and explicit.
- Record reused/adapted/rejected pieces in `docs/reference-audit.md`.

Files:

- `skills/using-superpowers/SKILL.md`
  - replace eager trigger rule
  - add Planning Depth Gate
  - add mode precedence
  - add skip and forced-depth lists
  - remove broad memory/setup blocking prompts

- `skills/planning-depth-gate/SKILL.md`
  - new small policy skill
  - define scoring, overrides, modes, and examples
  - must be short enough to load cheaply

- `hooks/planning-depth-gate.js`
  - standalone classifier usable by hooks and tests
  - no network access
  - deterministic JSON output

- `hooks/skill-activator.js`
  - adapt optimized-fork confidence threshold and max-suggestion logic
  - consume planning-depth-gate result
  - suppress hints for depth `0`

- `hooks/skill-rules.json`
  - keep keyword/regex rule table
  - add risk metadata where relevant

- `tests/fixtures/planning-depth/*.json`
  - prompt, mode, expected depth, expected skills, expected rationale

- `tests/test_planning_depth_gate.*`
  - validate classifier
  - validate skill hint suppression
  - validate forced-depth overrides

- `README.md`
  - explain adaptive discipline
  - compare to original Superpowers and `superpowers-optimized`
  - document modes

## Example Depth Fixtures

Depth `0`:

- `What does this pasted error mean?`
- `Did you create .env?`
- `Can you open this file?`
- `Comment on whether this tool helps.`
- `What changed in the plan?`

Depth `1`:

- `Add this API key to ignored local .env without printing it.`
- `Check whether local endpoint returns 200.`
- `List docs referencing ACLED.`
- `Fix the typo on line 42.`

Depth `2`:

- `Patch one docs file with this decision.`
- `Add a small CLI flag with tests.`
- `Fix one bug with known cause.`
- `Update one hook message without changing behavior.`

Depth `3`:

- `Implement Phase 15 adapter interfaces.`
- `Add DuckDB/PIT storage foundation.`
- `Build coverage report gate.`
- `Change skill routing behavior.`
- `Patch the prompt hook classifier.`

Depth `4`:

- `Enable live licensed Reuters ingest.`
- `Store licensed article bodies.`
- `Run real backtest using paid market data.`
- `Change trading recommendation behavior.`
- `Move production API keys.`
- `Show me the production API key.`

Optimized-fork compatibility fixtures:

- `fix the typo on line 42` -> depth `1`, no heavy skill
- `rename foo to bar` -> depth `1`, no heavy skill
- `review my code before merge` -> depth `3`, review skill
- `write tests for this bug` -> depth `2` or `3`, TDD skill
- `build secure user authentication` -> depth `3` or `4` depending on auth/secrets scope

False-positive fixtures:

- `review this plan quickly` -> depth `0`, no code-review skill
- `what is a worktree?` -> depth `0`, no worktree skill
- `is this repo using tests?` -> depth `0` or `1`, no TDD workflow

Boundary fixtures:

- `What does this pasted error mean?` -> depth `0`
- `Investigate this failing test in the repo` -> depth `2` or `3`
- `Check whether local endpoint returns 200` -> depth `1`
- `Check whether production auth endpoint accepts real credentials` -> depth `4`
- `Add this key to ignored local .env without printing it` -> depth `1`
- `Print the key from .env` -> depth `4`

## Acceptance Criteria

- Simple Q&A does not trigger heavy skill workflow.
- Status/open/list/check requests do not create plan artifacts.
- Credential/env update produces direct action plus verification only.
- Normal code edits still require tests or equivalent verification.
- High-risk source/license/live-data tasks force depth `4` and human approval.
- Trading-adjacent tasks force depth `4`.
- User modes are honored.
- Repo `AGENTS.md`/`CLAUDE.md` instructions are preserved.
- Response length reduces for low-depth tasks.
- Verification-before-completion remains mandatory for implementation claims.
- Hook output is empty for depth `0`.
- Hook output is bounded for depth `1-2`.
- Hook output includes explicit risk reason for depth `3-4`.
- Depth `4` approval gates cannot be bypassed by mode.
- Local ignored `.env` writes can be depth `1`; reading/displaying/committing/moving secrets is depth `4`.

## Verification Plan

Run classifier tests:

```bash
node tests/test_planning_depth_gate.js
```

Run hook tests:

```bash
node tests/test_skill_activator.js
```

If the project uses Python instead:

```bash
pytest -q
```

Manual inspection checks:

- no remaining "1% chance" eager trigger language
- no remaining "do not skip even if simple" language
- no blanket "when in doubt, full" default
- no recommendation to disable `AGENTS.md`
- depth `0` examples produce no skill hint
- depth `4` examples produce approval gate

Smoke table:

| Prompt | Expected |
| --- | --- |
| `did you create .env?` | depth `0` |
| `add this FRED key to ignored local .env without printing it` | depth `1` |
| `fix this failing unit test` | depth `2` or `3` |
| `implement Phase 15 fake adapters` | depth `3` |
| `enable live Reuters full text` | depth `4` |
| `review this plan quickly` | depth `0` |
| `review my code before merge` | depth `3` |

## Implementation Phases

Phase 0: Reference Audit

- Inspect `REPOZY/superpowers-optimized` router, hook, rule table, tests, plugin manifests.
- Copy no code blindly.
- Record which pieces are reused, adapted, or rejected.

Phase 1: Classifier

- Implement deterministic Planning Depth Gate.
- Add fixtures first.
- Return JSON matching the Prompt Gate output schema.

Phase 2: Router Skill

- Patch `using-superpowers`.
- Keep it concise.
- Make depth policy the first decision point.

Phase 3: Hook Integration

- Adapt `skill-activator.js`.
- Suppress low-depth context injection.
- Add bounded risk context for high-depth prompts.

Phase 4: Memory And Context Policy

- Keep `known-issues.md` and `session-log.md` support optional.
- No blocking memory setup prompt for ordinary work.
- Do not auto-create memory files unless user asks or strict mode requires it.
- Recall memory only for depth `2+` by default.
- Inject at most 2 memory entries.
- Cap each memory entry at 1000 characters.
- Cap total memory context at 1800 characters.
- Never recall memory for depth `0` unless the user explicitly asks for history.

Phase 5: Tests

- Add planning-depth fixtures.
- Add optimized-fork compatibility cases.
- Add false-positive tests.
- Add mode override tests.

Phase 6: Docs

- Update README.
- Document differences from original Superpowers and `superpowers-optimized`.
- Include mode examples and risk examples.

## Non-Goals

- Do not remove TDD/debug/review discipline.
- Do not weaken high-risk safety gates.
- Do not make a trading or market-data source decision.
- Do not install hooks globally by default.
- Do not depend on `trade-agent`.
- Do not force memory setup for every project.
- Do not disable or override repo-local instruction files.

## Suggested First Prompt For Implementation Session

```text
Read SUPERPOWER_A_PLAN.md. Build Superpower-A by adapting the useful router/hook/test ideas from REPOZY/superpowers-optimized, but implement the 0-4 Planning Depth Gate, modes, repo-instruction precedence, and high-risk source/license/trading gates from this plan. Keep changes minimal and testable.
```

## Source Notes

Installed Superpowers source on this machine:

```text
/home/ubuntu/.codex/plugins/cache/openai-curated/superpowers/c6ea566d/skills
```

Relevant original file:

```text
/home/ubuntu/.codex/plugins/cache/openai-curated/superpowers/c6ea566d/skills/using-superpowers/SKILL.md
```

Reference optimized fork:

```text
https://github.com/REPOZY/superpowers-optimized
https://raw.githubusercontent.com/REPOZY/superpowers-optimized/main/skills/using-superpowers/SKILL.md
https://raw.githubusercontent.com/REPOZY/superpowers-optimized/main/hooks/skill-activator.js
https://raw.githubusercontent.com/REPOZY/superpowers-optimized/main/hooks/skill-rules.json
```
