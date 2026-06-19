import { zodResolver } from "@hookform/resolvers/zod"
import {
  Button,
  Hint,
  Input,
  Label,
  Switch,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { AttributeType } from "@mercurjs/types"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import * as zod from "zod"

import { AttributeValueInput } from "@components/inputs/attribute-value-input"
import { ChipInput } from "@components/inputs/chip-input"
import { Form } from "@components/common/form"
import { RouteDrawer, useRouteModal } from "@components/modals"
import { KeyboundForm } from "@components/utilities/keybound-form"
import { useBatchProductAttributes } from "@hooks/api/products"

type AttributeValue = { id: string; name: string }

type EditAttributeAttribute = {
  id: string
  name: string
  type: AttributeType | string
  is_variant_axis?: boolean
  is_scoped?: boolean
  values?: AttributeValue[]
  all_values?: AttributeValue[]
}

type EditAttributeFormProps = {
  productId: string
  attribute: EditAttributeAttribute
}

export const EditAttributeForm = ({
  productId,
  attribute,
}: EditAttributeFormProps) => {
  // A product-scoped (inline) attribute is owned by this product, so it gets
  // the same authoring affordances as the create form: editable title and
  // free-form values (chips for variant axes, a textarea for text). Shared
  // catalog attributes keep the value-selection form (pick from the catalog).
  if (attribute.is_scoped) {
    return <EditScopedAttributeForm productId={productId} attribute={attribute} />
  }

  return <EditCatalogAttributeForm productId={productId} attribute={attribute} />
}

type ScopedFormValues = {
  title: string
  values: string | string[]
}

const EditScopedAttributeForm = ({
  productId,
  attribute,
}: EditAttributeFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const isAxis = attribute.type === AttributeType.MULTI_SELECT
  const currentValues = attribute.values ?? attribute.all_values ?? []

  const schema = zod.object({
    title: zod
      .string()
      .trim()
      .min(1, { message: t("products.create.attributes.errors.titleRequired") }),
    values: zod
      .union([zod.string(), zod.array(zod.string())])
      .refine(
        (v) => (Array.isArray(v) ? v.length > 0 : v.trim().length > 0),
        { message: t("products.create.attributes.errors.valuesRequired") },
      ),
  })

  const form = useForm<ScopedFormValues>({
    defaultValues: {
      title: attribute.name,
      values: isAxis
        ? currentValues.map((v) => v.name)
        : currentValues[0]?.name ?? "",
    },
    resolver: zodResolver(schema),
  })

  const { mutateAsync, isPending } = useBatchProductAttributes(productId)

  const handleSubmit = form.handleSubmit(async (data) => {
    const title =
      data.title.trim() !== attribute.name ? data.title.trim() : undefined

    let payload: Parameters<typeof mutateAsync>[0]

    if (isAxis) {
      // Diff the chip names against the existing value rows: new names become
      // `add: [{ value }]`, dropped value rows become `remove: [value_id]`.
      const newNames = (Array.isArray(data.values) ? data.values : [])
        .map((v) => v.trim())
        .filter(Boolean)
      const byName = new Map(currentValues.map((v) => [v.name, v.id]))
      const add = newNames
        .filter((name) => !byName.has(name))
        .map((value) => ({ value }))
      const remove = currentValues
        .filter((v) => !newNames.includes(v.name))
        .map((v) => v.id)
      payload = {
        update: [{ id: attribute.id, title, add, remove }],
      }
    } else {
      // Free-form text/unit: a single scalar swap (plus optional rename).
      const value = Array.isArray(data.values)
        ? data.values[0] ?? ""
        : data.values
      payload = {
        update: [{ id: attribute.id, title, value }],
      }
    }

    await mutateAsync(payload, {
      onSuccess: () => handleSuccess(),
      onError: (error) => toast.error(error.message),
    })
  })

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex h-full flex-col">
        <RouteDrawer.Body>
          <div className="flex flex-col gap-y-4">
            <div className="bg-ui-bg-component shadow-elevation-card-rest rounded-xl p-1.5">
              <div className="grid grid-cols-[min-content,1fr] items-start gap-1.5">
                <div className="flex items-center px-2 py-1.5">
                  <Label
                    size="xsmall"
                    weight="plus"
                    className="text-ui-fg-subtle"
                  >
                    {t("fields.title")}
                  </Label>
                </div>
                <Form.Field
                  control={form.control}
                  name="title"
                  render={({ field, fieldState }) => (
                    <Form.Item>
                      <Form.Control>
                        <Input
                          {...field}
                          aria-invalid={fieldState.invalid ? "true" : undefined}
                          className={
                            fieldState.invalid
                              ? "bg-ui-bg-field-component shadow-borders-error focus:shadow-borders-error"
                              : "bg-ui-bg-field-component hover:bg-ui-bg-field-component-hover"
                          }
                          data-testid="edit-attribute-title-input"
                        />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />
                <div className="flex items-center px-2 py-1.5">
                  <Label
                    size="xsmall"
                    weight="plus"
                    className="text-ui-fg-subtle"
                  >
                    {t("fields.values")}
                  </Label>
                </div>
                <Form.Field
                  control={form.control}
                  name="values"
                  render={({ field: { onChange, value }, fieldState }) => (
                    <Form.Item>
                      <Form.Control>
                        {isAxis ? (
                          <ChipInput
                            variant="contrast"
                            value={Array.isArray(value) ? value : []}
                            onChange={onChange}
                            aria-invalid={
                              fieldState.invalid ? "true" : undefined
                            }
                            className={
                              fieldState.invalid
                                ? "shadow-borders-error focus-within:!shadow-borders-error"
                                : undefined
                            }
                            placeholder={t(
                              "products.create.attributes.valuePlaceholder",
                            )}
                          />
                        ) : (
                          <Textarea
                            aria-invalid={
                              fieldState.invalid ? "true" : undefined
                            }
                            className={
                              fieldState.invalid
                                ? "bg-ui-bg-field-component shadow-borders-error focus:shadow-borders-error"
                                : "bg-ui-bg-field-component hover:bg-ui-bg-field-component-hover"
                            }
                            value={
                              Array.isArray(value) ? value.join(", ") : value ?? ""
                            }
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={t(
                              "products.create.attributes.valuePlaceholder",
                            )}
                            data-testid="edit-attribute-values-input"
                          />
                        )}
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />
                <div />
                {/* Use-for-variants reflects the attribute's axis nature; it is
                    read-only here because flipping it would create/drop the
                    backing variant option and re-key existing variants. */}
                <div className="flex items-start gap-x-3 py-1.5">
                  <Switch
                    className="shrink-0 rtl:rotate-180"
                    checked={isAxis}
                    disabled
                  />
                  <div className="flex flex-col">
                    <Label size="xsmall" weight="plus">
                      {t("products.create.attributes.useForVariants")}
                    </Label>
                    <Hint className="!txt-small">
                      {t("products.create.attributes.useForVariantsDescription")}
                    </Hint>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-ui-bg-component shadow-elevation-card-rest flex items-center gap-x-3 rounded-lg px-3 py-2.5">
              <div className="bg-ui-tag-orange-icon h-full min-h-[24px] w-1 shrink-0 rounded-full" />
              <Text size="small" className="text-ui-fg-subtle">
                <span className="text-ui-fg-base txt-compact-small-plus">
                  {t("products.create.attributes.warning")}:{" "}
                </span>
                {t("products.create.attributes.editWarning")}
              </Text>
            </div>
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button
              size="small"
              type="submit"
              isLoading={isPending}
              data-testid="edit-attribute-submit-button"
            >
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}

type CatalogFormValues = {
  values: string | string[]
}

const EditCatalogAttributeForm = ({
  productId,
  attribute,
}: EditAttributeFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const hasPresetValues =
    attribute.type === AttributeType.SINGLE_SELECT ||
    attribute.type === AttributeType.MULTI_SELECT

  const initialValues = (() => {
    const selected = attribute.values ?? []
    if (attribute.type === AttributeType.MULTI_SELECT) {
      return selected.map((v) => v.name)
    }
    return selected[0]?.name ?? ""
  })()

  const schema = zod.object({
    values: zod
      .union([zod.string(), zod.array(zod.string())])
      .refine(
        (v) => (Array.isArray(v) ? v.length > 0 : v.trim().length > 0),
        { message: t("products.create.attributes.errors.valuesRequired") },
      ),
  })

  const form = useForm<CatalogFormValues>({
    defaultValues: { values: initialValues },
    resolver: zodResolver(schema),
  })

  const { mutateAsync, isPending } = useBatchProductAttributes(productId)

  const handleSubmit = form.handleSubmit(async (data) => {
    const vals = Array.isArray(data.values)
      ? data.values
      : [data.values].filter((s) => s.trim().length > 0)

    let payload: Parameters<typeof mutateAsync>[0]

    if (hasPresetValues) {
      // Map the chosen value names to ids over the attribute's full value set.
      const selectedIds = (attribute.all_values ?? [])
        .filter((v) => vals.includes(v.name))
        .map((v) => v.id)

      if (attribute.is_variant_axis) {
        // Shared axis: adjust the per-product value subset (add/remove diff).
        const currentIds = (attribute.values ?? []).map((v) => v.id)
        const add = selectedIds.filter((id) => !currentIds.includes(id))
        const remove = currentIds.filter((id) => !selectedIds.includes(id))
        payload = { update: [{ id: attribute.id, add, remove }] }
      } else {
        // Non-axis select: replace the value links (remove → add in one call).
        payload = {
          remove: [attribute.id],
          add: [{ id: attribute.id, value_ids: selectedIds }],
        }
      }
    } else {
      // Text / unit / toggle: a single free-form scalar.
      payload = {
        update: [
          {
            id: attribute.id,
            value:
              attribute.type === AttributeType.TOGGLE
                ? vals[0] === "true"
                : vals[0],
          },
        ],
      }
    }

    await mutateAsync(payload, {
      onSuccess: () => handleSuccess(),
      onError: (error) => toast.error(error.message),
    })
  })

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex h-full flex-col">
        <RouteDrawer.Body>
          <div className="flex flex-col gap-y-4">
            <div className="bg-ui-bg-component shadow-elevation-card-rest rounded-xl p-1.5">
              <div className="grid grid-cols-[min-content,1fr] items-center gap-1.5">
                <div className="flex items-center px-2 py-1.5">
                  <Label
                    size="xsmall"
                    weight="plus"
                    className="text-ui-fg-subtle"
                  >
                    {t("fields.title")}
                  </Label>
                </div>
                <Input
                  className="bg-ui-bg-field-component"
                  value={attribute.name}
                  disabled
                  data-testid="edit-attribute-title-input"
                />
                <div className="flex items-center px-2 py-1.5">
                  <Label
                    size="xsmall"
                    weight="plus"
                    className="text-ui-fg-subtle"
                  >
                    {t("fields.values")}
                  </Label>
                </div>
                <Form.Field
                  control={form.control}
                  name="values"
                  render={({ field: { onChange, value } }) => (
                    <Form.Item>
                      <Form.Control>
                        <AttributeValueInput
                          type={attribute.type}
                          value={value}
                          onChange={onChange}
                          availableValues={attribute.all_values ?? []}
                        />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />
              </div>
            </div>
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button
              size="small"
              type="submit"
              isLoading={isPending}
              data-testid="edit-attribute-submit-button"
            >
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
