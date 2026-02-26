import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "@medusajs/ui"
import { useCallback, useEffect, useMemo } from "react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import { AdminCreateProductVariantPrice, HttpTypes } from "@medusajs/types"
import { useRouteModal } from "../../../../../components/modals"
import { TabbedForm } from "../../../../../components/tabbed-form/tabbed-form"
import { TabDefinition } from "../../../../../components/tabbed-form/types"
import { useRegions } from "../../../../../hooks/api"
import { useCreateProductVariant } from "../../../../../hooks/api/products"
import { castNumber } from "../../../../../lib/cast-number"
import { CreateProductVariantSchema } from "./constants"
import DetailsTab from "./details-tab"
import InventoryKitTab from "./inventory-kit-tab"
import PricingTab from "./pricing-tab"

type CreateProductVariantFormProps = {
  product: HttpTypes.AdminProduct
}

export const CreateProductVariantForm = ({
  product,
}: CreateProductVariantFormProps) => {
  const { handleSuccess } = useRouteModal()

  const form = useForm<z.infer<typeof CreateProductVariantSchema>>({
    defaultValues: {
      sku: "",
      title: "",
      manage_inventory: false,
      allow_backorder: false,
      inventory_kit: false,
      options: {},
    },
    resolver: zodResolver(CreateProductVariantSchema),
  })

  const { mutateAsync, isPending } = useCreateProductVariant(product.id)

  const { regions } = useRegions({ limit: 9999 })

  const regionsCurrencyMap = useMemo(() => {
    if (!regions?.length) {
      return {}
    }

    return regions.reduce(
      (acc, reg) => {
        acc[reg.id] = reg.currency_code
        return acc
      },
      {} as Record<string, string>
    )
  }, [regions])

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
    const { allow_backorder, manage_inventory, sku, title } = data

    await mutateAsync(
      {
        title,
        sku: sku || undefined,
        allow_backorder,
        manage_inventory,
        options: data.options,
        prices: Object.entries(data.prices ?? {})
          .map(([currencyOrRegion, value]) => {
            if (value === "" || value === undefined) {
              return undefined
            }

            const ret = {} as AdminCreateProductVariantPrice
            const amount = castNumber(value)

            if (currencyOrRegion.startsWith("reg_")) {
              ret.rules = { region_id: currencyOrRegion }
              ret.currency_code = regionsCurrencyMap[currencyOrRegion]
            } else {
              ret.currency_code = currencyOrRegion
            }

            ret.amount = amount

            return ret
          })
          .filter(Boolean),
        inventory_items: (data.inventory || [])
          .map((i) => {
            if (!i.required_quantity || !i.inventory_item_id) {
              return false
            }

            return {
              ...i,
              required_quantity: castNumber(i.required_quantity),
            }
          })
          .filter(Boolean),
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
    <TabbedForm
      form={form}
      onSubmit={handleSubmit}
      isLoading={isPending}
      transformTabs={transformTabs}
    >
      <DetailsTab product={product} />
      <PricingTab />
      <InventoryKitTab />
    </TabbedForm>
  )
}
