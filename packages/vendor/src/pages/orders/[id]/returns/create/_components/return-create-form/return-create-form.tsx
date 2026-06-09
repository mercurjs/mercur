import { zodResolver } from "@hookform/resolvers/zod"
import { PencilSquare } from "@medusajs/icons"
import {
  AdminOrder,
  AdminOrderPreview,
  AdminReturn,
} from "@medusajs/types"
import {
  Button,
  CurrencyInput,
  Heading,
  IconButton,
  Switch,
  Text,
  toast,
  usePrompt,
} from "@medusajs/ui"
import { useEffect, useMemo, useState } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Form } from "@components/common/form"
import { Combobox } from "@components/inputs/combobox"
import {
  RouteFocusModal,
  StackedFocusModal,
  useRouteModal,
  useStackedModal,
} from "@components/modals"
import { KeyboundForm } from "@components/utilities/keybound-form"
import {
  useAddReturnItem,
  useAddReturnShipping,
  useCancelReturnRequest,
  useConfirmReturnRequest,
  useDeleteReturnShipping,
  useRemoveReturnItem,
  useUpdateReturn,
  useUpdateReturnItem,
  useUpdateReturnShipping,
} from "@hooks/api/returns"
import { useShippingOptions } from "@hooks/api/shipping-options"
import { useStockLocations } from "@hooks/api/stock-locations"
import { currencies } from "@lib/data/currencies"
import { getStylizedAmount } from "@lib/money-amount-helpers"
import { RETURN_POLICY_DAYS } from "@lib/policy"

import { ReturnShippingPlaceholder } from "../../../../../common/placeholders"
import { AddReturnItemsTable } from "../add-return-items-table"
import { ReturnItem } from "./return-item"
import { ReturnCreateSchema, ReturnCreateSchemaType } from "./schema"

type ReturnCreateFormProps = {
  order: AdminOrder
  activeReturn: AdminReturn
  preview: AdminOrderPreview
}

// Held outside the component so the stacked-modal `Save` click can read
// the latest selection without piping props through. Matches the admin
// pattern. Values are order line item ids (the `i.id` field on
// `order.items[]`) — the vendor `add-return-items` route accepts those.
let selectedLineItemIds: string[] = []

// Shipping option row shape returned by `sdk.vendor.shippingOptions.query`.
type ShippingOptionRow = {
  id: string
  name: string
  service_zone?: {
    fulfillment_set?: {
      location?: { id?: string } | null
    } | null
  } | null
  rules?: Array<{ attribute: string; value: string }>
}

// Stock location row returned by `sdk.vendor.stockLocations.query`.
type StockLocationRow = {
  id: string
  name: string
}

// Preview line item action shape (admin's `AdminOrderChangeAction` lives
// under preview items). Kept narrow to avoid pulling Medusa types we
// don't strictly need.
type PreviewAction = {
  id: string
  action: string
  return_id?: string | null
  internal_note?: string | null
  details?: { reason_id?: string; quantity?: number } | null
}

