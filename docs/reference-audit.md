# Reference Audit

Date: 2026-06-10

Reference: `REPOZY/superpowers-optimized`

## Reused Ideas

- Proportional routing instead of one-size workflow.
- Micro-task bypass for low-risk prompts.
- Confidence threshold for prompt-to-skill matching.
- Cap skill suggestions at three.
- Keep prompt matching in a rule table.
- Treat verification as the only required gate for small direct work.
- Use fixture tests for routing behavior.

## Adapted Ideas

- Replaced `micro / lightweight / full` with depth `0-4`.
- Replaced broad "mandatory router" language with risk-scored routing.
- Preserved repo instruction precedence instead of recommending removal of `AGENTS.md`.
- Made memory optional and bounded rather than always-on.
- Added source/license/live-data/trading/secret forced-risk gates.
- Added explicit JSON schema for hook output.

## Rejected Behaviors

- "When in doubt, full" as the default tie-breaker.
- Blocking memory setup prompt before ordinary work.
- Skill ceremony for simple Q&A, status checks, file opens, and plan comments.
- Disabling existing repo-local instruction files.

## Local Implementation

- `hooks/planning-depth-gate.js`: deterministic classifier and skill matcher.
- `hooks/skill-activator.js`: hook response builder, suppresses depth `0`.
- `hooks/skill-rules.json`: bounded keyword/regex skill rules.
- `tests/fixtures/planning-depth/*.json`: depth, boundary, and mode fixtures.
