---
name: admin-form-ui
description: Enforce correct form UI patterns when creating or modifying forms in packages/admin. Use when writing form fields, edit drawers, create modals, or any form-based UI in the admin package. Covers Form.Field pattern, labels, errors, hints, grids, submit guards, drawer/modal structure.
---

# Admin Form UI Patterns

Use this skill when:
- creating new form fields in the admin
- building edit forms in RouteDrawer
- building create forms in RouteFocusModal
- adding fields to existing forms
- reviewing form code for UI consistency

**Not for**: creating tabbed wizard forms (use `admin-tab-ui`), creating pages/sections (use `admin-page-ui`).

Before introducing new custom field wrappers, overlays, selectors, or interactive form primitives, first apply `medusa-ui-conformance`.

Read next (as needed):
- `references/form-field-patterns.md` — exact code examples for every field type
- `references/drawer-modal-patterns.md` — RouteDrawer and RouteFocusModal form structure

## Core Rule

**NEVER** use raw `Controller` from react-hook-form or raw `Label` from `@medusajs/ui` in admin forms. Always use the `Form.*` compound components.

## Form Field Pattern (mandatory)

Every form field MUST follow this structure:

```tsx
<Form.Field
  control={form.control}
  name="field_name"
  render={({ field }) => (
    <Form.Item>
      <Form.Label>{t("scope.fields.field_name.label")}</Form.Label>
      <Form.Control>
        <Input {...field} />
      </Form.Control>
      <Form.ErrorMessage />
    </Form.Item>
  )}
/>
```

## Hard Rules (DO NOT)

1. Do NOT use raw `Controller` — always use `Form.Field` (wraps Controller with context).
2. Do NOT use `<Label>` from `@medusajs/ui` — use `<Form.Label>` (supports `optional`, `tooltip`, accessibility).
3. Do NOT manually render errors (`fieldState.error && <span>`) — use `<Form.ErrorMessage />` (auto-reads form state).
4. Do NOT mark required fields with `*` in text — omit `optional` prop (absence = required). Use `<Form.Label optional>` for optional fields.
5. Do NOT use hardcoded strings — use `t("...")` from `useTranslation()` for all user-visible text.
6. Do NOT use custom `<div className="flex flex-col gap-y-2">` wrappers around fields — use `<Form.Item>` (renders `flex flex-col space-y-2`).
7. Do NOT skip `data-testid` on form fields and buttons.
8. Do NOT skip `<Form.ErrorMessage />` — include it even if you think validation won't fail.
9. Do NOT use `window.confirm` — use `usePrompt()` for confirmations.
10. Do NOT use raw `<form>` — use `<KeyboundForm>` for Ctrl/Cmd+Enter support.
11. Do NOT skip `isPending` guard on submit — both button `isLoading` AND keyboard submit must check it.
12. Do NOT hand-roll custom input components — ALWAYS check `packages/admin/src/components/inputs/` and the Field Types Reference table below FIRST. If a component exists (HandleInput, ChipInput, SwitchBox, etc.), use it. Never create a custom wrapper for something that already has a reusable component.
13. Do NOT call `useRouteModal()` outside of `RouteDrawer` or `RouteFocusModal` — it requires the provider. Split into outer shell (RouteDrawer + data fetch) and inner form component (useRouteModal + form logic). See RouteDrawer Form Structure below.

## Form.Label Features

```tsx
// Required field (default — no special markup needed)
<Form.Label>{t("fields.title")}</Form.Label>

// Optional field
<Form.Label optional>{t("fields.subtitle")}</Form.Label>

// With tooltip
<Form.Label tooltip={t("fields.handle.tooltip")}>{t("fields.handle")}</Form.Label>

// Optional + tooltip
<Form.Label optional tooltip={t("fields.sku.tooltip")}>{t("fields.sku")}</Form.Label>
```

## Grid Layouts

```tsx
// 2-column grid
<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
  <Form.Field ... />
  <Form.Field ... />
</div>

// 3-column grid
<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
  <Form.Field ... />
  <Form.Field ... />
  <Form.Field ... />
</div>

// Label-left layout (label + hint in left column, field in right)
<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
  <div>
    <Form.Label optional>{t("fields.shipping_profile.label")}</Form.Label>
    <Form.Hint><Trans i18nKey="fields.shipping_profile.hint" /></Form.Hint>
  </div>
  <Form.Field control={form.control} name="shipping_profile_id" render={...} />
</div>
```

## Form.Hint Usage

