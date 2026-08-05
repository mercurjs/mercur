import { defineGuide } from "../define-guide"

// Screenshots the vendor order flow against the order that guide-seed places
// (see global-setup + seed-order.ts): the orders list and the order detail
// page. The specific action (mark-an-order-as-delivered) is described in prose because it runs
// through an ActionMenu and a modal that depend on order state.
//
// A step's `waitFor` runs BEFORE its actions, so the row click and the wait for
// the detail page live in separate steps.
export default defineGuide({
  slug: "mark-an-order-as-delivered",
  dir: "orders/how-tos",
  panel: "vendor",
  title: "Mark an Order as Delivered",
  description: "Record that a shipment has reached the customer.",
  intro:
    "Marking a fulfillment as delivered records that the customer has received their items. You do this from the order's detail page after the fulfillment has shipped.",
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
      title: "Mark the fulfillment as delivered",
      body: "In the **Fulfillment** section, open the actions menu for the shipped fulfillment and choose **Mark as delivered**. This completes the fulfillment lifecycle for those items.",
      shot: false,
    },
  ],
})
