# Subscriptions

**Subscriptions** allow the platform operator to charge sellers a recurring fee for marketplace access. This is an opt-in feature — when disabled, sellers operate without any platform billing. This page covers the subscription model, billing rules, and how overrides work.

## Platform-Level Toggle

Subscriptions are controlled by a **platform-wide toggle**:

- **Disabled** (default) — No subscription billing occurs. Sellers are not charged any platform fees. The subscription UI is hidden from both the admin dashboard and the vendor portal.
- **Enabled** — Sellers are billed according to their subscription plan. The operator must configure at least one default plan before enabling subscriptions.

Toggling subscriptions off after they have been enabled **does not delete** existing subscription records. Billing simply stops, and sellers are not charged for subsequent periods. Re-enabling resumes billing from the next cycle.

## Default Subscription Plan

When subscriptions are enabled, the operator defines a **default plan** for each currency in which sellers operate. Each plan specifies:

| Field | Description |
|---|---|
| `currency_code` | The currency this plan applies to (matches the seller's `currency_code`, unique per plan) |
| `monthly_amount` | The recurring fee charged each billing cycle |
| `free_months` | Number of initial months during which no charge is applied (default: 0) |
| `requires_orders` | When enabled, billing only occurs for months in which the seller had at least one order |
| `metadata` | Arbitrary JSON metadata |

### How the Default Plan Works

When a new [seller](seller.md) account is approved, the system automatically assigns the default plan matching the seller's currency. The seller begins their subscription immediately, starting with any configured free months.

The `requires_orders` flag is designed for marketplaces that want to avoid charging inactive sellers. When this flag is set, a billing cycle with zero orders produces no invoice — the seller is effectively not charged for that month.

## Per-Seller Overrides

The operator can override subscription terms for **individual sellers**. An override is linked to a plan and identified by a `reference` / `reference_id` pair (e.g. referencing a specific seller). Each seller can have at most one override per plan. Override fields take precedence over the default plan when present:

| Field | Description |
|---|---|
| `monthly_amount` | Custom recurring fee (nullable — when null, the plan's amount applies) |
| `free_months` | Custom number of free initial months (nullable — when null, the plan's value applies) |
| `free_from` | Start date of a temporary free period |
| `free_to` | End date of a temporary free period |
| `metadata` | Arbitrary JSON metadata |

The `free_from` / `free_to` date range allows **time-bound fee waivers** independent of the initial free months. This is useful for granting temporary relief without permanently changing the seller's subscription terms.

Overrides are managed through the admin dashboard and can be applied at any time during the seller's lifecycle. They are commonly used for:

- **Promotional onboarding** — Offering an extended free trial to attract high-value sellers
- **Negotiated rates** — Enterprise or high-volume sellers may negotiate custom pricing
- **Temporary relief** — Waiving fees for a specific date range during platform incidents or market disruptions

## Billing Rules

### Billing Cycle

Subscriptions are billed on a **monthly anniversary** basis. The cycle starts on the date the seller's account was approved, and each subsequent billing occurs on the same day of the month.

If the start date falls on the 29th, 30th, or 31st, billing rolls to the last day of shorter months.

### Billing Across Statuses

Subscription billing continues regardless of the seller's [account status](seller.md), with one exception:

| Status | Billed? | Notes |
|---|---|---|
| `open` | Yes | Normal billing |
| `suspended` | Yes | Seller is still occupying platform resources |
| `pending_approval` | No | Billing begins only after approval |
| `terminated` | No | Final invoice issued at termination; no further billing |

Suspended sellers **continue to be billed**. This is intentional — suspension is a temporary measure, and the seller retains their catalog, data, and platform presence. If the operator does not wish to charge a suspended seller, they can apply a per-seller override.

### Negative Balance

If a seller's subscription payment fails, the unpaid amount carries forward as a **negative balance**. The platform does not automatically retry payment. The outstanding amount is added to the next billing cycle's invoice.

Persistent negative balances may be grounds for suspension or termination at the operator's discretion.

## Taxes on Subscriptions

In the current implementation, subscription fees support a **flat tax rate** or **zero tax**:

- The operator configures a single tax rate that applies to all subscription invoices
- Tax is calculated on the `monthly_amount` and included as a line item on the invoice
- Per-region or per-category tax rules are not supported for subscriptions in this phase

Future iterations may integrate with the platform's tax engine for more granular tax handling.

## Relationship to Other Concepts

- **Seller accounts** determine which default plan applies based on `currency_code` (see [Seller](seller.md))
- **Billing access** in the vendor portal is controlled by the `payout_read` and `payout_write` permissions (see [Roles and Permissions](roles-and-permissions.md))
- Subscription status is independent of [member management](seller-members.md) — adding or removing members does not affect billing
