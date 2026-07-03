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
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Button,
  Heading,
  Input,
  Select,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"

import { RouteDrawer, useRouteModal } from "@components/modals"
import { Form } from "@components/common/form"
import { KeyboundForm } from "@components/utilities/keybound-form"
import { useRefundPayment } from "@hooks/api/payments"
import { useRefundReasons } from "@hooks/api/refund-reasons"
import { useDocumentDirection } from "@hooks/use-document-direction"
import { getStylizedAmount } from "@lib/money-amount-helpers"

const RefundSchema = z.object({
  amount: z.coerce.number().positive(),
  refund_reason_id: z.string().optional(),
  note: z.string().optional(),
})

type RefundFormValues = z.infer<typeof RefundSchema>

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

  const refundPayment = useRefundPayment(order.id, paymentId)

  const form = useForm<RefundFormValues>({
    resolver: zodResolver(RefundSchema),
    defaultValues: {
      amount: remaining,
      refund_reason_id: undefined,
      note: "",
    },
    values: {
      amount: remaining,
      refund_reason_id: undefined,
      note: "",
    },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    if (values.amount > remaining) {
      form.setError("amount", {
        message: t("orders.payment.createRefundWrongQuantity", {
          number: remaining,
        }),
      })
      return
    }

    await refundPayment.mutateAsync(
      {
        amount: values.amount,
        refund_reason_id: values.refund_reason_id,
        note: values.note?.trim() ? values.note.trim() : undefined,
      },
      {
        onSuccess: () => {
          toast.success(
            t("orders.payment.refundPaymentSuccess", {
              amount: getStylizedAmount(values.amount, order.currency_code),
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
            <div className="bg-ui-bg-component shadow-elevation-card-rest rounded-lg p-3">
              <div className="flex items-center justify-between">
                <Text size="small" className="text-ui-fg-subtle">
                  {t("orders.payment.totalPaidByCustomer")}
                </Text>
                <Text size="small" weight="plus">
                  {getStylizedAmount(
                    payment.amount as number,
                    order.currency_code
                  )}
                </Text>
              </div>
              {refundedAmount > 0 && (
                <div className="flex items-center justify-between pt-1">
                  <Text size="small" className="text-ui-fg-subtle">
                    {t("orders.payment.totalRefunded")}
                  </Text>
                  <Text size="small" weight="plus">
                    {getStylizedAmount(refundedAmount, order.currency_code)}
                  </Text>
                </div>
              )}
            </div>

            <Form.Field
              control={form.control}
              name="amount"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>{t("fields.amount")}</Form.Label>
                  <Form.Control>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      max={remaining}
                      data-testid="refund-amount-input"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                    />
                  </Form.Control>
                  <Form.Hint>
                    {t("orders.payment.refundAmount", {
                      amount: getStylizedAmount(remaining, order.currency_code),
                    })}
                  </Form.Hint>
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
          <div className="flex items-center gap-x-2">
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
              {t("actions.confirm")}
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
