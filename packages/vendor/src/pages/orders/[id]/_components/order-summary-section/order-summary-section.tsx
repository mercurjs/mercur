import { ReactNode, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import {
  ArrowDownRightMini,
  ArrowLongRight,
  ArrowPath,
  ArrowUturnLeft,
  DocumentText,
  ExclamationCircle,
  PencilSquare,
  TriangleDownMini,
} from "@medusajs/icons"
import {
  AdminOrder,
  AdminOrderLineItem,
  AdminOrderPreview,
  AdminReservation,
  AdminReturn,
  AdminReturnItem,
  AdminReturnReason,
  HttpTypes,
} from "@medusajs/types"
import {
  Badge,
  Button,
  clx,
  Container,
  Copy,
  Heading,
  StatusBadge,
  Text,
  Tooltip,
  toast,
} from "@medusajs/ui"

import { ActionMenu } from "@components/common/action-menu"
import { useOrderPreview } from "../../../../../hooks/api/orders"
import { useMarkPaymentCollectionAsPaid } from "../../../../../hooks/api/payment-collections"
import { useReservationItems } from "../../../../../hooks/api/reservations"
import { useReturns } from "../../../../../hooks/api/returns"
import {
  getLocaleAmount,
  getStylizedAmount,
  isAmountLessThenRoundingError,
} from "@lib/money-amount-helpers"
import { getTotalCaptured } from "@lib/payment"
import { getReservationsLimitCount } from "../../../../../lib/orders"
import {
  CLAIM_POLICY_DAYS,
  EXCHANGE_POLICY_DAYS,
  RETURN_POLICY_DAYS,
  isOutsidePolicyWindow,
} from "@lib/policy"
import { getReturnableQuantity } from "@lib/rma"
import { useDate } from "../../../../../hooks/use-date"
import ReturnInfoPopover from "./return-info-popover"
import ShippingInfoPopover from "./shipping-info-popover"
import { Thumbnail } from "@components/common/thumbnail"

type ReturnWithReason = Omit<AdminReturn, "items"> & {
  items: (AdminReturnItem & { reason?: AdminReturnReason })[]
}

type OrderSummarySectionProps = {
  order: HttpTypes.AdminOrder
}

export const OrderSummarySection = ({
  order,
}: OrderSummarySectionProps) => {
  const { t } = useTranslation()

  const { reservations } = useReservationItems(
    {
      line_item_id: order?.items?.map((i) => i.id),
      limit: getReservationsLimitCount(order),
    },
    { enabled: Array.isArray(order?.items) }
  )

  const { order: orderPreview } = useOrderPreview(order.id)

  const reservationList = useMemo(
    () => (reservations ?? []) as AdminReservation[],
    [reservations]
  )

  const { returns: receivableReturnsList = [] } = useReturns({
    status: "requested",
    order_id: order.id,
    fields: "+received_at",
  })

  const receivableReturns = useMemo(
    () =>
      (receivableReturnsList as AdminReturn[]).filter((r) => !r.canceled_at),
    [receivableReturnsList]
  )

  const showReturns = !!receivableReturns.length

  const showAllocateButton = useMemo(() => {
    if (!reservations) {
      return false
    }

    const reservationsMap = new Map(
      reservationList.map((r) => [r.line_item_id, r.id])
    )

    return order.items?.some((item) => {
      const offerLinks = (item as unknown as {
        offer?: { inventory_item_link?: unknown[] | null }
      }).offer?.inventory_item_link
      if (!offerLinks?.length) {
        return false
      }
      const fulfilled = item.detail?.fulfilled_quantity ?? 0
      if (item.quantity - fulfilled <= 0) {
        return false
      }
      return !reservationsMap.has(item.id)
    }) ?? false
  }, [order.items, reservations, reservationList])

  const unpaidPaymentCollection = order.payment_collections?.find(
    (pc) => pc.status !== "captured" && pc.status !== "canceled"
  )

  const pendingDifference = order.summary?.pending_difference || 0
  const isAmountSignificant = !isAmountLessThenRoundingError(
    pendingDifference,
    order.currency_code
  )

  const showRefund =
    unpaidPaymentCollection && pendingDifference < 0 && isAmountSignificant

  return (
    <Container className="divide-y p-0">
      <Header order={order} orderPreview={orderPreview} />
      <ItemBreakdown order={order} reservations={reservationList} />
      <CostBreakdown order={order} />
      <Total order={order} />

      {(showReturns || showRefund || showAllocateButton) && (
        <div className="bg-ui-bg-subtle flex items-center justify-end gap-x-2 rounded-b-xl px-4 py-4">
          {showReturns &&
            (receivableReturns.length === 1 ? (
              <Button asChild variant="secondary" size="small">
                <Link
                  to={`/orders/${order.id}/returns/${receivableReturns[0].id}/receive`}
                >
                  {t("orders.returns.receive.action")}
                </Link>
              </Button>
            ) : (
              <ActionMenu
                groups={[
                  {
                    actions: receivableReturns.map((r) => {
                      let id = r.id
                      let returnType = "Return"

                      if (r.exchange_id) {
                        id = r.exchange_id
                        returnType = "Exchange"
                      }

                      if (r.claim_id) {
                        id = r.claim_id
                        returnType = "Claim"
                      }

                      return {
                        label: t("orders.returns.receive.receiveItems", {
                          id: `#${id?.slice(-7)}`,
                          returnType,
                        }),
                        icon: <ArrowLongRight />,
                        to: `/orders/${order.id}/returns/${r.id}/receive`,
                      }
                    }),
                  },
                ]}
              >
                <Button variant="secondary" size="small">
                  {t("orders.returns.receive.action")}
                </Button>
              </ActionMenu>
            ))}

          {showAllocateButton && (
            <Button
              asChild
              variant="secondary"
              size="small"
              data-testid="order-summary-allocate-items-cta"
            >
              <Link to="allocate-items">
                {t("orders.allocateItems.action")}
              </Link>
            </Button>
          )}

          {showRefund && (
            <Button size="small" variant="secondary" asChild>
              <Link to={`/orders/${order.id}/refund`}>
                {t("orders.payment.refundAmount", {
                  amount: getStylizedAmount(
                    pendingDifference * -1,
                    order?.currency_code
                  ),
                })}
              </Link>
            </Button>
          )}
        </div>
      )}

      <OutstandingActions order={order} />
    </Container>
  )
}

const Header = ({
  order,
  orderPreview,
}: {
  order: HttpTypes.AdminOrder
  orderPreview?: AdminOrderPreview
}) => {
  const { t } = useTranslation()

  const isCanceled = !!order.canceled_at
  const returnOutOfPolicy = isOutsidePolicyWindow(order, RETURN_POLICY_DAYS)
  const exchangeOutOfPolicy = isOutsidePolicyWindow(
    order,
    EXCHANGE_POLICY_DAYS
  )
  const claimOutOfPolicy = isOutsidePolicyWindow(order, CLAIM_POLICY_DAYS)

  const shouldDisableReturn = (order.items || []).every(
    (i) => !(getReturnableQuantity(i) > 0)
  )

  const orderChange = orderPreview?.order_change
  const isOrderEditActive = orderChange?.change_type === "edit"
  const isOrderEditPending =
    orderChange?.change_type === "edit" && orderChange?.status === "pending"

  const editDisabled =
    isCanceled ||
    (!!orderChange && orderChange.change_type !== "edit") ||
    (orderChange?.change_type === "edit" && orderChange?.status === "requested")

  const returnDisabledByChange =
    isOrderEditActive ||
    !!orderChange?.exchange_id ||
    !!orderChange?.claim_id

  const exchangeDisabledByChange =
    isOrderEditActive ||
    (!!orderChange?.return_id && !orderChange?.exchange_id) ||
    !!orderChange?.claim_id

  const claimDisabledByChange =
    isOrderEditActive ||
    (!!orderChange?.return_id && !orderChange?.claim_id) ||
    !!orderChange?.exchange_id

  return (
    <div className="flex items-center justify-between px-6 py-4">
      <Heading level="h2">{t("fields.summary")}</Heading>
      <ActionMenu
        groups={[
          {
            actions: [
              {
                label: t(
                  isOrderEditPending
                    ? "orders.summary.editOrderContinue"
                    : "orders.edits.create"
                ),
                to: "edit",
                disabled: editDisabled,
                icon: <PencilSquare />,
              },
            ],
          },
          {
            actions: [
              {
                label: t("orders.returns.create"),
                to: "returns/create",
                disabled:
                  isCanceled ||
                  returnOutOfPolicy ||
                  shouldDisableReturn ||
                  returnDisabledByChange,
                disabledTooltip: returnOutOfPolicy
                  ? t("orders.returns.outOfPolicy", {
                      days: RETURN_POLICY_DAYS,
                    })
                  : undefined,
                icon: <ArrowUturnLeft />,
              },
              {
                label:
                  orderChange?.id && orderChange?.exchange_id
                    ? t("orders.exchanges.manage")
                    : t("orders.exchanges.create"),
                to: "exchanges/create",
                disabled:
                  isCanceled ||
                  exchangeOutOfPolicy ||
                  shouldDisableReturn ||
                  exchangeDisabledByChange,
                disabledTooltip: exchangeOutOfPolicy
                  ? t("orders.exchanges.outOfPolicy", {
                      days: EXCHANGE_POLICY_DAYS,
                    })
                  : undefined,
                icon: <ArrowPath />,
              },
              {
                label:
                  orderChange?.id && orderChange?.claim_id
                    ? t("orders.claims.manage")
                    : t("orders.claims.create"),
                to: "claims/create",
                disabled:
                  isCanceled ||
                  claimOutOfPolicy ||
                  shouldDisableReturn ||
                  claimDisabledByChange,
                disabledTooltip: claimOutOfPolicy
                  ? t("orders.claims.outOfPolicy", {
                      days: CLAIM_POLICY_DAYS,
                    })
                  : undefined,
                icon: <ExclamationCircle />,
              },
            ],
          },
        ]}
      />
    </div>
  )
}

const Item = ({
  item,
  currencyCode,
  returns,
  reservation,
}: {
  item: AdminOrderLineItem
  currencyCode: string
  returns: ReturnWithReason[]
  reservation?: AdminReservation
}) => {
  const { t } = useTranslation()
  const original_price =
    item.variant?.prices?.find((price) => price.currency_code === currencyCode)
      ?.amount || 0
  const price = item.unit_price

  const offerInventoryLinks =
    (item as unknown as {
      offer?: { inventory_item_link?: unknown[] | null }
    }).offer?.inventory_item_link ?? []
  const isInventoryManaged = !!offerInventoryLinks.length
  const hasUnfulfilledItems =
    item.quantity - (item.detail?.fulfilled_quantity ?? 0) > 0

  // `offer` is wired through Mercur's order-line-item-offer link but isn't in
  // Medusa's public AdminOrderLineItem type. Pull it off the runtime shape.
  const offerSku =
    (item as unknown as { offer?: { sku?: string | null } }).offer?.sku ?? null
  const captionSku = offerSku ?? item.variant_sku ?? null

  return (
    <>
      <div
        key={item.id}
        className="text-ui-fg-subtle grid grid-cols-2 items-center gap-x-4 px-6 py-4"
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
              {item.title || item.product_title}
            </Text>

            {captionSku && (
              <div className="flex items-center gap-x-1">
                <Text size="small">{captionSku}</Text>
                <Copy content={captionSku} className="text-ui-fg-muted" />
              </div>
            )}
            <Text size="small">
              {item.variant?.options?.map((o) => o.value).join(" · ")}
            </Text>
          </div>
        </div>

        <div className="grid grid-cols-3 items-center gap-x-4">
          <div className="flex items-center justify-end gap-x-4">
            <Text size="small">
              {original_price !== price && (
                <span className="line-through text-ui-fg-muted text-xs mr-1">
                  {getLocaleAmount(original_price, currencyCode)}
                </span>
              )}
              {getLocaleAmount(price, currencyCode)}
            </Text>
          </div>

          <div className="flex items-center gap-x-2">
            <div className="w-fit min-w-[27px]">
              <Text size="small">
                <span className="tabular-nums">{item.quantity}</span>x
              </Text>
            </div>

            <div className="overflow-visible">
              {isInventoryManaged && hasUnfulfilledItems && (
                <StatusBadge
                  color={reservation ? "green" : "orange"}
                  className="text-nowrap"
                >
                  {reservation
                    ? t("orders.reservations.allocatedLabel")
                    : t("orders.reservations.notAllocatedLabel")}
                </StatusBadge>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end">
            <Text size="small" className="pt-[1px]">
              {getLocaleAmount(item.original_total || 0, currencyCode)}
            </Text>
          </div>
        </div>
      </div>

      {returns.map((r) => (
        <ReturnBreakdown key={r.id} orderReturn={r} itemId={item.id} />
      ))}
    </>
  )
}

const ItemBreakdown = ({
  order,
  reservations,
}: {
  order: AdminOrder
  reservations: AdminReservation[]
}) => {
  const { returns: returnsList = [] } = useReturns({
    order_id: order.id,
    fields: "*items,*items.reason",
  })

  const returns = useMemo<ReturnWithReason[]>(
    () =>
      (returnsList as ReturnWithReason[]).filter((r) => !r.canceled_at),
    [returnsList]
  )

  const reservationsMap = useMemo(
    () => new Map(reservations.map((r) => [r.line_item_id, r])),
    [reservations]
  )

  return (
    <div>
      {order.items?.map((item) => {
        return (
          <Item
            key={item.id}
            item={item}
            currencyCode={order.currency_code}
            returns={returns}
            reservation={reservationsMap.get(item.id)}
          />
        )
      })}
    </div>
  )
}

const ReturnBreakdownWithDamages = ({
  orderReturn,
  itemId,
}: {
  orderReturn: ReturnWithReason
  itemId: string
}) => {
  const { t } = useTranslation()

  const item = orderReturn.items?.find((ri) => ri.item_id === itemId)
  const damagedQuantity = item?.damaged_quantity || 0

  if (!item || damagedQuantity <= 0) {
    return null
  }

  return (
    <div
      key={`${orderReturn.id}-damaged`}
      className="txt-compact-small-plus text-ui-fg-subtle bg-ui-bg-subtle flex flex-row justify-between gap-y-2 border-t-2 border-dotted px-6 py-4"
    >
      <div className="flex items-center gap-2">
        <ArrowDownRightMini className="text-ui-fg-muted" />
        <Text size="small">
          {t("orders.returns.damagedItemsReturned", {
            quantity: damagedQuantity,
          })}
        </Text>

        {item.note && (
          <Tooltip content={item.note}>
            <DocumentText className="text-ui-tag-neutral-icon ml-1 inline" />
          </Tooltip>
        )}

        {item.reason && (
          <Badge
            size="2xsmall"
            className="cursor-default select-none capitalize"
            rounded="full"
          >
            {item.reason.label}
          </Badge>
        )}
      </div>

      <Text size="small" leading="compact" className="text-ui-fg-muted">
        {t("orders.returns.damagedItemReceived")}
        <span className="ml-2">
          <ReturnInfoPopover orderReturn={orderReturn} />
        </span>
      </Text>
    </div>
  )
}

const ReturnBreakdown = ({
  orderReturn,
  itemId,
}: {
  orderReturn: ReturnWithReason
  itemId: string
}) => {
  const { t } = useTranslation()
  const { getRelativeDate } = useDate()

  if (
    !["requested", "received", "partially_received"].includes(
      orderReturn.status || ""
    )
  ) {
    return null
  }

  const isRequested = orderReturn.status === "requested"
  const item = orderReturn.items?.find((ri) => ri.item_id === itemId)

  if (!item) {
    return null
  }

  const damagedQuantity = item.damaged_quantity || 0

  return (
    <>
      {damagedQuantity > 0 && (
        <ReturnBreakdownWithDamages
          orderReturn={orderReturn}
          itemId={itemId}
        />
      )}
      <div
        key={item.id}
        className="txt-compact-small-plus text-ui-fg-subtle bg-ui-bg-subtle flex flex-row justify-between gap-y-2 border-t-2 border-dotted px-6 py-4"
      >
        <div className="flex items-center gap-2">
          <ArrowDownRightMini className="text-ui-fg-muted" />
          <Text size="small">
            {t(
              `orders.returns.${
                isRequested ? "returnRequestedInfo" : "returnReceivedInfo"
              }`,
              {
                requestedItemsCount: isRequested
                  ? item.quantity
                  : item.received_quantity,
              }
            )}
          </Text>

          {item.note && (
            <Tooltip content={item.note}>
              <DocumentText className="text-ui-tag-neutral-icon ml-1 inline" />
            </Tooltip>
          )}

          {item.reason && (
            <Badge
              size="2xsmall"
              className="cursor-default select-none capitalize"
              rounded="full"
            >
              {item.reason.label}
            </Badge>
          )}
        </div>

        {isRequested ? (
          <Text size="small" leading="compact" className="text-ui-fg-muted">
            {getRelativeDate(orderReturn.created_at)}
            <span className="ml-2">
              <ReturnInfoPopover orderReturn={orderReturn} />
            </span>
          </Text>
        ) : (
          <Text size="small" leading="compact" className="text-ui-fg-muted">
            {t("orders.returns.itemReceived")}
            <span className="ml-2">
              <ReturnInfoPopover orderReturn={orderReturn} />
            </span>
          </Text>
        )}
      </div>
    </>
  )
}

const Cost = ({
  label,
  value,
  secondaryValue,
  tooltip,
}: {
  label: ReactNode
  value: string | number
  secondaryValue?: string
  tooltip?: ReactNode
}) => (
  <div className="grid grid-cols-3 items-center">
    <Text size="small" leading="compact">
      {label} {tooltip}
    </Text>
    <div className="text-right">
      <Text size="small" leading="compact">
        {secondaryValue}
      </Text>
    </div>
    <div className="text-right">
      <Text size="small" leading="compact">
        {value}
      </Text>
    </div>
  </div>
)

const CostBreakdown = ({
  order,
}: {
  order: HttpTypes.AdminOrder
}) => {
  const { t } = useTranslation()
  const [isTaxOpen, setIsTaxOpen] = useState(false)
  const [isShippingOpen, setIsShippingOpen] = useState(false)

  const commissionTotal = useMemo(() => {
    return order.items.reduce((acc, item) => {
      const lines = (item as any).commission_lines as any[] | undefined
      if (!lines) return acc
      return acc + lines.reduce((sum: number, line: any) => sum + (line.amount ?? 0), 0)
    }, 0)
  }, [order.items])

  const discountCodes = useMemo(() => {
    const codes = new Set()
    order.items.forEach((item) =>
      item.adjustments?.forEach((adj) => {
        codes.add(adj.code)
      })
    )

    return Array.from(codes).sort()
  }, [order])

  const taxCodes = useMemo(() => {
    const taxCodeMap: Record<string, number> = {}

    order.items.forEach((item) => {
      item.tax_lines?.forEach((line) => {
        taxCodeMap[line.code] = (taxCodeMap[line.code] || 0) + line.total
      })
    })

    order.shipping_methods.forEach((sm) => {
      sm.tax_lines?.forEach((line) => {
        taxCodeMap[line.code] = (taxCodeMap[line.code] || 0) + line.total
      })
    })

    return taxCodeMap
  }, [order])

  const automaticTaxesOn = !!order.region?.automatic_taxes
  const hasTaxLines = !!Object.keys(taxCodes).length

  const discountTotal = automaticTaxesOn
    ? order.discount_total
    : order.discount_subtotal

  return (
    <div className="text-ui-fg-subtle flex flex-col gap-y-2 px-6 py-4">
      <Cost
        label={t(
          automaticTaxesOn
            ? "orders.summary.itemTotal"
            : "orders.summary.itemSubtotal"
        )}
        value={getLocaleAmount(order.item_total, order.currency_code)}
      />
      <Cost
        label={
          // oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
          <span
            onClick={() => setIsShippingOpen((o) => !o)}
            className="flex cursor-pointer items-center gap-1"
          >
            <span>
              {t(
                automaticTaxesOn
                  ? "orders.summary.shippingTotal"
                  : "orders.summary.shippingSubtotal"
              )}
            </span>
            <TriangleDownMini
              style={{
                transform: `rotate(${isShippingOpen ? 0 : -90}deg)`,
              }}
            />
          </span>
        }
        value={getLocaleAmount(
          automaticTaxesOn ? order.shipping_total : order.shipping_subtotal,
          order.currency_code
        )}
      />

      {isShippingOpen && (
        <div className="flex flex-col gap-1 pl-5">
          {(order.shipping_methods || [])
            .sort((m1, m2) =>
              (m1.created_at as string).localeCompare(m2.created_at as string)
            )
            .map((sm, i) => {
              return (
                <div
                  key={sm.id}
                  className="flex items-center justify-between gap-x-2"
                >
                  <div>
                    <span className="txt-small text-ui-fg-subtle font-medium">
                      {sm.name}
                      {sm.detail?.return_id &&
                        ` (${t("fields.returnShipping")})`}{" "}
                      <ShippingInfoPopover key={i} shippingMethod={sm} />
                    </span>
                  </div>
                  <div className="relative flex-1">
                    <div className="bottom-[calc(50% - 2px)] absolute h-[1px] w-full border-b border-dashed" />
                  </div>
                  <span className="txt-small text-ui-fg-muted">
                    {getLocaleAmount(
                      automaticTaxesOn ? sm.total : sm.subtotal,
                      order.currency_code
                    )}
                  </span>
                </div>
              )
            })}
        </div>
      )}

      <Cost
        label={t(
          automaticTaxesOn
            ? "orders.summary.discountTotal"
            : "orders.summary.discountSubtotal"
        )}
        secondaryValue={discountCodes.join(", ")}
        value={
          discountTotal > 0
            ? `- ${getLocaleAmount(discountTotal, order.currency_code)}`
            : "-"
        }
      />

      <>
        <div className="flex justify-between">
          {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <div
            onClick={() => hasTaxLines && setIsTaxOpen((o) => !o)}
            className={clx("flex items-center gap-1", {
              "cursor-pointer": hasTaxLines,
            })}
          >
            <span className="txt-small select-none">
              {t(
                automaticTaxesOn
                  ? "orders.summary.taxTotalIncl"
                  : "orders.summary.taxTotal"
              )}
            </span>
            {hasTaxLines && (
              <TriangleDownMini
                style={{
                  transform: `rotate(${isTaxOpen ? 0 : -90}deg)`,
                }}
              />
            )}
          </div>

          <div className="text-right">
            <Text size="small" leading="compact">
              {getLocaleAmount(order.tax_total, order.currency_code)}
            </Text>
          </div>
        </div>
        {isTaxOpen && (
          <div className="flex flex-col gap-1 pl-5">
            {Object.entries(taxCodes).map(([code, total]) => {
              return (
                <div
                  key={code}
                  className="flex items-center justify-between gap-x-2"
                >
                  <div>
                    <span className="txt-small text-ui-fg-subtle font-medium">
                      {code}
                    </span>
                  </div>
                  <div className="relative flex-1">
                    <div className="bottom-[calc(50% - 2px)] absolute h-[1px] w-full border-b border-dashed" />
                  </div>
                  <span className="txt-small text-ui-fg-muted">
                    {getLocaleAmount(total as number, order.currency_code)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </>
      {commissionTotal > 0 && (
        <Cost
          label={t("fields.commission")}
          value={getLocaleAmount(commissionTotal, order.currency_code)}
        />
      )}
    </div>
  )
}

const Total = ({ order }: { order: AdminOrder }) => {
  const { t } = useTranslation()
  const totalCaptured = getTotalCaptured(order.payment_collections || [])
  const outstanding = Math.max(0, order.total - totalCaptured)

  return (
    <div className=" flex flex-col gap-y-2 px-6 py-4">
      <div className="text-ui-fg-base flex items-center justify-between">
        <Text
          weight="plus"
          className="text-ui-fg-subtle"
          size="small"
          leading="compact"
        >
          {t("fields.total")}
        </Text>
        <Text
          weight="plus"
          className="text-ui-fg-subtle"
          size="small"
          leading="compact"
        >
          {getStylizedAmount(order.total, order.currency_code)}
        </Text>
      </div>

      <div className="text-ui-fg-base flex items-center justify-between">
        <Text
          weight="plus"
          className="text-ui-fg-subtle"
          size="small"
          leading="compact"
        >
          {t("fields.paidTotal")}
        </Text>
        <Text
          weight="plus"
          className="text-ui-fg-subtle"
          size="small"
          leading="compact"
        >
          {getStylizedAmount(totalCaptured, order.currency_code)}
        </Text>
      </div>

      <div className="text-ui-fg-base flex items-center justify-between">
        <Text weight="plus" size="small" leading="compact">
          {t("orders.payment.outstandingAmount")}
        </Text>
        <Text weight="plus" size="small" leading="compact">
          {getStylizedAmount(outstanding, order.currency_code)}
        </Text>
      </div>
    </div>
  )
}

const OutstandingActions = ({ order }: { order: HttpTypes.AdminOrder }) => {
  const { t } = useTranslation()

  const unpaidCollection = order.payment_collections?.find(
    (pc) => pc.status !== "captured" && pc.status !== "canceled"
  )

  const pendingDifference = order.summary?.pending_difference || 0
  const isOutstanding =
    pendingDifference > 0.005 &&
    order.status !== "canceled" &&
    !!unpaidCollection

  const markAsPaid = useMarkPaymentCollectionAsPaid(
    order.id,
    unpaidCollection?.id ?? ""
  )

  if (!isOutstanding || !unpaidCollection) {
    return null
  }

  const paymentLink =
    (
      unpaidCollection.payment_sessions?.[0]?.data as
        | { url?: string }
        | undefined
    )?.url ?? null

  const handleCopyLink = async () => {
    if (!paymentLink) {
      toast.error(t("orders.payment.copyLinkMissing"))
      return
    }
    try {
      await navigator.clipboard.writeText(paymentLink)
      toast.success(t("orders.payment.copyLinkSuccess"))
    } catch {
      toast.error(t("orders.payment.copyLinkError"))
    }
  }

  const handleMarkAsPaid = () => {
    markAsPaid.mutate(
      { order_id: order.id },
      {
        onSuccess: () => toast.success(t("orders.payment.markAsPaidSuccess")),
        onError: (e) => toast.error(e.message),
      }
    )
  }

  return (
    <div className="bg-ui-bg-subtle flex items-center justify-end gap-x-2 rounded-b-xl px-4 py-4">
      {paymentLink && (
        <Button size="small" variant="secondary" onClick={handleCopyLink}>
          {t("orders.payment.copyPaymentLink", {
            amount: getStylizedAmount(pendingDifference, order.currency_code),
          })}
        </Button>
      )}

      <Button
        size="small"
        variant="secondary"
        onClick={handleMarkAsPaid}
        isLoading={markAsPaid.isPending}
      >
        {t("orders.payment.markAsPaid")}
      </Button>
    </div>
  )
}
