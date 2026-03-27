import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Input, Select, Switch, Text, Textarea, toast } from "@medusajs/ui"
import { Heading } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"

import { Form } from "../../../components/common/form"
import { RouteDrawer, useRouteModal } from "../../../components/modals"
import { KeyboundForm } from "../../../components/utilities/keybound-form"
import { useAttribute, useUpdateAttribute } from "../../../hooks/api/attributes"
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

export const AttributeEdit = () => {
  const { id } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { handleSuccess } = useRouteModal()

  const { attribute, isPending, isError, error } = useAttribute(id!, {
    fields: ATTRIBUTE_DETAIL_FIELDS,
  })

  const form = useForm<UpdateAttributeFormValues>({
    resolver: zodResolver(UpdateAttributeSchema),
    values: attribute
      ? {
          name: attribute.name ?? "",
          handle: attribute.handle ?? "",
          description: attribute.description ?? "",
          is_filterable: attribute.is_filterable ?? false,
          is_required: attribute.is_required ?? false,
          ui_component: (attribute.ui_component as UpdateAttributeFormValues["ui_component"]) ?? "select",
        }
      : undefined,
  })

  const { mutateAsync, isPending: isMutating } = useUpdateAttribute(id!)

  if (isError) {
    throw error
  }

  if (isPending || !attribute) {
    return null
  }

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(data, {
      onSuccess: ({ attribute: updated }) => {
        toast.success(
          t("attributes.edit.successToast", { name: updated.name })
        )
        navigate(`/settings/attributes/${id}`)
        handleSuccess()
      },
      onError: (err) => {
        toast.error(err.message)
      },
    })
  })

  return (
    <RouteDrawer data-testid="attribute-edit-drawer">
      <RouteDrawer.Header data-testid="attribute-edit-drawer-header">
        <RouteDrawer.Title asChild>
          <Heading data-testid="attribute-edit-drawer-heading">
            {t("attributes.edit.header")}
          </Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description className="sr-only">
          {t("attributes.edit.subtitle")}
        </RouteDrawer.Description>
      </RouteDrawer.Header>
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
                  <Form.Label data-testid="attribute-edit-name-label">
                    {t("attributes.fields.name")}
                  </Form.Label>
                  <Form.Control data-testid="attribute-edit-name-control">
                    <Input
                      {...field}
                      size="small"
                      data-testid="attribute-edit-name-input"
                    />
                  </Form.Control>
                  <Form.ErrorMessage data-testid="attribute-edit-name-error" />
                </Form.Item>
              )}
            />

            <Form.Field
              control={form.control}
              name="handle"
              render={({ field }) => (
                <Form.Item data-testid="attribute-edit-handle-field">
                  <Form.Label optional data-testid="attribute-edit-handle-label">
                    {t("attributes.fields.handle")}
                  </Form.Label>
                  <Form.Control data-testid="attribute-edit-handle-control">
                    <div className="relative">
                      <Input
                        {...field}
                        size="small"
                        className="pl-9"
                        data-testid="attribute-edit-handle-input"
                      />
                      <div className="z-100 absolute bottom-0 left-0 top-0 flex w-7 items-center justify-center border-r border-ui-border-base px-2 text-ui-fg-muted">
                        /
                      </div>
                    </div>
                  </Form.Control>
                  <Form.ErrorMessage data-testid="attribute-edit-handle-error" />
                </Form.Item>
              )}
            />

            <Form.Field
              control={form.control}
              name="description"
              render={({ field }) => (
                <Form.Item data-testid="attribute-edit-description-field">
                  <Form.Label optional data-testid="attribute-edit-description-label">
                    {t("attributes.fields.description")}
                  </Form.Label>
                  <Form.Control data-testid="attribute-edit-description-control">
                    <Textarea
                      {...field}
                      data-testid="attribute-edit-description-input"
                    />
                  </Form.Control>
                  <Form.ErrorMessage data-testid="attribute-edit-description-error" />
                </Form.Item>
              )}
            />

            <Form.Field
              control={form.control}
              name="ui_component"
              render={({ field }) => (
                <Form.Item data-testid="attribute-edit-ui-component-field">
                  <Form.Label data-testid="attribute-edit-ui-component-label">
                    {t("attributes.fields.type")}
                  </Form.Label>
                  <Form.Control data-testid="attribute-edit-ui-component-control">
                    <Select
                      value={field.value as string}
                      onValueChange={field.onChange}
                      data-testid="attribute-edit-ui-component-select"
                    >
                      <Select.Trigger data-testid="attribute-edit-ui-component-trigger">
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Content data-testid="attribute-edit-ui-component-content">
                        {Object.values(AttributeUIComponent).map((component) => (
                          <Select.Item
                            key={component}
                            value={component}
                            data-testid={`attribute-edit-ui-component-option-${component}`}
                          >
                            {UI_COMPONENT_LABELS[component] ?? component}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                  </Form.Control>
                  <Form.ErrorMessage data-testid="attribute-edit-ui-component-error" />
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
                      <Form.Control data-testid="attribute-edit-filterable-control">
                        <Switch
                          checked={field.value as boolean}
                          onCheckedChange={field.onChange}
                          className="mt-1"
                          data-testid="attribute-edit-filterable-switch"
                        />
                      </Form.Control>
                      <div>
                        <Form.Label data-testid="attribute-edit-filterable-label">
                          {t(
                            "attributes.fields.isFilterable",
                            "Yes, this is a filterable attribute"
                          )}
                        </Form.Label>
                        <Text className="mt-1 text-xs text-ui-fg-subtle">
                          {t(
                            "attributes.fields.isFilterableHint",
                            "If checked, buyers will be able to filter products using this attribute."
                          )}
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
                      <Form.Control data-testid="attribute-edit-required-control">
                        <Switch
                          checked={field.value as boolean}
                          onCheckedChange={field.onChange}
                          className="mt-1"
                          data-testid="attribute-edit-required-switch"
                        />
                      </Form.Control>
                      <div>
                        <Form.Label data-testid="attribute-edit-required-label">
                          {t(
                            "attributes.fields.isRequired",
                            "Yes, this is a required attribute"
                          )}
                        </Form.Label>
                        <Text className="mt-1 text-xs text-ui-fg-subtle">
                          {t(
                            "attributes.fields.isRequiredHint",
                            "If checked, vendors must set a value to this attribute."
                          )}
                        </Text>
                      </div>
                    </div>
                  </div>
                </Form.Item>
              )}
            />
          </RouteDrawer.Body>

          <RouteDrawer.Footer data-testid="attribute-edit-form-footer">
            <div className="flex items-center justify-end gap-x-2">
              <RouteDrawer.Close asChild>
                <Button
                  variant="secondary"
                  size="small"
                  type="button"
                  data-testid="attribute-edit-cancel-button"
                >
                  {t("actions.cancel")}
                </Button>
              </RouteDrawer.Close>
              <Button
                size="small"
                type="submit"
                isLoading={isMutating}
                data-testid="attribute-edit-save-button"
              >
                {t("actions.save")}
              </Button>
            </div>
          </RouteDrawer.Footer>
        </KeyboundForm>
      </RouteDrawer.Form>
    </RouteDrawer>
  )
}
