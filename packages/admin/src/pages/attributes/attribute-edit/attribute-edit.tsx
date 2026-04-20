import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Input, Select, Switch, Text, Textarea, toast } from "@medusajs/ui"
import { HandleInput } from "../../../components/inputs/handle-input"
import { Heading } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { Form } from "../../../components/common/form"
import { Combobox } from "../../../components/inputs/combobox"
import { RouteDrawer, useRouteModal } from "../../../components/modals"
import { KeyboundForm } from "../../../components/utilities/keybound-form"
import { useProductAttribute, useUpdateProductAttribute } from "../../../hooks/api/product-attributes"
import { useProductCategories } from "../../../hooks/api"
import { ATTRIBUTE_DETAIL_FIELDS } from "../attribute-detail/constants"
import { AttributeUIComponent, UpdateAttributeSchema } from "./schema"
import type { UpdateAttributeFormValues } from "./types"

const UI_COMPONENT_LABELS: Record<string, string> = {
  select: "Single Select",
  multivalue: "Multi Select",
  unit: "Unit",
  toggle: "Toggle",
  text_area: "Text",
}

type AttributeEditFormProps = {
  attribute: Record<string, any>
}

const AttributeEditForm = ({ attribute }: AttributeEditFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const { product_categories: allCategories } = useProductCategories({
    limit: 999,
  })

  const categoryOptions = (allCategories ?? []).map((cat: any) => ({
    label: cat.name,
    value: cat.id,
  }))

  const form = useForm<UpdateAttributeFormValues>({
    resolver: zodResolver(UpdateAttributeSchema),
    defaultValues: {
      name: attribute.name ?? "",
      handle: attribute.handle ?? "",
      description: attribute.description ?? "",
      is_filterable: attribute.is_filterable ?? false,
      is_required: attribute.is_required ?? false,
      ui_component: attribute.ui_component ?? "select",
      product_category_ids: (attribute.product_categories ?? []).map(
        (cat: any) => cat.id
      ),
    },
  })

  const { mutateAsync, isPending: isMutating } = useUpdateProductAttribute(attribute.id)

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(data, {
      onSuccess: () => {
        toast.success(
          t("attributes.edit.successToast", { name: data.name || attribute.name })
        )
        handleSuccess()
      },
      onError: (err) => {
        toast.error(err.message)
      },
    })
  })

  return (
    <RouteDrawer.Form form={form} data-testid="attribute-edit-form">
      <KeyboundForm
        className="flex size-full flex-col overflow-hidden"
        onSubmit={handleSubmit}
      >
        <RouteDrawer.Body
          className="flex flex-1 flex-col gap-y-6 overflow-auto"
          data-testid="attribute-edit-form-body"
        >
          <Form.Field
            control={form.control}
            name="name"
            render={({ field }) => (
              <Form.Item data-testid="attribute-edit-name-field">
                <Form.Label>{t("attributes.fields.name")}</Form.Label>
                <Form.Control>
                  <Input {...field} size="small" />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />

          <Form.Field
            control={form.control}
            name="handle"
            render={({ field }) => (
              <Form.Item data-testid="attribute-edit-handle-field">
                <Form.Label optional>{t("attributes.fields.handle")}</Form.Label>
                <Form.Control>
                  <HandleInput {...field} />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />

          <Form.Field
            control={form.control}
            name="description"
            render={({ field }) => (
              <Form.Item data-testid="attribute-edit-description-field">
                <Form.Label optional>{t("attributes.fields.description")}</Form.Label>
                <Form.Control>
                  <Textarea {...field} />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />

          <Form.Field
            control={form.control}
            name="ui_component"
            render={({ field }) => (
              <Form.Item data-testid="attribute-edit-ui-component-field">
                <Form.Label>{t("attributes.fields.type")}</Form.Label>
                <Form.Control>
                  <Select
                    value={field.value as string}
                    onValueChange={field.onChange}
                  >
                    <Select.Trigger>
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Content>
                      {Object.values(AttributeUIComponent).map((component) => (
                        <Select.Item key={component} value={component}>
                          {UI_COMPONENT_LABELS[component] ?? component}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select>
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />

          <Form.Field
            control={form.control}
            name="is_filterable"
            render={({ field }) => (
              <Form.Item data-testid="attribute-edit-filterable-field">
                <div className="rounded-lg bg-ui-bg-component p-4 shadow-elevation-card-rest">
                  <div className="flex gap-3">
                    <Form.Control>
                      <Switch
                        checked={field.value as boolean}
                        onCheckedChange={field.onChange}
                        className="mt-1"
                      />
                    </Form.Control>
                    <div>
                      <Form.Label>
                        {t("attributes.fields.filterable")}
                      </Form.Label>
                      <Text className="mt-1 text-xs text-ui-fg-subtle">
                        {t("attributes.hints.filterable", "If checked, buyers will be able to filter products using this attribute.")}
                      </Text>
                    </div>
                  </div>
                </div>
              </Form.Item>
            )}
          />

          <Form.Field
            control={form.control}
            name="is_required"
            render={({ field }) => (
              <Form.Item data-testid="attribute-edit-required-field">
                <div className="rounded-lg bg-ui-bg-component p-4 shadow-elevation-card-rest">
                  <div className="flex gap-3">
                    <Form.Control>
                      <Switch
                        checked={field.value as boolean}
                        onCheckedChange={field.onChange}
                        className="mt-1"
                      />
                    </Form.Control>
                    <div>
                      <Form.Label>
                        {t("attributes.fields.required")}
                      </Form.Label>
                      <Text className="mt-1 text-xs text-ui-fg-subtle">
                        {t("attributes.hints.required", "If checked, vendors must set a value for this attribute.")}
                      </Text>
                    </div>
                  </div>
                </div>
              </Form.Item>
            )}
          />

          <Form.Field
            control={form.control}
            name="product_category_ids"
            render={({ field }) => (
              <Form.Item>
                <Form.Label optional>
                  {t("attributes.fields.category")}
                </Form.Label>
                <Form.Control>
                  <Combobox
                    options={categoryOptions}
                    {...field}
                    value={field.value ?? []}
                  />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
        </RouteDrawer.Body>

        <RouteDrawer.Footer data-testid="attribute-edit-form-footer">
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button variant="secondary" size="small" type="button">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button size="small" type="submit" isLoading={isMutating}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}

export const AttributeEdit = () => {
  const { id } = useParams()

  const { product_attribute: attribute, isPending, isError, error } = useProductAttribute(id!, {
    fields: ATTRIBUTE_DETAIL_FIELDS,
  })

  if (isError) {
    throw error
  }

  if (isPending || !attribute) {
    return null
  }

  return (
    <RouteDrawer data-testid="attribute-edit-drawer">
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>{attribute.name}</Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description className="sr-only">
          Edit attribute
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      <AttributeEditForm attribute={attribute} />
    </RouteDrawer>
  )
}
