import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "@medusajs/ui"
import { Children, ReactNode, useMemo } from "react"
import { DeepPartial, useForm } from "react-hook-form"
import { z } from "zod"

import { HttpTypes } from "@medusajs/types"
import { useRouteModal } from "@components/modals"
import { TabbedForm } from "@components/tabbed-form/tabbed-form"
import { useCreateProductVariant } from "@hooks/api/products"
import { CreateProductVariantSchema } from "./constants"
import DetailsTab from "./details-tab"

export type CreateProductVariantSchemaType = z.infer<
  typeof CreateProductVariantSchema
>

type CreateProductVariantFormProps = {
  product: HttpTypes.AdminProduct
  children?: ReactNode
  schema?: z.ZodType<CreateProductVariantSchemaType>
  defaultValues?: DeepPartial<CreateProductVariantSchemaType>
}

const CREATE_VARIANT_DEFAULTS: DeepPartial<CreateProductVariantSchemaType> = {
  sku: "",
  title: "",
  attribute_values: {},
}

export const CreateProductVariantForm = ({
  product,
  children,
  schema,
  defaultValues: extraDefaults,
}: CreateProductVariantFormProps) => {
  const { handleSuccess } = useRouteModal()

  const form = useForm<CreateProductVariantSchemaType>({
    defaultValues: {
      ...CREATE_VARIANT_DEFAULTS,
      ...extraDefaults,
    } as CreateProductVariantSchemaType,
    resolver: zodResolver(schema ?? CreateProductVariantSchema),
  })

  const { mutateAsync, isPending } = useCreateProductVariant(product.id)

  const handleSubmit = form.handleSubmit(async (data) => {
    const { title, attribute_values } = data

    const cleanedAttributeValues = Object.fromEntries(
      Object.entries(attribute_values ?? {}).filter(([, v]) =>
        Array.isArray(v) ? v.length > 0 : !!v
      )
    ) as Record<string, string | string[]>

    await mutateAsync(
      {
        title,
        attribute_values: Object.keys(cleanedAttributeValues).length
          ? cleanedAttributeValues
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

  const defaultTabs = useMemo(
    () => [<DetailsTab key="details" product={product} />],
    [product]
  )

  const hasCustomChildren = Children.count(children) > 0

  return (
    <TabbedForm form={form} onSubmit={handleSubmit} isLoading={isPending}>
      {hasCustomChildren ? children : defaultTabs}
    </TabbedForm>
  )
}
