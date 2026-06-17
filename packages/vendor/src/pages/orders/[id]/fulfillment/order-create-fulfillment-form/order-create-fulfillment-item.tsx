import { useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import * as zod from "zod"
import { Checkbox, clx, Input, Text, Tooltip } from "@medusajs/ui"
import { UseFormReturn, useWatch } from "react-hook-form"
import { HttpTypes } from "@medusajs/types"

import { Form } from "@components/common/form/index"
import { Thumbnail } from "@components/common/thumbnail/index"
import { getFulfillableQuantity } from "@lib/order-item"
import { CreateFulfillmentSchema } from "./constants"
import { InformationCircleSolid } from "@medusajs/icons"

// In Mercur inventory is owned by the offer's inventory item link
// (per-seller), exposing per-location stock levels. The create-fulfillment
// row reads available / in-stock quantities from there — the same source the
// allocate-items flow uses — rather than the product variant, which is not
// inventory-scoped to the seller and returns no levels here.
type OfferLocationLevel = {
  location_id?: string
  stocked_quantity?: number | null
  available_quantity?: number | null
}

type OfferInventoryLink = {
  inventory_item?: {
    location_levels?: OfferLocationLevel[] | null
  } | null
}

type OrderLineItemWithOffer = HttpTypes.AdminOrderLineItem & {
  offer?: {
    inventory_item_link?: OfferInventoryLink[] | null
  } | null
}

type OrderEditItemProps = {
  item: OrderLineItemWithOffer
  currencyCode: string
  locationId?: string
  onItemRemove: (itemId: string) => void
  form: UseFormReturn<zod.infer<typeof CreateFulfillmentSchema>>
  disabled: boolean
  onToggleSelected: (itemId: string, checked: boolean) => void
  onInventoryStatusChange: (itemId: string, missingLevel: boolean) => void
}

export function OrderCreateFulfillmentItem({
  item,
  form,
  locationId,
  disabled,
  onToggleSelected,
  onInventoryStatusChange,
}: OrderEditItemProps) {
  const { t } = useTranslation()

  const firstLink = item.offer?.inventory_item_link?.[0]

  // Items are fulfilled by default; deselecting via the checkbox excludes
  // the item from the payload. Undefined (never toggled) reads as selected.
  const isSelected =
    useWatch({
      control: form.control,
      name: `selection.${item.id}` as `selection.${string}`,
    }) !== false

  const { availableQuantity, inStockQuantity, missingLevel } = useMemo(() => {
    if (!firstLink || !locationId) {
      return { missingLevel: false }
    }

    const locationInventory = firstLink.inventory_item?.location_levels?.find(
      (inv) => inv.location_id === locationId
    )

    // The item is inventory-managed but has no level at the chosen
    // location — it cannot be fulfilled from here. Surface this up so the
    // form can render an aggregate warning.
    if (!locationInventory) {
      return { missingLevel: true }
    }

    return {
      availableQuantity: locationInventory.available_quantity,
      inStockQuantity: locationInventory.stocked_quantity,
      missingLevel: false,
    }
  }, [firstLink, locationId])

  useEffect(() => {
    onInventoryStatusChange(item.id, missingLevel)
  }, [item.id, missingLevel, onInventoryStatusChange])

  const minValue = 0
  const maxValue = Math.min(
    getFulfillableQuantity(item as any),
    availableQuantity || Number.MAX_SAFE_INTEGER
  )

  const inputDisabled = disabled || !isSelected

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
          <div
            className={clx(
              "bg-ui-bg-subtle shadow-elevation-card-rest rounded-xl",
              !isSelected && "opacity-60"
            )}
          >
            <div className="flex flex-row items-center">
              <div className="ml-4 flex items-center gap-x-2">
                <Checkbox
                  checked={isSelected}
                  disabled={disabled}
                  onCheckedChange={(value) =>
                    onToggleSelected(item.id, value === true)
                  }
                  data-testid={`fulfillment-item-${item.id}-checkbox`}
                />
                {disabled && (
                  <Tooltip
                    content={t("orders.fulfillment.disabledItemTooltip")}
                    side="top"
                  >
                    <InformationCircleSolid className="text-ui-tag-orange-icon" />
                  </Tooltip>
                )}
              </div>

              <div
                className={clx(
                  "flex flex-col flex-1 gap-x-2 gap-y-2 p-3 text-sm sm:flex-row",
                  disabled && "opacity-50 pointer-events-none"
                )}
              >
                <div className="flex flex-1 items-center gap-x-3">
                  <Thumbnail src={item.thumbnail} />
                  <div className="flex flex-col">
                    <div>
                      <Text className="txt-small" as="span" weight="plus">
                        {item.title}
                      </Text>
                      {item.variant_sku && <span>({item.variant_sku})</span>}
                    </div>
                    <Text as="div" className="text-ui-fg-subtle txt-small">
                      {item.variant_title}
                    </Text>
                  </div>
                </div>

                <div className="flex flex-1 items-center gap-x-1">
                  <div className="mr-2 block h-[16px] w-[2px] bg-gray-200" />

                  <div className="text-small flex flex-1 flex-col">
                    <span className="text-ui-fg-subtle font-medium">
                      {t("orders.fulfillment.available")}
                    </span>
                    <span className="text-ui-fg-subtle">
                      {availableQuantity ?? "N/A"}
                    </span>
                  </div>

                  <div className="flex flex-1 items-center gap-x-1">
                    <div className="mr-2 block h-[16px] w-[2px] bg-gray-200" />

                    <div className="flex flex-col">
                      <span className="text-ui-fg-subtle font-medium">
                        {t("orders.fulfillment.inStock")}
                      </span>
                      <span className="text-ui-fg-subtle">
                        {inStockQuantity ?? "N/A"}{" "}
                        {!!inStockQuantity && (
                          <span className="font-medium text-red-500">
                            -{form.getValues(`quantity.${item.id}`)}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 items-center gap-1">
                    <Form.Item>
                      <Form.Control>
                        <Input
                          className="bg-ui-bg-base txt-small w-[50px] rounded-lg text-right [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          type="number"
                          {...field}
                          disabled={inputDisabled}
                          onChange={(e) => {
                            const val =
                              e.target.value === ""
                                ? null
                                : Number(e.target.value)

                            field.onChange(val)

                            if (val !== null && !isNaN(val ?? 0)) {
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
                        />
                      </Form.Control>
                    </Form.Item>

                    <span className="text-ui-fg-subtle">
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
