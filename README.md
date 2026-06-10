# Superpower-A

Adaptive workflow routing for Codex-style Superpowers.

Superpower-A helps an AI coding agent choose the smallest useful workflow for each request. It keeps simple questions and one-command checks lightweight, while preserving explicit review, verification, and human approval for work that carries real risk.

## Why This Exists

Not every technical request needs the same ceremony.

Opening a file, answering a question, or fixing a tiny typo should stay fast. Changing hooks, touching routing policy, exposing secrets, making a repo public, or altering production-adjacent behavior should slow down and get deliberate.

Superpower-A puts a tested Planning Depth Gate in front of heavier workflow skills so the agent can route by risk instead of habit.

## What It Does

Each prompt is classified into depth `0-4`:

| Depth | Meaning | Agent behavior |
| --- | --- | --- |
| `0` | Direct | Answer or run a read-only check. No plan, no workflow ceremony. |
| `1` | Tiny | Do the small action and verify the outcome. |
| `2` | Standard | Use a short checklist and focused tests or equivalent verification. |
| `3` | Structured | Plan, use appropriate skills, review, and verify before completion. |
| `4` | Gated | State the concrete risk and wait for explicit approval before the risky action. |

The gate scores five practical dimensions:

- scope
- risk
- unknowns
- blast radius
- reversibility

## Highlights

- Deterministic depth classification with fixture tests.
- Explicit forced gates for secrets, source/license/legal issues, live data, trading or money-adjacent work, destructive actions, and other hard-to-reverse external effects.
- Mode-aware routing: `fast`, `normal`, `strict`, `caveman`, and `audit`.
- Repo instructions such as `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md` stay ahead of plugin ceremony unless safety requires escalation.
- Hook output is compact and machine-readable.

## Repository Layout

| Path | Purpose |
| --- | --- |
| `hooks/planning-depth-gate.js` | Deterministic prompt classifier. |
| `hooks/skill-activator.js` | Hook response builder for adaptive routing context. |
| `hooks/skill-rules.json` | Skill matching rules used by the classifier. |
| `skills/planning-depth-gate/SKILL.md` | Human-readable Planning Depth Gate policy. |
| `skills/using-superpowers/SKILL.md` | Router instructions for applying the gate. |
| `tests/` | Fixture-backed tests for classification and hook output. |

## Quick Start

Install dependencies if needed:

```bash
npm install
```

Run the test suite:

```bash
npm test
```

Try the classifier directly:

```bash
node hooks/planning-depth-gate.js "review this plan quickly"
node hooks/planning-depth-gate.js "Show me the production API key"
```

The second example is intentionally risky: depth `4` requires explicit approval before any sensitive action.

## Example Output

```json
{
  "depth": 2,
  "mode": "normal",
  "scores": {
    "scope": 1,
    "risk": 0,
    "unknowns": 1,
    "blast_radius": 0,
    "reversibility": 1
  },
  "approvalRequired": false
}
```

## Design Principle

Use the smallest workflow that controls the real risk.

Superpower-A is not anti-process. It is anti-automatic-overhead. The goal is to keep momentum on low-risk work and reserve heavier process for changes where it genuinely protects the codebase, the user, or the account.

## Attribution

Thanks to [`obra/superpowers`](https://github.com/obra/superpowers) for the original Superpowers framework and software development methodology this project builds on.

Superpower-A also acknowledges the proportional-routing ideas explored in [`REPOZY/superpowers-optimized`](https://github.com/REPOZY/superpowers-optimized).

## License

MIT, as declared in `package.json`.
