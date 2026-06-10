---
name: planning-depth-gate
description: Use when deciding how much workflow/process a request needs before invoking heavier skills.
---

# Planning Depth Gate

Choose the smallest workflow that controls real risk.

Depth is planning/process depth, not code depth.

## Score

Score each dimension `0-2`:

| Dimension | 0 | 1 | 2 |
| --- | --- | --- | --- |
| `scope` | answer/read-only | 1-2 files or one command | 3+ files, subsystem, broad work |
| `risk` | no security/source/money/trading exposure | local-only credential or bounded security edit | source/license/legal, live data, trading, user money, secret exposure, production credential |
| `unknowns` | known answer or obvious local action | one bounded local unknown | unclear requirements, external docs/API/account state, missing access |
| `blast_radius` | isolated answer/file/command | one feature path or non-shared module | hooks, router, schema/storage, provider, CLI, CI/CD, shared config |
| `reversibility` | no mutation or trivial revert | local file change, easy rollback | external side effect, persistent data/policy/account state, destructive command |

## Depths

- `0`: direct answer or read-only check. No workflow skill, no plan.
- `1`: tiny direct action plus concise verification.
- `2`: small normal change. Short checklist plus focused tests.
- `3`: structured work. Plan, appropriate skills, review, verification.
- `4`: gated risk. State concrete risk and wait for explicit approval before risky action.

## Forced Depth

Force depth `4` for live data, source/license/legal decisions, reading/displaying/committing/moving secrets, production credential changes, trading-adjacent behavior, paid market data, destructive commands, user money, or external side effects that cannot be easily undone.

Force at least depth `3` for hooks, routers, skill activation policy, schemas, storage, providers, CI/CD, release changes, broad refactors, or persistent memory formats.

## Modes

- `fast`: prefer depth `0-1` unless forced risk applies.
- `normal`: use the gate as written.
- `strict`: raise non-trivial work toward depth `3`.
- `caveman`: keep responses terse; depth still applies.
- `audit`: read-only unless user authorizes edits.

Mode cannot suppress a depth `4` approval gate.

## Hook Schema

The deterministic classifier returns:

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
