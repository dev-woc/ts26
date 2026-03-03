---
name: plan-feature
description: Write a structured implementation plan to docs/plans/<feature-name>.md before any code is written. Run this BEFORE /execute.
---

Usage: `/plan-feature <feature-name>`

Creates a structured implementation plan before any code is written. Run this BEFORE `/execute`.

## Process

1. **Load relevant context**
   - Re-read the phase from `IMPLEMENTATION_PLAN.md`
   - Load relevant on-demand docs (`docs/frontend-components.md`, `docs/api-endpoints.md`, `docs/database-schema.md`)
   - Use sub-agents to explore relevant parts of the codebase

2. **Clarify with questions** (if needed)
   - Ask 3–5 targeted questions about the feature before writing the plan
   - Use multiple-choice where possible

3. **Write the plan to `docs/plans/<feature-name>.md`**

## Plan Template

```markdown
# Plan: <Feature Name>

## Goal
One sentence description of what we're building.

## Success Criteria
- [ ] Specific, testable outcome 1
- [ ] Specific, testable outcome 2
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] E2E tests pass (`npm run test:e2e`)

## Context References
- Relevant files: [list files to read before implementing]
- External docs: [any API docs or library references needed]

## Database Changes
- New models: [model names and fields]
- Schema changes: [describe changes to existing models]
- Migration: `npx prisma migrate dev --name <migration-name>`

## API Routes
- New routes: [METHOD /path — description]
- Modified routes: [METHOD /path — what changes]

## UI Components
- New components: [ComponentName.tsx — purpose]
- Modified components: [ComponentName.tsx — what changes]
- Panel affected: [which workspace panel, if any]

## Implementation Task List
1. [ ] DB schema change + migration
2. [ ] API route(s)
3. [ ] UI component(s)
4. [ ] Wire up state in parent page (if workspace panel)
5. [ ] Type-check: `npx tsc --noEmit`

## Validation Strategy
### Automated
- Type check: `npx tsc --noEmit`
- Unit tests: `npm run test:run` (if applicable)
- E2E: `npm run test:e2e` or specific script in `tests/e2e/`

### Manual User Journey
Step-by-step what the tester does in the browser:
1. Navigate to [page]
2. [Action]
3. Expect: [result]
```

## After Writing the Plan
- Review the plan with the user
- **Reset context** (start a new session)
- Run `/execute docs/plans/<feature-name>.md`
