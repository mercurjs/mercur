import { defineGuide } from "../define-guide"

// Screenshots the deterministic states of the attribute create flow: the list,
// the filled Details step, and the Type step. The Type control is a Medusa
// <Select> (Radix), not a native <select>, so the driver cannot drive it —
// choosing a type is described in prose. All targets below are verified against
// packages/admin/src/pages/attributes/...; if one breaks, generation fails
// loudly, which is the intended UI-drift signal.
//
// A step's `waitFor` runs BEFORE its actions (see guides/driver.ts), so the
// "open the form" click and the "wait for the form" gate live in separate steps,
// and the "Continue" click and the resulting Type step are also split.
//
// Note: the name field's visible label is "Title" (fields.title) and the final
// submit button reads "Save" (actions.save), so the copy mirrors the real panel
// rather than the MDX wording.
export default defineGuide({
  slug: "create-an-attribute",
  dir: "attributes/how-tos",
  panel: "admin",
  title: "Create a Product Attribute",
  description: "Add a new attribute and choose how it stores its value.",
  intro:
    "An attribute is a reusable property that sellers apply to their products, such as material or size. Creating one is a two-step form: the Details step names the attribute and sets how it behaves, and the Type step chooses how its value is stored. This guide creates an attribute from the Admin Panel.",
  steps: [
    {
      title: "Open the attributes settings",
      body: "Go to **Settings**, then **Attributes** in the sidebar. The page lists every attribute sellers can apply to their products. Select **Create** to start a new one.",
      goto: "/settings/attributes",
      waitFor: { role: "link", name: "Create" },
      highlight: { role: "link", name: "Create" },
      shot: "full",
    },
    {
      title: "Open the create form",
      body: "The attribute form opens with two steps: **Details** names the attribute and sets how it behaves, and **Type** chooses how its value is stored.",
      click: { role: "link", name: "Create" },
      shot: false,
    },
    {
      title: "Enter the details",
      body: "In **Details**, enter a **Title** for the attribute, for example Material. Optionally add a **Handle** (Mercur generates one from the title if left blank) and a **Description**. Use the switches to mark the attribute as **Required attribute**, **Filterable attribute** on the storefront, or **Global attribute** across all products. When **Global attribute** is off, choose the **Categories** it applies to.",
      waitFor: { label: "Title" },
      fill: [{ target: { label: "Title" }, value: "Material" }],
      highlight: { label: "Title" },
      shot: "viewport",
    },
    {
      title: "Continue to the type",
      body: "Select **Continue** to move to the **Type** step.",
      click: { role: "button", name: "Continue" },
      shot: false,
    },
    {
      title: "Choose the type",
      body: "Open **Type** and pick how the value is stored: **Single Select** (one value from a list), **Multi Select** (one or more values), **Unit** (a number with a unit of measurement), **Toggle** (on or off), or **Text Area** (free text). For a select type, add the possible values sellers can choose from. For **Multi Select**, you can turn on **Use for variants** so the attribute splits a product into separately purchasable variants.",
      waitFor: { role: "heading", name: "Type" },
      highlight: { testid: "attribute-create-type-trigger" },
      shot: "viewport",
    },
    {
      title: "Create the attribute",
      body: "Select **Save**. The new attribute appears in the list and is available to sellers. Only a **Multi Select** attribute can be used as a variant axis.",
      shot: false,
    },
  ],
})
