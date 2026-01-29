import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import * as zod from "zod"
import { clx, Input, Text, Tooltip } from "@medusajs/ui"
import { UseFormReturn } from "react-hook-form"
import { HttpTypes } from "@medusajs/types"

import { Form } from "../../../../../components/common/form/index"
import { Thumbnail } from "../../../../../components/common/thumbnail/index"
import { useProductVariant } from "../../../../../hooks/api/products"
import { getFulfillableQuantity } from "../../../../../lib/order-item"
import { CreateFulfillmentSchema } from "./constants"
import { InformationCircleSolid } from "@medusajs/icons"

type OrderEditItemProps = {
  item: HttpTypes.AdminOrderLineItem
  currencyCode: string
  locationId?: string
  onItemRemove: (itemId: string) => void
  reservations: HttpTypes.AdminReservation[]
  form: UseFormReturn<zod.infer<typeof CreateFulfillmentSchema>>
  disabled: boolean
}

export function OrderCreateFulfillmentItem({
  item,
  form,
  locationId,
  reservations,
  disabled,
}: OrderEditItemProps) {
  const { t } = useTranslation()

  const { variant } = useProductVariant(
    item.product_id,
    item.variant_id,
    {
      fields: "*inventory,*inventory.location_levels,*inventory_items",
    },
    {
      enabled: !!item.variant,
    }
  )

  const { availableQuantity, inStockQuantity } = useMemo(() => {
    if (
      !variant?.inventory_items?.length ||
      !variant?.inventory?.length ||
      !locationId
    ) {
      return {}
    }

    const { inventory, inventory_items } = variant

    const locationHasEveryInventoryItem = inventory.every((i) =>
      i.location_levels?.find((inv) => inv.location_id === locationId)
    )

    if (!locationHasEveryInventoryItem) {
      return {}
    }

    const inventoryItemRequiredQuantityMap = new Map(
      inventory_items.map((i) => [i.inventory_item_id, i.required_quantity])
    )

    // since we don't allow split fulifllments only one reservation from inventory kit is enough to calculate avalabel product quantity
    const reservation = reservations?.find((r) => r.line_item_id === item.id)
    const iitemRequiredQuantity = inventory_items.find(
      (i) => i.inventory_item_id === reservation?.inventory_item_id
    )?.required_quantity

    const reservedQuantityForItem = !reservation
      ? 0
      : reservation?.quantity / (iitemRequiredQuantity || 1)

    const locationInventoryLevels = inventory.map((i) => {
      const level = i.location_levels?.find(
        (inv) => inv.location_id === locationId
      )

      const requiredQuantity = inventoryItemRequiredQuantityMap.get(i.id)

      if (!level || !requiredQuantity) {
        return {
          availableQuantity: Number.MAX_SAFE_INTEGER,
          stockedQuantity: Number.MAX_SAFE_INTEGER,
        }
      }

      const availableQuantity = level.available_quantity / requiredQuantity
      const stockedQuantity = level.stocked_quantity / requiredQuantity

      return {
        availableQuantity,
        stockedQuantity,
      }
    })

    const maxAvailableQuantity = Math.min(
      ...locationInventoryLevels.map((i) => i.availableQuantity)
    )

    const maxStockedQuantity = Math.min(
      ...locationInventoryLevels.map((i) => i.stockedQuantity)
    )

    if (
      maxAvailableQuantity === Number.MAX_SAFE_INTEGER ||
      maxStockedQuantity === Number.MAX_SAFE_INTEGER
    ) {
      return {}
    }

    return {
      availableQuantity: Math.floor(
        maxAvailableQuantity + reservedQuantityForItem
      ),
      inStockQuantity: Math.floor(maxStockedQuantity),
    }
  }, [variant, locationId, reservations])

  const minValue = 0
  const maxValue = Math.min(
    getFulfillableQuantity(item),
    availableQuantity || Number.MAX_SAFE_INTEGER
  )

  return (
    <Form.Field
      control={form.control}
      name={`quantity.${item.id}`}
      rules={{
        required: true,
        min: minValue,
        max: maxValue,
      }}
      render={({ field }) => {
        return (
          <div className="bg-ui-bg-subtle shadow-elevation-card-rest my-2 rounded-xl" data-testid={`order-create-fulfillment-item-${item.id}`}>
            <div className="flex flex-row items-center" data-testid={`order-create-fulfillment-item-${item.id}-content`}>
              {disabled && (
                <div className="inline-flex items-center ml-4" data-testid={`order-create-fulfillment-item-${item.id}-disabled-indicator`}>
                  <Tooltip
                    content={t("orders.fulfillment.disabledItemTooltip")}
                    side="top"
                  >
                    <InformationCircleSolid className="text-ui-tag-orange-icon" />
                  </Tooltip>
                </div>
              )}

              <div
                className={clx(
                  "flex flex-col flex-1 gap-x-2 gap-y-2 p-3 text-sm sm:flex-row",
                  disabled && "opacity-50 pointer-events-none"
                )}
                data-testid={`order-create-fulfillment-item-${item.id}-details`}
              >
                <div className="flex flex-1 items-center gap-x-3" data-testid={`order-create-fulfillment-item-${item.id}-info`}>
                  <Thumbnail src={item.thumbnail} data-testid={`order-create-fulfillment-item-${item.id}-thumbnail`} />
                  <div className="flex flex-col" data-testid={`order-create-fulfillment-item-${item.id}-text`}>
                    <div data-testid={`order-create-fulfillment-item-${item.id}-title`}>
                      <Text className="txt-small" as="span" weight="plus">
                        {item.title}
                      </Text>
                      {item.variant_sku && <span data-testid={`order-create-fulfillment-item-${item.id}-sku`}>({item.variant_sku})</span>}
                    </div>
                    <Text as="div" className="text-ui-fg-subtle txt-small" data-testid={`order-create-fulfillment-item-${item.id}-variant-title`}>
                      {item.variant_title}
                    </Text>
                  </div>
                </div>

                <div className="flex flex-1 items-center gap-x-1" data-testid={`order-create-fulfillment-item-${item.id}-quantities`}>
                  <div className="mr-2 block h-[16px] w-[2px] bg-gray-200" />

                  <div className="text-small flex flex-1 flex-col" data-testid={`order-create-fulfillment-item-${item.id}-available`}>
                    <span className="text-ui-fg-subtle font-medium" data-testid={`order-create-fulfillment-item-${item.id}-available-label`}>
                      {t("orders.fulfillment.available")}
                    </span>
                    <span className="text-ui-fg-subtle" data-testid={`order-create-fulfillment-item-${item.id}-available-value`}>
                      {availableQuantity || "N/A"}
                    </span>
                  </div>

                  <div className="flex flex-1 items-center gap-x-1" data-testid={`order-create-fulfillment-item-${item.id}-in-stock`}>
                    <div className="mr-2 block h-[16px] w-[2px] bg-gray-200" />

                    <div className="flex flex-col">
                      <span className="text-ui-fg-subtle font-medium" data-testid={`order-create-fulfillment-item-${item.id}-in-stock-label`}>
                        {t("orders.fulfillment.inStock")}
                      </span>
                      <span className="text-ui-fg-subtle" data-testid={`order-create-fulfillment-item-${item.id}-in-stock-value`}>
                        {inStockQuantity || "N/A"}{" "}
                        {inStockQuantity && (
                          <span className="font-medium text-red-500" data-testid={`order-create-fulfillment-item-${item.id}-in-stock-reserved`}>
                            -{form.getValues(`quantity.${item.id}`)}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 items-center gap-1" data-testid={`order-create-fulfillment-item-${item.id}-quantity-input-section`}>
                    <Form.Item data-testid={`order-create-fulfillment-item-${item.id}-quantity-item`}>
                      <Form.Control data-testid={`order-create-fulfillment-item-${item.id}-quantity-control`}>
                        <Input
                          className="bg-ui-bg-base txt-small w-[50px] rounded-lg text-right [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          type="number"
                          {...field}
                          onChange={(e) => {
                            const val =
                              e.target.value === ""
                                ? null
                                : Number(e.target.value)

                            field.onChange(val)

                            if (!isNaN(val)) {
                              if (val < minValue || val > maxValue) {
                                form.setError(`quantity.${item.id}`, {
                                  type: "manual",
                                  message: t(
                                    "orders.fulfillment.error.wrongQuantity",
                                    {
                                      count: maxValue,
                                      number: maxValue,
                                    }
                                  ),
                                })
                              } else {
                                form.clearErrors(`quantity.${item.id}`)
                              }
                            }
                          }}
                          data-testid={`order-create-fulfillment-item-${item.id}-quantity-input`}
                        />
                      </Form.Control>
                      <Form.ErrorMessage data-testid={`order-create-fulfillment-item-${item.id}-quantity-error`} />
                    </Form.Item>

                    <span className="text-ui-fg-subtle" data-testid={`order-create-fulfillment-item-${item.id}-quantity-label`}>
                      / {item.quantity} {t("fields.qty")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Form.ErrorMessage className="flex justify-end pr-3 pb-2" />
          </div>
        )
      }}
    />
  )
}
