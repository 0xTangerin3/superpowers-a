---
name: using-superpowers
description: Adaptive Superpower-A router. Use for technical work after running the Planning Depth Gate; skip heavy workflow for depth 0-1 tasks.
---

# Using Superpower-A

Before invoking heavy workflow skills, classify the request with the Planning Depth Gate.

## Priority

1. Forced depth `4` approval gates
2. Direct user instruction in the current conversation
3. Repo instructions: `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, local plugin config
4. Selected Superpower-A mode
5. Superpower-A defaults

Repo-local instruction files are preserved. Do not recommend disabling them.

## Routing

Depth `0`:

- Answer directly or run the requested read-only check.
- Do not invoke workflow skills.
- Do not create plan artifacts.

Depth `1`:

- Act directly.
- Do not invoke brainstorming or planning.
- Verify only the requested outcome.
- Keep the response terse.

Depth `2`:

- Use a short chat checklist.
- Invoke TDD/debug/review skills only when directly relevant.
- Run focused tests or equivalent verification.

Depth `3`:

- Use structured planning.
- Route to appropriate existing skills for debugging, TDD, execution, and review.
- Verify before claiming completion.

Depth `4`:

- State the concrete risk.
- Ask for explicit approval before the risky action.
- Do not perform live data, licensed-source, money, trading, secret-exposure, production-secret, destructive, or irreversible actions without approval.

## Skip Cases

Default depth `0`: simple Q&A, status check, open/list/check, explain known fact, "did you create X?", "what changed?", "where is this file?"

Default depth `1`: write an ignored local `.env` secret without displaying it, local endpoint status check, single local smoke command, typo correction, small docs wording correction, single-line config update.

## Forced Risk

Depth `4` always wins over modes. Local ignored `.env` writes can be depth `1`; reading, displaying, exfiltrating, committing, or moving secrets is depth `4`.

## Verification

Verification-before-completion remains mandatory before any implementation success claim.
