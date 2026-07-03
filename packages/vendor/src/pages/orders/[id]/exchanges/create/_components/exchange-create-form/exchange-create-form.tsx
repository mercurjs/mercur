// Vendor port of admin's `ExchangeCreateForm`. Mirrors admin's
// `RouteFocusModal.Body` + `RouteFocusModal.Footer` shell, centered
// 720px container, and the h1 heading + sub-section composition.
// Delegates inbound + outbound flows to the already-aligned
// `ExchangeInboundSection` / `ExchangeOutboundSection` sub-components.
//
// Adapts to vendor's mutations: creates the exchange on mount via
// `useCreateExchange` (admin does this in the parent route), confirms
// via `useRequestExchange` (admin uses `useExchangeConfirmRequest`).
// Preserves SPEC-008 additions: policy hint.
import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Heading, Switch, Text, toast, usePrompt } from "@medusajs/ui"
import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { Form } from "@components/common/form"
import { RouteFocusModal, useRouteModal } from "@components/modals"
import { KeyboundForm } from "@components/utilities/keybound-form"
import { useOrder, useOrderPreview } from "@hooks/api/orders"
import {
  useCancelExchangeBegin,
  useCreateExchange,
  useRequestExchange,
} from "@hooks/api/exchanges"
import { getStylizedAmount } from "@lib/money-amount-helpers"
import { EXCHANGE_POLICY_DAYS } from "@lib/policy"

import { ExchangeInboundSection } from "./exchange-inbound-section"
import { ExchangeOutboundSection } from "./exchange-outbound-section"
import { ExchangeCreateSchema, type CreateExchangeSchemaType } from "./schema"

// Discriminator workaround: `preview.order_change.exchange_id` is present
// when `change_type === "exchange"` but `HttpTypes.AdminOrderChange` doesn't
// expose a discriminated union. Read it via a narrow cast.
const readExchangeId = (change: unknown): string | undefined => {
  if (
    change &&
    typeof change === "object" &&
    "exchange_id" in change &&
    typeof (change as { exchange_id?: unknown }).exchange_id === "string"
  ) {
    return (change as { exchange_id: string }).exchange_id
  }
  return undefined
}

type PreviewItem = {
  id: string
  quantity?: number
  total?: number | null
  detail?: {
    return_requested_quantity?: number
    quantity?: number
  }
  actions?: Array<{
    id?: string
    action?: string
    exchange_id?: string | null
    return_id?: string | null
    details?: { quantity?: number } | null
  }>
}

type PreviewShippingMethod = {
  total?: number | null
  actions?: Array<{
    id?: string
    action?: string
    return_id?: string | null
  }>
}

let IS_REQUEST_RUNNING = false

