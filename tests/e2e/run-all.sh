#!/bin/bash
set -e

echo "========================================"
echo "  USHER E2E Test Suite"
echo "========================================"
echo ""

# Ensure dev server is running
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
  echo "ERROR: Dev server not running at http://localhost:3000"
  echo "Start it with: npm run dev"
  exit 1
fi

mkdir -p tests/e2e/screenshots

PASSED=0
FAILED=0
TESTS=()

run_test() {
  local name=$1
  local script=$2
  echo ""
  echo "----------------------------------------"
  echo "Running: $name"
  echo "----------------------------------------"
  if bash "$script"; then
    PASSED=$((PASSED + 1))
    TESTS+=("PASS: $name")
  else
    FAILED=$((FAILED + 1))
    TESTS+=("FAIL: $name")
  fi
}

run_test "Login Flow"           "tests/e2e/login.sh"
run_test "Opportunities List"   "tests/e2e/opportunities.sh"
run_test "SOW Generation"       "tests/e2e/sow.sh"
run_test "Advanced Filtering"   "tests/e2e/filtering.sh"

echo ""
echo "========================================"
echo "  Results: $PASSED passed, $FAILED failed"
echo "========================================"
for t in "${TESTS[@]}"; do
  echo "  $t"
done
echo ""

if [ $FAILED -gt 0 ]; then
  echo "SOME TESTS FAILED"
  exit 1
else
  echo "ALL TESTS PASSED"
  exit 0
fi
