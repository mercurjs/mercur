import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Component,
  ExclamationCircleSolid,
  TriangleDownMini,
} from "@medusajs/icons"
import { UseFormReturn, useWatch } from "react-hook-form"
import { Input, Text, clx } from "@medusajs/ui"
import * as zod from "zod"
import type { AdminOrderLineItem, OrderLineItemDTO } from "@medusajs/types"

import { Thumbnail } from "@components/common/thumbnail"
import { getFulfillableQuantity } from "@lib/order-item"
import { Form } from "@components/common/form"
import { AllocateItemsSchema } from "./constants"

export type OfferLinkLocationLevel = {
  id?: string
  location_id?: string
  stocked_quantity?: number | null
  reserved_quantity?: number | null
  incoming_quantity?: number | null
  available_quantity?: number | null
}

export type OfferLinkRow = {
  id?: string
  inventory_item_id?: string | null
  required_quantity?: number | null
  inventory_item?: {
    id?: string | null
    sku?: string | null
    title?: string | null
    location_levels?: OfferLinkLocationLevel[] | null
  } | null
}

export type OrderLineItemWithOffer = AdminOrderLineItem & {
  offer?: {
    id?: string
    sku?: string | null
    inventory_item_link?: OfferLinkRow[] | null
  } | null
}

type OrderEditItemProps = {
  item: OrderLineItemWithOffer
  locationId?: string
  form: UseFormReturn<zod.infer<typeof AllocateItemsSchema>>
  onQuantityChange: (
    link: OfferLinkRow,
    lineItem: OrderLineItemWithOffer,
    hasInventoryKit: boolean,
    value: number | null,
    isRoot?: boolean
  ) => void
}

const resolveInventoryItemId = (link: OfferLinkRow): string | null =>
  link.inventory_item?.id ?? link.inventory_item_id ?? null

