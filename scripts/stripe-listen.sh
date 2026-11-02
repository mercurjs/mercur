#!/usr/bin/env bash
# Forwards Stripe sandbox webhooks to the local API, the way the two production
# endpoints would deliver them:
#   payment: platform events -> /hooks/payment/stripe-connector_stripe
#   payout:  platform transfer.* and Connect account.* / payout.* -> /hooks/payout
#
# Usage: ./scripts/stripe-listen.sh   (needs `stripe login` once)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/apps/api/.env"
API_URL="${API_URL:-http://localhost:9000}"
LOG_DIR="$ROOT/.stripe"

PAYMENT_EVENTS="payment_intent.amount_capturable_updated,payment_intent.succeeded,payment_intent.payment_failed,payment_intent.canceled,payment_intent.partially_funded,payment_intent.requires_action,charge.refunded"
PAYOUT_EVENTS="account.updated,transfer.created,transfer.reversed,payout.paid,payout.failed,payout.canceled,payout.updated"

command -v stripe >/dev/null || { echo "Install the Stripe CLI: brew install stripe/stripe-cli/stripe"; exit 1; }

# Listen on the account the API charges, not whichever one `stripe login` picked.
API_KEY="$(grep -E '^STRIPE_SECRET_KEY=' "$ENV_FILE" | tail -1 | cut -d= -f2- | tr -d "\"'" || true)"
[ -n "$API_KEY" ] || { echo "Set STRIPE_SECRET_KEY in apps/api/.env"; exit 1; }
case "$API_KEY" in sk_test_* | rk_test_*) ;; *) echo "Refusing to listen with a live Stripe key"; exit 1 ;; esac
export STRIPE_API_KEY="$API_KEY"

# The CLI signs every forwarded event with one secret per account, so both
# webhook secrets in .env must hold it.
SECRET="$(stripe listen --print-secret)"

changed=0
touch "$ENV_FILE"
for var in STRIPE_OPERATOR_WEBHOOK_SECRET STRIPE_SELLERS_WEBHOOK_SECRET; do
  if ! grep -qx "$var=$SECRET" "$ENV_FILE"; then
    [ "$changed" = 1 ] || cp "$ENV_FILE" "$ENV_FILE.bak"
    tmp="$(mktemp)"
    grep -v "^$var=" "$ENV_FILE" > "$tmp" || true
    echo "$var=$SECRET" >> "$tmp"
    mv "$tmp" "$ENV_FILE"
    changed=1
  fi
done
if [ "$changed" = 1 ]; then
  echo "Updated the webhook secrets in apps/api/.env (previous file in .env.bak) -- restart the API so it verifies with them."
fi

# The logs carry the webhook signing secret.
umask 077
mkdir -p "$LOG_DIR"
trap 'kill 0' EXIT INT TERM

stripe listen \
  --events "$PAYMENT_EVENTS" \
  --forward-to "$API_URL/hooks/payment/stripe-connector_stripe" \
  2>&1 | sed -u 's/^/[payment] /' | tee "$LOG_DIR/payment.log" &

stripe listen \
  --events "$PAYOUT_EVENTS" \
  --forward-to "$API_URL/hooks/payout" \
  --forward-connect-to "$API_URL/hooks/payout" \
  2>&1 | sed -u 's/^/[payout]  /' | tee "$LOG_DIR/payout.log" &

echo "Forwarding to $API_URL (logs in .stripe/). A 200 only means the event was queued;"
echo "run 'bun --cwd apps/api run stripe:check-webhooks' to confirm it was processed."
wait