```tsx
// Below a label (inside Form.Item or standalone)
<Form.Label optional>{t("fields.sales_channels.label")}</Form.Label>
<Form.Hint><Trans i18nKey="fields.sales_channels.hint" /></Form.Hint>

// In header with action button
<div className="flex items-start justify-between gap-x-4">
  <div className="flex flex-col">
    <Form.Label>{t("fields.options.label")}</Form.Label>
    <Form.Hint>{t("fields.options.hint")}</Form.Hint>
  </div>
  <Button size="small" variant="secondary" type="button" onClick={handleAdd}>
    {t("actions.add")}
  </Button>
</div>
```

## Submit Pattern

```tsx
const { mutateAsync, isPending } = useMutation()

const handleSubmit = form.handleSubmit(async (data) => {
  // Guard for async dependencies
  if (isRegionsPending) return

  await mutateAsync(data, {
    onSuccess: () => {
      toast.success(t("scope.successToast"))
      handleSuccess()  // from useRouteModal()
    },
  })
})

return (
  <KeyboundForm onSubmit={handleSubmit}>
    {/* ... form content ... */}
    <Button type="submit" isLoading={isPending}>
      {t("actions.save")}
    </Button>
  </KeyboundForm>
)
```

## RouteDrawer Form Structure

```tsx
<RouteDrawer>
  <RouteDrawer.Header>
    <Heading>{t("scope.edit.header")}</Heading>
  </RouteDrawer.Header>
  <RouteDrawer.Form form={form}>
    <KeyboundForm onSubmit={handleSubmit}>
      <RouteDrawer.Body>
        {/* Form fields here */}
      </RouteDrawer.Body>
      <RouteDrawer.Footer>
        <div className="flex items-center justify-end gap-x-2">
          <RouteDrawer.Close asChild>
            <Button variant="secondary">{t("actions.cancel")}</Button>
          </RouteDrawer.Close>
          <Button type="submit" isLoading={isPending}>
            {t("actions.save")}
          </Button>
        </div>
      </RouteDrawer.Footer>
    </KeyboundForm>
  </RouteDrawer.Form>
</RouteDrawer>
```

## RouteFocusModal Form Structure

```tsx
<RouteFocusModal>
  <RouteFocusModal.Form form={form}>
    <KeyboundForm onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
      <RouteFocusModal.Header />
      <RouteFocusModal.Body className="flex flex-1 flex-col items-center overflow-y-auto py-16">
        <div className="flex w-full max-w-[720px] flex-col gap-y-8">
          <div>
            <Heading>{t("scope.create.header")}</Heading>
            <Text size="small">{t("scope.create.hint")}</Text>
          </div>
          {/* Form fields (grids) */}
        </div>
      </RouteFocusModal.Body>
      <RouteFocusModal.Footer>
        <div className="flex items-center justify-end gap-x-2">
          <RouteFocusModal.Close asChild>
            <Button variant="secondary">{t("actions.cancel")}</Button>
          </RouteFocusModal.Close>
          <Button type="submit" isLoading={isPending}>
            {t("actions.create")}
          </Button>
        </div>
      </RouteFocusModal.Footer>
    </KeyboundForm>
  </RouteFocusModal.Form>
</RouteFocusModal>
```

## Field Types Reference

| Field Type | Component | Import |
|------------|-----------|--------|
| Text input | `<Input {...field} />` | `@medusajs/ui` |
| Textarea | `<Textarea {...field} />` | `@medusajs/ui` |
| Select/Combobox | `<Combobox {...field} options={...} />` | local |
| Switch | `<SwitchBox control={form.control} name="..." label="..." description="..." />` | local |
| Number | `<Input type="number" {...field} onChange={...} />` | `@medusajs/ui` |
| Handle/Slug | `<HandleInput {...field} />` | local |
| Chips (tags) | `<ChipInput {...field} variant="contrast" />` | local |
| File upload | `<FileUpload />` | local |

## Imports Checklist

```tsx
// Form components — from local form module
import { Form } from "@components/common/form"        // Form.Field, Form.Item, Form.Label, etc.
import { KeyboundForm } from "@components/utilities/keybound-form"
import { SwitchBox } from "@components/common/switch-box"
import { HandleInput } from "@components/inputs/handle-input"

// UI primitives — from @medusajs/ui
import { Input, Textarea, Heading, Text, Button } from "@medusajs/ui"

// Modal/drawer — from local route components
import { RouteDrawer, useRouteModal } from "@components/modals"
import { RouteFocusModal } from "@components/modals"

// i18n
import { useTranslation, Trans } from "react-i18next"

// Hooks
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
```
