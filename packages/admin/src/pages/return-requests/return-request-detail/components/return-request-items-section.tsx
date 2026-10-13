import { HttpTypes } from "@medusajs/types"
import { Container, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { Thumbnail } from "../../../../components/common/thumbnail"
import { AdminReturnRequest } from "../../../../hooks/api/return-requests"
import { useReturnReasons } from "../../../../hooks/api/return-reasons"

type ItemRow = {
  id: string
  title: string
  variant_title?: string | null
  thumbnail?: string | null
  quantity: number
  reason?: string | null
  note?: string | null
}

export const ReturnRequestItemsSection = ({
  returnRequest,
  order,
}: {
  returnRequest: AdminReturnRequest
  order?: HttpTypes.AdminOrder
}) => {
  const { t } = useTranslation()
  const { return_reasons: returnReasons = [] } = useReturnReasons({
    limit: 100,
  })

  const orderItems = order?.items ?? []

  const items: ItemRow[] = returnRequest.items.map((requested) => {
    const orderItem = orderItems.find((i) => i.id === requested.id)
    return {
      id: requested.id,
      title: orderItem?.title ?? requested.id,
      variant_title: orderItem?.variant_title,
      thumbnail: orderItem?.thumbnail,
      quantity: requested.quantity,
      reason: returnReasons.find((r) => r.id === requested.reason_id)?.label,
      note: requested.note,
    }
  })

  return (
    <Container className="divide-y p-0" data-testid="return-request-items-section">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("returnRequests.detail.items")}</Heading>
      </div>
      {items.length === 0 ? (
        <div className="px-6 py-4">
          <Text size="small" className="text-ui-fg-subtle">
            {t("returnRequests.detail.noItems")}
          </Text>
        </div>
      ) : (
        items.map((item) => (
          <div
            key={item.id}
            className="text-ui-fg-subtle grid grid-cols-[auto_1fr_auto] items-center gap-x-4 px-6 py-4"
          >
            <Thumbnail src={item.thumbnail} />
            <div className="flex flex-col">
              <Text size="small" leading="compact" weight="plus">
                {item.title}
              </Text>
              {item.variant_title && (
                <Text size="small" leading="compact">
                  {item.variant_title}
                </Text>
              )}
              {(item.reason || item.note) && (
                <Text size="small" leading="compact">
                  {[item.reason, item.note].filter(Boolean).join(" · ")}
                </Text>
              )}
            </div>
            <Text size="small" leading="compact">
              x{item.quantity}
            </Text>
          </div>
        ))
      )}
    </Container>
  )
}
