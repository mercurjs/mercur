import { defineGuide } from "../define-guide"

// Uses the commission rule that guide-seed creates (a rate scoped to the demo
// seller) so the Commission Rules list is not empty. Editing, enabling,
// disabling, and deleting run through the row actions and are described in prose.
export default defineGuide({
  slug: "manage-a-commission-rule",
  dir: "commissions/how-tos",
  panel: "admin",
  title: "Manage a Commission Rule",
  description: "Edit, enable, disable, or delete an existing commission rule.",
  intro:
    "Commission rules are managed from the Commissions settings page. Each rule overrides the global commission for its scope, and the most specific matching rule always wins.",
  steps: [
    {
      title: "Open the commissions settings",
      body: "Go to **Settings**, then **Commissions**. Your rules appear in the **Commission Rules** section below the global commission.",
      goto: "/settings/commissions",
      waitFor: { role: "heading", name: "Commission Rules" },
      shot: "full",
    },
    {
      title: "Edit, enable, disable, or delete",
      body: "Open a rule from the **Commission Rules** list to reach its detail page, or use the row's actions menu. From there you can **Edit** the rule's scope and fee, **Enable** or **Disable** it, or **Delete** it. A disabled rule stops applying without being removed, so you can turn it back on later.",
      shot: false,
    },
  ],
})
