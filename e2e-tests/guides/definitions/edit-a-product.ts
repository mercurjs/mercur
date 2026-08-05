import { defineGuide } from "../define-guide"

// Opens an existing seeded product ("Apex Pool Slides", from
// apps/api/src/scripts/seed-catalog.ts) from the vendor products list and shows
// its detail page, where edits are made section by section. Editing fields is
// described in prose: each edit opens its own drawer and submits a change
// request, which is not worth driving field by field for a screenshot.
//
// A step's `waitFor` runs BEFORE its actions, so the row click and the wait for
// the detail page live in separate steps.
export default defineGuide({
  slug: "edit-a-product",
  dir: "products/how-tos",
  panel: "vendor",
  title: "Edit a Product",
  description: "Change a product you have already submitted to the marketplace.",
  intro:
    "You edit a product from its detail page in the Vendor Portal. Every change is submitted to the marketplace as a change request, so your edits take effect once an operator approves them.",
  steps: [
    {
      title: "Open the products list",
      body: "Go to **Products** in the sidebar. The page lists every product you sell, with its status. Select the product you want to edit.",
      goto: "/products",
      waitFor: { role: "link", name: "Create" },
      shot: "full",
    },
    {
      title: "Open the product",
      body: "Search for the product by name, then select its row to open the detail page.",
      fill: [{ target: { placeholder: "Search" }, value: "Apex Pool Slides" }],
      click: { role: "row", name: /apex pool slides/i },
      shot: false,
    },
    {
      title: "Edit the product",
      body: "The detail page groups the product into sections: general information, media, options, variants, and organization. Each section has an **Edit** action that opens a drawer for those fields. Make your change and save it. The edit is submitted as a change request and appears as pending until an operator reviews it.",
      waitFor: { role: "heading", name: /apex pool slides/i },
      shot: "full",
    },
  ],
})