export function OrderAllocateItemsItem({
  item,
  form,
  locationId,
  onQuantityChange,
}: OrderEditItemProps) {
  const { t } = useTranslation()
  const inventoryLinks = item.offer?.inventory_item_link ?? []

  const [isOpen, setIsOpen] = useState(false)

  const quantityField = useWatch({
    control: form.control,
    name: "quantity",
  })

  const hasInventoryKit = inventoryLinks.length > 1
  const firstLink = inventoryLinks[0]
  const firstLinkId = firstLink ? resolveInventoryItemId(firstLink) : null

  const { availableQuantity, inStockQuantity } = useMemo(() => {
    if (!firstLink || !locationId) {
      return {} as {
        availableQuantity?: number | null
        inStockQuantity?: number | null
      }
    }

    const locationInventory = firstLink.inventory_item?.location_levels?.find(
      (inv) => inv.location_id === locationId
    )

    if (!locationInventory) {
      return {}
    }

    return {
      availableQuantity: locationInventory.available_quantity,
      inStockQuantity: locationInventory.stocked_quantity,
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [firstLink, locationId])

  const hasQuantityError =
    !hasInventoryKit &&
    availableQuantity &&
    firstLinkId &&
    quantityField[`${item.id}-${firstLinkId}`] &&
    Number(quantityField[`${item.id}-${firstLinkId}`]) >
      availableQuantity

  const minValue = 0
  const maxValue = Math.min(
    getFulfillableQuantity(item as unknown as OrderLineItemDTO) ?? 0,
    availableQuantity || Number.MAX_SAFE_INTEGER
  )

  return (
    <div className="bg-ui-bg-subtle shadow-elevation-card-rest my-2 min-w-[720px] divide-y divide-dashed rounded-xl">
      <div className="flex items-center gap-x-3 p-3 text-sm">
        <div className="flex flex-1 items-center">
          <div className="flex items-center gap-x-3">
            {hasQuantityError && (
              <ExclamationCircleSolid className="text-ui-fg-error" />
            )}
            <Thumbnail src={item.thumbnail} />
            <div className="flex flex-col">
              <div className="flex flex-row">
                <Text className="txt-small flex" as="span" weight="plus">
                  {item.product_title}
                </Text>
                {(item.offer?.sku ?? item.variant_sku) && (
                  <span className="text-ui-fg-subtle">
                    {" "}
                    ({item.offer?.sku ?? item.variant_sku})
                  </span>
                )}
                {hasInventoryKit && (
                  <Component className="text-ui-fg-muted ml-2 overflow-visible pt-[2px]" />
                )}
              </div>
              <Text as="div" className="text-ui-fg-subtle txt-small">
                {item.title}
              </Text>
            </div>
          </div>
        </div>

        <div
          className={clx(
            "flex flex-1 items-center gap-x-3",
            hasInventoryKit ? "justify-end" : "justify-between"
          )}
        >
          {!hasInventoryKit && (
            <>
              <div className="flex items-center gap-3">
                <div className="bg-ui-border-strong block h-[12px] w-[1px]" />

                <div className="txt-small flex flex-col">
                  <span className="text-ui-fg-subtle font-medium">
                    {t("labels.available")}
                  </span>
                  <span className="text-ui-fg-muted">
                    {availableQuantity || "-"}
                    {availableQuantity &&
                      !hasInventoryKit &&
                      firstLinkId &&
                      quantityField[`${item.id}-${firstLinkId}`] && (
                        <span className="text-ui-fg-error txt-small ml-1">
                          -
                          {quantityField[`${item.id}-${firstLinkId}`]}
                        </span>
                      )}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-ui-border-strong block h-[12px] w-[1px]" />

                <div className="txt-small flex flex-col">
                  <span className="text-ui-fg-subtle font-medium">
                    {t("labels.inStock")}
                  </span>
                  <span className="text-ui-fg-muted">
                    {inStockQuantity || "-"}
                  </span>
                </div>
              </div>
            </>
          )}

          <div className="flex items-center gap-3">
            <div className="bg-ui-border-strong block h-[12px] w-[1px]" />

            <div className="text-ui-fg-subtle txt-small mr-2 flex flex-row items-center gap-2">
              <Form.Field
                control={form.control}
                name={
                  hasInventoryKit && firstLinkId
                    ? (`quantity.${item.id}-`)
                    : (`quantity.${item.id}-${firstLinkId ?? ""}`) as `quantity.${string}`
                }
                rules={{
                  required: !hasInventoryKit,
                  min: !hasInventoryKit ? minValue : undefined,
                  max: maxValue > 0 ? maxValue : undefined,
                }}
                render={({ field }) => {
                  return (
                    <Form.Item>
                      <Form.Control>
                        <Input
                          className="bg-ui-bg-base txt-small w-[46px] rounded-lg text-right [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          type="number"
                          {...field}
                          disabled={!locationId}
                          onChange={(e) => {
                            const val =
                              e.target.value === ""
                                ? null
                                : Number(e.target.value)

                            if (firstLink) {
                              onQuantityChange(
                                firstLink,
                                item,
                                hasInventoryKit,
                                val,
                                true
                              )
                            }
                          }}
                        />
                      </Form.Control>
                    </Form.Item>
                  )
                }}
              />{" "}
              / {item.quantity} {t("fields.qty")}
            </div>
          </div>
        </div>
      </div>

      {hasInventoryKit && (
        <div className="px-4 py-2">
          {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <div
            onClick={() => setIsOpen((o) => !o)}
            className="flex items-center gap-x-2"
          >
            <TriangleDownMini
              style={{ transform: `rotate(${isOpen ? -90 : 0}deg)` }}
              className="text-ui-fg-muted -mt-[1px]"
            />
            <span className="txt-small text-ui-fg-muted cursor-pointer">
              {t("orders.allocateItems.consistsOf", {
                num: inventoryLinks.length,
              })}
            </span>
          </div>
        </div>
      )}

      {isOpen &&
        inventoryLinks.map((link, ind) => {
          const inventoryItemId = resolveInventoryItemId(link)
          const location = link.inventory_item?.location_levels?.find(
            (l) => l.location_id === locationId
          )
          const required = link.required_quantity ?? 1

          const quantityKey = `${item.id}-${inventoryItemId ?? ""}`
          const childHasError =
            !!quantityField[quantityKey] &&
            location &&
            Number(quantityField[quantityKey]) >
              (location.available_quantity ?? 0)

          return (
            <div
              key={link.id ?? inventoryItemId ?? `link-${ind}`}
              className="txt-small flex items-center gap-x-3 p-4"
            >
              <div className="flex flex-1 flex-row items-center gap-3">
                {childHasError && (
                  <ExclamationCircleSolid className="text-ui-fg-error" />
                )}
                <div className="flex flex-col">
                  <span className="text-ui-fg-subtle">
                    {link.inventory_item?.title ??
                      link.inventory_item?.sku ??
                      `Inventory Item ${ind + 1}`}
                  </span>
                  <span className="text-ui-fg-muted">
                    {t("orders.allocateItems.requires", {
                      num: required,
                    })}
                  </span>
                </div>
              </div>

              <div className="flex flex-1 flex-row justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-ui-border-strong block h-[12px] w-[1px]" />

                  <div className="txt-small flex flex-col">
                    <span className="text-ui-fg-subtle font-medium">
                      {t("labels.available")}
                    </span>
                    <span className="text-ui-fg-muted">
                      {location?.available_quantity || "-"}
                      {location?.available_quantity &&
                        quantityField[quantityKey] && (
                          <span className="text-ui-fg-error txt-small ml-1">
                            -{quantityField[quantityKey]}
                          </span>
                        )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-ui-border-strong block h-[12px] w-[1px]" />

                  <div className="txt-small flex flex-col">
                    <span className="text-ui-fg-subtle font-medium">
                      {t("labels.inStock")}
                    </span>
                    <span className="text-ui-fg-muted">
                      {location?.stocked_quantity || "-"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-ui-border-strong block h-[12px] w-[1px]" />

                  <div className="text-ui-fg-subtle txt-small mr-1 flex flex-row items-center gap-2">
                    <Form.Field
                      control={form.control}
                      name={`quantity.${item.id}-${inventoryItemId ?? ""}` as `quantity.${string}`}
                      rules={{
                        required: true,
                        min: 0,
                        max: location?.available_quantity ?? undefined,
                      }}
                      render={({ field }) => {
                        return (
                          <Form.Item>
                            <Form.Control>
                              <Input
                                className="bg-ui-bg-base txt-small w-[46px] rounded-lg text-right [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                type="number"
                                {...field}
                                disabled={!locationId}
                                onChange={(e) => {
                                  const val =
                                    e.target.value === ""
                                      ? null
                                      : Number(e.target.value)

                                  onQuantityChange(
                                    link,
                                    item,
                                    hasInventoryKit,
                                    val
                                  )
                                }}
                              />
                            </Form.Control>
                          </Form.Item>
                        )
                      }}
                    />
                    / {item.quantity * required} {t("fields.qty")}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
    </div>
  )
}
