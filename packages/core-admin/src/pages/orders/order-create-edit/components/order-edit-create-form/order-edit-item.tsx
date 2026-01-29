import { ArrowUturnLeft, DocumentSeries, XCircle } from "@medusajs/icons"
import { AdminOrderLineItem } from "@medusajs/types"
import { Badge, Input, Text, toast } from "@medusajs/ui"
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

  const isAddedItem = useMemo(
    () => !!item.actions?.find((a) => a.action === "ITEM_ADD"),
    [item]
  )

  const isItemUpdated = useMemo(
    () => !!item.actions?.find((a) => a.action === "ITEM_UPDATE"),
    [item]
  )

  const isItemRemoved = useMemo(() => {
    // To be removed item needs to have updated quantity
    const updateAction = item.actions?.find((a) => a.action === "ITEM_UPDATE")
    return !!updateAction && item.quantity === item.detail.fulfilled_quantity
  }, [item])

  /**
   * HANDLERS
   */

  const onUpdate = async (quantity: number) => {
    if (quantity <= item.detail.fulfilled_quantity) {
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
      toast.error(e.message)
    }
  }

  const onRemove = async () => {
    const addItemAction = item.actions?.find((a) => a.action === "ITEM_ADD")

    try {
      if (addItemAction) {
        await undoAction(addItemAction.id)
      } else {
        await updateOriginalItem({
          quantity: item.detail.fulfilled_quantity, //
          itemId: item.id,
        })
      }
    } catch (e) {
      toast.error(e.message)
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
      toast.error(e.message)
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
      toast.error(e instanceof Error ? e.message : "An error occurred")
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
            <Input
              className="bg-ui-bg-base txt-small w-[67px] rounded-lg [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              type="number"
              disabled={item.detail.fulfilled_quantity === item.quantity}
              min={item.detail.fulfilled_quantity}
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
                        disabled:
                          item.detail.fulfilled_quantity === item.quantity,
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
