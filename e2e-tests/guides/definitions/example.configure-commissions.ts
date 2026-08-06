import { defineGuide } from "../define-guide"

// EXAMPLE ONLY — this file is not imported by registry.ts, so it generates
// nothing. It shows the shape of a real guide. To ship it: verify every selector
// against the live admin panel, rename to configure-commissions.ts, and add it
// to GUIDES in registry.ts.
//
// Selector tips:
//   - Prefer { testid: "..." }. The UI-ARCHITECTURE contract puts a
//     data-testid on every interactive element; find the exact ids in
//     packages/admin/src/pages/... (or run `bun run guides:ui` and inspect).
//   - Use `mask` for any dynamic/PII region (ids, dates, emails).
//   - Use `highlight` to draw the reader's eye to the control being used.
export default defineGuide({
  slug: "configure-commissions",
  panel: "admin",
  title: "Configure commissions",
  description:
    "Set the commission the marketplace takes on each seller's sales.",
  intro:
    "Commissions are the fee your marketplace keeps on every sale. This guide walks through creating a percentage commission rule from the Admin Panel.",
  steps: [
    {
      title: "Open the commissions settings",
      body: "Go to **Settings → Commissions** in the sidebar.",
      goto: "/settings/commissions",
      waitFor: { testid: "commission-list-table" },
      shot: "full",
    },
    {
      title: "Start a new rule",
      body: "Select **Create** to add a commission rule.",
      highlight: { testid: "commission-create-button" },
      click: { testid: "commission-create-button" },
      shot: "full",
    },
    {
      title: "Set a percentage rate",
      body: "Choose the percentage type and enter the rate you want to charge.",
      fill: [{ target: { testid: "commission-rate-input" }, value: "10" }],
      shot: { element: { testid: "commission-create-form" } },
    },
    {
      title: "Save the rule",
      body: "Select **Save**. The new rule now applies to matching sales.",
      click: { testid: "commission-save-button" },
      shot: "full",
    },
  ],
})
