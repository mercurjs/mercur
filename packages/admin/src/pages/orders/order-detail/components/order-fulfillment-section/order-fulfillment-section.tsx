import {
  AdminOrder,
  AdminOrderFulfillment,
  AdminOrderLineItem,
  HttpTypes,
  OrderLineItemDTO,
} from "@medusajs/types"
import {
  Container,
  Copy,
  Heading,
  StatusBadge,
  Text,
  Tooltip,
} from "@medusajs/ui"
import { format } from "date-fns"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { Skeleton } from "../../../../../components/common/skeleton"
import { Thumbnail } from "../../../../../components/common/thumbnail"
import { useStockLocation } from "../../../../../hooks/api/stock-locations"
import { formatProvider } from "../../../../../lib/format-provider"
import { getLocaleAmount } from "../../../../../lib/money-amount-helpers"
import { FulfillmentSetType } from "../../../../locations/common/constants"

type OrderFulfillmentSectionProps = {
  order: AdminOrder
}

export const OrderFulfillmentSection = ({
  order,
}: OrderFulfillmentSectionProps) => {
  const fulfillments = order.fulfillments || []

  return (
    <div className="flex flex-col gap-y-3" data-testid="order-fulfillment-section">
      <UnfulfilledItemBreakdown order={order} />
      {fulfillments.map((f, index) => (
        <Fulfillment key={f.id} index={index} fulfillment={f} order={order} />
      ))}
    </div>
  )
}

const UnfulfilledItem = ({
  item,
  currencyCode,
}: {
  item: OrderLineItemDTO & { variant: HttpTypes.AdminProductVariant }
  currencyCode: string
}) => {
  return (
    <div
      key={item.id}
      className="text-ui-fg-subtle grid grid-cols-2 items-start px-6 py-4"
    >
      <div className="flex items-start gap-x-4">
        <Thumbnail src={item.thumbnail} />
        <div>
          <Text
            size="small"
            leading="compact"
            weight="plus"
            className="text-ui-fg-base"
          >
            {item.title}
          </Text>
          {item.variant_sku && (
            <div className="flex items-center gap-x-1">
              <Text size="small">{item.variant_sku}</Text>
              <Copy content={item.variant_sku} className="text-ui-fg-muted" />
            </div>
          )}
          <Text size="small">
            {item.variant?.options?.map((o) => o.value).join(" · ")}
          </Text>
        </div>
      </div>
      <div className="grid grid-cols-3 items-center gap-x-4">
        <div className="flex items-center justify-end">
          <Text size="small">
            {getLocaleAmount(item.unit_price, currencyCode)}
          </Text>
        </div>
        <div className="flex items-center justify-end">
          <Text>
            <span className="tabular-nums">
              {item.quantity - item.detail.fulfilled_quantity}
            </span>
            x
          </Text>
        </div>
        <div className="flex items-center justify-end">
          <Text size="small">
            {getLocaleAmount(item.subtotal || 0, currencyCode)}
          </Text>
        </div>
      </div>
    </div>
  )
}

const UnfulfilledItemBreakdown = ({ order }: { order: AdminOrder }) => {
  const unfulfilledItemsWithShipping = order.items!.filter(
    (i) => i.requires_shipping && i.detail.fulfilled_quantity < i.quantity
  )

  const unfulfilledItemsWithoutShipping = order.items!.filter(
    (i) => !i.requires_shipping && i.detail.fulfilled_quantity < i.quantity
  )

  return (
    <>
      {!!unfulfilledItemsWithShipping.length && (
        <UnfulfilledItemDisplay
          order={order}
          unfulfilledItems={unfulfilledItemsWithShipping}
          requiresShipping={true}
        />
      )}

      {!!unfulfilledItemsWithoutShipping.length && (
        <UnfulfilledItemDisplay
          order={order}
          unfulfilledItems={unfulfilledItemsWithoutShipping}
          requiresShipping={false}
        />
      )}
    </>
  )
}

const UnfulfilledItemDisplay = ({
  order,
  unfulfilledItems,
  requiresShipping = false,
}: {
  order: AdminOrder
  unfulfilledItems: AdminOrderLineItem[]
  requiresShipping: boolean
}) => {
  const { t } = useTranslation()

  if (order.status === "canceled") {
    return
  }

  return (
    <Container className="divide-y p-0" data-testid="order-fulfillment-unfulfilled">
      <div className="flex items-center justify-between px-6 py-4" data-testid="order-fulfillment-unfulfilled-header">
        <Heading level="h2" data-testid="order-fulfillment-unfulfilled-heading">{t("orders.fulfillment.unfulfilledItems")}</Heading>

        <div className="flex items-center gap-x-4" data-testid="order-fulfillment-unfulfilled-badges">
          {requiresShipping && (
            <StatusBadge color="red" className="text-nowrap" data-testid="order-fulfillment-unfulfilled-requires-shipping-badge">
              {t("orders.fulfillment.requiresShipping")}
            </StatusBadge>
          )}

          <StatusBadge color="red" className="text-nowrap" data-testid="order-fulfillment-unfulfilled-awaiting-badge">
            {t("orders.fulfillment.awaitingFulfillmentBadge")}
          </StatusBadge>
        </div>
      </div>
      <div data-testid="order-fulfillment-unfulfilled-items">
        {unfulfilledItems.map((item: AdminOrderLineItem) => (
          <UnfulfilledItem
            key={item.id}
            item={item}
            currencyCode={order.currency_code}
          />
        ))}
      </div>
    </Container>
  )
}

