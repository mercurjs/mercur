import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Heading, Input, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { HttpTypes } from "@medusajs/types"
import { AttributeType, ProductDTO } from "@mercurjs/types"

import { Form } from "@components/common/form"
import { AttributeValueInput } from "@components/inputs/attribute-value-input"
import { RouteFocusModal, useRouteModal } from "@components/modals"
import { KeyboundForm } from "@components/utilities/keybound-form"
import { useCreateProductVariant } from "@hooks/api/products"
import { CreateProductVariantSchema } from "./constants"

export type CreateProductVariantSchemaType = z.infer<
  typeof CreateProductVariantSchema
>

type CreateProductVariantFormProps = {
  product: HttpTypes.AdminProduct
}

export const CreateProductVariantForm = ({
  product,
}: CreateProductVariantFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const variantAttributes =
    (
      product as HttpTypes.AdminProduct & Pick<ProductDTO, "attributes">
    ).attributes?.filter((a) => a.is_variant_axis) ?? []

  // Seed every variant-axis option with an empty value so the required
  // validation fires for untouched selects (an empty record would pass).
  const defaultOptions = variantAttributes.reduce<Record<string, string>>(
    (acc, attribute) => {
      acc[attribute.handle ?? attribute.id] = ""
      return acc
    },
    {}
  )

  const form = useForm<CreateProductVariantSchemaType>({
    defaultValues: {
      title: "",
      sku: "",
      options: defaultOptions,
    },
    resolver: zodResolver(CreateProductVariantSchema),
  })

  const { mutateAsync, isPending } = useCreateProductVariant(product.id)

  const handleSubmit = form.handleSubmit(async (data) => {
    const { title, options } = data

    // Form keys variant fields by `handle ?? id`; backend keys options
    // by option title (= attribute name). Remap before submitting.
    const cleanedOptions = variantAttributes.reduce<Record<string, string>>(
      (acc, attr) => {
        const fieldKey = attr.handle ?? attr.id
        const v = options?.[fieldKey]
        if (v && attr.name) acc[attr.name] = v
        return acc
      },
      {}
    )

    await mutateAsync(
      {
        title,
        options: Object.keys(cleanedOptions).length
          ? cleanedOptions
          : undefined,
      },
      {
        onSuccess: () => {
          handleSuccess()
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  })

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex h-full flex-col">
        <RouteFocusModal.Header>
          <RouteFocusModal.Title asChild>
            <span className="sr-only">
              {t("products.variant.create.header")}
            </span>
          </RouteFocusModal.Title>
          <RouteFocusModal.Description className="sr-only">
            {t("products.variant.create.header")}
          </RouteFocusModal.Description>
        </RouteFocusModal.Header>

        <RouteFocusModal.Body className="flex flex-1 flex-col items-center overflow-y-auto">
          <div className="flex w-full max-w-[720px] flex-col gap-y-8 px-8 py-16">
            <Heading level="h1">{t("products.variant.create.header")}</Heading>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Form.Field
                control={form.control}
                name="title"
                render={({ field }) => {
                  return (
                    <Form.Item>
                      <Form.Label>{t("fields.title")}</Form.Label>
                      <Form.Control>
                        <Input
                          {...field}
                          data-testid="create-variant-title-input"
                        />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )
                }}
              />

              <Form.Field
                control={form.control}
                name="sku"
                render={({ field }) => {
                  return (
                    <Form.Item>
                      <Form.Label optional>{t("fields.sku")}</Form.Label>
                      <Form.Control>
                        <Input
                          {...field}
                          data-testid="create-variant-sku-input"
                        />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )
                }}
              />

              {variantAttributes.map((attribute) => {
                const fieldKey = attribute.handle ?? attribute.id
                return (
                  <Form.Field
                    key={attribute.id}
                    control={form.control}
                    name={`options.${fieldKey}`}
                    render={({ field: { value, onChange } }) => {
                      return (
                        <Form.Item>
                          <Form.Label>{attribute.name}</Form.Label>
                          <Form.Control>
                            <AttributeValueInput
                              type={AttributeType.SINGLE_SELECT}
                              value={typeof value === "string" ? value : ""}
                              onChange={onChange}
                              availableValues={(attribute.values ?? []).map(
                                (v) => ({
                                  id: v.id,
                                  name: v.name,
                                })
                              )}
                            />
                          </Form.Control>
                          <Form.ErrorMessage />
                        </Form.Item>
                      )
                    }}
                  />
                )
              })}
            </div>
          </div>
        </RouteFocusModal.Body>

        <RouteFocusModal.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteFocusModal.Close asChild>
              <Button variant="secondary" size="small">
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button
              type="submit"
              variant="primary"
              size="small"
              isLoading={isPending}
              data-testid="create-variant-submit-button"
            >
              {t("actions.save")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}
