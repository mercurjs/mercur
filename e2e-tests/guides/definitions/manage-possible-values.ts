import { defineGuide } from "../define-guide"

// Screenshots the reliable, deterministic states of managing an attribute's
// possible values: the attributes list, the attribute detail with its Possible
// Values section, and the Create values form. The demo seed (apps/api/src/
// scripts/seed.ts) always creates a global Multi Select "Color" attribute with
// values, so opening that row and reaching its Possible Values section is
// deterministic. The Organize Ranking step is a drag-and-drop wizard tab, so
// reordering and saving are described in prose rather than automated.
//
// All targets are verified against packages/admin/src/pages/attributes/...; if
// one breaks, generation fails loudly, which is the intended UI-drift signal.
//
// A step's `waitFor` runs BEFORE its actions (see guides/driver.ts), so the
// "open the attribute" click and the "wait for the detail page" gate live in
// separate steps.
export default defineGuide({
  slug: "manage-possible-values",
  dir: "attributes/how-tos",
  panel: "admin",
  title: "Manage an Attribute's Possible Values",
  description:
    "Add or reorder the values sellers can choose from for a select attribute.",
  intro:
    "For select attributes (Single Select and Multi Select), the possible values are the choices sellers pick from when they fill in a product. You can add new values or change the order they appear in at any time. This guide manages the possible values of an existing attribute from the Admin Panel.",
  steps: [
    {
      title: "Open the Attributes settings",
      body: "Go to **Settings**, then **Attributes** in the sidebar. The page lists every product attribute in your catalog, along with its handle and type.",
      goto: "/settings/attributes",
      waitFor: { role: "link", name: "Create" },
      shot: "full",
    },
    {
      title: "Open a select attribute",
      body: "Choose a **Single Select** or **Multi Select** attribute from the list, since only those types have possible values. Selecting a row opens the attribute's detail page.",
      click: { role: "row", name: /color/i },
      shot: false,
    },
    {
      title: "Review the possible values",
      body: "The **Possible values** section lists each value and its rank. From here you can **Create** a new value, **Edit ranking** to change the order the values appear in, or use a value's row menu to edit or delete it.",
      waitFor: { text: "Possible values" },
      highlight: { text: "Possible values" },
      shot: "full",
    },
    {
      title: "Open the create-values form",
      body: "Select **Create** in the **Possible values** section. The form opens on the **Values** step, where you add one or more new values.",
      click: { role: "link", name: "Create" },
      shot: false,
    },
    {
      title: "Add one or more values",
      body: "Enter a value, and use **Add value** to add more rows. Drag the handle to reorder rows before continuing.",
      waitFor: { text: "Create values" },
      fill: [
        {
          target: { testid: "create-possible-value-input-0" },
          value: "Green",
        },
      ],
      shot: "viewport",
    },
    {
      title: "Organize the ranking and save",
      body: "Select **Continue** to reach **Organize Ranking**, drag the values into the order sellers should see them, then select **Save**. To change a single existing value instead, use its row menu and choose **Edit**; to reorder without adding values, use **Edit ranking**.",
      shot: false,
    },
  ],
})
