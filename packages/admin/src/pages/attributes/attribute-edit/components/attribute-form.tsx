import {
  forwardRef,
  useEffect,
  useMemo,
  useImperativeHandle,
} from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input, Select, Textarea } from "@medusajs/ui"
import { FormProvider, useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { AttributeType, ProductAttributeDTO } from "@mercurjs/types"
import { Form } from "../../../../components/common/form"
import { SwitchBox } from "../../../../components/common/switch-box"
import { HandleInput } from "../../../../components/inputs/handle-input"
import {
  ATTRIBUTE_TYPE_OPTIONS,
  CreateAttributeSchema,
  UpdateAttributeSchema,
} from "../schema"
import type {
  CreateAttributeFormValues,
  UpdateAttributeFormValues,
} from "../types"
import { PossibleValuesList } from "../../attribute-create/components/possible-values-list"

export interface AttributeFormRef {
  validateFields: (fields: string[]) => Promise<boolean>
}

export interface AttributeFormProps {
  initialData?: ProductAttributeDTO
  onSubmit: (
    data: CreateAttributeFormValues | UpdateAttributeFormValues
  ) => Promise<void>
  mode?: "create" | "update"
  activeTab?: "details" | "type"
  onFormStateChange?: (formState: {
    detailsStatus: "not-started" | "in-progress" | "completed"
    typeStatus: "not-started" | "in-progress" | "completed"
  }) => void
}

const ATTRIBUTE_TYPE_LABELS: Record<string, string> = {
  [AttributeType.SINGLE_SELECT]: "attributes.type.select",
  [AttributeType.MULTI_SELECT]: "attributes.type.multivalue",
  [AttributeType.UNIT]: "attributes.type.unit",
  [AttributeType.TOGGLE]: "attributes.type.toggle",
  [AttributeType.TEXT]: "attributes.type.text_area",
}

export const AttributeForm = forwardRef<AttributeFormRef, AttributeFormProps>(
  (
    {
      initialData,
      onSubmit,
      mode = "create",
      activeTab = "details",
      onFormStateChange,
    },
    ref
  ) => {
    const { t } = useTranslation()

    const form = useForm<CreateAttributeFormValues | UpdateAttributeFormValues>({
      resolver: zodResolver(
        mode === "create" ? CreateAttributeSchema : UpdateAttributeSchema
      ),
      defaultValues: {
        name: initialData?.name ?? "",
        description: initialData?.description ?? "",
        handle: initialData?.handle ?? "",
        type: initialData?.type ?? AttributeType.SINGLE_SELECT,
        is_filterable: initialData?.is_filterable ?? false,
        is_required: initialData?.is_required ?? false,
        is_variant_axis: initialData?.is_variant_axis ?? false,
        values:
          initialData?.values?.map((v) => ({
            id: v.id,
            name: v.name,
            rank: v.rank,
          })) ?? [],
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

    const [name, description, handle, type, values] = useWatch({
      control: form.control,
      name: ["name", "description", "handle", "type", "values"],
    })

    const formStateKey = useMemo(() => {
      return JSON.stringify({
        name,
        description,
        handle,
        type,
        valuesCount: values?.length ?? 0,
      })
    }, [name, description, handle, type, values])

    useEffect(() => {
      if (!onFormStateChange) return

      const hasName = name?.trim()
      const hasDetailsData = description?.trim() || handle?.trim()
      const detailsStatus = hasName
        ? "completed"
        : hasDetailsData
          ? "in-progress"
          : "not-started"

      const hasTypeData = type && (values?.length ?? 0) > 0
      const typeStatus = hasTypeData ? "completed" : "not-started"

      onFormStateChange({
        detailsStatus: detailsStatus as
          | "not-started"
          | "in-progress"
          | "completed",
        typeStatus: typeStatus as "not-started" | "in-progress" | "completed",
      })
    }, [formStateKey, onFormStateChange])

    const showValues =
      type === AttributeType.SINGLE_SELECT ||
      type === AttributeType.MULTI_SELECT

    const renderDetailsTab = () => (
      <div
        className="flex flex-col gap-y-8"
        data-testid="attribute-form-details-tab"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Form.Field
            control={form.control}
            name="name"
            render={({ field }) => (
              <Form.Item data-testid="attribute-form-name-field">
                <Form.Label>{t("attributes.fields.name")}</Form.Label>
                <Form.Control>
                  <Input
                    {...field}
                    data-testid="attribute-form-name-input"
                  />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
          <Form.Field
            control={form.control}
            name="handle"
            render={({ field }) => (
              <Form.Item data-testid="attribute-form-handle-field">
                <Form.Label optional>
                  {t("attributes.fields.handle")}
                </Form.Label>
                <Form.Control>
                  <HandleInput
                    {...field}
                    data-testid="attribute-form-handle-input"
                  />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
        </div>

        <Form.Field
          control={form.control}
          name="description"
          render={({ field }) => (
            <Form.Item data-testid="attribute-form-description-field">
              <Form.Label optional>
                {t("attributes.fields.description")}
              </Form.Label>
              <Form.Control>
                <Textarea
                  {...field}
                  data-testid="attribute-form-description-input"
                />
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Item>
          )}
        />

        <SwitchBox
          control={form.control}
          name="is_filterable"
          label={t("attributes.fields.isFilterable", "Filterable attribute")}
          description={t(
            "attributes.fields.isFilterableHint",
            "If checked, buyers will be able to filter products using this attribute."
          )}
          data-testid="attribute-form-filterable-switch"
        />

        <SwitchBox
          control={form.control}
          name="is_required"
          label={t("attributes.fields.isRequired", "Required attribute")}
          description={t(
            "attributes.fields.isRequiredHint",
            "If checked, vendors must set a value for this attribute."
          )}
          data-testid="attribute-form-required-switch"
        />

        <SwitchBox
          control={form.control}
          name="is_variant_axis"
          label={t(
            "attributes.fields.isVariantAxis",
            "Use for Variants"
          )}
          description={t(
            "attributes.fields.isVariantAxisHint",
            "If checked, this attribute can be used to create product variants."
          )}
          data-testid="attribute-form-variant-axis-switch"
        />
      </div>
    )

    const renderTypeTab = () => (
      <div
        className="flex w-full flex-col gap-y-8"
        data-testid="attribute-form-type-tab"
      >
        <Form.Field
          control={form.control}
          name="type"
          render={({ field }) => (
            <Form.Item data-testid="attribute-form-type-field">
              <Form.Label>{t("attributes.fields.type")}</Form.Label>
              <Form.Control>
                <Select
                  value={field.value as string}
                  onValueChange={field.onChange}
                  data-testid="attribute-form-type-select"
                >
                  <Select.Trigger data-testid="attribute-form-type-trigger">
                    <Select.Value
                      placeholder={t(
                        "attributes.fields.typePlaceholder",
                        "Select Type"
                      )}
                    />
                  </Select.Trigger>
                  <Select.Content>
                    {ATTRIBUTE_TYPE_OPTIONS.map((option) => (
                      <Select.Item
                        key={option}
                        value={option}
                        data-testid={`attribute-form-type-option-${option}`}
                      >
                        {t(ATTRIBUTE_TYPE_LABELS[option] ?? option)}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Item>
          )}
        />

        {showValues && (
          <div data-testid="attribute-form-values-section">
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
