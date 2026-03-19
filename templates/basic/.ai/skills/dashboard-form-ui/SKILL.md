---
name: dashboard-form-ui
description: Create or modify forms in admin or vendor dashboards in the Mercur basic starter using stable form structure, validation, submission guards, and dashboard UI conventions.
---

# Dashboard Form UI

Use this skill when:
- adding or editing a form in admin or vendor
- wiring page-level create or edit flows
- reviewing submission, validation, or field structure

Applies equally to **admin** and **vendor** dashboards.

## Core rule

Prefer the existing Mercur form pattern already present in the screen or package. Do not introduce a parallel form system just because it is locally convenient.

Before introducing custom field wrappers, selectors, overlays, or other interactive form UI, apply `medusa-ui-conformance`.

## Required imports

Forms use `react-hook-form` with `zod` validation and components from `@mercurjs/dashboard-shared` and `@medusajs/ui`.

## Standard form page structure

A create/edit form page is a `RouteFocusModal` drawer route:

```tsx
// The page default export wraps RouteFocusModal (provides context)
const CreatePage = () => (
  <RouteFocusModal>
    <CreateForm />
  </RouteFocusModal>
);
export default CreatePage;

// The form component uses RouteFocusModal.Form, .Header, .Body, .Footer
const CreateForm = () => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();
  const form = useForm({ defaultValues: { ... }, resolver: zodResolver(schema) });

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(data, {
      onSuccess: () => { toast.success("Created"); handleSuccess("/route"); },
      onError: (error) => toast.error(error.message),
    });
  });

  return (
    <RouteFocusModal.Form form={form}>
      <form onSubmit={handleSubmit} className="flex h-full flex-col overflow-hidden">
        <RouteFocusModal.Header />
        <RouteFocusModal.Body className="flex size-full flex-col items-center p-16">
          <div className="flex w-full max-w-[720px] flex-col gap-y-8">
            {/* Heading, fields */}
          </div>
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer>
          <RouteFocusModal.Close asChild>
            <Button size="small" variant="secondary">{t("actions.cancel")}</Button>
          </RouteFocusModal.Close>
          <Button size="small" variant="primary" type="submit" isLoading={isPending}>
            {t("actions.create")}
          </Button>
        </RouteFocusModal.Footer>
      </form>
    </RouteFocusModal.Form>
  );
};
```

## Two form containers

### RouteFocusModal — for create flows
Full-screen modal overlay. Used for creating new entities.
- Page wraps `RouteFocusModal` (provides context), form uses `.Form`, `.Header`, `.Body`, `.Footer`, `.Close`
- `useRouteModal()` must be called inside the provider
- If using `TabbedForm`, do NOT use `RouteFocusModal.Form` — `TabbedForm` renders it internally. See `dashboard-tab-ui`.

### RouteDrawer — for edit flows
Side panel from the right. Used for editing existing entities.
- Same pattern: page wraps `RouteDrawer`, form uses `.Form`, `.Header`, `.Title`, `.Description`, `.Body`, `.Footer`, `.Close`
- **Critical:** Edit drawer route must use `@` prefix directory (e.g. `[id]/@edit/page.tsx`) to create a parallel route. Without `@`, the detail page unmounts. See `dashboard-page-ui` for full pattern.

## Key components

- `RouteFocusModal` / `RouteDrawer` — wraps the page, provides modal provider context
- `.Form` — wraps the form, connects react-hook-form
- `.Header` — modal/drawer header (RouteFocusModal has close button built in; RouteDrawer uses `.Title` and `.Description`)
- `.Body` — scrollable content area
- `.Footer` — sticky footer with actions
- `.Close` — closes the modal/drawer (use with `asChild` on Cancel button)
- `Form.Field` / `Form.Item` / `Form.Label` / `Form.Control` / `Form.ErrorMessage` — form field composition
- `Form.Label optional` — marks a field as optional in the UI

## Hard rules

1. Do not hardcode labels, hints, or button text; use i18n.
2. Do not ship forms without explicit validation behavior.
3. Do not rely only on button disabled state; submission guards must also protect non-button submit paths.
4. Do not flatten large forms into one unstructured wall of fields.
5. Do not add ad hoc field wrappers when the existing project already has a preferred form composition.
6. Do not use `useRouteModal()` outside a `RouteFocusModal` provider.

## Preferred patterns

- Use schema-driven validation (`zod` + `zodResolver`) when the form is non-trivial.
- Group related fields together and keep labels, hints, and errors predictable.
- Preserve loading, pending, success, and failure behavior in submission flows.
- When extending an existing form, follow its established wrapper, field, and footer shape.

## When to switch skills

- If the task is mainly page structure, use `dashboard-page-ui`.
- If the task is mainly a tabbed wizard, use `dashboard-tab-ui`.

## Verification

- confirm validation fires on the expected fields
- confirm the submit path is guarded during pending async work
- confirm translated copy, hints, and errors remain coherent
- run app build or lint after non-trivial form changes
