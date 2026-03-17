THINK ABOUT CANCELLING ORDERS
THINK OF HANDLING ERROR CAPTURED ORDERS

# Jobs

This folder contains scheduled jobs that support the marketplace payment lifecycle.

The intended payment architecture here is:

1. Customer authorizes a single platform payment
2. Sellers accept or reject their part of the order
3. Platform captures the final accepted amount before authorization expires
4. Platform settles funds to sellers

## Stripe Connect Assumption

This flow assumes Stripe Connect with:

- `separate charges and transfers`
- one platform-side charge
- one or more seller settlements after capture

This is important because the internal word `payout` in this codebase is marketplace settlement language. In Stripe terms, that settlement is closer to a `transfer` to a connected account than a Stripe bank payout object.

## Merchant Of Record

With `separate charges and transfers`, the platform is the Merchant of Record.

That means the platform is responsible for:

- charging the customer
- refunds
- disputes and chargebacks
- payment compliance
- tax and VAT handling, depending on the marketplace legal setup

This README describes the technical workflow only. Legal and tax treatment still needs to be confirmed for the actual business.

## Main Time Windows

There are three separate timing concepts and they should not be mixed together.

`authorization window`

- How long the card authorization remains capturable
- Typical default: `7 days`
- Config example: `PAYOUT_AUTHORIZATION_WINDOW_MS=604800000`

`vendor action window`

- How long the vendor is allowed to complete required actions such as accepting the order or creating fulfillments
- Example: `72 hours`
- Config example: `VENDOR_ACTION_WINDOW_MS=259200000`

`capture safety buffer`

- A margin before authorization expiry so capture is not attempted at the last possible moment
- Example: `24 hours`
- Config example: `PAYOUT_CAPTURE_SAFETY_BUFFER_MS=86400000`

Recommended relationship:

- `VENDOR_ACTION_WINDOW_MS < PAYOUT_AUTHORIZATION_WINDOW_MS`
- capture should happen before `authorization_expires_at - PAYOUT_CAPTURE_SAFETY_BUFFER_MS`

## `PayoutModuleOptions`

The payout module should expose typed configuration through `PayoutModuleOptions` in [common.ts](/Users/viktorholik/Desktop/mercur/packages/types/src/payout/common.ts).

Recommended shape:

```ts
type PayoutModuleOptions = {
  authorizationWindowMs?: number;
  vendorActionWindowMs?: number;
  captureSafetyBufferMs?: number;
  captureCheckBatchSize?: number;
  dailyPayoutsBatchSize?: number;
  captureCheckEventName?: string;
  dailyPayoutsEventName?: string;
};
```

Recommended config example:

```ts
modules: [
  {
    resolve: "@mercurjs/b2c-core",
    options: {
      payout: {
        authorizationWindowMs: 7 * 24 * 60 * 60 * 1000,
        vendorActionWindowMs: 72 * 60 * 60 * 1000,
        captureSafetyBufferMs: 24 * 60 * 60 * 1000,
        captureCheckBatchSize: 100,
        dailyPayoutsBatchSize: 100,
        captureCheckEventName: "payment.capture_check.requested",
        dailyPayoutsEventName: "payout.received",
      },
    },
  },
];
```

If runtime env vars are still used temporarily, they should be treated as fallback values for these typed module options, not the primary contract.

## Why The Safety Buffer Exists

Card authorizations usually last about 7 days, but capture should not happen exactly at expiry.

The safety buffer exists because:

- cron does not run at a perfectly exact moment
- retries and queue delays happen
- provider/API failures happen
- infrastructure downtime happens
- some payment methods or issuer behavior may be less forgiving near expiry

Without a safety buffer, a single failed capture attempt near the deadline can turn into an expired authorization.

## Recommended Order Deadline Logic

When payment is authorized:

1. Store `authorized_at`
2. Compute `vendor_action_deadline = authorized_at + VENDOR_ACTION_WINDOW_MS`
3. Compute `authorization_expires_at = authorized_at + PAYOUT_AUTHORIZATION_WINDOW_MS`
4. Compute `capture_deadline = authorization_expires_at - PAYOUT_CAPTURE_SAFETY_BUFFER_MS`

Rules:

- If the vendor does not complete required actions before `vendor_action_deadline`, reject or cancel the order
- If vendor requirements are completed in time, the order becomes eligible for capture
- Capture should never wait past `capture_deadline`

