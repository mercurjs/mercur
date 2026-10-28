# @mercurjs/stripe-connector-plugin

Connects a Mercur marketplace to Stripe. Mercur's payout module keeps the
seller's payout account, one payout per order and the reversals of refunds;
this plugin adds the Stripe adapters, the scheduled jobs that drive them, and
the Stripe-specific bookkeeping (captures, settlements, bank payouts,
adjustments).

- **Payment provider** `pp_stripe-connector_<id>`: Medusa's Stripe provider
  with manual capture, so the platform account charges the whole cart once and
  the captures job captures it when every seller order is decided.
- **Payout provider** `pop_stripe-connect_<id>`: Express accounts, onboarding
  and login links; a payout is a transfer to the connected account with
  `source_transaction`, a reversal is a transfer reversal.
- **Module** `stripe_connector`: job runs, checkpoints, operator notifications,
  settlements with their bank payouts, and operator adjustments.
- **Jobs and subscribers**: the schedule below, plus faster runs on order
  fulfillment, cancellation, payment capture and refunds.
- **Admin** Finance → Stripe: one tab per job with its run card and table, a
  run history, Settings → Stripe with the webhook URLs, a Stripe section on the
  seller page and a payout widget on the order page.
- **Vendor** Integrations → Stripe: set-up form, the Stripe account with what
  Stripe still needs, and settlements. The payout account itself (status,
  onboarding, verification) shows on the core vendor Payouts page.

## Install

```ts
// medusa-config.ts
module.exports = withMercur({
  plugins: [
    {
      resolve: "@mercurjs/stripe-connector-plugin",
      options: {
        apiKey: process.env.STRIPE_SECRET_KEY,
        webhookSecret: process.env.STRIPE_SELLERS_WEBHOOK_SECRET,
        settlements: { mode: "plugin" },
        alerting: { technicalEmail: "ops@example.com", from: "noreply@example.com" },
      },
    },
  ],
  modules: [
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "@mercurjs/stripe-connector-plugin/providers/payment-stripe",
            id: "stripe",
            options: {
              apiKey: process.env.STRIPE_SECRET_KEY,
              webhookSecret: process.env.STRIPE_OPERATOR_WEBHOOK_SECRET,
            },
          },
        ],
      },
    },
    {
      resolve: "@mercurjs/core/modules/payout",
      options: {
        providers: [
          {
            resolve: "@mercurjs/stripe-connector-plugin/providers/payout-stripe-connect",
            id: "stripe",
            options: {
              apiKey: process.env.STRIPE_SECRET_KEY,
              webhookSecret: process.env.STRIPE_SELLERS_WEBHOOK_SECRET,
              manualPayouts: true,
            },
          },
        ],
        onboarding: {
          returnUrl: `${process.env.VENDOR_URL}/stripe`,
          refreshBaseUrl: process.env.BACKEND_URL,
        },
      },
    },
  ],
})
```

`settlements.mode: "plugin"` sends each settlement to the seller's bank
from the plugin, so pair it with `manualPayouts: true` on the payout provider.
With `mode: "provider"` Stripe pays out on its own schedule and settlements are
only recorded. A bank payout waits (`on_hold`, `insufficient_available_balance`)
until the connected account's available balance in the settlement currency
covers it, and is retried on the next run.

Set `notifications.secret` to sign each operator notification: the body's
HMAC-SHA256, hex-encoded, is sent as `x-mercur-signature: sha256=<hex>`.

Run `medusa db:migrate`, then register two webhooks in the Stripe dashboard:

| Endpoint | Events |
| --- | --- |
| `POST /hooks/payment/pp_stripe-connector_stripe` | `payment_intent.*`, `charge.*` (platform account) |
| `POST /hooks/payout` | `account.updated`, `transfer.created`, `transfer.reversed`, `payout.paid`, `payout.failed`, `payout.canceled`, `payout.updated` (listen on connected accounts) |

## Schedule

| Job | Schedule (UTC) | Does |
| --- | --- | --- |
| `payout-sync-onboarding` | every minute | Express accounts and onboarding links for new sellers |
| `payout-validate-captures` | every 5 min | captures or cancels decided order groups |
| `payout-process-transfers` | every 5 min, minute 1 | backlog, then payouts for fulfilled orders |
| `payout-process-reversals` | every 5 min, minute 2 | backlog, then reversals for refunds |
| `payout-process-settlements` | daily 01:03 | adjustments, failed bank payouts, settlements, bank payouts |
| `payout-alert-failed-operations` | daily 08:04 | digest email of everything failed |
| `payout-monitor-kyc` | every 6 h, opt-in | re-reads every account's requirements |

Every plugin option is documented on `StripeConnectorPluginOptions`.