export const ExchangeCreateForm = () => {
  const { id } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { handleSuccess } = useRouteModal()

  const orderId = id ?? ""

  const { order } = useOrder(orderId, {
    fields: "currency_code,total,items.*,items.variant.*",
  })
  const { order: preview } = useOrderPreview(orderId)

  const [exchangeId, setExchangeId] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)
  const [canceling, setCanceling] = useState(false)

  /**
   * FORM
   */
  const form = useForm<CreateExchangeSchemaType>({
    defaultValues: {
      inbound_items: [],
      outbound_items: [],
      location_id: undefined,
      inbound_option_id: null,
      outbound_option_id: null,
      send_notification: false,
    },
    resolver: zodResolver(ExchangeCreateSchema),
  })

  const { mutateAsync: createExchange } = useCreateExchange(orderId)
  const { mutateAsync: cancelBegin } = useCancelExchangeBegin(
    exchangeId,
    orderId
  )
  const { mutateAsync: requestExchange, isPending: isConfirming } =
    useRequestExchange(exchangeId, orderId)

  useEffect(() => {
    async function run() {
      if (IS_REQUEST_RUNNING || exchangeId || !preview) {
        return
      }

      if (preview.order_change) {
        if (preview.order_change.change_type !== "exchange") {
          navigate(`/orders/${orderId}`, { replace: true })
          toast.error(t("orders.exchanges.activeChangeError"))
          return
        }
        const existingExchangeId = readExchangeId(preview.order_change)
        if (existingExchangeId) {
          setExchangeId(existingExchangeId)
        }
        return
      }

      IS_REQUEST_RUNNING = true

      try {
        const { exchange } = await createExchange({ order_id: orderId })
        setExchangeId(exchange.id)
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : t("errorBoundary.defaultTitle")
        )
        navigate(`/orders/${orderId}`, { replace: true })
      } finally {
        IS_REQUEST_RUNNING = false
      }
    }

    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview, orderId, exchangeId])

  const inboundItemsWatch = form.watch("inbound_items")
  const outboundItemsWatch = form.watch("outbound_items")

  const hasSelection = useMemo(
    () =>
      (inboundItemsWatch?.length ?? 0) > 0 ||
      (outboundItemsWatch?.length ?? 0) > 0,
    [inboundItemsWatch, outboundItemsWatch]
  )

  // Mirror admin's totals math, scoped to this exchange.
  const previewItems = useMemo<PreviewItem[]>(() => {
    if (!exchangeId) return []
    return ((preview?.items as PreviewItem[] | undefined) ?? []).filter(
      (i) => !!i.actions?.find((a) => a.exchange_id === exchangeId)
    )
  }, [preview, exchangeId])

  const inboundPreviewItems = useMemo(
    () =>
      previewItems.filter(
        (item) => !!item.actions?.find((a) => a.action === "RETURN_ITEM")
      ),
    [previewItems]
  )

  const outboundPreviewItems = useMemo(
    () =>
      previewItems.filter(
        (item) => !!item.actions?.find((a) => a.action === "ITEM_ADD")
      ),
    [previewItems]
  )

  const currencyCode = order?.currency_code ?? ""

  const inboundTotal = useMemo(() => {
    return inboundPreviewItems.reduce((acc, item) => {
      const action = item.actions?.find((a) => a.action === "RETURN_ITEM")
      const requested = Number(action?.details?.quantity || 0)
      const itemQty = item.quantity ?? 0
      const itemTotal = item.total ?? 0
      if (!itemQty) return acc
      return acc + (requested / itemQty) * itemTotal
    }, 0)
  }, [inboundPreviewItems])

  const outboundTotal = useMemo(() => {
    return outboundPreviewItems.reduce(
      (acc, item) => acc + (item.total ?? 0),
      0
    )
  }, [outboundPreviewItems])

  const inboundShippingTotal = useMemo(() => {
    const methods = (preview?.shipping_methods as
      | PreviewShippingMethod[]
      | undefined) ?? []
    const method = methods.find(
      (sm) =>
        !!sm.actions?.find((a) => a.action === "SHIPPING_ADD" && !!a.return_id)
    )
    return method?.total ?? 0
  }, [preview])

  const outboundShippingTotal = useMemo(() => {
    const methods = (preview?.shipping_methods as
      | PreviewShippingMethod[]
      | undefined) ?? []
    const method = methods.find(
      (sm) =>
        !!sm.actions?.find((a) => a.action === "SHIPPING_ADD" && !a.return_id)
    )
    return method?.total ?? 0
  }, [preview])

  const estimatedDifference = useMemo(() => {
    const summary = (preview?.summary as { pending_difference?: number } | undefined)
    return (summary?.pending_difference ?? 0) - inboundTotal
  }, [preview, inboundTotal])

  const prompt = usePrompt()

  /**
   * HANDLERS
   */
  const handleSubmit = form.handleSubmit(async (data) => {
    if (!exchangeId) {
      return
    }

    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("orders.exchanges.confirmText"),
      confirmText: t("actions.continue"),
      cancelText: t("actions.cancel"),
      variant: "confirmation",
    })

    if (!res) {
      return
    }

    setSubmitting(true)
    try {
      // Vendor mutations are fired by the sub-sections as the user edits;
      // confirm just calls request. Admin parity: `no_notification` is
      // derived from the toggle.
      await requestExchange(
        { no_notification: !data.send_notification } as never
      )
      toast.success(t("orders.exchanges.toast.confirmedSuccessfully"))
      handleSuccess(`/orders/${orderId}`)
    } catch (e) {
      toast.error(t("general.error"), {
        description:
          e instanceof Error ? e.message : t("errorBoundary.defaultTitle"),
      })
    } finally {
      setSubmitting(false)
    }
  })

  const handleClose = async () => {
    if (!exchangeId) {
      navigate(`/orders/${orderId}`, { replace: true })
      return
    }
    setCanceling(true)
    try {
      await cancelBegin()
      toast.success(t("orders.exchanges.toast.canceledSuccessfully"))
    } catch {
      // Swallow — user is leaving the screen.
    } finally {
      setCanceling(false)
      navigate(`/orders/${orderId}`, { replace: true })
    }
  }

  const ready = !!order && !!preview && !!exchangeId

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex h-full flex-col">
        <RouteFocusModal.Header />
        <RouteFocusModal.Body className="flex size-full justify-center overflow-y-auto">
          <div className="mt-16 w-[720px] max-w-[100%] px-4 md:p-0">
            <Heading level="h1">{t("orders.exchanges.create")}</Heading>

            {/* Vendor-only: policy hint surfaced near the top so sellers
                know the MVP 30-day window before they confirm. */}
            <Text size="small" className="text-ui-fg-subtle mt-2">
              {t("orders.exchanges.policyHint", {
                days: EXCHANGE_POLICY_DAYS,
              })}
            </Text>

            {ready && (
              <>
                <ExchangeInboundSection
                  form={form}
                  preview={preview as never}
                  order={order!}
                  exchange={{ id: exchangeId }}
                />

                <ExchangeOutboundSection
                  form={form}
                  preview={preview as never}
                  order={order!}
                  exchange={{ id: exchangeId }}
                />

                {/* TOTALS SECTION */}
                <div className="mt-8 border-y border-dotted py-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="txt-small text-ui-fg-subtle">
                      {t("orders.returns.inboundTotal")}
                    </span>
                    <span className="txt-small text-ui-fg-subtle">
                      {getStylizedAmount(-1 * inboundTotal, currencyCode)}
                    </span>
                  </div>

                  <div className="mb-2 flex items-center justify-between">
                    <span className="txt-small text-ui-fg-subtle">
                      {t("orders.exchanges.outboundTotal")}
                    </span>
                    <span className="txt-small text-ui-fg-subtle">
                      {getStylizedAmount(outboundTotal, currencyCode)}
                    </span>
                  </div>

                  <div className="mb-2 flex items-center justify-between">
                    <span className="txt-small text-ui-fg-subtle">
                      {t("orders.returns.inboundShipping")}
                    </span>
                    <span className="txt-small text-ui-fg-subtle">
                      {getStylizedAmount(inboundShippingTotal, currencyCode)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="txt-small text-ui-fg-subtle">
                      {t("orders.exchanges.outboundShipping")}
                    </span>
                    <span className="txt-small text-ui-fg-subtle">
                      {getStylizedAmount(outboundShippingTotal, currencyCode)}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-dotted pt-4">
                    <span className="txt-small font-medium">
                      {t("orders.exchanges.refundAmount")}
                    </span>
                    <span className="txt-small font-medium">
                      {getStylizedAmount(estimatedDifference, currencyCode)}
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* SEND NOTIFICATION */}
            <div className="bg-ui-bg-field mt-8 rounded-lg border py-2 pl-2 pr-4">
              <Form.Field
                control={form.control}
                name="send_notification"
                render={({ field: { onChange, value, ...field } }) => (
                  <Form.Item>
                    <div className="flex items-center">
                      <Form.Control className="mr-4 self-start">
                        <Switch
                          dir="ltr"
                          className="mt-[2px] rtl:rotate-180"
                          checked={!!value}
                          onCheckedChange={onChange}
                          {...field}
                          data-testid="exchange-create-notify"
                        />
                      </Form.Control>
                      <div className="block">
                        <Form.Label>
                          {t("orders.returns.sendNotification")}
                        </Form.Label>
                        <Form.Hint className="!mt-1">
                          {t("orders.returns.sendNotificationHint")}
                        </Form.Hint>
                      </div>
                    </div>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
            </div>

            <div className="p-8" />
          </div>
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer>
          <div className="flex w-full items-center justify-end gap-x-4">
            <div className="flex items-center justify-end gap-x-2">
              <RouteFocusModal.Close asChild>
                <Button
                  type="button"
                  onClick={handleClose}
                  variant="secondary"
                  size="small"
                  isLoading={canceling}
                  disabled={submitting}
                  data-testid="exchange-cancel"
                >
                  {t("orders.exchanges.cancel.title")}
                </Button>
              </RouteFocusModal.Close>
              <Button
                key="submit-button"
                type="submit"
                variant="primary"
                size="small"
                isLoading={submitting || isConfirming}
                disabled={!exchangeId || canceling || !hasSelection}
                data-testid="exchange-confirm"
              >
                {t("orders.exchanges.confirm")}
              </Button>
            </div>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}
