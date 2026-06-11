import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "@medusajs/ui"
import { Children, ReactNode, useMemo } from "react"
import { DeepPartial, useForm } from "react-hook-form"
import { z } from "zod"

import { HttpTypes } from "@medusajs/types"
import { ProductDTO } from "@mercurjs/types"
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
  options: {},
}

export const CreateProductVariantForm = ({
  product,
  children,
  schema,
  defaultValues: extraDefaults,
}: CreateProductVariantFormProps) => {
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
      ...CREATE_VARIANT_DEFAULTS,
      options: defaultOptions,
      ...extraDefaults,
    } as CreateProductVariantSchemaType,
    resolver: zodResolver(schema ?? CreateProductVariantSchema),
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
      {},
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
