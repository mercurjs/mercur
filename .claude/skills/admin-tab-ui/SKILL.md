---
name: admin-tab-ui
description: Enforce correct tab UI patterns when creating custom tabs for TabbedForm wizards in packages/admin. Use when adding new tabs to product create, price list create, or any multi-step form wizard. Covers defineTabMeta, layout, heading levels, section structure, i18n.
---

# Admin Tab UI Patterns

Use this skill when:
- adding a custom tab to a TabbedForm (e.g., SEO tab in product create)
- creating a new multi-step wizard form with tabs
- reviewing tab code for UI consistency

**Not for**: form fields inside tabs (use `admin-form-ui` for field patterns), page structure (use `admin-page-ui`).

Before introducing custom interactive UI inside a tab, first apply `medusa-ui-conformance`.

Read next (as needed):
- `references/tab-anatomy.md` — exact code structure for tabs with sections

## Hard Rules (DO NOT)

1. Do NOT use raw `_tabMeta = { ... }` — use `defineTabMeta<SchemaType>({...})` for type safety.
2. Do NOT use `<Heading level="h1">` in tabs — use `<Heading level="h2">` (h1 is page-level only).
3. Do NOT use hardcoded strings — use `t("...")` for all labels, headings, placeholders.
4. Do NOT skip `data-testid` on the tab root and major sections.
5. Do NOT use raw `Controller` for form fields — use `Form.Field` pattern (see `admin-form-ui` skill).
6. Do NOT put all fields in one flat list — group them into sections with clear headers.
7. Do NOT forget `validationFields` in `defineTabMeta` — list fields validated on forward navigation.
8. Do NOT use `<Container>` as the only top-level wrapper inside a tab — follow the section-based layout.
9. Do NOT use `label` in tabMeta for display — use `labelKey` (i18n key) for translation support.

## Tab Layout Structure

Every tab MUST follow this outer layout:

```tsx
const MyTab = () => {
  const form = useTabbedForm()

  return (
    <div
      className="flex flex-col items-center p-16"
      data-testid="my-tab-root"
    >
      <div className="flex w-full max-w-[720px] flex-col gap-y-8">
        <Header />            {/* Heading h2 + optional description */}
        <SectionOne />         {/* Grouped fields */}
        <Divider />            {/* Optional separator */}
        <SectionTwo />         {/* More grouped fields */}
      </div>
    </div>
  )
}
```

**Fixed classes:**
- Outer: `flex flex-col items-center p-16`
- Inner: `flex w-full max-w-[720px] flex-col gap-y-8`
- Between sections: `gap-y-8` (32px)
- Between fields within section: `gap-y-6` (24px)

## Tab Header

```tsx
// Simple header
<Heading level="h2">{t("products.create.tabs.seo.header")}</Heading>

// Header with description
<div>
  <Heading level="h2">{t("products.create.tabs.seo.header")}</Heading>
  <Text size="small" className="text-ui-fg-subtle">
    {t("products.create.tabs.seo.description")}
  </Text>
</div>
```

## Tab Metadata (defineTabMeta)

```tsx
import { defineTabMeta } from "@components/tabbed-form/types"
import type { ProductCreateSchemaType } from "./schema"

MyTab._tabMeta = defineTabMeta<ProductCreateSchemaType>({
  id: "seo",
  labelKey: "products.create.tabs.seo",        // i18n key — NOT raw text
  validationFields: ["seo_title", "seo_slug"],  // fields validated on forward nav
})
```

**Rules:**
- `id` — unique tab identifier (lowercase, kebab-case)
- `labelKey` — i18n translation key (the tab label shown in the progress bar)
- `validationFields` — array of form field names validated when navigating forward from this tab
- Omit `validationFields` for full-form validation on this tab

## Section Structure

```tsx
// Section with label-header (fields grouped under a heading)
<div id="general" className="flex flex-col gap-y-6" data-testid="seo-general-section">
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
    <Form.Field control={form.control} name="seo_title" render={...} />
    <Form.Field control={form.control} name="seo_slug" render={...} />
  </div>
  <Form.Field control={form.control} name="seo_description" render={...} />
</div>

// Section with header + action button
<div className="flex flex-col gap-y-6">
  <div className="flex items-start justify-between gap-x-4">
    <div className="flex flex-col">
      <Form.Label>{t("scope.section.label")}</Form.Label>
      <Form.Hint>{t("scope.section.hint")}</Form.Hint>
    </div>
    <Button size="small" variant="secondary" type="button" onClick={handleAdd}>
      {t("actions.add")}
    </Button>
  </div>
  {/* Field list */}
</div>
```

