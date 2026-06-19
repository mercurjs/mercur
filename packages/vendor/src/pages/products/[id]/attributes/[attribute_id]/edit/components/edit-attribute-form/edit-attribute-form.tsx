import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Input, Label, toast } from "@medusajs/ui"
import { AttributeType } from "@mercurjs/types"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import * as zod from "zod"

import { AttributeValueInput } from "@components/inputs/attribute-value-input"
import { Form } from "@components/common/form"
import { RouteDrawer, useRouteModal } from "@components/modals"
import { KeyboundForm } from "@components/utilities/keybound-form"
import { useBatchProductAttributes } from "@hooks/api/products"

type AttributeValue = { id: string; name: string }

type EditAttributeFormProps = {
  productId: string
  attribute: {
    id: string
    name: string
    type: AttributeType | string
    is_variant_axis?: boolean
    values?: AttributeValue[]
    all_values?: AttributeValue[]
  }
}

type EditAttributeFormValues = {
  values: string | string[]
}

export const EditAttributeForm = ({
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

  const form = useForm<EditAttributeFormValues>({
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
            value: attribute.type === AttributeType.TOGGLE
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
