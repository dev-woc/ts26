#!/bin/bash
set -e

echo "=== E2E: Login Flow ==="

# Navigate to login
agent-browser open http://localhost:3000/login
agent-browser wait --load networkidle
agent-browser screenshot tests/e2e/screenshots/login-page.png

# Snapshot interactive elements
agent-browser snapshot -i

# Fill login form
agent-browser find label "Email address" fill "$TEST_USER_EMAIL"
agent-browser find label "Password" fill "$TEST_USER_PASSWORD"

# Submit — use first matching submit button (avoid Google OAuth button)
agent-browser find role button click --name "Sign in" --exact

# Wait for redirect to dashboard or opportunities
agent-browser wait --url "**/dashboard"
agent-browser wait --load networkidle

URL=$(agent-browser get url)
if [[ "$URL" == *"/dashboard"* ]]; then
  echo "PASS: Redirected to dashboard after login"
else
  echo "FAIL: Expected /dashboard, got $URL"
  exit 1
fi

agent-browser screenshot tests/e2e/screenshots/login-success.png
echo "=== Login Flow: PASSED ==="
