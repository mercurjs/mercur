# @mercurjs/stripe-connector-plugin

Connects a Mercur marketplace to Stripe. The plugin is two provider adapters
plus the screens; the schedule, the tables and the rules live in Mercur's
payout module.

- **Payment provider** `pp_stripe-connector_<id>`: Medusa's Stripe provider
  with manual capture, so the platform account charges the whole cart once and
  the payout module captures it when every seller order is decided.
- **Payout provider** `pop_stripe-connect_<id>`: Express accounts, onboarding
  and login links, transfers with `source_transaction`, reversals, debits and
  payouts on the connected account, and the `account.*`, `transfer.*` and
  `payout.*` webhooks.
- **Admin** Finance → Stripe: one tab per payout job with its run card and
  table, a run history, Settings → Stripe with the webhook URLs, a Stripe tab on
  the seller page and a transfer widget on the order page.
- **Vendor** Settings → Stripe: set-up form, onboarding link, KYC status and
  requirements, transfers, settlements and payouts.

## Install

```ts
// medusa-config.ts
module.exports = withMercur({
  plugins: [{ resolve: "@mercurjs/stripe-connector-plugin", options: {} }],
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
            },
          },
        ],
        onboarding: {
          returnUrl: `${process.env.VENDOR_URL}/settings/stripe`,
          refreshBaseUrl: process.env.BACKEND_URL,
        },
        alerting: { technicalEmail: "ops@example.com", from: "noreply@example.com" },
      },
    },
  ],
})
```

Run `medusa db:migrate`, then register two webhooks in the Stripe dashboard:

| Endpoint | Events |
| --- | --- |
| `POST /hooks/payment/pp_stripe-connector_stripe` | `payment_intent.*`, `charge.*` (platform account) |
| `POST /hooks/payout/pop_stripe-connect_stripe` | `account.updated`, `transfer.created`, `transfer.reversed`, `payout.paid`, `payout.failed`, `payout.canceled` (listen on connected accounts) |

## Schedule

| Job | Schedule (UTC) | Does |
| --- | --- | --- |
| `payout-sync-onboarding` | every minute | Express accounts and onboarding links for new sellers |
| `payout-validate-captures` | every 5 min | captures or cancels decided order groups |
| `payout-process-transfers` | every 5 min, minute 1 | backlog, then transfers for fulfilled orders |
| `payout-process-reversals` | every 5 min, minute 2 | backlog, then reversals for refunds |
| `payout-process-settlements` | daily 01:03 | failed payouts, adjustments, settlements, payouts |
| `payout-alert-failed-operations` | daily 08:04 | digest email of everything failed |
| `payout-monitor-kyc` | every 6 h, opt-in | re-reads every account's requirements |

Every option of the payout module is documented in `@mercurjs/types`
(`PayoutModuleOptions`).
