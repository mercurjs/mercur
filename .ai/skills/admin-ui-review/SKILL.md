---
name: admin-ui-review
description: Review admin UI code for consistency with established patterns. Use after writing any UI code in packages/admin to catch anti-patterns — wrong form components, hardcoded strings, missing i18n, incorrect heading levels, manual error rendering, missing data-testid, raw Controller usage.
allowed-tools: Read, Grep, Glob
---

# Admin UI Review

Use this skill when:
- you just wrote new UI code in packages/admin and want to verify consistency
- reviewing a PR or diff that touches admin UI
- the user asks to check UI code quality

This skill checks ALL admin UI patterns. For implementation guidance, see:
- `admin-form-ui` — form field patterns
- `admin-page-ui` — page and section patterns
- `admin-tab-ui` — tab patterns in TabbedForm wizards

## Review Process

1. Identify all changed/new UI files in `packages/admin/src/`
2. Run each file through the checklist below
3. Report findings ordered by severity: **P1** (breaks UX/a11y), **P2** (inconsistency), **P3** (style)
4. Provide exact code fixes for each finding

## Checklist

### Form Fields (P1)

- [ ] Uses `Form.Field` (not raw `Controller` from react-hook-form)
- [ ] Uses `Form.Item` wrapper (not manual `<div className="flex flex-col gap-y-2">`)
- [ ] Uses `Form.Label` (not `<Label>` from `@medusajs/ui`)
- [ ] Uses `Form.Control` around input elements
- [ ] Uses `Form.ErrorMessage` (not manual `fieldState.error && <span>`)
- [ ] Required fields: no `*` in label text — just omit `optional` prop
- [ ] Optional fields: `<Form.Label optional>` is present
- [ ] Hints use `Form.Hint` component (not custom divs)

### Internationalization (P1)

- [ ] ALL user-visible strings use `t("...")` from `useTranslation()`
- [ ] Labels: `t("scope.fields.field_name.label")`
- [ ] Placeholders: `t("scope.fields.field_name.placeholder")`
- [ ] Headings: `t("scope.section.header")`
- [ ] Buttons: `t("actions.save")`, `t("actions.cancel")`, `t("actions.create")`, `t("actions.delete")`
- [ ] Toast messages: `t("scope.action.successToast")`
- [ ] Tab labels: `labelKey: "scope.create.tabs.tab_name"` (not raw text)
- [ ] No hardcoded English strings in JSX

### Typography (P2)

- [ ] Page title: `<Heading>` (default level, no level prop)
- [ ] Section title: `<Heading level="h2">` (inside Container/card headers)
- [ ] Tab heading: `<Heading level="h2">` (NEVER h1 in tabs)
- [ ] Drawer title: `<Heading>` inside `RouteDrawer.Header`
- [ ] Description text: `<Text size="small">` or `<Text size="small" className="text-ui-fg-subtle">`
- [ ] No raw `<h1>`, `<h2>`, `<p>` tags — use Heading/Text components

### Tab Metadata (P1 if in TabbedForm)

- [ ] Uses `defineTabMeta<SchemaType>({...})` (not raw object `{ id, label, ... }`)
- [ ] Has `labelKey` (i18n key, not `label` with raw text)
- [ ] Has `validationFields` array listing fields for this tab
- [ ] Generic type matches the form schema type

### Layout & Spacing (P2)

- [ ] Tab layout: outer `p-16`, inner `max-w-[720px]` + `gap-y-8`
- [ ] Section spacing: `gap-y-8` between sections, `gap-y-6` between fields
- [ ] Grid: `grid-cols-1 gap-4 md:grid-cols-{2,3}` (not custom breakpoints)
- [ ] Container sections: `Container className="divide-y p-0"` with header `px-6 py-4`
- [ ] Modal body: `py-16` + centered `max-w-[720px]`
- [ ] Footer buttons: `flex items-center justify-end gap-x-2`

### Inline Editable Rows / Dynamic Arrays (P2)

