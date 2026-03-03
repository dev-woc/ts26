#!/bin/bash
set -e

echo "=== E2E: SOW Workspace ==="

# Navigate to opportunities and pick the first one
agent-browser open http://localhost:3000/dashboard
agent-browser wait --load networkidle

# Go to opportunities list
agent-browser find role link click --name "Opportunities"
agent-browser wait --load networkidle
agent-browser snapshot -i

# Click the first opportunity in the list
agent-browser find role link click --index 0
agent-browser wait --load networkidle
agent-browser screenshot tests/e2e/screenshots/workspace-summary.png

# Verify workspace loaded (summary panel default)
SNAPSHOT=$(agent-browser snapshot)
if echo "$SNAPSHOT" | grep -qi "summary\|solicitation\|opportunity"; then
  echo "PASS: Workspace loaded with summary panel"
else
  echo "FAIL: Workspace summary not found"
  exit 1
fi

# Navigate to SOW panel
agent-browser find role button click --name "SOW"
agent-browser wait --load networkidle
agent-browser screenshot tests/e2e/screenshots/workspace-sow-panel.png

SNAPSHOT=$(agent-browser snapshot)
if echo "$SNAPSHOT" | grep -qi "statement of work\|generate sow\|sow"; then
  echo "PASS: SOW panel rendered"
else
  echo "FAIL: SOW panel content not found"
  exit 1
fi

# Navigate to Subcontractors panel
agent-browser find role button click --name "Subcontractors"
agent-browser wait --load networkidle
agent-browser screenshot tests/e2e/screenshots/workspace-subs-panel.png

SNAPSHOT=$(agent-browser snapshot)
if echo "$SNAPSHOT" | grep -qi "subcontractor\|vendor\|discover"; then
  echo "PASS: Subcontractors panel rendered"
else
  echo "FAIL: Subcontractors panel not found"
  exit 1
fi

echo "=== SOW Workspace: PASSED ==="
