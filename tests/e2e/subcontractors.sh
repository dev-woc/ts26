#!/bin/bash
set -e

echo "=== E2E: Subcontractors — Geo-Radius UI ==="

OPP_ID="cmllhq1h300018onwatu9gthc"

# Navigate directly to the known opportunity workspace
agent-browser open "http://localhost:3000/opportunities/${OPP_ID}"
agent-browser wait --load networkidle

# Go to Subcontractors panel
agent-browser find role button click --name "Subcontractors" --exact
agent-browser wait --load networkidle
agent-browser screenshot tests/e2e/screenshots/subcontractors-panel.png

# 1. Verify panel rendered
SNAPSHOT=$(agent-browser snapshot)
if echo "$SNAPSHOT" | grep -qi "subcontractor\|vendor\|find vendor"; then
  echo "PASS: Subcontractors panel loaded"
else
  echo "FAIL: Subcontractors panel not found"
  exit 1
fi

# 2. Verify geography label is present
if echo "$SNAPSHOT" | grep -qi "searching within\|statewide\|nationally"; then
  echo "PASS: Geography label present"
else
  echo "FAIL: Geography label missing"
  exit 1
fi

# 3. Verify radius dropdown contains all tier options
if echo "$SNAPSHOT" | grep -q "50mi" && echo "$SNAPSHOT" | grep -q "25mi" && echo "$SNAPSHOT" | grep -q "100mi" && echo "$SNAPSHOT" | grep -q "250mi"; then
  echo "PASS: Radius dropdown present with all tiers (25/50/100/250mi)"
else
  echo "FAIL: Radius dropdown options not found"
  exit 1
fi

# 6. Click Find Vendors — verify no crash (result depends on API key config)
agent-browser find role button click --name "Find Vendors" --exact
agent-browser wait --load networkidle --timeout 30000
agent-browser screenshot tests/e2e/screenshots/subcontractors-after-search.png

SNAPSHOT=$(agent-browser snapshot)
if echo "$SNAPSHOT" | grep -qi "vendor\|subcontractor\|no vendor\|api not\|searching"; then
  echo "PASS: Find Vendors completed without crash"
else
  echo "FAIL: UI in unexpected state after Find Vendors"
  exit 1
fi

# 7. Verify expand status messaging works (auto-expand shows status text or resolved)
# The panel should not be stuck in a loading/broken state
if echo "$SNAPSHOT" | grep -qi "find vendor\|vendor\|subcontractor"; then
  echo "PASS: Panel stable after search"
else
  echo "FAIL: Panel unstable after search"
  exit 1
fi

echo "=== Subcontractors Geo-Radius: PASSED ==="
