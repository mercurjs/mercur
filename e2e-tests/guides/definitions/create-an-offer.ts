import { defineGuide } from "../define-guide"

// Screenshots the reliable, deterministic states of the create-offer flow: the
// offers list, its Create entry point, and the opened create wizard on its
// first step ("Products"). Product selection uses a data-table of checkboxes
// and the second step ("Stock Levels & Prices") is only reachable after a
// product is picked, so both are described in prose rather than automated —
// the driver cannot reliably drive a table selection, and reaching the stock
// step needs one. All targets below are verified against
// packages/vendor/src/pages/offers/...; if one breaks, generation fails loudly,
// which is the intended UI-drift signal.
//
// A step's `waitFor` runs BEFORE its actions (see guides/driver.ts), so the
// "open the form" click and the "wait for the form" gate live in separate steps.
export default defineGuide({
  slug: "create-an-offer",
  dir: "offers/how-tos",
  panel: "vendor",
  title: "Create an Offer",
  description:
    "List one or more catalog products for sale with your SKU, price, and stock.",
  intro:
    "An offer is your listing against a master product in the shared catalog. Each offer carries your own SKU, price, inventory, and shipping profile. Creating an offer is a two-step form: first you choose which catalog products to list, then you set stock and prices for each of their variants. You can list several products in one flow. This guide creates an offer from the Vendor Panel.",
  steps: [
    {
      title: "Open the offers list",
      body: "Go to **Products**, then **Offers** in the sidebar. The page lists the offers you already sell. Select **Create** to start a new one.",
      goto: "/offers",
      waitFor: { role: "link", name: "Create" },
      highlight: { role: "link", name: "Create" },
      shot: "full",
    },
    {
      title: "Choose products",
      body: "Selecting **Create** opens a two-step wizard. In the **Products** step, browse or search the catalog and select the checkbox next to every product you want to list. Select all the products that match your inventory in one go, then select **Continue**.",
      shot: false,
    },
    {
      title: "Set stock and prices",
      body: "In the **Stock Levels & Prices** step, each selected product fans out to one row per variant. For every row, enter a **SKU** unique across your store, choose a **Shipping Profile**, enter a **Price** for each currency, and set the stocked quantity for each of your stock locations.",
      shot: false,
    },
    {
      title: "Publish the offers",
      body: "Select **Publish**. Your offers are created. An offer only appears on the storefront once it has both stock levels and a price set, so any offer missing either stays hidden until you complete it.",
      shot: false,
    },
  ],
})