## Section with Switch Toggle

```tsx
<div className="flex flex-col gap-y-6">
  <Heading level="h2">{t("scope.section.header")}</Heading>
  <SwitchBox
    control={form.control}
    name="enable_feature"
    label={t("scope.fields.enable_feature.label")}
    description={t("scope.fields.enable_feature.hint")}
  />
</div>
```

## Complete Tab Example (Correct)

```tsx
import { useTabbedForm } from "@mercurjs/admin"
import { defineTabMeta } from "@components/tabbed-form/types"
import { Form } from "@components/common/form"
import { Heading, Input, Textarea, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import type { ExtendedProductCreateSchemaType } from "../schema"

const SEOTab = () => {
  const { t } = useTranslation()
  const form = useTabbedForm()

  return (
    <div className="flex flex-col items-center p-16" data-testid="seo-tab">
      <div className="flex w-full max-w-[720px] flex-col gap-y-8">
        <div>
          <Heading level="h2">
            {t("products.create.tabs.seo.header")}
          </Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {t("products.create.tabs.seo.description")}
          </Text>
        </div>
        <div className="flex flex-col gap-y-6" data-testid="seo-fields-section">
          <Form.Field
            control={form.control}
            name="seo_title"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>
                  {t("products.fields.seo_title.label")}
                </Form.Label>
                <Form.Control>
                  <Input
                    {...field}
                    placeholder={t("products.fields.seo_title.placeholder")}
                  />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
          <Form.Field
            control={form.control}
            name="seo_description"
            render={({ field }) => (
              <Form.Item>
                <Form.Label optional>
                  {t("products.fields.seo_description.label")}
                </Form.Label>
                <Form.Control>
                  <Textarea
                    {...field}
                    placeholder={t("products.fields.seo_description.placeholder")}
                  />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
          <Form.Field
            control={form.control}
            name="seo_slug"
            render={({ field }) => (
              <Form.Item>
                <Form.Label optional>
                  {t("products.fields.seo_slug.label")}
                </Form.Label>
                <Form.Control>
                  <Input
                    {...field}
                    placeholder={t("products.fields.seo_slug.placeholder")}
                  />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
        </div>
      </div>
    </div>
  )
}

SEOTab._tabMeta = defineTabMeta<ExtendedProductCreateSchemaType>({
  id: "seo",
  labelKey: "products.create.tabs.seo",
  validationFields: ["seo_title", "seo_description", "seo_slug"],
})

export { SEOTab }
```

## WRONG vs RIGHT Examples

### Tab Metadata
```tsx
// WRONG — raw object, no type safety
SEOTab._tabMeta = {
  id: "seo",
  label: "SEO",
  labelKey: "SEO",
  validationFields: ["seo_title"],
}

// RIGHT — defineTabMeta with generic type
SEOTab._tabMeta = defineTabMeta<ExtendedProductCreateSchemaType>({
  id: "seo",
  labelKey: "products.create.tabs.seo",
  validationFields: ["seo_title"],
})
```

### Tab Heading
```tsx
// WRONG — h1 in a tab
<Heading level="h1">SEO Settings</Heading>

// RIGHT — h2 with i18n
<Heading level="h2">{t("products.create.tabs.seo.header")}</Heading>
```

### Tab Field
```tsx
// WRONG — raw Controller, manual error, hardcoded string
<Controller
  control={form.control}
  name="seo_title"
  render={({ field, fieldState }) => (
    <div className="flex flex-col gap-y-2">
      <Label htmlFor="seo-title">SEO Title *</Label>
      <Input id="seo-title" placeholder="Enter SEO title..." {...field} />
      {fieldState.error && (
        <span className="text-ui-fg-error text-small">
          {fieldState.error.message}
        </span>
      )}
    </div>
  )}
/>

// RIGHT — Form.Field, Form.Label, Form.ErrorMessage, i18n
<Form.Field
  control={form.control}
  name="seo_title"
  render={({ field }) => (
    <Form.Item>
      <Form.Label>{t("products.fields.seo_title.label")}</Form.Label>
      <Form.Control>
        <Input {...field} placeholder={t("products.fields.seo_title.placeholder")} />
      </Form.Control>
      <Form.ErrorMessage />
    </Form.Item>
  )}
/>
```
