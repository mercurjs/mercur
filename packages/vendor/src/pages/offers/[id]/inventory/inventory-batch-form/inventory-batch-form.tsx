import { zodResolver } from "@hookform/resolvers/zod"
import { HttpTypes } from "@medusajs/types"
import { Button, toast, usePrompt } from "@medusajs/ui"
import { useMemo, useRef, useState } from "react"
import { DefaultValues, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { DataGrid } from "../../../../../components/data-grid"
import {
  RouteFocusModal,
  useRouteModal,
} from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useBatchInventoryItemsLocationLevels } from "../../../../../hooks/api/inventory"
import { castNumber } from "../../../../../lib/cast-number"
import { OfferDetail } from "../../../common/types"
import { useOfferStockColumns } from "./hooks/use-offer-stock-columns"
import {
  OfferStockFormValues,
  OfferStockInventoryItemSchema,
  OfferStockLocationSchema,
  OfferStockSchema,
} from "./schema"
import { OfferInventoryItemRow } from "./types"

type InventoryBatchFormProps = {
  offer: OfferDetail
  locations: HttpTypes.AdminStockLocation[]
}

export const InventoryBatchForm = ({
  offer,
  locations,
}: InventoryBatchFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess, setCloseOnEscape } = useRouteModal()
  const prompt = usePrompt()
  const [isPromptOpen, setIsPromptOpen] = useState(false)

  const rows = useMemo(() => buildRows(offer), [offer])
  const defaults = useMemo(
    () => getDefaultValue(offer, locations),
    [offer, locations],
  )
  const initialValues = useRef(defaults)

  const form = useForm<OfferStockFormValues>({
    defaultValues: defaults,
    resolver: zodResolver(OfferStockSchema),
  })

  const columns = useOfferStockColumns(locations)
  const { mutateAsync, isPending } = useBatchInventoryItemsLocationLevels()

  const onSubmit = form.handleSubmit(async (data) => {
    const payload: HttpTypes.AdminBatchInventoryItemsLocationLevels = {
      create: [],
      update: [],
      delete: [],
      force: true,
    }

    for (const [inventory_item_id, item] of Object.entries(
      data.inventory_items,
    )) {
      for (const [location_id, level] of Object.entries(item.locations)) {
        if (level.id) {
          const wasChecked =
            initialValues.current.inventory_items?.[inventory_item_id]?.locations?.[
              location_id
            ]?.checked

          if (wasChecked && !level.checked) {
            payload.delete!.push(level.id)
          } else {
            const newQuantity =
              level.quantity !== "" ? castNumber(level.quantity) : 0
            const originalQuantity =
              initialValues.current.inventory_items?.[inventory_item_id]
                ?.locations?.[location_id]?.quantity

            if (newQuantity !== originalQuantity) {
              payload.update!.push({
                inventory_item_id,
                location_id,
                stocked_quantity: newQuantity,
              })
            }
          }
        }

        if (!level.id && level.quantity !== "") {
          payload.create!.push({
            inventory_item_id,
            location_id,
            stocked_quantity: castNumber(level.quantity),
          })
        }
      }
    }

    if (payload.delete && payload.delete.length > 0) {
      setIsPromptOpen(true)
      const confirm = await prompt({
        title: t("general.areYouSure"),
        description: t("inventory.stock.disablePrompt", {
          count: payload.delete.length,
        }),
        confirmText: t("actions.continue"),
        cancelText: t("actions.cancel"),
        variant: "confirmation",
      })
      setIsPromptOpen(false)
      if (!confirm) return
    }

    await mutateAsync(payload, {
      onSuccess: () => {
        toast.success(t("offers.inventory.successToast"))
        handleSuccess()
      },
      onError: (error) => toast.error(error.message),
    })
  })

  return (
    <RouteFocusModal.Form form={form} data-testid="offer-inventory-batch-form">
      <KeyboundForm onSubmit={onSubmit} className="flex size-full flex-col">
        <RouteFocusModal.Header />
        <RouteFocusModal.Body className="flex flex-col overflow-hidden">
          <DataGrid
            state={form}
            columns={columns}
            data={rows}
            onEditingChange={(editing) => setCloseOnEscape(!editing)}
            disableInteractions={isPending || isPromptOpen}
            multiColumnSelection
          />
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteFocusModal.Close asChild>
              <Button variant="secondary" size="small" type="button">
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button type="submit" size="small" isLoading={isPending}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}

function buildRows(offer: OfferDetail): OfferInventoryItemRow[] {
  return (offer.inventory_item_link ?? [])
    .map((link) => {
      const item = link.inventory_item
      if (!item?.id) return null
      return {
        id: item.id,
        title: item.title,
        sku: item.sku,
        thumbnail: null,
      } satisfies OfferInventoryItemRow
    })
    .filter((row): row is OfferInventoryItemRow => row !== null)
}

function getDefaultValue(
  offer: OfferDetail,
  locations: HttpTypes.AdminStockLocation[],
): DefaultValues<OfferStockFormValues> {
  const inventory_items: Record<string, OfferStockInventoryItemSchema> = {}

  for (const link of offer.inventory_item_link ?? []) {
    const item = link.inventory_item
    if (!item?.id) continue
    const locationMap: OfferStockLocationSchema = {}
    for (const location of locations) {
      const level = item.location_levels?.find(
        (l) => l.location_id === location.id,
      )
      locationMap[location.id] = {
        id: level?.id,
        quantity:
          level?.stocked_quantity !== undefined &&
          level?.stocked_quantity !== null
            ? level.stocked_quantity
            : "",
        checked: !!level,
        disabledToggle:
          ((level?.incoming_quantity as number | undefined) ?? 0) > 0 ||
          ((level?.reserved_quantity as number | undefined) ?? 0) > 0,
      }
    }
    inventory_items[item.id] = { locations: locationMap }
  }

  return { inventory_items }
}
