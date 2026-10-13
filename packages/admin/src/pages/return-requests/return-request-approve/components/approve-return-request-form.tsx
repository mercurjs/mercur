import { zodResolver } from "@hookform/resolvers/zod"
import { Button, CurrencyInput, Switch, Textarea, toast } from "@medusajs/ui"
import { useMemo } from "react"
import { formatValue } from "react-currency-input-field"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import * as zod from "zod"

import { Form } from "../../../../components/common/form"
import { RouteDrawer, useRouteModal } from "../../../../components/modals"
import { KeyboundForm } from "../../../../components/utilities/keybound-form"
import {
  AdminReturnRequest,
  useApproveReturnRequest,
} from "../../../../hooks/api/return-requests"
import { currencies } from "../../../../lib/data/currencies"
import { getLocaleAmount } from "../../../../lib/money-amount-helpers"

const ApproveReturnRequestSchema = zod.object({
  amount: zod.object({
    value: zod.string().or(zod.number()),
    float: zod.number().or(zod.null()),
  }),
  refund_shipping: zod.boolean(),
  refund_note: zod.string().max(1000).optional(),
})

type ApproveReturnRequestFormValues = zod.infer<
  typeof ApproveReturnRequestSchema
>

const computeDefaultAmount = (returnRequest: AdminReturnRequest) => {
  const items = returnRequest.return?.items ?? []
  const itemsTotal = items.reduce(
    (sum, returnItem) =>
      sum + Number(returnItem.item?.unit_price ?? 0) * Number(returnItem.quantity),
    0
  )
  const shippingTotal = (returnRequest.return?.shipping_methods ?? []).reduce(
    (sum, shipping) => sum + Number(shipping.amount ?? 0),
    0
  )
  return { itemsTotal, shippingTotal }
}

export const ApproveReturnRequestForm = ({
  returnRequest,
}: {
  returnRequest: AdminReturnRequest
}) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const currencyCode = returnRequest.order?.currency_code ?? "usd"
  const currency = useMemo(
    () => currencies[currencyCode.toUpperCase()],
    [currencyCode]
  )

  const { itemsTotal, shippingTotal } = useMemo(
    () => computeDefaultAmount(returnRequest),
    [returnRequest]
  )

  const form = useForm<ApproveReturnRequestFormValues>({
    resolver: zodResolver(ApproveReturnRequestSchema),
    defaultValues: {
      amount: { value: "", float: null },
      refund_shipping: false,
      refund_note: "",
    },
  })

  const refundShipping = form.watch("refund_shipping")
  const suggested = refundShipping ? itemsTotal + shippingTotal : itemsTotal

  const { mutateAsync, isPending } = useApproveReturnRequest(
    returnRequest.id,
    returnRequest.order_id
  )

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(
      {
        refund_amount:
          data.amount.float !== null && data.amount.float > 0
            ? data.amount.float
            : undefined,
        refund_shipping: data.refund_shipping,
        refund_note: data.refund_note || undefined,
      },
      {
        onSuccess: () => {
          toast.success(t("returnRequests.approve.successToast"))
          handleSuccess()
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  })

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <RouteDrawer.Body>
          <div className="flex flex-col gap-y-6">
            <Form.Field
              control={form.control}
              name="refund_shipping"
              render={({ field: { value, onChange, ...field } }) => (
                <Form.Item>
                  <div className="flex flex-col gap-y-2">
                    <div className="flex items-start justify-between">
                      <Form.Label>
                        {t("returnRequests.approve.refundShipping")}
                      </Form.Label>
                      <Form.Control>
                        <Switch
                          {...field}
                          checked={value}
                          onCheckedChange={onChange}
                          disabled={shippingTotal === 0}
                        />
                      </Form.Control>
                    </div>
                    <Form.Hint>
                      {t("returnRequests.approve.refundShippingHint")}
                    </Form.Hint>
                  </div>
                </Form.Item>
              )}
            />

            <Form.Field
              control={form.control}
              name="amount"
              render={({ field: { onChange, ...field } }) => (
                <Form.Item>
                  <Form.Label optional>{t("fields.amount")}</Form.Label>
                  <Form.Control>
                    <CurrencyInput
                      {...field}
                      min={0}
                      placeholder={formatValue({
                        value: `${suggested}`,
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
                    />
                  </Form.Control>
                  <Form.Hint>
                    {t("returnRequests.approve.amountHint", {
                      amount: getLocaleAmount(suggested, currencyCode),
                    })}
                  </Form.Hint>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />

            <Form.Field
              control={form.control}
              name="refund_note"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>{t("fields.note")}</Form.Label>
                  <Form.Control>
                    <Textarea {...field} />
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
            <Button size="small" type="submit" isLoading={isPending}>
              {t("returnRequests.approve.action")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
