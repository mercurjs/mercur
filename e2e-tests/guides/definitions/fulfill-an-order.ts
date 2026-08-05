import { defineGuide } from "../define-guide"

// Screenshots the vendor order flow against the order that guide-seed places
// (see global-setup + seed-order.ts): the orders list and the order detail
// page. The specific action (fulfill-an-order) is described in prose because it runs
// through an ActionMenu and a modal that depend on order state.
//
// A step's `waitFor` runs BEFORE its actions, so the row click and the wait for
// the detail page live in separate steps.
export default defineGuide({
  slug: "fulfill-an-order",
  dir: "orders/how-tos",
  panel: "vendor",
  title: "Fulfill an Order",
  description: "Prepare the items in an order to be sent to the customer.",
  intro:
    "Fulfilling an order reserves its items and prepares them to ship. You fulfill from an order's detail page in the Vendor Portal, choosing a stock location and the items to include.",
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
      title: "Fulfill the items",
      body: "In the **Unfulfilled Items** section, open the actions menu and choose **Fulfill items**. Choose the stock location to fulfill from, confirm the items and quantities, and optionally notify the customer. The items move to a fulfillment you can then ship.",
      shot: false,
    },
  ],
})