- [ ] Row card: `<li>` with `bg-ui-bg-component shadow-elevation-card-rest rounded-xl p-1.5`
- [ ] Outer grid: `grid grid-cols-[1fr_28px]` (content + delete button)
- [ ] Inner grid: `grid grid-cols-[min-content,1fr]` (label + input pairs horizontally)
- [ ] Row labels: `<Label size="xsmall" weight="plus" className="text-ui-fg-subtle">` (compact inline labels — NOT Form.Label)
- [ ] Row inputs: `className="bg-ui-bg-field-component"` for contrast background
- [ ] Delete button: `<IconButton size="small" variant="transparent">` with `<XMarkMini />`
- [ ] Dynamic rows: `useFieldArray` with append/remove
- [ ] Section header: `Form.Label` + `Form.Hint` + Add `<Button size="small" variant="secondary">`
- [ ] Duplicate prevention: `useWatch` + `isOptionDisabled` pattern when rows select from shared pool

### Components (P2)

- [ ] Action menus: `ActionMenu` component (not custom dropdowns)
- [ ] Delete confirmation: `usePrompt()` (not `window.confirm`)
- [ ] Empty states: `NoRecords` / `NoResults` (not custom empty divs)
- [ ] Status indicators: `StatusBadge` (not custom colored spans)
- [ ] Forms: `KeyboundForm` (not raw `<form>`)
- [ ] Close buttons: `RouteDrawer.Close` / `RouteFocusModal.Close` (not manual navigate)

### Submit Safety (P1)

- [ ] Uses `KeyboundForm` (not raw `<form>`)
- [ ] Submit handler has `isPending` guard
- [ ] Button has `isLoading={isPending}`
- [ ] Keyboard submit (Ctrl/Cmd+Enter) respects loading state
- [ ] Async dependencies (e.g., regions loading) are guarded in submit handler
- [ ] Success: `toast.success()` + `handleSuccess()` from `useRouteModal()`

### Data Loading (P2)

- [ ] `isError` → `throw error` for error boundary
- [ ] Loading state shows skeleton (not blank page)
- [ ] Data fetching in Root, passed as props to sections (not context)

### Testing (P3)

- [ ] `data-testid` on root elements, form fields, buttons
- [ ] Test IDs follow kebab-case naming: `data-testid="product-create-title-input"`

## Output Format

### When findings exist:

```
## UI Review: {file_path}

### P1 (Critical)
1. **Raw Controller** at line {N}: Uses `Controller` instead of `Form.Field`
   Fix: Replace with `Form.Field` + `Form.Item` + `Form.Label` + `Form.Control` + `Form.ErrorMessage`

2. **Hardcoded string** at line {N}: `"SEO Title *"` should be `t("products.fields.seo_title.label")`

### P2 (Inconsistency)
1. **Wrong heading level** at line {N}: `<Heading level="h1">` in tab — should be `level="h2"`

### P3 (Style)
1. **Missing data-testid** at line {N}: Tab root div missing `data-testid`
```

### When no findings:

```
## UI Review: {file_path}

No findings. Code follows all admin UI patterns.

Verified:
- Form.Field pattern ✓
- i18n strings ✓
- Correct heading levels ✓
- defineTabMeta ✓
- data-testid ✓
```

## Common Anti-Patterns (quick reference)

| Anti-Pattern | Correct Pattern |
|-------------|----------------|
| `<Controller>` | `<Form.Field>` |
| `<Label>` from @medusajs/ui | `<Form.Label>` |
| `fieldState.error && <span>` | `<Form.ErrorMessage />` |
| `"Title *"` | `<Form.Label>{t("...")}</Form.Label>` (no `optional`) |
| `_tabMeta = { id: "x" }` | `defineTabMeta<T>({ id: "x", ... })` |
| `<Heading level="h1">` in tab | `<Heading level="h2">` |
| `window.confirm(...)` | `usePrompt()` |
| `<form onSubmit>` | `<KeyboundForm onSubmit>` |
| `<div className="flex flex-col gap-y-2">` (field wrapper) | `<Form.Item>` |
| Hardcoded `"Save"` | `t("actions.save")` |
