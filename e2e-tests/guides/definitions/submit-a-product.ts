import { defineGuide } from "../define-guide"

// Screenshots the reliable, deterministic states of the vendor submit-a-product
// flow: the products list (Create highlighted) and the filled Details tab of the
// create wizard. The create form is a RouteFocusModal + TabbedForm with four
// tabs (Details, Organize, Attributes, Variants); Organize/Attributes/Variants
// depend on Ariakit Comboboxes (category, collection, type, tags) and the
// marketplace attribute catalog, none of which the driver can drive, so those
// steps and the final submit are described in prose rather than automated.
//
// Only the plain-text Title <Input> is filled. It is targeted by its unique
// placeholder ("Winter jacket") rather than by label, because Playwright's
// getByLabel does a case-insensitive substring match and "Title" would also
// match the neighbouring "Subtitle" field, tripping strict mode.
//
// A step's `waitFor` runs BEFORE its actions (see guides/driver.ts), so the
// "open the form" click and the "wait for the form" gate live in separate steps.
// All targets are verified against packages/vendor/src/pages/products/...; if one
// breaks, generation fails loudly, which is the intended UI-drift signal.
export default defineGuide({
  slug: "submit-a-product",
  dir: "products/how-tos",
  panel: "vendor",
  title: "Submit a Product",
  description:
    "Create a new product and send it to the marketplace for approval.",
  intro:
    "Adding a product is a four-step form: Details, Organize, Attributes, and Variants. When you submit it, the product is created with a Proposed status and sent to the marketplace operator for review. It goes live on the storefront once the operator approves it. This guide creates a product from the Vendor Portal.",
  steps: [
    {
      title: "Open the products list",
      body: "Go to **Products** in the sidebar. The page lists every product you have submitted, with its status. Select **Create** to start a new one.",
      goto: "/products",
      waitFor: { role: "link", name: "Create" },
      highlight: { role: "link", name: "Create" },
      shot: "full",
    },
    {
      title: "Open the create form",
      body: "The create form opens as a four-step wizard: **Details**, **Organize**, **Attributes**, and **Variants**. A footer with **Continue** advances through the steps.",
      click: { role: "link", name: "Create" },
      shot: false,
    },
    {
      title: "Enter the details",
      body: "In **Details**, enter the core information for the product. **Title** is the only required field; **Subtitle**, **Handle**, and **Description** are optional. Fill in a title, then select **Continue** to move on.",
      waitFor: {
        css: "input[data-testid='product-create-general-section-title-input'] >> nth=0",
      },
      fill: [
        {
          target: {
            css: "input[data-testid='product-create-general-section-title-input'] >> nth=0",
          },
          value: "Winter jacket",
        },
      ],
      shot: "viewport",
    },
    {
      title: "Organize and add attributes",
      body: "Select **Continue** to reach **Organize**, where you assign the product to a category and set any collection, type, or tags that apply. In **Attributes**, fill in the marketplace attributes: any attribute the operator marks as required must have a value before you can submit.",
      shot: false,
    },
    {
      title: "Add variants and submit",
      body: "In **Variants**, define any variations such as size or colour. If the product has none, a single default variant is created for you. Select **Publish** to submit the product for review, or **Save draft** to keep working on it later. Submitted products are created with a **Proposed** status; you are notified once the operator approves or requests changes.",
      shot: false,
    },
  ],
})
