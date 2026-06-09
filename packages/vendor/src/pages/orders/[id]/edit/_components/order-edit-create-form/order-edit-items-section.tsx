import { AdminOrder, AdminOrderPreview } from "@medusajs/types"
import { Button, Heading, Input, toast } from "@medusajs/ui"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import {
  RouteFocusModal,
  StackedFocusModal,
  useStackedModal,
} from "@components/modals"
import { useAddOrderEditItems } from "@hooks/api/order-edits"

import { AddOrderEditItemsTable } from "../add-order-edit-items-table"
import { OrderEditItem } from "./order-edit-item"

type OrderEditItemsSectionProps = {
  order: AdminOrder
  preview: AdminOrderPreview
}

// Holds the picker's current selection while the stacked modal is open. The
// stacked modal lives in a separate React subtree, so a module-local mutable
// reference avoids prop-drilling the selection through `StackedFocusModal`.
// Mirrors admin's pattern.
let addedOffers: string[] = []

export const OrderEditItemsSection = ({
  order,
  preview,
}: OrderEditItemsSectionProps) => {
  const { t } = useTranslation()

  /**
   * STATE
   */
  const { setIsOpen } = useStackedModal()
  const [filterTerm, setFilterTerm] = useState("")

  /*
   * MUTATIONS
   */
  const { mutateAsync: addItems, isPending } = useAddOrderEditItems(order.id)

  /**
   * CALLBACKS
   */
  const onItemsSelected = async () => {
    if (!addedOffers.length) {
      setIsOpen("order-edit-add-items", false)
      return
    }

    try {
      await addItems({
        // Vendor route resolves `offer_id` → variant_id + unit_price
        // server-side. Picker rows are keyed by offer id, not variant id.
        items: addedOffers.map((offer_id) => ({
          offer_id,
          quantity: 1,
        })) as never,
      })
      addedOffers = []
      setIsOpen("order-edit-add-items", false)
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : t("errorBoundary.defaultTitle")
      )
    }
  }

  const filteredItems = useMemo(() => {
    const term = filterTerm.toLowerCase()
    if (!term) {
      return preview.items
    }
    return preview.items.filter(
      (i) =>
        i.title?.toLowerCase().includes(term) ||
        i.product_title?.toLowerCase().includes(term)
    )
  }, [preview, filterTerm])

  return (
    <div>
      <div className="mb-3 mt-8 flex items-center justify-between">
        <Heading level="h2">{t("fields.items")}</Heading>

        <div className="flex gap-2">
          <Input
            value={filterTerm}
            onChange={(e) => setFilterTerm(e.target.value)}
            placeholder={t("fields.search")}
            autoComplete="off"
            type="search"
            data-testid="edit-items-search"
          />

          <StackedFocusModal id="order-edit-add-items">
            <StackedFocusModal.Trigger asChild>
              <Button
                variant="secondary"
                size="small"
                data-testid="edit-add-items-trigger"
              >
                {t("actions.addItems")}
              </Button>
            </StackedFocusModal.Trigger>

            <StackedFocusModal.Content>
              <StackedFocusModal.Header />
              <StackedFocusModal.Title asChild>
                <span className="sr-only">{t("orders.edits.addItems")}</span>
              </StackedFocusModal.Title>
              <StackedFocusModal.Description className="sr-only">
                {t("orders.edits.addItemsDescription")}
              </StackedFocusModal.Description>

              <StackedFocusModal.Body className="size-full overflow-hidden">
                <AddOrderEditItemsTable
                  currencyCode={order.currency_code}
                  onSelectionChange={(finalSelection) => {
                    addedOffers = finalSelection
                  }}
                />
              </StackedFocusModal.Body>

              <StackedFocusModal.Footer>
                <div className="flex w-full items-center justify-end gap-x-4">
                  <div className="flex items-center justify-end gap-x-2">
                    <RouteFocusModal.Close asChild>
                      <Button
                        type="button"
                        variant="secondary"
                        size="small"
                        data-testid="edit-add-items-cancel"
                      >
                        {t("actions.cancel")}
                      </Button>
                    </RouteFocusModal.Close>
                    <Button
                      key="submit-button"
                      type="submit"
                      variant="primary"
                      size="small"
                      role="button"
                      disabled={isPending}
                      onClick={async () => await onItemsSelected()}
                      data-testid="edit-add-items-save"
                    >
                      {t("actions.save")}
                    </Button>
                  </div>
                </div>
              </StackedFocusModal.Footer>
            </StackedFocusModal.Content>
          </StackedFocusModal>
        </div>
      </div>

      {filteredItems.map((item) => (
        <OrderEditItem
          key={item.id}
          item={item}
          orderId={order.id}
          currencyCode={order.currency_code}
        />
      ))}

      {filterTerm && !filteredItems.length && (
        <div
          style={{
            background:
              "repeating-linear-gradient(-45deg, rgb(212, 212, 216, 0.15), rgb(212, 212, 216,.15) 10px, transparent 10px, transparent 20px)",
          }}
          className="bg-ui-bg-field mt-4 block h-[56px] w-full rounded-lg border border-dashed"
        />
      )}
    </div>
  )
}
