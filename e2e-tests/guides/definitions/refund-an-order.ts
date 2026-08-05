import { defineGuide } from "../define-guide"

// Screenshots the vendor order flow against the order that guide-seed places
// (see global-setup + seed-order.ts): the orders list and the order detail
// page. The specific action (refund-an-order) is described in prose because it runs
// through an ActionMenu and a modal that depend on order state.
//
// A step's `waitFor` runs BEFORE its actions, so the row click and the wait for
// the detail page live in separate steps.
export default defineGuide({
  slug: "refund-an-order",
  dir: "orders/how-tos",
  panel: "vendor",
  title: "Refund an Order",
  description: "Return money to the customer for an order.",
  intro:
    "You refund a customer from the order's detail page. A refund returns part or all of a captured payment for the order.",
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
      title: "Create the refund",
      body: "In the **Payments** section, open the actions menu and choose **Refund**. Enter the amount to refund and a reason, then confirm. The refund is issued against the order's captured payment.",
      shot: false,
    },
  ],
})
