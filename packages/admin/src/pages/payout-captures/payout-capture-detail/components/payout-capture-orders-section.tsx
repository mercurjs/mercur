import { TriangleRightMini } from "@medusajs/icons"
import { Badge, Container, Heading, StatusBadge, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { NoRecords } from "../../../../components/common/empty-table-content"
import { AdminPayoutCapture } from "../../../../hooks/api/payout-captures"
import { getStylizedAmount } from "../../../../lib/money-amount-helpers"
import { getPayoutCaptureOrderStatusProps, toNumber } from "../../common/utils"

export const PayoutCaptureOrdersSection = ({
  capture,
}: {
  capture: AdminPayoutCapture
}) => {
  const { t } = useTranslation()

  return (
    <Container className="divide-y p-0" data-testid="payout-capture-orders-section">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-x-2">
          <Heading level="h2">{t("payoutCaptures.orders.header")}</Heading>
          <Badge size="2xsmall">{capture.orders.length}</Badge>
        </div>
      </div>
      {capture.orders.length === 0 ? (
        <NoRecords
          className="flex h-full flex-col overflow-hidden p-6"
          icon={null}
          title={t("payoutCaptures.orders.emptyTitle")}
          message={t("payoutCaptures.orders.emptyMessage")}
        />
      ) : (
        capture.orders.map((order) => {
          const status = getPayoutCaptureOrderStatusProps(order, t)

          return (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="hover:bg-ui-bg-base-hover focus-visible:shadow-borders-focus block outline-none transition-colors"
              data-testid={`payout-capture-order-${order.id}`}
            >
              <div className="flex items-center gap-x-4 px-6 py-4">
                <div className="flex flex-1 flex-col">
                  <Text size="small" leading="compact" weight="plus">
                    {order.display_id ? `#${order.display_id}` : order.id}
                  </Text>
                  <Text size="small" leading="compact" className="text-ui-fg-subtle">
                    {order.seller?.name ?? t("payoutCaptures.orders.unknownSeller")}
                  </Text>
                </div>
                <Text size="small" leading="compact" className="tabular-nums">
                  {getStylizedAmount(
                    toNumber(order.total),
                    order.currency_code ?? capture.currency_code,
                  )}
                </Text>
                <StatusBadge color={status.color}>{status.label}</StatusBadge>
                <TriangleRightMini className="text-ui-fg-muted rtl:rotate-180" />
              </div>
            </Link>
          )
        })
      )}
    </Container>
  )
}
