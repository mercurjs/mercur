import { ArrowUturnLeft, DocumentSeries, XCircle } from "@medusajs/icons"
import { AdminOrderLineItem } from "@medusajs/types"
import { Badge, Input, Text, Tooltip, toast } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { ActionMenu } from "../../../../../components/common/action-menu"
import { Thumbnail } from "../../../../../components/common/thumbnail"
import { MoneyAmountCell } from "../../../../../components/table/table-cells/common/money-amount-cell"
import { useMemo } from "react"
import {
  useAddOrderEditItems,
  useRemoveOrderEditItem,
  useUpdateOrderEditAddedItem,
  useUpdateOrderEditOriginalItem,
} from "../../../../../hooks/api/order-edits"
import { resolveErrorToastMessage } from "../../../../../lib/seller-scoped-error"
import { getOrderItemMutationLimits } from "../../../../../lib/order-item-mutation-limits"

type OrderEditItemProps = {
  item: AdminOrderLineItem
  currencyCode: string
  orderId: string
}

function OrderEditItem({ item, currencyCode, orderId }: OrderEditItemProps) {
  const { t } = useTranslation()

  const { mutateAsync: addItems } = useAddOrderEditItems(orderId)
  const { mutateAsync: updateAddedItem } = useUpdateOrderEditAddedItem(orderId)
  const { mutateAsync: updateOriginalItem } =
    useUpdateOrderEditOriginalItem(orderId)
  const { mutateAsync: undoAction } = useRemoveOrderEditItem(orderId)

  const limits = useMemo(() => getOrderItemMutationLimits(item), [item])

  // Per-reason tooltip copy (007 FR-003): a disabled qty input or
  // disabled Remove menu item explains the specific reason
  // (fulfilled / returned / both) instead of a generic "disabled".
  const reduceTooltip =
    limits.canRemove === false
      ? limits.reason === "fulfilled"
        ? t("orders.edits.tooltip.cannotReduceBelowFulfilled")
        : limits.reason === "returned"
          ? t("orders.edits.tooltip.cannotReduceBelowReturned")
          : t("orders.edits.tooltip.cannotReduceBelowFulfilledReturned")
      : undefined
  const removeTooltip =
    limits.canRemove === false
      ? limits.reason === "fulfilled"
        ? t("orders.edits.tooltip.cannotRemoveFulfilled")
        : limits.reason === "returned"
          ? t("orders.edits.tooltip.cannotRemoveReturned")
          : t("orders.edits.tooltip.cannotRemoveFulfilledAndReturned")
      : undefined

  const isAddedItem = useMemo(
    () => !!item.actions?.find((a) => a.action === "ITEM_ADD"),
    [item]
  )

  const isItemUpdated = useMemo(
    () => !!item.actions?.find((a) => a.action === "ITEM_UPDATE"),
    [item]
  )

  const isItemRemoved = useMemo(() => {
    // To be removed item needs to have updated quantity dropped to the
    // minimum allowed (fulfilled + returned). Items with no blocking
    // history can drop to 0; items with history floor at minQty.
    //
    // Note: this only fires for original-order items with an
    // ITEM_UPDATE action. Added items (ITEM_ADD) are removed
    // destructively — backend rejects POST quantity=0 on
    // /admin/order-edits/:id/items/:action_id, so we cannot keep the
    // row around for an Undo. See `onRemove` below.
    const updateAction = item.actions?.find((a) => a.action === "ITEM_UPDATE")
    return !!updateAction && item.quantity === limits.minQty
  }, [item, limits])

  /**
   * HANDLERS
   */

  const onUpdate = async (quantity: number) => {
    if (limits.canRemove === false && quantity < limits.minQty) {
      toast.error(t("orders.edits.validation.quantityLowerThanFulfillment"))
      return
    }

    if (quantity === item.quantity) {
      return
    }

    const addItemAction = item.actions?.find((a) => a.action === "ITEM_ADD")

    try {
      if (addItemAction) {
        await updateAddedItem({ quantity, actionId: addItemAction.id })
      } else {
        await updateOriginalItem({ quantity, itemId: item.id })
      }
    } catch (e) {
      toast.error(resolveErrorToastMessage(e, t))
    }
  }

  const onRemove = async () => {
    const addItemAction = item.actions?.find((a) => a.action === "ITEM_ADD")

    try {
      if (addItemAction) {
        // Destructive: undo the ITEM_ADD action — the item disappears
        // from the preview entirely. Backend rejects POST quantity=0
        // on the action endpoint, so we cannot keep the row around
        // for a soft-remove + Undo flow.
        await undoAction(addItemAction.id)
      } else {
        await updateOriginalItem({
          quantity: limits.minQty,
          itemId: item.id,
        })
      }
    } catch (e) {
      toast.error(resolveErrorToastMessage(e, t))
    }
  }

  const onRemoveUndo = async () => {
    const updateItemAction = item.actions?.find(
      (a) => a.action === "ITEM_UPDATE"
    )

    try {
      if (updateItemAction) {
        await undoAction(updateItemAction.id) // Remove action that updated items quantity to fulfilled quantity which makes it "removed"
      }
    } catch (e) {
      toast.error(resolveErrorToastMessage(e, t))
    }
  }

  const onDuplicate = async () => {
    if (!item.variant_id) {
      toast.error(t("orders.edits.duplicateItemErrorToast"))
      
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
      toast.error(resolveErrorToastMessage(e, t) ?? "An error occurred")
    }
  }

  return (
    <div
      key={item.quantity}
      className="bg-ui-bg-subtle shadow-elevation-card-rest my-2 rounded-xl "
      data-testid={`order-edit-item-${item.id}`}
    >
      <div className="flex flex-col items-center gap-x-2 gap-y-2 p-3 text-sm md:flex-row" data-testid={`order-edit-item-${item.id}-content`}>
        <div className="flex flex-1 items-center justify-between" data-testid={`order-edit-item-${item.id}-info`}>
          <div className="flex flex-row items-center gap-x-3" data-testid={`order-edit-item-${item.id}-details`}>
            <Thumbnail src={item.thumbnail} data-testid={`order-edit-item-${item.id}-thumbnail`} />

            <div className="flex flex-col" data-testid={`order-edit-item-${item.id}-text`}>
              <div data-testid={`order-edit-item-${item.id}-title`}>
                <Text className="txt-small" as="span" weight="plus">
                  {item.title}{" "}
                </Text>

                {item.variant_sku && <span data-testid={`order-edit-item-${item.id}-sku`}>({item.variant_sku})</span>}
              </div>
              <Text as="div" className="text-ui-fg-subtle txt-small" data-testid={`order-edit-item-${item.id}-subtitle`}>
                {item.subtitle}
              </Text>
            </div>
          </div>

          {isAddedItem && (
            <Badge size="2xsmall" rounded="full" color="blue" className="mr-1" data-testid={`order-edit-item-${item.id}-new-badge`}>
              {t("general.new")}
            </Badge>
          )}

          {isItemRemoved ? (
            <Badge size="2xsmall" rounded="full" color="red" className="mr-1" data-testid={`order-edit-item-${item.id}-removed-badge`}>
              {t("general.removed")}
            </Badge>
          ) : (
            isItemUpdated && (
              <Badge
                size="2xsmall"
                rounded="full"
                color="orange"
                className="mr-1"
                data-testid={`order-edit-item-${item.id}-modified-badge`}
              >
                {t("general.modified")}
              </Badge>
            )
          )}
        </div>

        <div className="flex flex-1 justify-between" data-testid={`order-edit-item-${item.id}-actions`}>
          <div className="flex flex-grow items-center gap-2" data-testid={`order-edit-item-${item.id}-quantity`}>
            {reduceTooltip && limits.minQty === item.quantity ? (
              <Tooltip content={reduceTooltip}>
                <Input
                  className="bg-ui-bg-base txt-small w-[67px] rounded-lg [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  type="number"
                  disabled
                  min={limits.minQty}
                  defaultValue={item.quantity}
                  data-testid={`order-edit-item-${item.id}-quantity-input`}
                />
              </Tooltip>
            ) : (
              <Input
                className="bg-ui-bg-base txt-small w-[67px] rounded-lg [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                type="number"
                disabled={limits.minQty === item.quantity}
                min={limits.minQty}
                defaultValue={item.quantity}
                onBlur={(e) => {
                  const val = e.target.value
                  const payload = val === "" ? null : Number(val)

                  if (payload) {
                    onUpdate(payload)
                  }
                }}
                data-testid={`order-edit-item-${item.id}-quantity-input`}
              />
            )}
            <Text className="txt-small text-ui-fg-subtle" data-testid={`order-edit-item-${item.id}-quantity-label`}>
              {t("fields.qty")}
            </Text>
          </div>

          <div className="text-ui-fg-subtle txt-small mr-2 flex flex-shrink-0" data-testid={`order-edit-item-${item.id}-total`}>
            <MoneyAmountCell currencyCode={currencyCode} amount={item.total} />
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
                        disabled: limits.minQty === item.quantity,
                        disabledTooltip: removeTooltip,
                      }
                    : {
                        label: t("actions.undo"),
                        onClick: onRemoveUndo,
                        icon: <ArrowUturnLeft />,
                      },
                ].filter(Boolean),
              },
            ]}
            data-testid={`order-edit-item-${item.id}-action-menu`}
          />
        </div>
      </div>
    </div>
  )
}

export { OrderEditItem }
