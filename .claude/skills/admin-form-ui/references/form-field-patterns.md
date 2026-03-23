# Form Field Patterns — Exact Code Examples

## Standard Text Input

```tsx
<Form.Field
  control={form.control}
  name="title"
  render={({ field }) => (
    <Form.Item data-testid="product-create-title">
      <Form.Label data-testid="product-create-title-label">
        {t("products.fields.title.label")}
      </Form.Label>
      <Form.Control data-testid="product-create-title-control">
        <Input
          {...field}
          placeholder={t("products.fields.title.placeholder")}
          data-testid="product-create-title-input"
        />
      </Form.Control>
      <Form.ErrorMessage />
    </Form.Item>
  )}
/>
```

## Optional Text Input with Tooltip

```tsx
<Form.Field
  control={form.control}
  name="handle"
  render={({ field }) => (
    <Form.Item>
      <Form.Label
        tooltip={t("products.fields.handle.tooltip")}
        optional
      >
        {t("fields.handle")}
      </Form.Label>
      <Form.Control>
        <HandleInput
          {...field}
          placeholder={t("products.fields.handle.placeholder")}
        />
      </Form.Control>
      <Form.ErrorMessage />
    </Form.Item>
  )}
/>
```

## Textarea

```tsx
<Form.Field
  control={form.control}
  name="description"
  render={({ field }) => (
    <Form.Item>
      <Form.Label optional>
        {t("products.fields.description.label")}
      </Form.Label>
      <Form.Control>
        <Textarea
          {...field}
          placeholder={t("products.fields.description.placeholder")}
        />
      </Form.Control>
      <Form.ErrorMessage />
    </Form.Item>
  )}
/>
```

## Combobox (Select with Search)

```tsx
<Form.Field
  control={form.control}
  name="type_id"
  render={({ field }) => (
    <Form.Item>
      <Form.Label optional>
        {t("products.fields.type.label")}
      </Form.Label>
      <Form.Control>
        <Combobox
          {...field}
          options={types.options}
          searchValue={types.searchValue}
          onSearchValueChange={types.onSearchValueChange}
          fetchNextPage={types.fetchNextPage}
        />
      </Form.Control>
      <Form.ErrorMessage />
    </Form.Item>
  )}
/>
```

## SwitchBox (Toggle)

```tsx
<SwitchBox
  control={form.control}
  name="discountable"
  label={t("products.fields.discountable.label")}
  description={t("products.fields.discountable.hint")}
  optional
/>
```

## Number Input

```tsx
<Form.Field
  control={form.control}
  name={`variants.${variantIndex}.inventory.${inventoryIndex}.required_quantity`}
  render={({ field: { onChange, value, ...field } }) => (
    <Form.Item>
      <Form.Control>
        <Input
          type="number"
          className="bg-ui-bg-field-component"
          min={0}
          value={value}
          onChange={(e) => {
            const value = e.target.value
            if (value === "") {
              onChange(null)
            } else {
              onChange(Number(value))
            }
          }}
          {...field}
        />
      </Form.Control>
      <Form.ErrorMessage />
    </Form.Item>
  )}
/>
```

## ChipInput (Tags / Comma-Separated Values)

```tsx
<Controller
  control={form.control}
  name={`options.${index}.values`}
  render={({ field: { onChange, ...field } }) => (
    <ChipInput
      {...field}
      variant="contrast"
      onChange={(values) => onChange(values)}
      placeholder={t("products.fields.options.variantions.placeholder")}
    />
  )}
/>
```

Note: ChipInput is an exception where raw `Controller` may be used because it's a specialized component that doesn't fit the `Form.Item` wrapper pattern.

## Array Field with Add Button

```tsx
<Form.Field
  control={form.control}
  name="options"
  render={() => (
    <Form.Item>
      <div className="flex items-start justify-between gap-x-4">
        <div className="flex flex-col">
          <Form.Label>
            {t("products.create.variants.productOptions.label")}
          </Form.Label>
          <Form.Hint>
            {t("products.create.variants.productOptions.hint")}
          </Form.Hint>
        </div>
        <Button
          size="small"
          variant="secondary"
          type="button"
          onClick={handleAddOption}
        >
          {t("actions.add")}
        </Button>
      </div>
      <ul className="flex flex-col gap-y-4">
        {options.fields.map((option, index) => (
          <li
            key={option.id}
            className="bg-ui-bg-component shadow-elevation-card-rest rounded-xl p-3"
          >
            {/* Row content: input + delete button */}
          </li>
        ))}
      </ul>
    </Form.Item>
  )}
/>
```

## ChipGroup (Selected Items Display)

```tsx
<Form.Field
  control={form.control}
  name="sales_channels"
  render={() => (
    <Form.Item>
      <div className="flex items-start justify-between gap-x-4">
        <div>
          <Form.Label optional>
            {t("products.fields.sales_channels.label")}
          </Form.Label>
          <Form.Hint>
            <Trans i18nKey="products.fields.sales_channels.hint" />
          </Form.Hint>
        </div>
        <StackedFocusModal.Trigger asChild>
          <Button size="small" variant="secondary" type="button">
            {t("actions.add")}
          </Button>
        </StackedFocusModal.Trigger>
      </div>
      <Form.Control className="mt-0">
        {fields.length > 0 && (
          <ChipGroup onClearAll={handleClearAll} onRemove={handleRemove} className="py-4">
            {fields.map((field, index) => (
              <ChipGroup.Chip key={field.key} index={index}>
                {field.name}
              </ChipGroup.Chip>
            ))}
          </ChipGroup>
        )}
      </Form.Control>
    </Form.Item>
  )}
/>
```

## Inline Editable Row (Dynamic Array with Grid Layout)

