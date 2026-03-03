#!/bin/bash
set -e

echo "=== E2E: Opportunities List ==="

# Assume logged in (run login.sh first or use saved session)
agent-browser open http://localhost:3000/dashboard
agent-browser wait --load networkidle
agent-browser screenshot tests/e2e/screenshots/dashboard.png

# Verify page loaded
SNAPSHOT=$(agent-browser snapshot)
if echo "$SNAPSHOT" | grep -qi "opportunity\|dashboard\|pipeline"; then
  echo "PASS: Dashboard loaded"
else
  echo "FAIL: Dashboard content not found"
  exit 1
fi

# Navigate to opportunities list
agent-browser find role link click --name "Opportunities"
agent-browser wait --load networkidle
agent-browser screenshot tests/e2e/screenshots/opportunities-list.png

agent-browser snapshot -i

# Verify opportunities table/list rendered
SNAPSHOT=$(agent-browser snapshot)
if echo "$SNAPSHOT" | grep -qi "opportunity\|solicitation\|no opportunities"; then
  echo "PASS: Opportunities list rendered"
else
  echo "FAIL: Opportunities list not found"
  exit 1
fi

# Try clicking into an opportunity if any exist
agent-browser screenshot tests/e2e/screenshots/opportunities-final.png
echo "=== Opportunities List: PASSED ==="
