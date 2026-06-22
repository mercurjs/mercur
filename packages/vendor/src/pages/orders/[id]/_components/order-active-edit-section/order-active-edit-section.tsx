import { ExclamationCircleSolid } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Button, Container, Copy, Heading, toast } from "@medusajs/ui"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { Thumbnail } from "@components/common/thumbnail/thumbnail"
import {
  useCancelOrderEdit,
  useConfirmOrderEdit,
} from "@hooks/api/order-edits"
import { useOrderPreview } from "@hooks/api/orders"

type OrderActiveEditSectionProps = {
  order: HttpTypes.AdminOrder
}

type PreviewItem = {
  id: string
  quantity: number
  title?: string
  variant_sku?: string | null
  thumbnail?: string | null
}

function EditItem({
  item,
  quantity,
}: {
  item: PreviewItem
  quantity: number
}) {
  return (
    <div className="text-ui-fg-subtle items-center gap-x-2">
      <div className="flex items-center gap-x-2">
        <div className="w-fit min-w-[27px]">
          <span className="txt-small tabular-nums">{quantity}</span>x
        </div>

        <Thumbnail src={item.thumbnail ?? undefined} />

        <span className="txt-small text-ui-fg-subtle font-medium">
          {item.title}
        </span>

        {item.variant_sku && " · "}

        {item.variant_sku && (
          <div className="flex items-center gap-x-1">
            <span className="txt-small">{item.variant_sku}</span>
            <Copy content={item.variant_sku} className="text-ui-fg-muted" />
          </div>
        )}
      </div>
    </div>
  )
}

export const OrderActiveEditSection = ({
  order,
}: OrderActiveEditSectionProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { order: orderPreview } = useOrderPreview(order.id)

  const { mutateAsync: cancelOrderEdit } = useCancelOrderEdit(order.id)
  const { mutateAsync: confirmOrderEdit } = useConfirmOrderEdit(order.id)

  const isPending =
    (orderPreview as { order_change?: { status?: string } } | undefined)
      ?.order_change?.status === "pending"

  const [addedItems, removedItems] = useMemo(() => {
    const added: { item: PreviewItem; quantity: number }[] = []
    const removed: { item: PreviewItem; quantity: number }[] = []

    const originals = (order.items ?? []) as PreviewItem[]
    const previewItems =
      ((orderPreview as { items?: PreviewItem[] } | undefined)?.items ?? []) as PreviewItem[]

    const orderLookupMap = new Map(originals.map((i) => [i.id, i]))

    previewItems.forEach((currentItem) => {
      const originalItem = orderLookupMap.get(currentItem.id)

      if (!originalItem) {
        added.push({ item: currentItem, quantity: currentItem.quantity })
        return
      }

      if (originalItem.quantity > currentItem.quantity) {
        removed.push({
          item: currentItem,
          quantity: originalItem.quantity - currentItem.quantity,
        })
      }

      if (originalItem.quantity < currentItem.quantity) {
        added.push({
          item: currentItem,
          quantity: currentItem.quantity - originalItem.quantity,
        })
      }
    })

    return [added, removed]
  }, [orderPreview, order.items])

  const onConfirmOrderEdit = async () => {
    try {
      await confirmOrderEdit()
      toast.success(t("orders.edits.toast.confirmedSuccessfully"))
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : t("errorBoundary.defaultTitle")
      )
    }
  }

  const onCancelOrderEdit = async () => {
    try {
      await cancelOrderEdit()
      toast.success(t("orders.edits.toast.canceledSuccessfully"))
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : t("errorBoundary.defaultTitle")
      )
    }
  }

  const change = (orderPreview as { order_change?: { change_type?: string } } | undefined)?.order_change

  if (!orderPreview || change?.change_type !== "edit") {
    return null
  }

  return (
    <div
      style={{
        background:
          "repeating-linear-gradient(-45deg, rgb(212, 212, 216, 0.15), rgb(212, 212, 216,.15) 10px, transparent 10px, transparent 20px)",
      }}
      className="-m-4 mb-1 border-b border-l p-4"
      data-testid="order-active-edit-section"
    >
      <Container className="flex items-center justify-between p-0">
        <div className="flex w-full flex-col divide-y divide-dashed">
          <div className="flex items-center gap-2 px-6 py-4">
            <ExclamationCircleSolid className="text-blue-500" />
            <Heading level="h2">
              {t(
                isPending
                  ? "orders.edits.panel.titlePending"
                  : "orders.edits.panel.title"
              )}
            </Heading>
          </div>

          {!!addedItems.length && (
            <div className="txt-small text-ui-fg-subtle flex flex-row px-6 py-4">
              <span className="flex-1 font-medium">{t("labels.added")}</span>
              <div className="flex flex-1 flex-col gap-y-2">
                {addedItems.map(({ item, quantity }) => (
                  <EditItem key={item.id} item={item} quantity={quantity} />
                ))}
              </div>
            </div>
          )}

          {!!removedItems.length && (
            <div className="txt-small text-ui-fg-subtle flex flex-row px-6 py-4">
              <span className="flex-1 font-medium">{t("labels.removed")}</span>
              <div className="flex flex-1 flex-col gap-y-2">
                {removedItems.map(({ item, quantity }) => (
                  <EditItem key={item.id} item={item} quantity={quantity} />
                ))}
              </div>
            </div>
          )}

          <div className="bg-ui-bg-subtle flex items-center justify-end gap-x-2 rounded-b-xl px-4 py-4">
            {isPending ? (
              <Button
                size="small"
                variant="secondary"
                onClick={() => navigate(`/orders/${order.id}/edit`)}
                data-testid="order-active-edit-continue"
              >
                {t("actions.continueEdit")}
              </Button>
            ) : (
              <Button
                size="small"
                variant="secondary"
                onClick={onConfirmOrderEdit}
                data-testid="order-active-edit-force-confirm"
              >
                {t("actions.forceConfirm")}
              </Button>
            )}
            <Button
              size="small"
              variant="secondary"
              onClick={onCancelOrderEdit}
              data-testid="order-active-edit-cancel"
            >
              {t("actions.cancel")}
            </Button>
          </div>
        </div>
      </Container>
    </div>
  )
}
