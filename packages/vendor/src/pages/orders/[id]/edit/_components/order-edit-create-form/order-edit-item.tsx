import {
  ArrowUturnLeft,
  DocumentSeries,
  ReceiptPercent,
  XCircle,
} from "@medusajs/icons"
import {
  AdminOrderChangeAction,
  AdminOrderLineItem,
  AdminOrderPreview,
} from "@medusajs/types"
import { Badge, Input, Text, toast, Tooltip } from "@medusajs/ui"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { ActionMenu } from "@components/common/action-menu"
import { Thumbnail } from "@components/common/thumbnail"
import { MoneyAmountCell } from "@components/table/table-cells/common/money-amount-cell"
import {
  useAddOrderEditItems,
  useRemoveOrderEditAddedItem,
  useUpdateOrderEditAddedItem,
  useUpdateOrderEditOriginalItem,
} from "@hooks/api/order-edits"

/**
 * Preview line item shape returned by `GET /vendor/orders/:id/preview`.
 * Medusa 2.13.4 doesn't export an `AdminOrderLinePreview` type, so we derive
 * it from `AdminOrderPreview["items"][number]`.
 */
type OrderEditPreviewLine = AdminOrderPreview["items"][number] & {
  detail?: {
    fulfilled_quantity?: number
    returned_quantity?: number
  }
  subtitle?: string | null
  total?: number
  adjustments?: { code?: string | null }[] | null
} & Pick<AdminOrderLineItem, "id" | "title" | "variant_sku" | "variant_id">

type OrderEditItemProps = {
  item: OrderEditPreviewLine
  currencyCode: string
  orderId: string
}

