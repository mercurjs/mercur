import { zodResolver } from "@hookform/resolvers/zod"
import { Button, InlineTip, Input, Label } from "@medusajs/ui"
import {
  AttributeType,
  ProductAttributeBatchInput,
} from "@mercurjs/types"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import * as zod from "zod"

import { Form } from "../../common/form"
import { AttributeValueInput } from "../../inputs/attribute-value-input"
import { ChipInput } from "../../inputs/chip-input"
import { RouteDrawer, useRouteModal } from "../../modals"
import { KeyboundForm } from "../../utilities/keybound-form"

export type ProductAttributeBatchPayload = Omit<
  ProductAttributeBatchInput,
  "product_id"
>

type AttributeValue = { id: string; name: string }

export type EditAttributeAttribute = {
  id: string
  name: string
  type: AttributeType | string
  description?: string
  is_required?: boolean
  is_variant_axis?: boolean
  is_scoped?: boolean
  values?: AttributeValue[]
  all_values?: AttributeValue[]
}

export type EditAttributeFormProps = {
  attribute: EditAttributeAttribute
  isAttached?: boolean
  isPending: boolean
  onSubmit: (payload: ProductAttributeBatchPayload) => Promise<void>
}

const isVariantAxis = (attribute: EditAttributeAttribute) =>
  attribute.type === AttributeType.MULTI_SELECT || !!attribute.is_variant_axis

export const EditAttributeForm = (props: EditAttributeFormProps) => {
  if (props.attribute.is_scoped) {
    return <EditScopedAttributeForm {...props} />
  }

  return <EditCatalogAttributeForm {...props} />
}

const AttributeWarning = () => {
  const { t } = useTranslation()

  return (
    <InlineTip
      variant="warning"
      label={t("products.create.attributes.warning")}
    >
      {t("products.create.attributes.editWarning")}
    </InlineTip>
  )
}

const VariantAxisTip = () => {
  const { t } = useTranslation()

  return (
    <InlineTip label={t("products.create.attributes.tip")}>
      {t("products.create.attributes.editVariantAxisTip")}
    </InlineTip>
  )
}

type ScopedFormValues = {
  title: string
  values: string | string[]
}

const EditScopedAttributeForm = ({
  attribute,
  isPending,
  onSubmit,
}: EditAttributeFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const isAxis = isVariantAxis(attribute)
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

  const handleSubmit = form.handleSubmit(async (data) => {
    const title =
      data.title.trim() !== attribute.name ? data.title.trim() : undefined

    let payload: ProductAttributeBatchPayload

    if (isAxis) {
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
      const value = Array.isArray(data.values)
        ? data.values[0] ?? ""
        : data.values
      payload = {
        update: [{ id: attribute.id, title, value }],
      }
    }

    try {
      await onSubmit(payload)
      handleSuccess()
    } catch {
      // The caller is responsible for surfacing the error.
    }
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
                          <AttributeValueInput
                            type={attribute.type}
                            value={value}
                            onChange={onChange}
                            placeholder={t(
                              "products.create.attributes.valuePlaceholder",
                            )}
                          />
                        )}
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />
              </div>
            </div>
            {isAxis && <VariantAxisTip />}
            <AttributeWarning />
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
  attribute,
  isAttached = true,
  isPending,
  onSubmit,
}: EditAttributeFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const isAxis = isVariantAxis(attribute)

  const hasPresetValues =
    attribute.type === AttributeType.SINGLE_SELECT ||
    attribute.type === AttributeType.MULTI_SELECT

  const labelTooltip =
    attribute.description ||
    (attribute.is_required
      ? t("products.attributeRequiredByMarketplace")
      : undefined)

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

  const handleSubmit = form.handleSubmit(async (data) => {
    const vals = Array.isArray(data.values)
      ? data.values
      : [data.values].filter((s) => s.trim().length > 0)

    let payload: ProductAttributeBatchPayload

    const scalarValue =
      attribute.type === AttributeType.TOGGLE ? vals[0] === "true" : vals[0]

    if (hasPresetValues) {
      const selectedIds = (attribute.all_values ?? [])
        .filter((v) => vals.includes(v.name))
        .map((v) => v.id)

      if (!isAttached) {
        payload = { add: [{ id: attribute.id, value_ids: selectedIds }] }
      } else if (attribute.is_variant_axis) {
        const currentIds = (attribute.values ?? []).map((v) => v.id)
        const add = selectedIds.filter((id) => !currentIds.includes(id))
        const remove = currentIds.filter((id) => !selectedIds.includes(id))
        payload = { update: [{ id: attribute.id, add, remove }] }
      } else {
        payload = {
          remove: [attribute.id],
          add: [{ id: attribute.id, value_ids: selectedIds }],
        }
      }
    } else if (!isAttached) {
      payload = { add: [{ id: attribute.id, value: scalarValue }] }
    } else {
      payload = {
        update: [{ id: attribute.id, value: scalarValue }],
      }
    }

    try {
      await onSubmit(payload)
      handleSuccess()
    } catch {
      // The caller is responsible for surfacing the error.
    }
  })

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex h-full flex-col">
        <RouteDrawer.Body>
          <div className="flex flex-col gap-y-4">
            <Form.Field
              control={form.control}
              name="values"
              render={({ field: { onChange, value } }) => (
                <Form.Item>
                  <Form.Label tooltip={labelTooltip}>
                    {attribute.name}
                  </Form.Label>
                  <Form.Control>
                    <AttributeValueInput
                      type={attribute.type}
                      value={value}
                      onChange={onChange}
                      availableValues={attribute.all_values ?? []}
                    />
                  </Form.Control>
                  <Form.ErrorMessage />
                  {isAxis && <VariantAxisTip />}
                </Form.Item>
              )}
            />
            <AttributeWarning />
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
