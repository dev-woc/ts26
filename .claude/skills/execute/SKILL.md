---
name: execute
description: Implement a feature from a structured plan file. Pass the plan path as the argument.
---

Usage: `/execute docs/plans/<feature-name>.md`

Implements a feature from a structured plan. Always start a FRESH session with ONLY the plan file.

## Steps

1. **Read the plan**
   - Read the specified plan file completely
   - Read each file listed in "Context References"
   - Do NOT read other files until needed

2. **Implement in order**
   Follow the task list in the plan exactly:
   1. DB schema change → run migration
   2. API routes
   3. UI components
   4. Wire up to parent state (if workspace panel)

3. **After each major step, validate**
   ```bash
   npx tsc --noEmit   # No type errors before continuing
   ```

4. **Run the dev server to test**
   ```bash
   npm run dev
   ```

5. **Execute E2E validation**
   ```bash
   npm run test:e2e
   # Or run a specific E2E script:
   bash tests/e2e/<feature>.sh
   ```

6. **Report results**
   - List each success criterion and whether it passed
   - Show any failures with error messages
   - Suggest fixes for failures (do NOT auto-fix without user approval)

## Rules During Execution
- Only implement what's in the plan — no scope creep
- No refactoring of unrelated code
- Tailwind: use `stone-*` colors ONLY (never gray/slate/zinc/neutral)
- All workspace panels: `'use client'`, state lives in parent page
- API routes: return `NextResponse.json()`, use Prisma via `import { prisma } from '@/lib/db'`

## Common Commands
```bash
npm run dev                        # Start dev server
npx tsc --noEmit                   # Type check
npx prisma migrate dev --name x    # Run migration
npx prisma generate                # Regenerate client
npx prisma studio                  # Browse DB
npm run test:e2e                   # Run all E2E tests
```
