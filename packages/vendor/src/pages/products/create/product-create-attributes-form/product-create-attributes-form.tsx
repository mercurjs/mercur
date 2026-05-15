import { forwardRef, useEffect, useImperativeHandle } from "react"

import { CircleInfoSolid } from "@medusajs/icons"
import { Button, Divider, Heading, Text, Tooltip } from "@medusajs/ui"
import { Path, useFieldArray, UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { useAttributes } from "../../../../hooks/api/attributes"
import { ProductAttribute } from "../../types"
import { ProductCreateSchemaType } from "../types"
import { createAttributeValidationRules } from "../utils/attribute-validation"
import {
  processAttributes,
  type FormField,
} from "../utils/process-attributes"
import { RequiredAttributesList } from "./required-attributes-list"
import { UserCreatedOptionsList } from "./user-created-options-list"

export interface ProductCreateAttributesFormRef {
  validateAttributes: () => Promise<boolean>
  requiredFormFields: FormField[]
}

type ProductCreateAttributesFormProps = {
  form: UseFormReturn<ProductCreateSchemaType>
}

export const ProductCreateAttributesForm = forwardRef<
  ProductCreateAttributesFormRef,
  ProductCreateAttributesFormProps
>(({ form }, ref) => {
  const { t } = useTranslation()

  const primaryCategoryId = form.watch("categories")?.[0]

  const options = useFieldArray({
    control: form.control,
    name: "options",
  })

  const { attributes: allAttributes, isLoading: allAttributesLoading } =
    useAttributes({
      fields:
        "id,name,handle,description,ui_component,is_required,product_categories.*,possible_values.*",
    })

  const processedAttributes = processAttributes(
    allAttributes,
    primaryCategoryId
  )
  const requiredFormFields = processedAttributes.required.all

  const validationRules = createAttributeValidationRules(
    requiredFormFields,
    t as any
  )

  const validateAttributes = async () => {
    const errors: Record<string, string> = {}

    requiredFormFields.forEach((field) => {
      if (field.is_required) {
        const value = form.getValues(
          field.handle as Path<ProductCreateSchemaType>
        )

        switch (field.ui_component) {
          case "select":
          case "toggle":
            if (!value || value === "") {
              errors[field.handle] = t(
                "products.fields.attributes.validation.requiredSelect"
              )
            }
            break
          case "text":
          case "text_area":
            if (!value || value === "") {
              errors[field.handle] = t(
                "products.fields.attributes.validation.requiredEnter"
              )
            }
            break
          case "multivalue":
            if (
              !value ||
              !Array.isArray(value) ||
              value.length === 0
            ) {
              errors[field.handle] = t(
                "products.fields.attributes.validation.requiredSelectMultiple"
              )
            }
            break
          case "unit":
            if (
              value === undefined ||
              value === null ||
              value === ""
            ) {
              errors[field.handle] = t(
                "products.fields.attributes.validation.requiredEnter"
              )
            }
            break
        }
      }
    })

    requiredFormFields.forEach((field) => {
      if (field.is_required) {
        form.clearErrors(
          field.handle as Path<ProductCreateSchemaType>
        )
      }
    })

    Object.keys(errors).forEach((fieldName) => {
      form.setError(fieldName as Path<ProductCreateSchemaType>, {
        type: "required",
        message: errors[fieldName],
      })
    })

    const currentOptions = form.getValues("options") || []
    const optionsValid = currentOptions.length > 0
      ? await form.trigger("options")
      : true

    return Object.keys(errors).length === 0 && optionsValid
  }

  useImperativeHandle(
    ref,
    () => ({
      validateAttributes,
      requiredFormFields,
    }),
    /* oxlint-disable react-hooks/exhaustive-deps */
    [
	requiredFormFields,
	validateAttributes
]
  /* oxlint-enable react-hooks/exhaustive-deps */
  )

  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
      if (
        name &&
        requiredFormFields.some((field) => field.handle === name)
      ) {
        const field = requiredFormFields.find(
          (f) => f.handle === name
        )
        if (field && field.is_required) {
          const value = values[name as keyof typeof values]
          let isValid = false

          switch (field.ui_component) {
            case "select":
            case "toggle":
              isValid = typeof value === "string" && value !== ""
              break
            case "text":
            case "text_area":
              isValid = typeof value === "string" && value !== ""
              break
            case "multivalue":
              isValid =
                Array.isArray(value) && value.length > 0
              break
            case "unit":
              isValid =
                value !== undefined &&
                value !== null &&
                value !== ""
              break
            default:
              isValid = false
              break
          }

          if (isValid) {
            form.clearErrors(
              name as Path<ProductCreateSchemaType>
            )
          }
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [form, requiredFormFields])

  const nonRequiredAttributes = allAttributes?.filter(
    (attribute: any) => !attribute.is_required
  )
  const availableAttributes = nonRequiredAttributes?.filter(
    (attribute: any) =>
      !options.fields?.some(
        (option: any) => option.attributeId === attribute.id
      )
  )

  return (
    <div className="flex flex-col items-center p-16">
      <div className="flex w-full max-w-[720px] flex-col gap-y-8">
        <Header options={options} />
        <div className="flex flex-col gap-y-8">
          <UserCreatedOptionsList
            form={form}
            options={options}
            availableAttributes={
              availableAttributes as ProductAttribute[]
            }
            allNonRequiredAttributes={
              nonRequiredAttributes as ProductAttribute[]
            }
            allowCreate={true}
          />

          {requiredFormFields.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              {allAttributesLoading
                ? t("products.create.attributes.loading")
                : null}
            </div>
          ) : (
            <>
              <Divider variant="dashed" />
              <div className="flex flex-col gap-y-2">
                <Heading level="h3" className="text-ui-fg-base">
                  {t(
                    "products.create.attributes.requiredHeading"
                  )}
                </Heading>
                <Text
                  size="small"
                  className="text-ui-fg-subtle"
                >
                  {t(
                    "products.create.attributes.requiredDescription"
                  )}
                </Text>
              </div>

              <RequiredAttributesList
                form={form}
                fields={requiredFormFields}
                validationRules={validationRules}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
})

ProductCreateAttributesForm.displayName =
  "ProductCreateAttributesForm"

type HeaderProps = {
  options: {
    append: (
      option: {
        title: string
        values: string[]
        metadata?: Record<string, unknown>
        useForVariants: boolean
      },
      focusOptions: Record<string, boolean>
    ) => void
  }
}

const Header = ({ options }: HeaderProps) => {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-y-2">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-y-2">
          <Heading level="h1" className="text-ui-fg-base">
            {t("products.create.tabs.attributes")}
          </Heading>
          <div className="space-y-0.5">
            <Text
              size="small"
              className="max-w-[440px] text-ui-fg-subtle"
            >
              {t("products.create.attributes.description")}
            </Text>
            <Text
              size="small"
              className="flex items-center gap-1 text-ui-fg-subtle"
            >
              {t(
                "products.create.attributes.learnMore.label"
              )}
              <Tooltip
                content={t(
                  "products.create.attributes.learnMore.content"
                )}
              >
                <CircleInfoSolid />
              </Tooltip>
            </Text>
          </div>
        </div>
        <Button
          size="small"
          variant="secondary"
          type="button"
          className="min-w-[100px]"
          onClick={() => {
            options.append(
              {
                title: "",
                values: [],
                metadata: { author: "vendor" },
                useForVariants: true,
              },
              {
                shouldFocus: false,
              }
            )
          }}
        >
          {t("actions.add")}{" "}
          {t("products.create.attributes.buttonLabel")}
        </Button>
      </div>
    </div>
  )
}
