// Vendor port of admin's `CreateRefundForm`
// (admin: routes/orders/order-create-refund/components/create-refund-form/).
// Same `RouteDrawer.Form` host + RHF + zod shape. Adapted for the vendor
// SDK (`useRefundPayment` already namespaces `sdk.vendor.payments`), the
// vendor's `useRefundReasons` hook, and the vendor's optional
// `payment_id` search-param (admin uses `paymentId`).
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"
import { formatValue } from "react-currency-input-field"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Button,
  CurrencyInput,
  Heading,
  Select,
  Textarea,
  toast,
} from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"

import { RouteDrawer, useRouteModal } from "@components/modals"
import { Form } from "@components/common/form"
import DisplayId from "@components/common/display-id/display-id"
import { KeyboundForm } from "@components/utilities/keybound-form"
import { useRefundPayment } from "@hooks/api/payments"
import { useRefundReasons } from "@hooks/api/refund-reasons"
import { useDocumentDirection } from "@hooks/use-document-direction"
import { currencies } from "@lib/data/currencies"
import { getDecimalDigits, getLocaleAmount } from "@lib/money-amount-helpers"

type CreateRefundFormProps = {
  order: HttpTypes.AdminOrder
}

export const CreateRefundForm = ({ order }: CreateRefundFormProps) => {
  const { t } = useTranslation()
  const dir = useDocumentDirection()
  const { handleSuccess } = useRouteModal()
  const [searchParams] = useSearchParams()

  const requestedPaymentId = searchParams.get("payment_id") ?? ""

  const { refund_reasons } = useRefundReasons({ limit: 100 })

  const payment = useMemo(() => {
    const allPayments = (order.payment_collections ?? []).flatMap(
      (pc) => pc.payments ?? []
    )

    if (requestedPaymentId) {
      return allPayments.find((p) => p.id === requestedPaymentId)
    }

    return allPayments.find((p) => {
      const refunded = (p.refunds ?? []).reduce(
        (acc: number, r: { amount?: number }) => acc + (r.amount ?? 0),
        0
      )
      return (
        !!p.captured_at &&
        !p.canceled_at &&
        refunded < (p.amount as number)
      )
    })
  }, [order, requestedPaymentId])

  const paymentId = payment?.id ?? ""

  const refundedAmount = useMemo(() => {
    if (!payment) return 0
    return (payment.refunds ?? []).reduce(
      (acc: number, r: { amount?: number }) => acc + (r.amount ?? 0),
      0
    )
  }, [payment])

  const remaining = useMemo(() => {
    if (!payment) return 0
    return Math.max(0, (payment.amount as number) - refundedAmount)
  }, [payment, refundedAmount])

  const currency = useMemo(
    () => currencies[order.currency_code.toUpperCase()],
    [order.currency_code]
  )

  const decimalDigits = getDecimalDigits(order.currency_code)

  // Mirror getStylizedAmount's rounding so the field and the paid line agree.
  const getRoundedAmount = (amount: number) =>
    amount.toLocaleString("en-US", {
      minimumFractionDigits: decimalDigits,
      maximumFractionDigits: decimalDigits,
      useGrouping: false,
    })

  const RefundSchema = useMemo(
    () =>
      z.object({
        amount: z
          .object({
            value: z.union([z.string(), z.number()]),
            float: z.number().nullable(),
          })
          .refine((v) => v.float !== null && v.float > 0, {
            message: t("orders.payment.enterAmount"),
          }),
        refund_reason_id: z.string().optional(),
        note: z.string().optional(),
      }),
    [t]
  )

  type RefundFormValues = z.infer<typeof RefundSchema>

  const refundPayment = useRefundPayment(order.id, paymentId)

  const form = useForm<RefundFormValues>({
    resolver: zodResolver(RefundSchema),
    defaultValues: {
      amount: {
        value: getRoundedAmount(remaining),
        float: remaining,
      },
      refund_reason_id: undefined,
      note: "",
    },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    const amount = values.amount.float ?? 0

    if (amount > remaining) {
      form.setError("amount", {
        message: t("orders.payment.createRefundWrongQuantity", {
          number: remaining,
        }),
      })
      return
    }

    await refundPayment.mutateAsync(
      {
        amount,
        refund_reason_id: values.refund_reason_id,
        note: values.note?.trim() ? values.note.trim() : undefined,
      },
      {
        onSuccess: () => {
          toast.success(
            t("orders.payment.refundPaymentSuccess", {
              amount: getLocaleAmount(amount, order.currency_code),
            })
          )
          handleSuccess(`/orders/${order.id}`)
        },
        onError: (e) => {
          toast.error(e.message)
        },
      }
    )
  })

  if (!payment) {
    return null
  }

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <RouteDrawer.Body>
          <div className="flex flex-col gap-y-4">
            <div className="text-ui-fg-base flex items-center gap-x-1 text-sm">
              <span>
                {getLocaleAmount(
                  payment.amount as number,
                  order.currency_code
                )}
              </span>
              <span>-</span>
              <span>
                (<DisplayId id={payment.id} />)
              </span>
            </div>

            <Form.Field
              control={form.control}
              name="amount"
              render={({ field: { onChange, ...field } }) => (
                <Form.Item>
                  <Form.Label>{t("fields.amount")}</Form.Label>
                  <Form.Control>
                    <CurrencyInput
                      {...field}
                      min={0}
                      placeholder={formatValue({
                        value: "0",
                        decimalScale: currency.decimal_digits,
                      })}
                      decimalScale={currency.decimal_digits}
                      symbol={currency.symbol_native}
                      code={currency.code}
                      value={field.value.value}
                      onValueChange={(_value, _name, values) =>
                        onChange({
                          value: values?.value ?? "",
                          float: values?.float ?? null,
                        })
                      }
                      data-testid="refund-amount-input"
                    />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />

            <Form.Field
              control={form.control}
              name="refund_reason_id"
              render={({ field: { ref, onChange, ...field } }) => (
                <Form.Item>
                  <Form.Label optional>{t("orders.returns.reason")}</Form.Label>
                  <Form.Control>
                    <Select onValueChange={onChange} {...field} dir={dir}>
                      <Select.Trigger
                        ref={ref}
                        data-testid="refund-reason-select"
                      >
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Content>
                        {(refund_reasons as Array<{
                          id: string
                          label?: string | null
                        }> | undefined ?? []).map((r) => (
                          <Select.Item key={r.id} value={r.id}>
                            {r.label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />

            <Form.Field
              control={form.control}
              name="note"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>{t("fields.note")}</Form.Label>
                  <Form.Control>
                    <Textarea
                      data-testid="refund-note-input"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
          </div>
        </RouteDrawer.Body>

        <RouteDrawer.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button
              size="small"
              type="submit"
              isLoading={refundPayment.isPending}
              data-testid="refund-submit-button"
            >
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}

// Re-exported here so the `_components/` barrel doesn't have to know
// about the heading-only render path.
export const CreateRefundDrawerHeading = () => {
  const { t } = useTranslation()
  return <Heading>{t("orders.payment.createRefund")}</Heading>
}
