import { defineGuide } from "../define-guide"

// Screenshots the reliable, deterministic states of the commission-rule flow:
// the list, the create form, and the filled Details step. The scope and fee
// selectors are Ariakit Comboboxes (not native <select>), and advancing the
// wizard needs valid scope dimensions, so those two actions are described in
// prose rather than automated. All targets below are verified against
// packages/admin/src/pages/commissions/...; if one breaks, generation fails
// loudly, which is the intended UI-drift signal.
//
// A step's `waitFor` runs BEFORE its actions (see guides/driver.ts), so the
// "open the form" click and the "wait for the form" gate live in separate steps.
export default defineGuide({
  slug: "create-a-commission-rule",
  dir: "commissions/how-tos",
  panel: "admin",
  title: "Create a Commission Rule",
  description:
    "Override the global commission for a specific store, product type, or category.",
  intro:
    "A commission rule overrides the global commission for a specific scope, such as a single store or a product category. When several rules could apply to a sale, the most specific rule wins. If no rule matches, the global commission is used. This guide creates a rule from the Admin Panel.",
  steps: [
    {
      title: "Open the commissions settings",
      body: "Go to **Settings**, then **Commissions** in the sidebar. The page shows your global commission and any rules you have created. Select **Create** in the **Commission Rules** section to start a new one.",
      goto: "/settings/commissions",
      waitFor: { testid: "commissions-page" },
      highlight: { role: "link", name: "Create" },
      shot: "full",
    },
    {
      title: "Open the create form",
      body: "The rule form opens with two steps: **Details** defines what the rule applies to, and **Commission** sets the fee.",
      click: { role: "link", name: "Create" },
      shot: false,
    },
    {
      title: "Enter the rule details",
      body: "In **Details**, enter a **Title** you will recognise later and a unique **Code**. Then open **Type** to choose the scope: a store, a product type, a category, or a store combined with one of those. Depending on the scope, select the specific stores, product types, or categories the rule applies to.",
      waitFor: { testid: "commission-rule-code-input" },
      fill: [
        { target: { label: "Title" }, value: "Electronics stores" },
        {
          target: { testid: "commission-rule-code-input" },
          value: "electronics-stores",
        },
      ],
      highlight: { testid: "commission-rule-scope-type-select" },
      shot: "viewport",
    },
    {
      title: "Set the fee",
      body: "Select **Continue**. In **Commission**, choose **Percentage** to charge a share of each order total, or **Fixed** to charge a set amount per order. Enter the **Value**: a number between 0 and 100 for a percentage, or an amount per store currency for a fixed fee. Set **Tax included** and **Shipping included** as needed, the same way as the global commission.",
      shot: false,
    },
    {
      title: "Save the rule",
      body: "Select **Save**. The new rule appears in the **Commission Rules** list and applies immediately to matching sales.",
      shot: false,
    },
  ],
})
