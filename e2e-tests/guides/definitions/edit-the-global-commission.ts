import { defineGuide } from "../define-guide"

// Screenshots the two deterministic states of the global-commission flow: the
// commissions settings page (with the Global Commission section) and the edit
// drawer. The section's Edit action lives behind an ActionMenu whose trigger is
// an unnamed IconButton (EllipsisHorizontal), so it is not a render-safe target;
// the menu interaction is described in prose and the drawer is opened directly
// via its route (/settings/commissions/edit-global is an Outlet child of the
// list page, so navigating there renders the drawer over the list). The Type
// field is an Ariakit Combobox, not a native <select>, so choosing it is prose
// too. All targets are verified against packages/admin/src/pages/commissions/...;
// if one breaks, generation fails loudly, which is the intended UI-drift signal.
//
// A step's `waitFor` runs BEFORE its actions (see guides/driver.ts).
export default defineGuide({
  slug: "edit-the-global-commission",
  dir: "commissions/how-tos",
  panel: "admin",
  title: "Edit the Global Commission",
  description:
    "Change the default fee your marketplace takes on every sale.",
  intro:
    "The global commission is the default fee applied to every sale across the marketplace. When no commission rule matches a sale, this is the fee that is used. You can charge either a percentage of the order total or a fixed amount. This guide edits it from the Admin Panel.",
  steps: [
    {
      title: "Open the commissions settings",
      body: "Go to **Settings**, then **Commissions** in the sidebar. The **Global Commission** section shows the current default fee, and the **Commission Rules** section lists any overrides you have created.",
      goto: "/settings/commissions",
      waitFor: { role: "heading", name: "Global Commission" },
      highlight: { role: "heading", name: "Global Commission" },
      shot: "full",
    },
    {
      title: "Open the edit window",
      body: "In the **Global Commission** section header, open the actions menu (the icon button on the right) and choose **Edit**. A side window opens with the current fee.",
      shot: false,
    },
    {
      title: "Set the fee",
      body: "In the side window, set the fee. Open **Type** and choose **Percentage** to charge a share of the order total, or **Fixed** to charge a set amount per order. Enter the **Value**: a number between 0 and 100 for a percentage, or an amount for each store currency for a fixed fee. Toggle **Tax included** to calculate commission on the total including tax, and **Shipping included** to include shipping fees; leave either off to let that portion go entirely to the store.",
      goto: "/settings/commissions/edit-global",
      waitFor: { label: "Code" },
      highlight: { testid: "global-commission-type-select" },
      shot: "viewport",
    },
    {
      title: "Save the change",
      body: "Select **Save**. The new global commission applies immediately to any sale that no rule overrides.",
      shot: false,
    },
  ],
})
