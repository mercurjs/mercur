import { defineGuide } from "../define-guide"

// Screenshots the vendor order flow against the order that guide-seed places
// (see global-setup + seed-order.ts): the orders list and the order detail
// page. The specific action (process-a-return) is described in prose because it runs
// through an ActionMenu and a modal that depend on order state.
//
// A step's `waitFor` runs BEFORE its actions, so the row click and the wait for
// the detail page live in separate steps.
export default defineGuide({
  slug: "process-a-return",
  dir: "orders/how-tos",
  panel: "vendor",
  title: "Process a Return",
  description: "Accept returned items from a customer and restock them.",
  intro:
    "A return brings items back from the customer. You start and receive returns from the order's detail page, using the return reasons you have configured.",
  steps: [
    {
      title: "Open the orders list",
      body: "Go to **Orders** in the sidebar. The page lists the orders that include your products. Select the order you want to work on.",
      goto: "/orders",
      waitFor: { role: "heading", name: "Orders" },
      shot: "full",
    },
    {
      title: "Open the order",
      body: "Selecting a row opens the order's detail page, where you manage fulfillment, shipping, payments, and returns for your part of the order.",
      click: { role: "row", name: /demo customer/i },
      shot: false,
    },
    {
      title: "Review the order",
      body: "The detail page shows the order's items, customer, payments, and fulfillment status. Work from here.",
      waitFor: { role: "heading", name: "Summary" },
      shot: "full",
    },
    {
      title: "Request and receive the return",
      body: "Open the order's actions menu and choose **Request return**. Select the items and quantities, choose a return reason and the location to receive them at, then confirm. When the items arrive, mark the return received to restock them.",
      shot: false,
    },
  ],
})
