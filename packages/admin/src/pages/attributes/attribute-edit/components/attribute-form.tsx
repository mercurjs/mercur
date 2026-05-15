import { forwardRef, useEffect, useMemo, useImperativeHandle, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  InlineTip,
  Input,
  Select,
  Switch,
  Text,
  Textarea,
} from "@medusajs/ui"
import { FormProvider, useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"

import type { AdminProductCategory } from "@medusajs/types"
import { AttributeDTO } from "@mercurjs/types"
import { Form } from "../../../../components/common/form"
import {
  AttributeUIComponent,
  CreateAttributeSchema,
  UpdateAttributeSchema,
} from "../schema"
import type {
  CreateAttributeFormValues,
  UpdateAttributeFormValues,
} from "../types"
import { MultiSelectCategory } from "../../attribute-create/components/multi-select-category"
import { PossibleValuesList } from "../../attribute-create/components/possible-values-list"

export interface AttributeFormRef {
  validateFields: (fields: string[]) => Promise<boolean>
}

export interface AttributeFormProps {
  initialData?: AttributeDTO
  onSubmit: (
    data: CreateAttributeFormValues | UpdateAttributeFormValues
  ) => Promise<void>
  categories?: AdminProductCategory[]
  mode?: "create" | "update"
  activeTab?: "details" | "type"
  onFormStateChange?: (formState: {
    detailsStatus: "not-started" | "in-progress" | "completed"
    typeStatus: "not-started" | "in-progress" | "completed"
  }) => void
}

const UI_COMPONENT_LABELS: Record<string, string> = {
  select: "Single Select",
  multivalue: "Multi Select",
  unit: "Unit",
  toggle: "Toggle",
  text_area: "Text",
}

export const AttributeForm = forwardRef<AttributeFormRef, AttributeFormProps>(
  (
    {
      initialData,
      onSubmit,
      categories,
      mode = "create",
      activeTab = "details",
      onFormStateChange,
    },
    ref
  ) => {
    const { t } = useTranslation()
    const [showCategorySection, setShowCategorySection] = useState(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((initialData as any)?.product_categories?.length || 0) > 0
    )

    const form = useForm<CreateAttributeFormValues | UpdateAttributeFormValues>({
      resolver: zodResolver(
        mode === "create" ? CreateAttributeSchema : UpdateAttributeSchema
      ),
      defaultValues: {
        name: initialData?.name ?? "",
        description: initialData?.description ?? "",
        handle: initialData?.handle ?? "",
        ui_component:
          (initialData?.ui_component as
            | "select"
            | "multivalue"
            | "unit"
            | "toggle"
            | "text_area"
            | undefined) ?? AttributeUIComponent.SELECT,
        is_filterable: initialData?.is_filterable ?? false,
        is_required: initialData?.is_required ?? false,
        possible_values: initialData?.possible_values?.map((v) => ({
          id: v.id,
          value: v.value,
          rank: v.rank,
        })) ?? [],
        product_category_ids: [],
        metadata: {},
      },
    })

    const handleSubmit = form.handleSubmit(async (data) => {
      try {
        await onSubmit(data)
      } catch (error) {
        console.error(error)
      }
    })

    useImperativeHandle(ref, () => ({
      validateFields: async (fields: string[]) => {
        const result = await form.trigger(
          fields as (keyof (
            | CreateAttributeFormValues
            | UpdateAttributeFormValues
          ))[]
        )
        return result
      },
    }))

    const [name, description, handle, uiComponent, possibleValues] = useWatch({
      control: form.control,
      name: [
        "name",
        "description",
        "handle",
        "ui_component",
        "possible_values",
      ],
    })

    const formStateKey = useMemo(() => {
      return JSON.stringify({
        name,
        description,
        handle,
        uiComponent,
        valuesCount: possibleValues?.length ?? 0,
      })
    }, [name, description, handle, uiComponent, possibleValues])

    useEffect(() => {
      if (!onFormStateChange) return

      const hasName = name?.trim()
      const hasDetailsData = description?.trim() || handle?.trim()
      const detailsStatus = hasName
        ? "completed"
        : hasDetailsData
          ? "in-progress"
          : "not-started"

      const hasTypeData =
        uiComponent && (possibleValues?.length ?? 0) > 0
      const typeStatus = hasTypeData ? "completed" : "not-started"

      onFormStateChange({
        detailsStatus: detailsStatus as
          | "not-started"
          | "in-progress"
          | "completed",
        typeStatus: typeStatus as "not-started" | "in-progress" | "completed",
      })
    }, [
	formStateKey,
	onFormStateChange,
	uiComponent,
	handle,
	description,
	name,
	possibleValues.length
])

    const renderDetailsTab = () => (
      <div className="grid gap-6" data-testid="attribute-form-details-tab">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Form.Field
            control={form.control}
            name="name"
            render={({ field }) => (
              <Form.Item data-testid="attribute-form-name-field">
                <Form.Label data-testid="attribute-form-name-label">
                  {t("attributes.fields.name", "Name")}
                </Form.Label>
                <Form.Control data-testid="attribute-form-name-control">
                  <Input
                    {...field}
                    size="small"
                    data-testid="attribute-form-name-input"
                  />
                </Form.Control>
                <Form.ErrorMessage data-testid="attribute-form-name-error" />
              </Form.Item>
            )}
          />

          <Form.Field
            control={form.control}
            name="handle"
            render={({ field }) => (
              <Form.Item data-testid="attribute-form-handle-field">
                <Form.Label optional data-testid="attribute-form-handle-label">
                  {t("attributes.fields.handle", "Handle")}
                </Form.Label>
                <Form.Control data-testid="attribute-form-handle-control">
                  <div className="relative">
                    <Input
                      {...field}
                      size="small"
                      className="pl-9"
                      data-testid="attribute-form-handle-input"
                    />
                    <div className="z-100 absolute bottom-0 left-0 top-0 flex w-7 items-center justify-center border-r border-ui-border-base px-2 text-ui-fg-muted">
                      /
                    </div>
                  </div>
                </Form.Control>
                <Form.ErrorMessage data-testid="attribute-form-handle-error" />
              </Form.Item>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Form.Field
            control={form.control}
            name="description"
            render={({ field }) => (
              <Form.Item data-testid="attribute-form-description-field">
                <Form.Label
                  optional
                  data-testid="attribute-form-description-label"
                >
                  {t("attributes.fields.description", "Description")}
                </Form.Label>
                <Form.Control data-testid="attribute-form-description-control">
                  <Textarea
                    {...field}
                    data-testid="attribute-form-description-input"
                  />
                </Form.Control>
                <Form.ErrorMessage data-testid="attribute-form-description-error" />
              </Form.Item>
            )}
          />

          <Form.Field
            control={form.control}
            name="is_filterable"
            render={({ field }) => (
              <Form.Item data-testid="attribute-form-filterable-field">
                <div className="rounded-lg bg-ui-bg-component p-4 shadow-elevation-card-rest">
                  <div className="flex gap-3">
                    <Form.Control data-testid="attribute-form-filterable-control">
                      <Switch
                        checked={field.value as boolean}
                        onCheckedChange={field.onChange}
                        className="mt-1"
                        data-testid="attribute-form-filterable-switch"
                      />
                    </Form.Control>
                    <div>
                      <Form.Label data-testid="attribute-form-filterable-label">
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
              <Form.Item data-testid="attribute-form-required-field">
                <div className="rounded-lg bg-ui-bg-component p-4 shadow-elevation-card-rest">
                  <div className="flex gap-3">
                    <Form.Control data-testid="attribute-form-required-control">
                      <Switch
                        checked={field.value as boolean}
                        onCheckedChange={field.onChange}
                        className="mt-1"
                        data-testid="attribute-form-required-switch"
                      />
                    </Form.Control>
                    <div>
                      <Form.Label data-testid="attribute-form-required-label">
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

          <Form.Field
            control={form.control}
            name="product_category_ids"
            render={({ field }) => {
              const categoryIds = (field.value as string[]) ?? []
              const isGlobal = categoryIds.length === 0 && !showCategorySection
              return (
                <Form.Item data-testid="attribute-form-global-field">
                  <div className="rounded-lg bg-ui-bg-component p-4 shadow-elevation-card-rest">
                    <div className="flex gap-3">
                      <Form.Control data-testid="attribute-form-global-control">
                        <Switch
                          checked={isGlobal}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              field.onChange([])
                              setShowCategorySection(false)
                            } else {
                              setShowCategorySection(true)
                            }
                          }}
                          className="mt-1"
                          data-testid="attribute-form-global-switch"
                        />
                      </Form.Control>
                      <div>
                        <Form.Label data-testid="attribute-form-global-label">
                          {t(
                            "attributes.fields.global",
                            "Yes, this is a global attribute"
                          )}
                        </Form.Label>
                        <Text className="mt-1 text-xs text-ui-fg-subtle">
                          {t(
                            "attributes.hints.global",
                            "When enabled, this attribute applies to all products regardless of category."
                          )}
                        </Text>
                      </div>
                    </div>
                  </div>

                  {(showCategorySection || categoryIds.length > 0) && (
                    <div className="mt-4" data-testid="attribute-form-category-field">
                      <Form.Label
                        optional
                        data-testid="attribute-form-category-label"
                      >
                        {t("attributes.fields.categories", "Product Categories")}
                      </Form.Label>
                      <div className="mt-1">
                        <MultiSelectCategory
                          categories={categories ?? []}
                          value={categoryIds}
                          onChange={(value) => field.onChange(value)}
                        />
                      </div>
                      <Form.ErrorMessage data-testid="attribute-form-category-error" />
                      <div className="mt-3">
                        <InlineTip label="Warning" variant="warning">
                          {t(
                            "attributes.hints.categoryInheritance",
                            "Child categories will inherit this attribute."
                          )}
                        </InlineTip>
                      </div>
                    </div>
                  )}
                </Form.Item>
              )
            }}
          />
        </div>
      </div>
    )

    const renderTypeTab = () => (
      <div
        className="grid w-full gap-6"
        data-testid="attribute-form-type-tab"
      >
        <Form.Field
          control={form.control}
          name="ui_component"
          render={({ field }) => (
            <Form.Item data-testid="attribute-form-ui-component-field">
              <Form.Label data-testid="attribute-form-ui-component-label">
                {t("attributes.fields.type", "Type")}
              </Form.Label>
              <Form.Control data-testid="attribute-form-ui-component-control">
                <Select
                  value={field.value as string}
                  onValueChange={field.onChange}
                  data-testid="attribute-form-ui-component-select"
                >
                  <Select.Trigger
                    className="mt-1"
                    data-testid="attribute-form-ui-component-trigger"
                  >
                    <Select.Value
                      placeholder={t(
                        "attributes.fields.typePlaceholder",
                        "Select Type"
                      )}
                    />
                  </Select.Trigger>
                  <Select.Content data-testid="attribute-form-ui-component-content">
                    {Object.values(AttributeUIComponent).map((component) => (
                      <Select.Item
                        key={component}
                        value={component}
                        data-testid={`attribute-form-ui-component-option-${component}`}
                      >
                        {UI_COMPONENT_LABELS[component] ?? component}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </Form.Control>
              <Form.ErrorMessage data-testid="attribute-form-ui-component-error" />
            </Form.Item>
          )}
        />

        {(uiComponent === AttributeUIComponent.SELECT ||
          uiComponent === AttributeUIComponent.MULTIVALUE) && (
          <InlineTip label="Tip" variant="info">
            {uiComponent === AttributeUIComponent.SELECT
              ? t(
                  "attributes.tips.singleSelect",
                  "When creating Single Select vendor will be able to choose only one value. This type of attribute will be good for product specifications."
                )
              : t(
                  "attributes.tips.multiSelect",
                  "When creating Multi Select vendor will be able to choose multiple values."
                )}
          </InlineTip>
        )}

        {(uiComponent === AttributeUIComponent.SELECT ||
          uiComponent === AttributeUIComponent.MULTIVALUE) && (
          <div data-testid="attribute-form-possible-values-section">
            <PossibleValuesList />
          </div>
        )}
      </div>
    )

    return (
      <FormProvider {...form}>
        <form
          id="attribute-form"
          onSubmit={handleSubmit}
          data-testid="attribute-form"
        >
          {activeTab === "details" && renderDetailsTab()}
          {activeTab === "type" && renderTypeTab()}
        </form>
      </FormProvider>
    )
  }
)

AttributeForm.displayName = "AttributeForm"