Used for inventory kits, variant options, price list items — any dynamic list where each row
has multiple inline fields (label + input pairs) and a delete button.

### Row Structure

```tsx
<li className="bg-ui-bg-component shadow-elevation-card-rest grid grid-cols-[1fr_28px] items-center gap-1.5 rounded-xl p-1.5">
  {/* Left: field pairs in horizontal grid */}
  <div className="grid grid-cols-[min-content,1fr] items-center gap-1.5">
    {/* Label + Input pair 1 */}
    <div className="flex items-center px-2 py-1.5">
      <Label size="xsmall" weight="plus" className="text-ui-fg-subtle">
        {t("fields.item")}
      </Label>
    </div>
    <Form.Field
      control={form.control}
      name={`variants.${variantIndex}.inventory.${inventoryIndex}.inventory_item_id`}
      render={({ field }) => (
        <Form.Item>
          <Form.Control>
            <Combobox
              {...field}
              options={items.options}
              className="bg-ui-bg-field-component hover:bg-ui-bg-field-component-hover"
              placeholder={t("scope.itemPlaceholder")}
            />
          </Form.Control>
        </Form.Item>
      )}
    />

    {/* Label + Input pair 2 */}
    <div className="flex items-center px-2 py-1.5">
      <Label size="xsmall" weight="plus" className="text-ui-fg-subtle">
        {t("fields.quantity")}
      </Label>
    </div>
    <Form.Field
      control={form.control}
      name={`variants.${variantIndex}.inventory.${inventoryIndex}.required_quantity`}
      render={({ field: { onChange, value, ...field } }) => (
        <Form.Item>
          <Form.Control>
            <Input
              type="number"
              className="bg-ui-bg-field-component"
              min={0}
              value={value}
              onChange={(e) => {
                const value = e.target.value
                if (value === "") {
                  onChange(null)
                } else {
                  onChange(Number(value))
                }
              }}
              {...field}
            />
          </Form.Control>
          <Form.ErrorMessage />
        </Form.Item>
      )}
    />
  </div>

  {/* Right: delete button (28px column) */}
  <IconButton
    type="button"
    size="small"
    variant="transparent"
    className="text-ui-fg-muted"
    onClick={onRemove}
  >
    <XMarkMini />
  </IconButton>
</li>
```

### Key layout classes:
- Outer: `grid grid-cols-[1fr_28px]` — content + delete button
- Inner: `grid grid-cols-[min-content,1fr]` — label + input pairs
- Card: `bg-ui-bg-component shadow-elevation-card-rest rounded-xl p-1.5`
- Labels: `Label size="xsmall" weight="plus" className="text-ui-fg-subtle"` (NOT Form.Label — inline rows use raw Label for compact sizing)
- Inputs: `className="bg-ui-bg-field-component"` for contrast background
- Delete: `IconButton size="small" variant="transparent"` with `XMarkMini`

### Section Wrapper with useFieldArray

```tsx
function SectionWithDynamicRows({ parentIndex }: { parentIndex: number }) {
  const form = useTabbedForm<SchemaType>()
  const { t } = useTranslation()

  const items = useFieldArray({
    control: form.control,
    name: `parent.${parentIndex}.items`,
  })

  return (
    <div className="grid gap-y-4">
      {/* Header with label + Add button */}
      <div className="flex items-start justify-between gap-x-4">
        <div className="flex flex-col">
          <Form.Label>{t("scope.section.label")}</Form.Label>
          <Form.Hint>{t("scope.section.hint")}</Form.Hint>
        </div>
        <Button
          size="small"
          variant="secondary"
          type="button"
          onClick={() => items.append({ field_a: "", field_b: "" })}
        >
          {t("actions.add")}
        </Button>
      </div>

      {/* Dynamic rows */}
      {items.fields.map((item, index) => (
        <InlineEditableRow
          key={item.id}
          parentIndex={parentIndex}
          itemIndex={index}
          onRemove={() => items.remove(index)}
        />
      ))}
    </div>
  )
}
```

### Duplicate Prevention Pattern

```tsx
const formData = useWatch({
  control: form.control,
  name: `parent.${parentIndex}.items`,
})

const isOptionDisabled = (option: { value: string }, currentIndex: number) => {
  return !!formData?.some(
    (item, i) => i !== currentIndex && item.field_id === option.value
  )
}
```

## WRONG vs RIGHT Comparison

### Field Label
```tsx
// WRONG — raw Label, asterisk in text
<Label htmlFor="seo-title">SEO Title *</Label>

// RIGHT — Form.Label, optional prop for optional fields
<Form.Label>{t("products.fields.seo_title.label")}</Form.Label>
<Form.Label optional>{t("products.fields.seo_title.label")}</Form.Label>
```

### Error Display
```tsx
// WRONG — manual error rendering
{fieldState.error && (
  <span className="text-ui-fg-error text-small">
    {fieldState.error.message}
  </span>
)}

// RIGHT — auto error component
<Form.ErrorMessage />
```

### Field Wrapper
```tsx
// WRONG — manual div wrapper
<div className="flex flex-col gap-y-2">
  <Label>...</Label>
  <Input />
</div>

// RIGHT — Form.Item
<Form.Item>
  <Form.Label>...</Form.Label>
  <Form.Control>
    <Input />
  </Form.Control>
  <Form.ErrorMessage />
</Form.Item>
```

### Strings
```tsx
// WRONG — hardcoded
<Form.Label>SEO Title</Form.Label>
<Input placeholder="Enter SEO title..." />

// RIGHT — i18n
<Form.Label>{t("products.fields.seo_title.label")}</Form.Label>
<Input placeholder={t("products.fields.seo_title.placeholder")} />
```
