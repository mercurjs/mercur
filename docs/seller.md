# Seller

A **seller** is the central actor in a Mercur marketplace. Every product listing, order, payout, and storefront presence traces back to a seller account. This page covers the seller data model, lifecycle, and the business rules that govern how sellers operate on the platform.

## Seller Profile

Each seller account holds the following core fields:


| Field             | Description                                                                   |
| ----------------- | ----------------------------------------------------------------------------- |
| `name`            | Display name shown to customers on the storefront (unique)                    |
| `handle`          | URL-friendly identifier for the seller (unique)                               |
| `email`           | Primary contact email for the seller account (unique)                         |
| `description`     | Free-text seller description, typically shown on the seller's storefront page |
| `logo`            | Seller logo or avatar                                                         |
| `banner`          | Banner image for the seller's storefront page                                 |
| `website_url`     | Seller's external website                                                     |
| `currency_code`   | The single currency in which this seller operates                             |
| `is_premium`      | Operator-designated premium seller flag (see below)                           |
| `status_reason`   | Optional explanation for the current status (e.g. reason for suspension)      |
| `external_id`     | Identifier in an external system (unique, optional)                           |
| `metadata`        | Arbitrary JSON metadata                                                       |


### Single Currency Per Account

Every seller account is locked to **one currency**. Prices, payouts, and subscription billing all use this currency. This constraint keeps financial reporting simple and eliminates exchange-rate ambiguity in payouts.

If a seller needs to trade in multiple currencies, the recommended pattern is to create **separate seller accounts** — one per currency. Each account operates independently with its own products, orders, and payouts.

### Professional Sellers

A seller is considered professional when it has associated **`professional_details`** — a separate record containing business information such as company name, registration number, and VAT ID. If this record is present, the seller is treated as a registered business; if absent, the seller is an individual.

This distinction affects tax handling, invoice formatting, and may influence storefront presentation.

## Address and Payment Information

Sellers can store one or more **addresses** (warehouse, return, business) and **payment details** used for payout processing. These are managed as sub-resources of the seller account and are referenced by workflows such as fulfillment and payout settlement.

## Seller Lifecycle

A seller account moves through **four statuses** over its lifetime:

```
                ┌──────────────────┐
                │  pending_approval │
                └────────┬─────────┘
                         │ approve
                         ▼
  ┌──────────┐      ┌────────┐
  │ suspended │◄────►│  open  │
  └──────────┘      └───┬────┘
                        │ terminate
                        ▼
                  ┌────────────┐
                  │ terminated  │
                  └────────────┘
```

### Status Definitions

- `**pending_approval**` — The seller has registered but has not yet been reviewed by the platform operator.
- `**open**` — The seller is active and may list products, receive orders, and collect payouts.
- `**suspended**` — The seller's operations are temporarily frozen. Products remain in the catalog but cannot be purchased.
- `**terminated**` — The seller account is permanently closed. This status is irreversible.

### Status Transition Rules


| From               | To           | Who               | Conditions                                                |
| ------------------ | ------------ | ----------------- | --------------------------------------------------------- |
| `pending_approval` | `open`       | Operator          | Operator reviews and approves the application             |
| `open`             | `suspended`  | Operator          | Policy violation, compliance hold, or operator discretion |
| `suspended`        | `open`       | Operator          | Issue resolved, seller reinstated                         |
| `open`             | `terminated` | Operator / Seller | All prerequisites met (see below)                         |
| `suspended`        | `terminated` | Operator          | All prerequisites met (see below)                         |


Transitions not listed above are **not permitted**. A terminated seller cannot be reopened — a new account must be created instead.

### Termination Prerequisites

Before a seller account can be terminated:

- All **open orders** must be fulfilled, cancelled, or otherwise resolved
- All **pending payouts** must be settled or forfeited
- Any **active subscription** must be cancelled and final billing completed

## Scheduled Closures

Sellers can schedule **temporary closures** without changing their account status. Two date fields control this:

- `closed_from` — The date the closure begins
- `closed_to` — The date the closure ends

During a scheduled closure the seller's storefront shows as unavailable and new orders cannot be placed, but the account remains in `open` status. This is designed for holidays, seasonal breaks, or planned downtime. Once `closed_to` passes, the seller automatically resumes normal operation.

Scheduled closures are **not a status** — they overlay on top of the current status and do not affect status transition rules.

## Premium Sellers

The `is_premium` flag is set **exclusively by the platform operator**. Sellers cannot designate themselves as premium. This flag is used for storefront features such as:

- Featured placement in search results or category pages
- Visual badges or highlights on the seller's profile
- Priority in marketplace curation

The specific storefront behavior tied to premium status is determined by the frontend implementation.

## Registration Flows

There are **three methods** for creating a seller account:

1. **Operator-created** — The platform operator creates the seller account directly via the admin dashboard. The account can be set to `open` immediately, bypassing `pending_approval`.
2. **Invite** — The operator sends an invitation to a prospective seller. The seller completes registration using the invite link. The resulting account may still require approval depending on platform configuration.
3. **Self-registration** — The seller registers through the public-facing registration flow. The account enters `pending_approval` status and waits for operator review.

## Business Rules Summary

- A seller account operates in **exactly one currency**
- The presence of `professional_details` determines whether the seller is a registered business
- Only the **operator** can approve, suspend, or reinstate sellers
- **Termination** is irreversible and requires all orders and payouts to be resolved
- Scheduled closures are **date-driven** and do not change account status
- **Premium** designation is operator-only and influences storefront presentation
- Every seller account must have at least one [member](seller-members.md) with an admin role (see [Roles and Permissions](roles-and-permissions.md))

