#!/data/data/com.termux/files/usr/bin/sh
# Termux smoke test for the portable backend.
# Run from the service directory or anywhere:
#   sh scripts/termux-smoke-test.sh
set -u

SERVICE_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
PORT="${PORT:-3999}"
LOG="${TMPDIR:-/tmp}/local-processor-smoke-$$.log"
PID=""

cleanup() {
  if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
    kill -TERM "$PID" 2>/dev/null || true
    wait "$PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

cd "$SERVICE_DIR" || exit 1
echo "== node --check =="
node --check server.js || exit 1

echo "== starting on 127.0.0.1:$PORT with ENABLE_QUEUE=false =="
HOST=127.0.0.1 PORT="$PORT" ENABLE_QUEUE=false NODE_ENV=test node server.js >"$LOG" 2>&1 &
PID=$!

STATUS="000"
i=0
while [ "$i" -lt 30 ]; do
  STATUS=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/" 2>/dev/null) || STATUS="000"
  [ "$STATUS" = "200" ] && break
  kill -0 "$PID" 2>/dev/null || break
  i=$((i + 1))
  sleep 1
done

echo "== GET / -> HTTP $STATUS =="
curl -s "http://127.0.0.1:$PORT/" || true
echo
echo "== startup log =="
cat "$LOG"

FAIL=0
[ "$STATUS" = "200" ] || { echo "FAIL: expected HTTP 200, got $STATUS"; FAIL=1; }
if ! grep -q "Background worker disabled" "$LOG"; then
  echo "FAIL: queue-disabled message missing"
  FAIL=1
fi
if grep -q "Starting Background Worker" "$LOG"; then
  echo "FAIL: background worker started"
  FAIL=1
fi

echo "== shutdown (SIGINT) =="
kill -INT "$PID" 2>/dev/null || true
wait "$PID"
CODE=$?
PID=""
echo "server exit code: $CODE"
[ "$CODE" = "0" ] || { echo "FAIL: expected exit code 0"; FAIL=1; }

if [ "$FAIL" = "0" ]; then echo "RESULT: PASS"; else echo "RESULT: FAIL"; fi
exit "$FAIL"
