---
status: passing
canonical: false
priority: 30
area: vendor-orders
created: 2026-06-15
last_updated: 2026-06-15
---

# SPEC-011 Vendor Order Edit Confirmation Step

## Context

When a vendor edits an order in the Vendor panel (changes item quantities, adds
or removes items), the edit is **auto-confirmed**: clicking "Confirm" in the edit
modal fires `requestOrderEdit()` immediately followed by `confirmOrderEdit()` in
the same action, so the change is applied to the live order with no separate
review/confirmation step.

The Admin panel behaves differently. There, clicking "Confirm Edit" only
**requests** the edit (`requestOrderEdit()`), leaving it in a `requested` state.
The operator then reviews the pending change in the active-edit banner on the
order detail page and explicitly applies it via **Force confirm** (or discards it
via **Cancel**). This two-stage flow gives the user a chance to review the diff
(added / removed items, totals) before the change becomes permanent and notifies
the customer.

This spec aligns the Vendor flow with the Admin flow: the vendor edit modal should
**request only**, leaving the edit pending confirmation in the existing
active-edit banner, instead of auto-confirming inline.

The relevant difference lives entirely in one file's submit handler — both panels
already share the same modal layout, the same `OrderActiveEditSection` banner, and
the same `useRequestOrderEdit` / `useConfirmOrderEdit` / `useCancelOrderEdit`
hooks. No backend/API changes are required; the order-edit endpoints
(`request`, `confirm`, `cancel`) already exist and are unchanged.

## User-Visible Behavior

When it works:

1. Vendor opens an order and starts an edit (`/orders/:id/edit`).
2. Vendor changes item quantities / adds / removes items.
3. Vendor clicks **Confirm** → an "Are you sure?" prompt appears (unchanged).
4. On confirming the prompt, the edit is **requested only** — a single toast
   "Order edit request created" (`orders.edits.createSuccessToast`) shows and the
   modal closes back to the order detail page. The change is **not yet applied**.
5. On the order detail page, the active-edit banner
   (`OrderActiveEditSection`) shows the pending change (Added / Removed items)
   with two actions:
   - **Force confirm** → applies the edit, toast "Order edit confirmed"
     (`orders.edits.toast.confirmedSuccessfully`).
   - **Cancel** → discards the edit, toast "Order edit canceled"
     (`orders.edits.toast.canceledSuccessfully`).
6. The customer-facing order only changes after **Force confirm** is clicked —
   matching Admin behavior.

## Implementation

### Primary change — vendor edit form submit handler

File: `packages/vendor/src/pages/orders/[id]/edit/_components/order-edit-create-form/order-edit-create-form.tsx`

Change `handleSubmit` (currently lines ~62–91) to mirror the Admin form
(`packages/admin/src/pages/orders/order-create-edit/components/order-edit-create-form/order-edit-create-form.tsx`):

- Keep the `usePrompt()` "Are you sure?" confirmation (unchanged).
- After the prompt is confirmed, call **only** `requestOrderEdit()`.
- Replace the two toasts (`orders.edits.toast.requestSent` +
  `orders.edits.toast.confirmedSuccessfully`) with the single Admin toast
  `orders.edits.createSuccessToast` ("Order edit request created"), which already
  exists in `packages/vendor/src/i18n/translations/en.json`.
- **Remove** the inline `await confirmOrderEdit()` call.
- Call `handleSuccess(\`/orders/${order.id}\`)` to close the modal (unchanged).

Cleanup in the same file:

- Remove the now-unused `useConfirmOrderEdit` import and the `confirmOrderEdit` /
  `isConfirming` destructure.
- Drop `isConfirming` from `isRequestRunning` (becomes `isCanceling || isRequesting`).

### No change needed — banner already supports it

`packages/vendor/src/pages/orders/[id]/_components/order-active-edit-section/order-active-edit-section.tsx`
already renders the pending change with **Force confirm** / **Cancel** buttons and
already imports `useConfirmOrderEdit` / `useCancelOrderEdit`. Once the form stops
auto-confirming, the requested (non-`pending`) edit will surface the **Force
confirm** button here — no edit required.

### Out of scope

- No backend / API route changes (`request`, `confirm`, `cancel` endpoints are
  unchanged).
- No i18n additions — all required keys already exist in the vendor package.
- The `useConfirmOrderEdit` hook in `packages/vendor/src/hooks/api/order-edits.tsx`
  stays (still used by the banner).

## Verification

Manual (primary, since this is a client-only behavior change):

1. `bun run dev` and log into the Vendor panel (port 7001).
2. Open an order with at least one fulfillable item → start an edit.
3. Change a quantity, click **Confirm**, accept the "Are you sure?" prompt.
4. Confirm: exactly **one** toast "Order edit request created" appears; the modal
   closes; the order total/items on the detail page are **unchanged**.
5. Confirm the active-edit banner shows the pending diff with **Force confirm**
   and **Cancel**.
6. Click **Force confirm** → toast "Order edit confirmed"; the order now reflects
   the change.
7. Repeat steps 2–4, then click **Cancel** in the banner → toast "Order edit
   canceled"; the order is unchanged and the banner disappears.

Build / lint:

- `bun run build` passes.
- `bun run lint` shows no new errors in the changed file (baseline lint on canary
  is red from pre-existing unrelated errors — check only the changed file).

Regression (API unaffected):

- `bun run test:integration:http -- order-edit` still passes (the order-edit
  endpoints are untouched; this confirms no accidental backend regression).

## Evidence

- 2026-06-15: Implemented in
  `packages/vendor/src/pages/orders/[id]/edit/_components/order-edit-create-form/order-edit-create-form.tsx`.
  `handleSubmit` now calls `requestOrderEdit()` only (no inline
  `confirmOrderEdit()`), toasts `orders.edits.createSuccessToast`, and the unused
  `useConfirmOrderEdit` import / `isConfirming` state were removed.
- `bun run build` — all 9 tasks successful (vendor package ESM + DTS build green).
- `bun run lint` — no errors in the changed file (canary baseline lint is red from
  pre-existing unrelated errors).
- Banner confirmation (`OrderActiveEditSection`) was already present and unchanged;
  it now surfaces the **Force confirm** action for the requested edit.

## Notes

- The auto-confirm was an intentional "Vendor MVP" shortcut — see the code comment
  at `order-edit-create-form.tsx:76–79`. This spec reverses that decision to bring
  the Vendor flow to full parity with Admin.
- This is a UI-behavior change in a React form; the existing Jest integration suite
  exercises the API endpoints directly, not the panel's submit sequencing, so there
  is no failing API test to add. Verification is manual + build/lint + the existing
  `order-edit` HTTP suite as a regression guard.
