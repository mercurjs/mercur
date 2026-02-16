import { ReactNode, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import {
  ArrowLongRight,
  TriangleDownMini,
} from "@medusajs/icons"
import {
  AdminOrder,
  AdminOrderLineItem,
  HttpTypes,
  PaymentStatus,
} from "@medusajs/types"
import {
  Button,
  clx,
  Container,
  Copy,
  Heading,
  Text,
  toast,
  usePrompt,
} from "@medusajs/ui"

import { ActionMenu } from "@components/common/action-menu"
import { useMarkPaymentCollectionAsPaid } from "@hooks/api/payment-collections"
import { formatCurrency } from "@lib/format-currency"
import {
  getLocaleAmount,
  getStylizedAmount,
  isAmountLessThenRoundingError,
} from "@lib/money-amount-helpers"
import { getTotalCaptured } from "@lib/payment"
import ShippingInfoPopover from "./shipping-info-popover"
import { Thumbnail } from "@components/common/thumbnail"

type OrderSummarySectionProps = {
  order: HttpTypes.AdminOrder
}

export const OrderSummarySection = ({
  order,
}: OrderSummarySectionProps & { payment_status?: PaymentStatus }) => {
  const { t } = useTranslation()
  const prompt = usePrompt()

  const receivableReturns = useMemo(
    () => order.returns?.filter((r) => !r.canceled_at),
    [order]
  )

  const showReturns = !!receivableReturns?.length

  const unpaidPaymentCollection = order.payment_collections?.find(
    (pc) => pc.status !== "captured" && pc.status !== "canceled"
  )

  const { mutateAsync: markAsPaid } = useMarkPaymentCollectionAsPaid(
    order.id,
    unpaidPaymentCollection?.id!
  )

  const pendingDifference = order.summary?.pending_difference || 0
  const isAmountSignificant = !isAmountLessThenRoundingError(
    pendingDifference,
    order.currency_code
  )

  const showPayment =
    unpaidPaymentCollection && pendingDifference > 0 && isAmountSignificant
  const showRefund =
    unpaidPaymentCollection && pendingDifference < 0 && isAmountSignificant

  const handleMarkAsPaid = async (
    paymentCollection: Partial<HttpTypes.AdminPaymentCollection>
  ) => {
    const res = await prompt({
      title: t("orders.payment.markAsPaid"),
      description: t("orders.payment.markAsPaidPayment", {
        amount: formatCurrency(
          paymentCollection.amount as number,
          order.currency_code
        ),
      }),
      confirmText: t("actions.confirm"),
      cancelText: t("actions.cancel"),
      variant: "confirmation",
    })

    if (!res) {
      return
    }

    await markAsPaid(
      { order_id: order.id },
      {
        onSuccess: () => {
          toast.success(
            t("orders.payment.markAsPaidPaymentSuccess", {
              amount: formatCurrency(
                paymentCollection.amount as number,
                order.currency_code
              ),
            })
          )
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  }

  return (
    <Container className="divide-y divide-dashed p-0">
      <Header />
      <ItemBreakdown order={order} />
      <CostBreakdown order={order} />
      <Total order={order} />

      {(showReturns || showPayment || showRefund) && (
        <div className="bg-ui-bg-subtle flex items-center justify-end gap-x-2 rounded-b-xl px-4 py-4">
          {showReturns &&
            (receivableReturns?.length === 1 ? (
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
                    actions: receivableReturns?.map((r) => {
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

          {showPayment && (
            <Button
              size="small"
              variant="secondary"
              onClick={() => handleMarkAsPaid(unpaidPaymentCollection)}
            >
              {t("orders.payment.markAsPaid")}
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
    </Container>
  )
}

const Header = () => {
  const { t } = useTranslation()

  return (
    <div className="flex items-center justify-between px-6 py-4">
      <Heading level="h2">{t("fields.summary")}</Heading>
    </div>
  )
}

const Item = ({
  item,
  currencyCode,
}: {
  item: AdminOrderLineItem
  currencyCode: string
}) => {
  const original_price =
    item.variant?.prices?.find((price) => price.currency_code === currencyCode)
      ?.amount || 0
  const price = item.unit_price

  return (
    <>
      <div
        key={item.id}
        className="text-ui-fg-subtle grid grid-cols-2 items-center gap-x-4 px-6 py-4"
      >
        <div className="flex items-start gap-x-4">
          <Thumbnail src={item.thumbnail} size="large" />
          <div>
            <Text
              size="small"
              leading="compact"
              weight="plus"
              className="text-ui-fg-base"
            >
              {item.title || item.product_title}
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
          </div>

          <div className="flex items-center justify-end">
            <Text size="small" className="pt-[1px]">
              {getLocaleAmount(item.original_total || 0, currencyCode)}
            </Text>
          </div>
        </div>
      </div>
    </>
  )
}

const ItemBreakdown = ({
  order,
}: {
  order: AdminOrder
}) => {
  return (
    <div>
      {order.items?.map((item) => {
        return (
          <Item
            key={item.id}
            item={item}
            currencyCode={order.currency_code}
          />
        )
      })}
    </div>
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
          label={"Commission"}
          value={getLocaleAmount(commissionTotal, order.currency_code)}
        />
      )}
    </div>
  )
}

const Total = ({ order }: { order: AdminOrder }) => {
  const { t } = useTranslation()

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
          {getStylizedAmount(
            getTotalCaptured(order.payment_collections || []),
            order.currency_code
          )}
        </Text>
      </div>
    </div>
  )
}