const Fulfillment = ({
  fulfillment,
  index,
}: {
  fulfillment: AdminOrderFulfillment
  order: AdminOrder
  index: number
}) => {
  const { t } = useTranslation()

  const showLocation = !!fulfillment.location_id
  const isPickUpFulfillment =
    fulfillment.shipping_option?.service_zone.fulfillment_set.type ===
    FulfillmentSetType.Pickup

  const { stock_location, isError, error } = useStockLocation(
    fulfillment.location_id!,
    undefined,
    {
      enabled: showLocation,
    }
  )

  let statusText = fulfillment.requires_shipping
    ? isPickUpFulfillment
      ? t("orders.fulfillment.status.awaitingPickup")
      : t("orders.fulfillment.status.awaitingShipping")
    : t("orders.fulfillment.status.awaitingDelivery")
  let statusColor: "blue" | "green" | "red" = "blue"
  let statusTimestamp = fulfillment.created_at

  if (fulfillment.canceled_at) {
    statusText = t("orders.fulfillment.status.canceled")
    statusColor = "red"
    statusTimestamp = fulfillment.canceled_at
  } else if (fulfillment.delivered_at) {
    statusText = t("orders.fulfillment.status.delivered")
    statusColor = "green"
    statusTimestamp = fulfillment.delivered_at
  } else if (fulfillment.shipped_at) {
    statusText = t("orders.fulfillment.status.shipped")
    statusColor = "green"
    statusTimestamp = fulfillment.shipped_at
  }

  if (isError) {
    throw error
  }

  const isValidUrl = (url?: string) => url && url.length > 0 && url !== "#"

  return (
    <Container className="divide-y p-0" data-testid={`order-fulfillment-${fulfillment.id}`}>
      <div className="flex items-center justify-between px-6 py-4" data-testid={`order-fulfillment-${fulfillment.id}-header`}>
        <Heading level="h2" data-testid={`order-fulfillment-${fulfillment.id}-heading`}>
          {t("orders.fulfillment.number", {
            number: index + 1,
          })}
        </Heading>
        <div className="flex items-center gap-x-4" data-testid={`order-fulfillment-${fulfillment.id}-status-container`}>
          <Tooltip
            content={format(
              new Date(statusTimestamp),
              "dd MMM, yyyy, HH:mm:ss"
            )}
          >
            <StatusBadge color={statusColor} className="text-nowrap" data-testid={`order-fulfillment-${fulfillment.id}-status-badge`}>
              {statusText}
            </StatusBadge>
          </Tooltip>
        </div>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-start px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("orders.fulfillment.itemsLabel")}
        </Text>
        <ul>
          {fulfillment.items.map((f_item) => (
            <li key={f_item.line_item_id}>
              <Text size="small" leading="compact">
                {f_item.quantity}x {f_item.title}
              </Text>
            </li>
          ))}
        </ul>
      </div>
      {showLocation && (
        <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
          <Text size="small" leading="compact" weight="plus">
            {t("orders.fulfillment.shippingFromLabel")}
          </Text>
          {stock_location ? (
            <Link
              to={`/settings/locations/${stock_location.id}`}
              className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover transition-fg"
            >
              <Text size="small" leading="compact">
                {stock_location.name}
              </Text>
            </Link>
          ) : (
            <Skeleton className="w-16" />
          )}
        </div>
      )}
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("fields.provider")}
        </Text>

        <Text size="small" leading="compact">
          {formatProvider(fulfillment.provider_id)}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-start px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("orders.fulfillment.trackingLabel")}
        </Text>
        <div>
          {fulfillment.labels && fulfillment.labels.length > 0 ? (
            <ul>
              {fulfillment.labels.map((tlink) => {
                const hasTrackingUrl = isValidUrl(tlink.tracking_url)
                const hasLabelUrl = isValidUrl(tlink.label_url)

                if (hasTrackingUrl || hasLabelUrl) {
                  return (
                    <li key={tlink.tracking_number}>
                      {hasTrackingUrl && (
                        <a
                          href={tlink.tracking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover transition-fg"
                        >
                          <Text size="small" leading="compact" as="span">
                            {tlink.tracking_number}
                          </Text>
                        </a>
                      )}
                      {hasTrackingUrl && hasLabelUrl && " - "}
                      {hasLabelUrl && (
                        <a
                          href={tlink.label_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover transition-fg"
                        >
                          <Text size="small" leading="compact" as="span">
                            {t("orders.fulfillment.labelLink")}
                          </Text>
                        </a>
                      )}
                    </li>
                  )
                }

                return (
                  <li key={tlink.tracking_number}>
                    <Text size="small" leading="compact">
                      {tlink.tracking_number}
                    </Text>
                  </li>
                )
              })}
            </ul>
          ) : (
            <Text size="small" leading="compact">
              -
            </Text>
          )}
        </div>
      </div>
    </Container>
  )
}
