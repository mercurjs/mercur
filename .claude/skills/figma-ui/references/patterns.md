# Patterns (how the pieces fit together)

The structural rules for Mercur dashboard pages. These are conventions, not lint rules — follow them so generated code reads like the rest of the codebase. Each pattern says what to do and, where it's a common mistake, what **not** to do.

## Sections do X

Every section on a page is a `Container` with the standard shell:

```tsx
<Container className="divide-y p-0" data-testid="customer-general-section">
  <div className="flex items-center justify-between px-6 py-4">
    <Heading>{t("customers.general.title")}</Heading>
    <div className="flex items-center gap-x-2">
      <StatusBadge {...statusProps}>{statusText}</StatusBadge>
      <ActionMenu groups={[...]} />
    </div>
  </div>
  {/* rows, each px-6 py-4; label/value rows use SectionRow */}
</Container>
```

- **Do**: `className="divide-y p-0"`; header row `flex items-center justify-between px-6 py-4`; `<Heading>` on the left; status badge + `ActionMenu` on the right.
- **Don't**: a `Container` for a section without `p-0` (you'll get default padding and misaligned rows); raw `<h2>`/`<h3>` instead of `<Heading>`; hand-built dropdowns instead of `ActionMenu`.

## Modals do X

- **Create** = `RouteFocusModal` host + `TabbedForm`. The page's `Root` opens the modal on mount and renders defaults unless children are passed:

  ```tsx
  const Root = ({ children }) => (
    <RouteFocusModal>
      <RouteFocusModal.Title asChild><span className="sr-only">{t("...")}</span></RouteFocusModal.Title>
      {Children.count(children) > 0 ? children : <CreateXForm />}
    </RouteFocusModal>
  )
  ```

  Each tab is a component whose `Root` carries `Root._tabMeta = defineTabMeta<Schema>({ id, labelKey, validationFields })`. Tab body: `flex flex-col items-center p-16` → inner `flex w-full max-w-[720px] flex-col gap-y-8`.

- **Edit** = `RouteDrawer` host + `RouteDrawer.Form` + `KeyboundForm`:

  ```tsx
  <RouteDrawer>
    <RouteDrawer.Header>
      <RouteDrawer.Title asChild><Heading>{t("domain.edit.header")}</Heading></RouteDrawer.Title>
      <RouteDrawer.Description className="sr-only">{t("domain.edit.description")}</RouteDrawer.Description>
    </RouteDrawer.Header>
    {ready && <EditXForm entity={entity} />}   {/* ready = !isPending && !!entity */}
  </RouteDrawer>
  ```

  Drawer body: `flex flex-col gap-y-4`. Footer: secondary **Cancel** (`RouteDrawer.Close`) + primary **Save** (`isLoading={isPending}`). Close/redirect via `useRouteModal().handleSuccess()`.

- **Don't**: render raw `FocusModal` / `Drawer` from `@medusajs/ui` for a page create/edit surface; nest a raw modal inside another (use `StackedFocusModal` / `StackedDrawer`).

## Forms do X

- Every field: `Form.Field` → `Form.Item` → `Form.Label` / `Form.Control` / `Form.ErrorMessage`. Help text via `Form.Hint`. Never render error text by hand (`Form.ErrorMessage` reads RHF).
- React Hook Form + `zodResolver(schema)`; infer type with `z.infer`. One schema per form.
- Wrap the `<form>` in `KeyboundForm` so Cmd/Ctrl+Enter submits.
- Selects: destructure `{ ref, onChange, ...field }`, pass `onValueChange={onChange}` and `dir={useDocumentDirection()}`.
- Nullable/optional values go through `transformNullableFormData` / `transformNullableFormNumber` before the mutation.
- **Don't**: raw `<input>`/`<textarea>`/`<select>`; react-hook-form `<Controller>` directly. Use the primitives in `components.md`. (Rare justified exceptions — data-grid cells, custom comboboxes — exist in the codebase, but new page code should not need them.)

## Destructive actions do Y

Extract to a hook `pages/<domain>/common/hooks/use-delete-<entity>-action.tsx`:

1. `usePrompt()` (`@medusajs/ui`) with i18n `title` / `description` / `confirmText` / `cancelText`.
2. Await confirmation → call the mutation.
3. `toast.success` / `toast.error`.
4. Navigate back on success.

Place the delete action **last**, in its own `ActionMenu` group (edit/navigation actions first). **Don't** inline a confirmation modal.

## Compound-component export shape

Every page exports a `Root` assembled with named parts, so downstream code can override slots:

```tsx
export const CategoryListPage = Object.assign(Root, {
  Header: CategoryListHeader,
  HeaderTitle: CategoryListTitle,
  HeaderActions: CategoryListActions,
  DataTable: CategoryListDataTable,
})
```

`Root` uses `Children.count(children) > 0 ? children : <DefaultContent />` so it renders defaults when used as-is but exposes every part.

## Data fetching

- All HTTP via the typed SDK (`sdk.admin.*` / `sdk.vendor.*`) in `hooks/api/<domain>.tsx`. Never call `fetch` from a page.
- One hook file per domain: `useX` (detail), `useXList` (list), `useCreate/Update/DeleteX` (mutations). Build keys with `queryKeysFactory("x")`.
- Mutations invalidate `lists()` / `details()` / `detail(id)` and forward `onSuccess`.
- Detail pages seed with a `loader.ts` → `initialData`. Throw on `isError` (`if (isError) throw error`) so `ErrorBoundary` catches it. Use `Skeleton` / `TwoColumnPageSkeleton` while loading.

## Tables

`DataTable` + `useDataTable`, page size 20, `keepPreviousData`. Build columns with `createColumnHelper<Row>()` + an `actions` display column rendering `ActionMenu`. Row navigation via `navigateTo={(row) => row.id}`. Empty states: `NoResults` (filtered) / `NoRecords` (no data).

## Internationalization

- Every visible string via `useTranslation()` / `t(key)`. No literal UI strings.
- Add keys to `packages/<pkg>/src/i18n/translations/en.json` **first** (English is canonical). Common namespaces: `actions.*`, `fields.*`, `general.*`, `<domain>.domain` (sidebar), `<domain>.<verb>.header|hint|successToast|description`.

## Test ids

Every interactive element (buttons, inputs, selects, action menus, headings, sections, modals) carries a kebab-case `data-testid` scoped to the page/section, e.g. `customer-general-section-header`, `create-customer-form-first-name-input`.

## Do-not list (quick scan)

- No component library other than `@medusajs/ui` / `@mercurjs/dashboard-shared`.
- No icon pack other than `@medusajs/icons`.
- No raw `<input>` / `<textarea>` / `<select>` / `<Controller>` in forms.
- No raw `FocusModal` / `Drawer` for page create/edit surfaces.
- No hardcoded `#hex`, `rgb()/rgba()`, or palette utilities (`text-gray-*`, `bg-slate-*`) — use Medusa UI tokens (`spacing.md`).
- No arbitrary spacing values where the scale has one (`gap-y-3/4/8`, `px-6 py-4`, `p-16`).
- No literal UI strings — always `t(...)`.
