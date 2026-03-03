# /commit — Standardized Commit Command

Creates a structured commit that serves as long-term memory for future `/prime` sessions.

## Commit Message Format

```
[PHASE-N] feat/fix/refactor: Short description (under 60 chars)

What was built:
- Bullet 1
- Bullet 2

Files changed:
- path/to/file.tsx — description
- path/to/route.ts — description

Validation:
- tsc: PASS
- E2E: PASS (tests/e2e/<script>.sh)
- Manual: [brief description of what was tested]

Phase status: [In Progress | Complete]
Next: [what comes next]
```

## Steps

1. Run pre-commit checks:
   ```bash
   npx tsc --noEmit
   npm run lint
   ```

2. Stage relevant files (never use `git add -A` blindly):
   ```bash
   git add <specific files>
   ```

3. Review what's staged:
   ```bash
   git diff --staged
   ```

4. Create commit using the format above

5. Update `IMPLEMENTATION_PLAN.md` — mark completed tasks with ✅

## Phase Tags
- `[PHASE-6]` — Advanced Filtering
- `[PHASE-7]` — Dashboard Enhancement
- `[CHORE]` — Scaffolding, tooling, docs
- `[FIX]` — Bug fix outside a phase
- `[E2E]` — Test-only changes
