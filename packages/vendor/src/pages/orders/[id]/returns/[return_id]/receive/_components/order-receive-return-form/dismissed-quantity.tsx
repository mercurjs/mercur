// Vendor port of admin's `DismissedQuantity` popover. Renders a small
// "damage" affordance next to the receive quantity input; the popover
// hosts a dismissed-quantity input that, on blur, calls the dismiss-item
// add/update/remove vendor mutations.
import { useMemo, useState } from "react"
import { HeartBroken } from "@medusajs/icons"
import type { FieldValues, Control } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Button, Input, Popover, toast } from "@medusajs/ui"

import { Form } from "@components/common/form"
import {
  useAddDismissItems,
  useRemoveDismissItem,
  useUpdateDismissItem,
} from "@hooks/api/returns"

// Simpler type than full `UseFormReturn` (admin notes the latter slows
// type-checking enough to be worth dropping for this leaf component).
export type DismissedQuantityForm = {
  control: Control<FieldValues>
  setValue: (
    name: `items.${number}.dismissed_quantity`,
    value: number | null | undefined,
    options?: {
      shouldTouch?: boolean
      shouldDirty?: boolean
    }
  ) => void
}

type PreviewAction = {
  id: string
  action: string
  details?: { quantity?: number } | null
}

type PreviewItem = {
  id: string
  quantity: number
  detail: { return_received_quantity: number }
  actions?: PreviewAction[]
}

type DismissedQuantityProps = {
  returnId: string
  orderId: string
  index: number
  item: PreviewItem
  form: DismissedQuantityForm
}

function DismissedQuantity({
  form,
  item,
  index,
  returnId,
  orderId,
}: DismissedQuantityProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  const { mutateAsync: addDismissedItems } = useAddDismissItems(
    returnId,
    orderId
  )
  const { mutateAsync: updateDismissedItems } = useUpdateDismissItem(
    returnId,
    orderId
  )
  const { mutateAsync: removeDismissedItems } = useRemoveDismissItem(
    returnId,
    orderId
  )

  const [dismissedQuantity] = useMemo(() => {
    const dismissedAction = item.actions?.find(
      (a) => a.action === "RECEIVE_DAMAGED_RETURN_ITEM"
    )
    return [dismissedAction?.details?.quantity as number | undefined]
  }, [item])

  const onDismissedQuantityChanged = async (value: number | null) => {
    const action = item.actions?.find(
      (a) => a.action === "RECEIVE_DAMAGED_RETURN_ITEM"
    )

    if (typeof value === "number" && value < 0) {
      form.setValue(`items.${index}.dismissed_quantity`, dismissedQuantity, {
        shouldTouch: true,
        shouldDirty: true,
      })
      toast.error(t("orders.returns.receive.toast.errorNegativeValue"))
      return
    }

    if (
      typeof value === "number" &&
      value > item.quantity - item.detail.return_received_quantity
    ) {
      form.setValue(`items.${index}.dismissed_quantity`, dismissedQuantity, {
        shouldTouch: true,
        shouldDirty: true,
      })
      toast.error(t("orders.returns.receive.toast.errorLargeDamagedValue"))
      return
    }

    try {
      if (value) {
        if (!action) {
          await addDismissedItems({
            items: [{ id: item.id, quantity: value }],
          })
        } else {
          await updateDismissedItems({ actionId: action.id, quantity: value })
        }
      } else if (action) {
        await removeDismissedItems(action.id)
      }
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : t("errorBoundary.defaultTitle")
      )
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <Button className="flex gap-2 px-2" variant="secondary" type="button">
          <div>
            <HeartBroken />
          </div>
          {!!dismissedQuantity && <span>{dismissedQuantity}</span>}
        </Button>
      </Popover.Trigger>
      <Popover.Content align="center">
        <div className="flex flex-col p-2">
          <span className="txt-small text-ui-fg-subtle mb-2 font-medium">
            {t("orders.returns.receive.writeOffInputLabel")}
          </span>
          <Form.Field
            control={form.control}
            name={`items.${index}.dismissed_quantity`}
            render={({ field: { onChange, value, ...field } }) => (
              <Form.Item className="w-full">
                <Form.Control>
                  <Input
                    min={0}
                    max={item.quantity}
                    type="number"
                    value={value}
                    className="bg-ui-bg-field-component text-right [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    onChange={(e) => {
                      const parsed =
                        e.target.value === ""
                          ? null
                          : parseFloat(e.target.value)
                      onChange(parsed)
                    }}
                    {...field}
                    onBlur={() => {
                      field.onBlur()
                      onDismissedQuantityChanged(
                        typeof value === "number" ? value : null
                      )
                    }}
                  />
                </Form.Control>
              </Form.Item>
            )}
          />
        </div>
      </Popover.Content>
    </Popover>
  )
}

export default DismissedQuantity