export const ReturnCreateForm = ({
  order,
  preview,
  activeReturn,
}: ReturnCreateFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const itemsMap = useMemo(
    () => new Map((order.items || []).map((i) => [i.id, i])),
    [order.items]
  )

  /**
   * Only consider items that belong to this return.
   */
  const previewItems = useMemo(
    () =>
      preview.items.filter(
        (i) =>
          !!(i.actions as PreviewAction[] | undefined)?.find(
            (a) => a.return_id === activeReturn.id
          )
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [preview.items, activeReturn.id]
  )

  const previewItemsMap = useMemo(
    () => new Map(previewItems.map((i) => [i.id, i])),
    [previewItems]
  )

  /**
   * STATE
   */
  const { setIsOpen } = useStackedModal()
  const [isShippingPriceEdit, setIsShippingPriceEdit] = useState(false)
  const [customShippingAmount, setCustomShippingAmount] = useState<{
    value: string
    float: number | null
  }>({
    value: "0",
    float: 0,
  })

  /**
   * HOOKS
   */
  const { stock_locations: stockLocations = [] } = useStockLocations({
    limit: 999,
  }) as { stock_locations?: StockLocationRow[] }
  const { shipping_options: shippingOptions = [] } = useShippingOptions({
    limit: 999,
    fields: "*prices,+service_zone.fulfillment_set.location.id",
  }) as { shipping_options?: ShippingOptionRow[] }

  /**
   * MUTATIONS
   */
  const { mutateAsync: confirmReturnRequest, isPending: isConfirming } =
    useConfirmReturnRequest(activeReturn.id, order.id)

  const { mutateAsync: cancelReturnRequest, isPending: isCanceling } =
    useCancelReturnRequest(activeReturn.id, order.id)
  const { mutateAsync: updateReturnRequest, isPending: isUpdating } =
    useUpdateReturn(activeReturn.id, order.id)

  const { mutateAsync: addReturnShipping, isPending: isAddingReturnShipping } =
    useAddReturnShipping(activeReturn.id, order.id)

  const {
    mutateAsync: updateReturnShipping,
    isPending: isUpdatingReturnShipping,
  } = useUpdateReturnShipping(activeReturn.id, order.id)

  const {
    mutateAsync: deleteReturnShipping,
    isPending: isDeletingReturnShipping,
  } = useDeleteReturnShipping(activeReturn.id, order.id)

  const { mutateAsync: addReturnItem, isPending: isAddingReturnItem } =
    useAddReturnItem(activeReturn.id, order.id)

  const { mutateAsync: removeReturnItem, isPending: isRemovingReturnItem } =
    useRemoveReturnItem(activeReturn.id, order.id)

  const { mutateAsync: updateReturnItem, isPending: isUpdatingReturnItem } =
    useUpdateReturnItem(activeReturn.id, order.id)

  const isRequestLoading =
    isConfirming ||
    isCanceling ||
    isAddingReturnShipping ||
    isUpdatingReturnShipping ||
    isDeletingReturnShipping ||
    isAddingReturnItem ||
    isRemovingReturnItem ||
    isUpdatingReturnItem ||
    isUpdating

  /**
   * FORM
   */
  const form = useForm<ReturnCreateSchemaType>({
    defaultValues: () => {
      const method = preview.shipping_methods.find(
        (s) =>
          !!(s.actions as PreviewAction[] | undefined)?.find(
            (a) => a.action === "SHIPPING_ADD"
          )
      )

      return Promise.resolve({
        items: previewItems.map((i) => {
          const actions = (i.actions as PreviewAction[] | undefined) ?? []
          const returnAction = actions.find((a) => a.action === "RETURN_ITEM")
          return {
            item_id: i.id,
            quantity: i.detail.return_requested_quantity,
            note: returnAction?.internal_note ?? undefined,
            reason_id: returnAction?.details?.reason_id,
          }
        }),
        option_id: method ? method.shipping_option_id ?? "" : "",
        location_id: activeReturn?.location_id ?? undefined,
        send_notification: false,
      })
    },
    resolver: zodResolver(ReturnCreateSchema),
  })

  const {
    fields: items,
    append,
    remove,
    update,
  } = useFieldArray({
    name: "items",
    control: form.control,
  })

  // Keep the field array synced with the preview state — items removed
  // on the backend (`removeReturnItem`) drop off the form; quantity and
  // reason changes coming back from the preview overwrite the local
  // value. Mirrors admin.
  useEffect(() => {
    const existingItemsMap: Record<string, boolean> = {}

    previewItems.forEach((i) => {
      const ind = items.findIndex((field) => field.item_id === i.id)

      if (!i.detail.return_requested_quantity) {
        return
      }

      existingItemsMap[i.id] = true

      if (ind > -1) {
        if (items[ind].quantity !== i.detail.return_requested_quantity) {
          const actions = (i.actions as PreviewAction[] | undefined) ?? []
          const returnItemAction = actions.find(
            (a) => a.action === "RETURN_ITEM"
          )

          update(ind, {
            ...items[ind],
            quantity: i.detail.return_requested_quantity,
            note: returnItemAction?.internal_note ?? undefined,
            reason_id: returnItemAction?.details?.reason_id,
          })
        }
      } else {
        append({
          item_id: i.id,
          quantity: i.detail.return_requested_quantity,
        })
      }
    })

    items.forEach((i, ind) => {
      if (!(i.item_id in existingItemsMap)) {
        remove(ind)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewItems])

  useEffect(() => {
    const method = preview.shipping_methods?.find(
      (s) =>
        !!(s.actions as PreviewAction[] | undefined)?.find(
          (a) => a.action === "SHIPPING_ADD"
        )
    )

    if (method) {
      form.setValue("option_id", method.shipping_option_id ?? "")
    } else {
      form.setValue("option_id", "")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview.shipping_methods])

  useEffect(() => {
    form.setValue("location_id", activeReturn?.location_id || "")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeReturn])

  useEffect(() => {
    if (isShippingPriceEdit) {
      document.getElementById("js-shipping-input")?.focus()
    }
  }, [isShippingPriceEdit])

  const showPlaceholder = !items.length
  const locationId = form.watch("location_id")
  const shippingOptionId = form.watch("option_id")
  const prompt = usePrompt()

  const locationName = useMemo(() => {
    if (!locationId) return null
    return stockLocations.find((l) => l.id === locationId)?.name ?? null
  }, [locationId, stockLocations])

  const returnTotal = (preview as { return_requested_total?: number })
    .return_requested_total

  const shippingTotal = useMemo(() => {
    const method = preview.shipping_methods.find(
      (sm) =>
        !!(sm.actions as PreviewAction[] | undefined)?.find(
          (a) => a.action === "SHIPPING_ADD"
        )
    )

    return (method as { total?: number } | undefined)?.total || 0
  }, [preview.shipping_methods])

  /**
   * For the estimated difference show the pending difference and subtract
   * the total of inbound items (assume all items will be returned
   * correctly). We don't include the inbound total in the pending
   * difference because it is only considered returned once the receive
   * flow is completed. Mirrors admin.
   */
  const estimatedDifference =
    ((preview.summary?.pending_difference as number) || 0) -
    previewItems.reduce(
      (acc, item) => acc + ((item as { total?: number }).total ?? 0),
      0
    )

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      const res = await prompt({
        title: t("general.areYouSure"),
        description: t("orders.returns.confirmText"),
        confirmText: t("actions.continue"),
        cancelText: t("actions.cancel"),
        variant: "confirmation",
      })

      if (!res) {
        return
      }

      await confirmReturnRequest({ no_notification: !data.send_notification })

      toast.success(t("orders.returns.toast.confirmedSuccessfully"))
      handleSuccess(`/orders/${order.id}`)
    } catch (e) {
      toast.error(t("general.error"), {
        description: e instanceof Error ? e.message : undefined,
      })
    }
  })

  const onItemsSelected = async () => {
    // Skip ids that are already on the draft (the picker shows them as
    // pre-selected; the user may have just clicked Save without changing
    // anything). Sending duplicates would 4xx out of the workflow.
    const existingIds = new Set(items.map((i) => i.item_id))
    const newIds = selectedLineItemIds.filter((id) => !existingIds.has(id))

    if (newIds.length === 0) {
      setIsOpen("items", false)
      return
    }
    try {
      // The vendor `add-return-items` route validator requires `items[].id`
      // to be an **order line item id** from the order being returned —
      // see `VendorPostReturnsRequestItemsReq`. Default qty=1; the user
      // can adjust per-line afterwards in the main form.
      await addReturnItem({
        items: newIds.map((id) => ({
          id,
          quantity: 1,
        })),
      })
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : t("errorBoundary.defaultTitle")
      )
    } finally {
      selectedLineItemIds = []
      setIsOpen("items", false)
    }
  }

  const onLocationChange = async (selectedLocationId: string) => {
    await updateReturnRequest({ location_id: selectedLocationId })
  }

  const onShippingOptionChange = async (
    selectedOptionId: string | undefined
  ) => {
    const promises = preview.shipping_methods
      .map(
        (s) =>
          (s.actions as PreviewAction[] | undefined)?.find(
            (a) => a.action === "SHIPPING_ADD"
          )?.id
      )
      .filter((id): id is string => !!id)
      .map((id) => deleteReturnShipping(id))

    await Promise.all(promises)

    if (selectedOptionId) {
      await addReturnShipping({ shipping_option_id: selectedOptionId })
    }
  }

  return (
    <RouteFocusModal.Form
      form={form}
      onClose={(isSubmitSuccessful) => {
        if (!isSubmitSuccessful) {
          cancelReturnRequest()
        }
      }}
    >
      <KeyboundForm onSubmit={handleSubmit} className="flex h-full flex-col">
        <RouteFocusModal.Header />
        <RouteFocusModal.Body className="flex size-full justify-center overflow-y-auto">
          <div className="mt-16 w-[720px] max-w-[100%] px-4 md:p-0">
            <Heading level="h1">{t("orders.returns.create")}</Heading>

            {/* Vendor-only: hard-coded policy hint surfaced near the top
                so sellers know the MVP 30-day window before they confirm. */}
            <Text size="small" className="text-ui-fg-subtle mt-2">
              {t("orders.returns.policyHint", { days: RETURN_POLICY_DAYS })}
            </Text>

            <div className="mt-8 flex items-center justify-between">
              <Heading level="h2">{t("orders.returns.inbound")}</Heading>
              <StackedFocusModal id="items">
                <StackedFocusModal.Trigger asChild>
                  <a
                    className="focus-visible:shadow-borders-focus transition-fg txt-compact-small-plus cursor-pointer text-blue-500 outline-none hover:text-blue-400"
                    data-testid="return-create-add-items-trigger"
                  >
                    {t("actions.addItems")}
                  </a>
                </StackedFocusModal.Trigger>
                <StackedFocusModal.Content>
                  <StackedFocusModal.Header />
                  <StackedFocusModal.Title asChild>
                    <span className="sr-only">
                      {t("actions.addItems")}
                    </span>
                  </StackedFocusModal.Title>
                  <StackedFocusModal.Description className="sr-only">
                    {t("orders.returns.create")}
                  </StackedFocusModal.Description>
                  <StackedFocusModal.Body className="size-full overflow-hidden">
                    <AddReturnItemsTable
                      order={order}
                      selectedItems={items.map((i) => i.item_id)}
                      onSelectionChange={(s) => (selectedLineItemIds = s)}
                    />
                  </StackedFocusModal.Body>
                  <StackedFocusModal.Footer>
                    <div className="flex w-full items-center justify-end gap-x-4">
                      <div className="flex items-center justify-end gap-x-2">
                        <StackedFocusModal.Close asChild>
                          <Button
                            type="button"
                            variant="secondary"
                            size="small"
                            data-testid="return-create-add-items-cancel"
                          >
                            {t("actions.cancel")}
                          </Button>
                        </StackedFocusModal.Close>
                        <Button
                          key="submit-button"
                          type="button"
                          variant="primary"
                          size="small"
                          role="button"
                          onClick={onItemsSelected}
                          data-testid="return-create-add-items-save"
                        >
                          {t("actions.save")}
                        </Button>
                      </div>
                    </div>
                  </StackedFocusModal.Footer>
                </StackedFocusModal.Content>
              </StackedFocusModal>
            </div>

            {showPlaceholder && (
              <div
                style={{
                  background:
                    "repeating-linear-gradient(-45deg, rgb(212, 212, 216, 0.15), rgb(212, 212, 216,.15) 10px, transparent 10px, transparent 20px)",
                }}
                className="bg-ui-bg-field mt-4 block h-[56px] w-full rounded-lg border border-dashed"
              />
            )}

            {items
              .filter((item) => !!previewItemsMap.get(item.item_id))
              .map((item, index) => {
                const previewItem = previewItemsMap.get(item.item_id)
                if (!previewItem) {
                  return null
                }
                const orderItem = itemsMap.get(item.item_id)
                if (!orderItem) {
                  return null
                }
                return (
                  <ReturnItem
                    key={item.id}
                    item={orderItem}
                    previewItem={previewItem}
                    currencyCode={order.currency_code}
                    form={form}
                    locationId={locationId}
                    locationName={locationName}
                    onRemove={() => {
                      const actions =
                        (previewItems.find((i) => i.id === item.item_id)
                          ?.actions as PreviewAction[] | undefined) ?? []
                      const actionId = actions.find(
                        (a) => a.action === "RETURN_ITEM"
                      )?.id

                      if (actionId) {
                        removeReturnItem(actionId)
                      }
                    }}
                    onUpdate={(payload) => {
                      const actions =
                        (previewItems.find((i) => i.id === item.item_id)
                          ?.actions as PreviewAction[] | undefined) ?? []
                      const action = actions.find(
                        (a) => a.action === "RETURN_ITEM"
                      )

                      if (action) {
                        updateReturnItem(
                          { actionId: action.id, ...payload },
                          {
                            onError: (error) => {
                              if (
                                action.details?.quantity &&
                                payload.quantity
                              ) {
                                form.setValue(
                                  `items.${index}.quantity`,
                                  action.details.quantity
                                )
                              }
                              toast.error(error.message)
                            },
                          }
                        )
                      }
                    }}
                    index={index}
                  />
                )
              })}

            {!showPlaceholder && (
              <div className="mt-8 flex flex-col gap-y-4">
                {/* LOCATION */}
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <div>
                    <Form.Label>{t("orders.returns.location")}</Form.Label>
                    <Form.Hint className="!mt-1">
                      {t("orders.returns.locationHint")}
                    </Form.Hint>
                  </div>

                  <Form.Field
                    control={form.control}
                    name="location_id"
                    render={({ field: { value, onChange, ...field } }) => {
                      return (
                        <Form.Item>
                          <Form.Control>
                            <Combobox
                              value={value ?? undefined}
                              onChange={(v) => {
                                onChange(v)
                                onLocationChange(v ?? "")
                              }}
                              {...field}
                              options={(stockLocations ?? []).map(
                                (loc) => ({
                                  label: loc.name,
                                  value: loc.id,
                                })
                              )}
                              data-testid="return-create-location"
                            />
                          </Form.Control>
                        </Form.Item>
                      )
                    }}
                  />
                </div>

                {/* INBOUND SHIPPING */}
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <div>
                    <Form.Label>
                      {t("orders.returns.inboundShipping")}
                      <Text
                        size="small"
                        leading="compact"
                        className="text-ui-fg-muted ml-1 inline"
                      >
                        ({t("fields.optional")})
                      </Text>
                    </Form.Label>

                    <Form.Hint className="!mt-1">
                      {t("orders.returns.inboundShippingHint")}
                    </Form.Hint>
                  </div>

                  <Form.Field
                    control={form.control}
                    name="option_id"
                    render={({ field: { value, onChange, ...field } }) => {
                      return (
                        <Form.Item>
                          <Form.Control>
                            <Combobox
                              allowClear
                              value={value}
                              onChange={(v) => {
                                onChange(v ?? "")
                                onShippingOptionChange(v)
                              }}
                              {...field}
                              options={(shippingOptions ?? [])
                                .filter(
                                  (so) =>
                                    (locationId
                                      ? so.service_zone?.fulfillment_set
                                          ?.location?.id === locationId
                                      : true) &&
                                    !!so.rules?.find(
                                      (r) =>
                                        r.attribute === "is_return" &&
                                        r.value === "true"
                                    )
                                )
                                .map((so) => ({
                                  label: so.name,
                                  value: so.id,
                                }))}
                              disabled={!locationId}
                              noResultsPlaceholder={
                                <ReturnShippingPlaceholder />
                              }
                              data-testid="return-create-shipping-option"
                            />
                          </Form.Control>
                        </Form.Item>
                      )
                    }}
                  />
                </div>
              </div>
            )}

            {/* TOTALS SECTION */}
            <div className="mt-8 border-y border-dotted py-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="txt-small text-ui-fg-subtle">
                  {t("orders.returns.returnTotal")}
                </span>
                <span className="txt-small text-ui-fg-subtle">
                  {getStylizedAmount(
                    returnTotal ? -1 * returnTotal : returnTotal ?? 0,
                    order.currency_code
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="txt-small text-ui-fg-subtle">
                  {t("orders.returns.inboundShipping")}
                </span>
                <span className="txt-small text-ui-fg-subtle flex items-center">
                  {!isShippingPriceEdit && (
                    <IconButton
                      onClick={() => setIsShippingPriceEdit(true)}
                      variant="transparent"
                      className="text-ui-fg-muted"
                      disabled={showPlaceholder || !shippingOptionId}
                    >
                      <PencilSquare />
                    </IconButton>
                  )}
                  {isShippingPriceEdit ? (
                    <CurrencyInput
                      id="js-shipping-input"
                      onBlur={() => {
                        let actionId: string | undefined

                        preview.shipping_methods.forEach((s) => {
                          const actions = s.actions as
                            | PreviewAction[]
                            | undefined
                          if (actions) {
                            for (const a of actions) {
                              if (a.action === "SHIPPING_ADD") {
                                actionId = a.id
                              }
                            }
                          }
                        })

                        if (actionId) {
                          updateReturnShipping({
                            actionId,
                            custom_amount:
                              customShippingAmount.float ?? undefined,
                          })
                        }
                        setIsShippingPriceEdit(false)
                      }}
                      symbol={
                        currencies[order.currency_code.toUpperCase()]
                          ?.symbol_native ?? ""
                      }
                      code={order.currency_code}
                      onValueChange={(_value, _name, values) =>
                        setCustomShippingAmount({
                          value: values?.value ?? "",
                          float: values?.float ?? null,
                        })
                      }
                      value={customShippingAmount.value}
                      disabled={showPlaceholder}
                    />
                  ) : (
                    getStylizedAmount(shippingTotal, order.currency_code)
                  )}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-dotted pt-4">
                <span className="txt-small font-medium">
                  {t("orders.returns.estDifference")}
                </span>
                <span className="txt-small font-medium">
                  {getStylizedAmount(estimatedDifference, order.currency_code)}
                </span>
              </div>
            </div>

            {/* SEND NOTIFICATION */}
            <div className="bg-ui-bg-field mt-8 rounded-lg border py-2 pl-2 pr-4">
              <Form.Field
                control={form.control}
                name="send_notification"
                render={({ field: { onChange, value, ...field } }) => {
                  return (
                    <Form.Item>
                      <div className="flex items-center">
                        <Form.Control className="mr-4 self-start">
                          <Switch
                            dir="ltr"
                            className="mt-[2px] rtl:rotate-180"
                            checked={!!value}
                            onCheckedChange={onChange}
                            {...field}
                            data-testid="return-create-notify"
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
                  )
                }}
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
                  variant="secondary"
                  size="small"
                  data-testid="return-create-cancel"
                >
                  {t("orders.returns.cancel.title")}
                </Button>
              </RouteFocusModal.Close>
              <Button
                key="submit-button"
                type="submit"
                variant="primary"
                size="small"
                isLoading={isRequestLoading}
                data-testid="return-create-confirm"
              >
                {t("orders.returns.confirm")}
              </Button>
            </div>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}
