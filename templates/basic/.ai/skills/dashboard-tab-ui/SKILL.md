---
name: dashboard-tab-ui
description: Create or modify tabbed workflows in admin or vendor dashboards in the Mercur basic starter using stable tab structure, validation scope, and i18n-aware wizard conventions.
---

# Dashboard Tab UI

Use this skill when:
- adding a custom tab to a tabbed flow in admin or vendor
- extending a multi-step wizard
- reviewing tab layout, validation scope, or navigation behavior

Applies equally to **admin** and **vendor** dashboards.

Before introducing custom interactive UI inside a tab, apply `medusa-ui-conformance`.

## Required component

Always use `TabbedForm` from `@mercurjs/dashboard-shared` — do NOT build custom tab navigation with `ProgressTabs` from `@medusajs/ui` directly.

## TabbedForm API

`TabbedForm` handles internally: `RouteFocusModal.Form`, `ProgressTabs` in the header navbar, `KeyboundForm`, and a default footer with Cancel/Continue/Save.

### Props

- `form` — `UseFormReturn` from `react-hook-form`
- `onSubmit` — submit handler from `form.handleSubmit()`
- `isLoading` (optional) — disables submit button
- `footer` (optional) — custom footer render prop; omit to use the default

### TabbedForm.Tab props

- `id` (string, required) — unique tab identifier
- `label` (string, required) — display label in the tab bar
- `validationFields` (FieldPath[], optional) — fields to validate on this tab
- `isVisible` ((form) => boolean, optional) — dynamic tab visibility

## Page structure

The create page wraps `RouteFocusModal` around the form component:

```tsx
const CreatePage = () => (
  <RouteFocusModal>
    <CreateForm />
  </RouteFocusModal>
);
export default CreatePage;
```

The form component renders `TabbedForm` directly — do NOT nest it inside another `RouteFocusModal.Form`:

```tsx
const CreateForm = () => {
  const { handleSuccess } = useRouteModal();
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { ... } });
  const handleSubmit = form.handleSubmit(async (data) => {
    handleSuccess("/entity-route");
  });

  return (
    <TabbedForm form={form} onSubmit={handleSubmit}>
      <TabbedForm.Tab id="general" label="General">
        <div className="flex flex-col gap-y-4 p-8">
          {/* Form.Field components */}
        </div>
      </TabbedForm.Tab>
    </TabbedForm>
  );
};
```

## Known issue: validation blocks Continue

`TabbedForm`'s internal `onNext` calls `form.trigger()` without arguments, which validates the **entire** form — not just the active tab's fields. Required fields on later tabs will prevent Continue from working.

**Workaround:** Only mark fields as required (`.min(1)`) if they are on the first tab. Use `.optional()` for fields on later tabs and validate at submit time if needed.

## Hard rules

1. Do not hardcode tab labels; use i18n-aware metadata.
2. Do not put all fields into one flat tab without section structure.
3. Do not build custom tab UI with `ProgressTabs` directly — use `TabbedForm`.
4. Do not wrap `TabbedForm` in `RouteFocusModal.Form` — it does this internally.
5. Do not provide a custom `footer` unless you need to change button labels — the default footer handles Cancel/Continue/Save correctly.
6. Do not add required zod validation to fields on tabs beyond the first (see known issue above).
7. Do not break keyboard or submit behavior when adding a tab.
8. Do not assume tabs are static if visibility depends on form state.

## Preferred patterns

- Give each tab a single clear purpose.
- Keep a visible header (`Heading level="h2"`) and grouped sections inside each tab body.
- Add `className="p-8"` to the wrapping div inside each `TabbedForm.Tab` for consistent spacing.
- Use `Form.Field` / `Form.Item` / `Form.Label` / `Form.Control` / `Form.ErrorMessage` from `@mercurjs/dashboard-shared`.
- Use `zodResolver` with `react-hook-form` for schema validation.

## When to switch skills

- Page shell work -> `dashboard-page-ui`
- Form field work without wizard concerns -> `dashboard-form-ui`

## Verification

- confirm Continue navigates to the next tab (check that later-tab fields are not required in zod schema)
- confirm tab labels and content are translation-ready
- confirm dynamic visibility does not leave the flow in an invalid state
- run app build or lint after non-trivial tab work
