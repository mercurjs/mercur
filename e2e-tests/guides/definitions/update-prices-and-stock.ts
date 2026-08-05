import { defineGuide } from "../define-guide"

// Opens an existing seeded offer ("Apex Pool Slides") from the vendor offers
// list and shows its detail page, where price and stock are edited per variant.
// The edit drawers themselves are described in prose rather than driven.
//
// A step's `waitFor` runs BEFORE its actions, so the row click and the wait for
// the detail page live in separate steps.
export default defineGuide({
  slug: "update-prices-and-stock",
  dir: "offers/how-tos",
  panel: "vendor",
  title: "Update Prices and Stock",
  description: "Change the price and available stock for an offer you already sell.",
  intro:
    "Price and stock live on the offer, not the product. You change them from an offer's detail page in the Vendor Portal, where each variant has its own price and stocked quantity.",
  steps: [
    {
      title: "Open the offers list",
      body: "Go to **Products**, then **Offers** in the sidebar. Select the offer whose price or stock you want to change.",
      goto: "/offers",
      waitFor: { role: "link", name: "Create" },
      shot: "full",
    },
    {
      title: "Open the offer",
      body: "Search for the offer by product name, then select its row to open the detail page.",
      fill: [{ target: { placeholder: "Search" }, value: "Apex Pool Slides" }],
      click: { role: "row", name: /apex pool slides/i },
      shot: false,
    },
    {
      title: "Update prices and stock",
      body: "The detail page shows one row per variant. Use **Edit prices** to set a price for each of your store currencies, and **Edit stock** to set the stocked quantity at each of your locations. An offer only appears on the storefront once a variant has both a price and stock, so keep both current.",
      waitFor: { role: "heading", name: /apex pool slides/i },
      shot: "full",
    },
  ],
})
