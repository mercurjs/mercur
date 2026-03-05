import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "@medusajs/ui"
import { Children, ReactNode, useMemo } from "react"
import { DeepPartial, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { HttpTypes } from "@medusajs/types"
import { useRouteModal } from "../../../../../components/modals"
import { TabbedForm } from "../../../../../components/tabbed-form/tabbed-form"
import {
  inventoryItemsQueryKeys,
  useCreateInventoryItem,
} from "../../../../../hooks/api/inventory"
import { sdk } from "../../../../../lib/client"
import {
  transformNullableFormData,
  transformNullableFormNumber,
  transformNullableFormNumbers,
} from "../../../../../lib/form-helpers"
import { queryClient } from "../../../../../lib/query-client"
import { InventoryAvailabilityForm } from "./inventory-availability-form"
import { InventoryCreateDetailsTab } from "./inventory-create-details-tab"
import { CreateInventoryItemSchema } from "./schema"

export type CreateInventoryItemSchemaType = z.infer<typeof CreateInventoryItemSchema>

type InventoryCreateFormProps = {
  locations: HttpTypes.AdminStockLocation[]
  children?: ReactNode
  schema?: z.ZodType<CreateInventoryItemSchemaType>
  defaultValues?: DeepPartial<CreateInventoryItemSchemaType>
}

export function InventoryCreateForm({
  locations,
  children,
  schema,
  defaultValues: extraDefaults,
}: InventoryCreateFormProps) {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<CreateInventoryItemSchemaType>({
    defaultValues: {
      title: "",
      sku: "",
      hs_code: "",
      weight: "",
      length: "",
      height: "",
      width: "",
      origin_country: "",
      mid_code: "",
      material: "",
      description: "",
      requires_shipping: true,
      thumbnail: "",
      locations: Object.fromEntries(
        locations.map((location) => [location.id, ""])
      ),
      ...extraDefaults,
    } as CreateInventoryItemSchemaType,
    resolver: zodResolver(schema ?? CreateInventoryItemSchema),
  })

  const { mutateAsync: createInventoryItem, isPending: isLoading } =
    useCreateInventoryItem()

  const handleSubmit = form.handleSubmit(async (data) => {
    const { locations: formLocations, weight, length, height, width, ...payload } = data

    const cleanData = transformNullableFormData(payload, false)
    const cleanNumbers = transformNullableFormNumbers(
      { weight, length, height, width },
      false
    )

    const { inventory_item } = await createInventoryItem(
      {
        ...cleanData,
        ...cleanNumbers,
      },
      {
        onError: (e) => {
          toast.error(e.message)
          return
        },
      }
    )

    // @ts-expect-error — Mercur SDK extension
    await sdk.admin.inventoryItem.batchUpdateLevels(inventory_item.id, {
        create: Object.entries(formLocations ?? {})
          .filter(([_, quantiy]) => !!quantiy)
          .map(([location_id, stocked_quantity]) => ({
            location_id,
            stocked_quantity: transformNullableFormNumber(
              stocked_quantity,
              false
            ),
          })),
      })
      .then(async () => {
        await queryClient.invalidateQueries({
          queryKey: inventoryItemsQueryKeys.lists(),
        })
      })
      .catch((e: Error) => {
        toast.error(e.message)
      })
      .finally(() => {
        handleSuccess()
        toast.success(t("inventory.create.successToast"))
      })
  })

  const defaultTabs = useMemo(
    () => [
      <InventoryCreateDetailsTab key="details" />,
      <InventoryAvailabilityForm key="availability" locations={locations} />,
    ],
    [locations]
  )

  const hasCustomChildren = Children.count(children) > 0

  return (
    <TabbedForm
      form={form}
      onSubmit={handleSubmit}
      isLoading={isLoading}
    >
      {hasCustomChildren ? children : defaultTabs}
    </TabbedForm>
  )
}