function OrderEditItem({ item, currencyCode, orderId }: OrderEditItemProps) {
  const { t } = useTranslation()

  const { mutateAsync: addItems } = useAddOrderEditItems(orderId)
  const { mutateAsync: updateAddedItem } = useUpdateOrderEditAddedItem(orderId)
  const { mutateAsync: updateOriginalItem } =
    useUpdateOrderEditOriginalItem(orderId)
  const { mutateAsync: undoAction } = useRemoveOrderEditAddedItem(orderId)

  const actions = (item.actions ?? []) as AdminOrderChangeAction[]

  const isAddedItem = useMemo(
    () => !!actions.find((a) => a.action === "ITEM_ADD"),
    [actions]
  )

  const isItemUpdated = useMemo(
    () => !!actions.find((a) => a.action === "ITEM_UPDATE"),
    [actions]
  )

  // MVP rule: when current quantity has been pulled down to fulfilled +
  // returned, the line is effectively "removed" — it can't go any lower.
  const fulfilledQty = item.detail?.fulfilled_quantity ?? 0
  const returnedQty = item.detail?.returned_quantity ?? 0
  const floor = fulfilledQty + returnedQty

  const isItemRemoved = useMemo(() => {
    const updateAction = actions.find((a) => a.action === "ITEM_UPDATE")
    return !!updateAction && item.quantity === floor
  }, [actions, item.quantity, floor])

  const appliedPromoCodes = useMemo(() => {
    return (item.adjustments || [])
      .map((adjustment) => adjustment.code)
      .filter((c): c is string => !!c)
  }, [item.adjustments])

  /**
   * HANDLERS
   */

  const onUpdate = async (quantity: number) => {
    // Cannot drop below fulfilled + returned units — surface the validation
    // message vendors already have for fulfilled-quantity violations.
    if (quantity < floor) {
      toast.error(t("orders.edits.removeBlockedFulfilledOrReturned"))
      return
    }

    if (quantity === item.quantity) {
      return
    }

    const addItemAction = actions.find((a) => a.action === "ITEM_ADD")

    try {
      if (addItemAction) {
        await updateAddedItem({ $actionId: addItemAction.id, quantity })
      } else {
        await updateOriginalItem({ $itemId: item.id, quantity })
      }
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : t("errorBoundary.defaultTitle")
      )
    }
  }

  const onRemove = async () => {
    const addItemAction = actions.find((a) => a.action === "ITEM_ADD")

    try {
      if (addItemAction) {
        // Added items are removed by undoing the ITEM_ADD action.
        await undoAction(addItemAction.id)
      } else {
        // Original items are "removed" by setting qty to fulfilled + returned
        // (the floor). The line stays but is visually flagged "removed".
        await updateOriginalItem({
          $itemId: item.id,
          quantity: floor,
        })
      }
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : t("errorBoundary.defaultTitle")
      )
    }
  }

  const onRemoveUndo = async () => {
    const updateItemAction = actions.find((a) => a.action === "ITEM_UPDATE")

    try {
      if (updateItemAction) {
        await undoAction(updateItemAction.id)
      }
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : t("errorBoundary.defaultTitle")
      )
    }
  }

  const onDuplicate = async () => {
    // Duplicate uses variant_id (the existing line's variant). The vendor
    // backend resolves variant_id → offer at confirm-time via the offer-link
    // subscriber, so passing variant_id is sufficient here.
    if (!item.variant_id) {
      return
    }
    try {
      await addItems({
        items: [
          {
            variant_id: item.variant_id,
            quantity: item.quantity,
          },
        ],
      })
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : t("errorBoundary.defaultTitle")
      )
    }
  }

  const isAtFloor = item.quantity === floor

  const qtyInput = (
    <Input
      className="bg-ui-bg-base txt-small w-[67px] rounded-lg [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      type="number"
      step="any"
      disabled={isAtFloor}
      min={floor}
      defaultValue={item.quantity}
      data-testid={`edit-item-${item.id}-qty`}
      onBlur={(e) => {
        const val = e.target.value
        const payload = val === "" ? null : Number(val)

        if (payload !== null) {
          onUpdate(payload)
        }
      }}
    />
  )

  return (
    <div
      key={item.quantity}
      className="bg-ui-bg-subtle shadow-elevation-card-rest my-2 rounded-xl"
      data-testid={`edit-item-${item.id}`}
    >
      <div className="flex flex-col items-center gap-x-2 gap-y-2 p-3 text-sm md:flex-row">
        <div className="flex flex-1 items-center justify-between">
          <div className="flex flex-row items-center gap-x-3">
            <Thumbnail src={item.thumbnail} />

            <div className="flex flex-col">
              <div>
                <Text className="txt-small" as="span" weight="plus">
                  {item.title}{" "}
                </Text>

                {item.variant_sku && <span>({item.variant_sku})</span>}
              </div>
              <Text as="div" className="text-ui-fg-subtle txt-small">
                {item.subtitle}
              </Text>
            </div>
          </div>

          {isAddedItem && (
            <Badge size="2xsmall" rounded="full" color="blue" className="mr-1">
              {t("general.new")}
            </Badge>
          )}

          {isItemRemoved ? (
            <Badge size="2xsmall" rounded="full" color="red" className="mr-1">
              {t("general.removed")}
            </Badge>
          ) : (
            isItemUpdated && (
              <Badge
                size="2xsmall"
                rounded="full"
                color="orange"
                className="mr-1"
              >
                {t("general.modified")}
              </Badge>
            )
          )}
        </div>

        <div className="flex flex-1 items-center justify-between">
          <div className="flex flex-grow items-center gap-2">
            {floor > 0 && isAtFloor ? (
              <Tooltip
                content={t("orders.edits.removeBlockedFulfilledOrReturned")}
              >
                {qtyInput}
              </Tooltip>
            ) : (
              qtyInput
            )}
            <Text className="txt-small text-ui-fg-subtle">
              {t("fields.qty")}
            </Text>

            {appliedPromoCodes.length > 0 && (
              <div className="flex flex-shrink pt-[2px]">
                <Tooltip
                  content={
                    <span className="text-pretty">
                      {appliedPromoCodes.map((code) => (
                        <div key={code}>{code}</div>
                      ))}
                    </span>
                  }
                >
                  <ReceiptPercent className="text-ui-fg-subtle font-normal" />
                </Tooltip>
              </div>
            )}
          </div>

          <div className="text-ui-fg-subtle txt-small mr-2 flex flex-shrink-0">
            <MoneyAmountCell
              currencyCode={currencyCode}
              amount={item.total ?? 0}
            />
          </div>

          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    label: t("actions.duplicate"),
                    onClick: onDuplicate,
                    icon: <DocumentSeries />,
                  },
                ],
              },
              {
                actions: [
                  !isItemRemoved
                    ? {
                        label: t("actions.remove"),
                        onClick: onRemove,
                        icon: <XCircle />,
                        disabled: isAtFloor,
                      }
                    : {
                        label: t("actions.undo"),
                        onClick: onRemoveUndo,
                        icon: <ArrowUturnLeft />,
                      },
                ],
              },
            ]}
          />
        </div>
      </div>
    </div>
  )
}

export { OrderEditItem }
