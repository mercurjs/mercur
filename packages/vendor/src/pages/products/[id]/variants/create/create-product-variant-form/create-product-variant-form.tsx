import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "@medusajs/ui"
import { Children, ReactNode, useCallback, useEffect, useMemo } from "react"
import { DeepPartial, useFieldArray, useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import { HttpTypes } from "@medusajs/types"
import { useRouteModal } from "@components/modals"
import { TabbedForm } from "@components/tabbed-form/tabbed-form"
import { TabDefinition } from "@components/tabbed-form/types"
import { useCreateProductVariant } from "@hooks/api/products"
import { CreateProductVariantSchema } from "./constants"
import DetailsTab from "./details-tab"
import InventoryKitTab from "./inventory-kit-tab"
import PricingTab from "./pricing-tab"

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
  manage_inventory: false,
  allow_backorder: false,
  inventory_kit: false,
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

  const isManageInventoryEnabled = useWatch({
    control: form.control,
    name: "manage_inventory",
  })

  const isInventoryKitEnabled = useWatch({
    control: form.control,
    name: "inventory_kit",
  })

  const inventoryField = useFieldArray({
    control: form.control,
    name: `inventory`,
  })

  useEffect(() => {
    if (isInventoryKitEnabled && inventoryField.fields.length === 0) {
      inventoryField.append({
        inventory_item_id: "",
        required_quantity: undefined,
      })
    }
  }, [isInventoryKitEnabled])

  const inventoryTabEnabled = isManageInventoryEnabled && isInventoryKitEnabled

  const transformTabs = useCallback(
    (tabs: TabDefinition<z.infer<typeof CreateProductVariantSchema>>[]) => {
      return tabs.map((tab) => {
        if (tab.id === "inventory") {
          return { ...tab, isVisible: () => !!inventoryTabEnabled }
        }
        return tab
      })
    },
    [inventoryTabEnabled]
  )

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
    () => [
      <DetailsTab key="details" product={product} />,
      <PricingTab key="pricing" />,
      <InventoryKitTab key="inventory" />,
    ],
    [product]
  )

  const hasCustomChildren = Children.count(children) > 0

  return (
    <TabbedForm
      form={form}
      onSubmit={handleSubmit}
      isLoading={isPending}
      transformTabs={transformTabs}
    >
      {hasCustomChildren ? children : defaultTabs}
    </TabbedForm>
  )
}
