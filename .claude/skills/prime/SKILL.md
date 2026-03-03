---
name: prime
description: Orient session at startup — read key files, check git history, run tsc, report current phase.
---

Run this at the START of every new session before any work begins.

## Steps

1. **Explore codebase structure**
   - Read `CLAUDE.md` (global rules, tech stack, conventions)
   - Read `ARCHITECTURE.md` (system overview, data flow, API map)
   - Read `IMPLEMENTATION_PLAN.md` (phases, current status, backlog)

2. **Check recent git history** (long-term memory)
   ```bash
   git log --oneline -20
   ```

3. **Check current working state**
   ```bash
   npx tsc --noEmit 2>&1 | tail -20   # Type errors?
   ```

4. **Identify current phase**
   - Look at the "In Progress / Next" section of IMPLEMENTATION_PLAN.md
   - Note what's completed vs what's next

5. **Load on-demand context** (only what's relevant to the current phase)
   - Working on UI? Read `docs/frontend-components.md`
   - Working on API routes? Read `docs/api-endpoints.md`
   - Working on DB? Read `docs/database-schema.md`

6. **Output a short understanding report:**
   ```
   ## Session Prime Report
   - Current phase: [phase name]
   - Next task: [specific task]
   - Any blockers: [type errors, missing env vars, etc.]
   - Loaded context: [which docs were read]
   - Ready to: [/plan-feature <feature> | /execute <plan-file>]
   ```

## Key Files to Always Read
- `CLAUDE.md` — rules, stack, patterns (load every session)
- `IMPLEMENTATION_PLAN.md` — what phase we're in
- `ARCHITECTURE.md` — load when touching API/DB/structure