## Partial Capture

This design should support partial capture.

Example:

- Seller A accepts
- Seller B rejects
- platform captures only the accepted amount

That means seller decisions must be reflected in the final capturable amount before capture runs.

The capture job should not assume the original authorized amount is always the final amount to capture.

## Refund And Reversal Implications

With `separate charges and transfers`, refund handling is not just "refund the customer".

You typically need both:

1. refund the platform charge
2. reverse seller settlement if seller funds were already transferred

So refund workflows must be designed together with settlement workflows. A payout record existing in the marketplace does not mean refund handling is complete.

## SCA

For Europe, Strong Customer Authentication happens during payment authorization / confirmation.

Capture is later, after the customer has already authenticated. The capture job should not expect a second customer authentication step.

## Recommended Stripe Metadata

Use grouping and allocation metadata so accounting and reversals are traceable.

Recommended fields:

- `transfer_group`
- order ID
- seller allocation metadata
- accepted and rejected seller amounts

This is especially useful for:

- partial capture
- transfer reconciliation
- refunds
- transfer reversals

## Scheduled Jobs

The jobs in this folder should stay small and event-driven.

They should:

- scan for candidates
- enforce time windows
- emit events or trigger workflows

They should not:

- contain the full business workflow inline
- duplicate settlement logic
- own refund logic

## `payout-check`

File: `src/jobs/payout-check.ts`

Purpose:

- fetch orders via `getOrdersListWorkflow` (which computes `fulfillment_status` and `payment_status` on each order)
- skip orders that already have linked payouts
- skip sellers without an active payout account
- skip orders where `fulfillment_status !== "fulfilled"` (workflow-computed)
- skip orders where `payment_status !== "authorized"` (workflow-computed)
- find authorized payment collections approaching the capture window
- emit `order.payout` so a subscriber or workflow can capture the payment

Default event (one per order):

```ts
{
  name: "order.payout",
  data: {
    order_id: string,
    authorized_at: Date,
    expires_at: Date,
  }
}
```

Default schedule:

```cron
*/15 * * * *
```

Relevant `PayoutModuleOptions` fields:

- `authorizationWindowMs`
- `captureSafetyBufferMs`
- `captureCheckBatchSize`

Suggested defaults:

- `authorizationWindowMs=604800000`
- `captureSafetyBufferMs=86400000`
- `captureCheckBatchSize=100`

### Why workflow-computed statuses?

`getOrdersListWorkflow` internally calls `getLastPaymentStatus` and `getLastFulfillmentStatus` and attaches the results as `payment_status` and `fulfillment_status` on each order. The job uses these directly instead of importing and calling those utilities separately. This avoids redundant computation and keeps the job focused on scanning and emitting events.

Recommended downstream flow:

1. receive `order.payout`
2. calculate the final amount to capture from accepted seller allocations
3. capture the authorized payment, fully or partially
4. mark the order ready for seller settlement

## `daily-payouts`

File: `src/jobs/daily-payouts.ts`

Purpose:

- scan fulfilled orders with captured payments
- skip orders that already have linked payouts
- skip sellers without an active payout account
- emit `payout.received` so downstream settlement logic can run

Default event:

```ts
{
  name: "payout.received",
  data: {
    order_id: string,
  }
}
```

Default schedule:

```cron
0 1 * * *
```

Relevant `PayoutModuleOptions` fields:

- `dailyPayoutsBatchSize`
- `dailyPayoutsEventName`

Suggested defaults:

- `dailyPayoutsBatchSize=100`
- `dailyPayoutsEventName=payout.received`

Recommended downstream flow:

1. receive `payout.received`
2. validate no seller settlement already exists for the order
3. credit the order into the seller settlement balance
4. create seller settlement records
5. execute provider-side seller fund movement

## Suggested Additional Job

If vendor action deadlines are part of the business rules, add a third job:

`vendor-deadline-check`

Purpose:

- scan authorized orders
- find orders where `now > vendor_action_deadline`
- reject or cancel overdue orders automatically

Suggested schedule:

```cron
*/15 * * * *
```

## Cron Format

```txt
* * * * *
│ │ │ │ │
│ │ │ │ └─ day of week
│ │ │ └─── month
│ │ └───── day of month
│ └─────── hour
└───────── minute
```
