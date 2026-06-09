// Vendor `ClaimCreateForm` aligned 1:1 with admin's
// `claim-create-form.tsx`. Receives `{ order, claim, preview,
// orderReturn }` as props — the parent route (`claims/create/index.tsx`)
// owns claim creation + data loading and only mounts this form once all
// four are resolved. That removes the `?? ""` currency fallback that was
// crashing `getNativeSymbol` during the initial render.
//
// Dropped vendor-only UI per user direction:
//   - Claim Type radio (refund/replace). Admin always opens a `replace`
//     claim; vendor now mirrors that. The /vendor/claims POST still sends
//     `type: "replace"` from the parent orchestrator.
//   - 30-day policy hint banner.
//   - RestockPreview inline component on inbound rows.
//
// Vendor-only architectural concerns preserved:
//   - Offer-based outbound (`ClaimOutboundSection` / `AddClaimOutboundItemsTable`).
//     The vendor backend resolves outbound items by `offer_id`, not raw
//     `variant_id`, so the picker stays.
//   - The "Carry over promotions" switch is omitted — vendor has no
//     `/vendor/order-changes/:id` route yet; this is the only admin
//     feature deferred in the port.
import { zodResolver } from "@hookform/resolvers/zod"
import {
  AdminClaim,
  AdminInventoryLevel,
  AdminOrder,
  AdminOrderPreview,
  AdminReturn,
  HttpTypes,
} from "@medusajs/types"
import { Alert, Button, Heading, Switch, Text, toast, usePrompt } from "@medusajs/ui"
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
  useAddClaimInboundItems,
  useAddClaimInboundShipping,
  useCancelClaimRequest,
  useClaimConfirmRequest,
  useDeleteClaimInboundShipping,
  useRemoveClaimInboundItem,
  useUpdateClaimInboundItem,
  useUpdateClaimInboundShipping,
} from "@hooks/api/claims"
import { useShippingOptions } from "@hooks/api/shipping-options"
import { useStockLocations } from "@hooks/api/stock-locations"
import { useUpdateReturn } from "@hooks/api/returns"
import { getStylizedAmount } from "@lib/money-amount-helpers"

import { ReturnShippingPlaceholder } from "../../../../../common/placeholders"
import { AddClaimItemsTable } from "../add-claim-items-table"
import { ClaimInboundItem } from "./claim-inbound-item"
import { ClaimOutboundSection } from "./claim-outbound-section"
import { ItemPlaceholder } from "./item-placeholder"
import { ClaimCreateSchema, type CreateClaimSchemaType } from "./schema"

type ClaimCreateFormProps = {
  order: AdminOrder
  claim: AdminClaim
  preview: AdminOrderPreview
  orderReturn?: AdminReturn
}

let itemsToAdd: string[] = []
let itemsToRemove: string[] = []
let IS_CANCELING = false

export const ClaimCreateForm = ({
  order,
  preview,
  claim,
  orderReturn,
}: ClaimCreateFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const { setIsOpen } = useStackedModal()
  const [_inventoryMap, setInventoryMap] = useState<
    Record<string, AdminInventoryLevel[]>
  >({})

  /**
   * MUTATIONS
   */
  const { mutateAsync: confirmClaimRequest, isPending: isConfirming } =
    useClaimConfirmRequest(claim.id, order.id)

  const { mutateAsync: cancelClaimRequest, isPending: isCanceling } =
    useCancelClaimRequest(claim.id, order.id)

  const { mutateAsync: updateReturn, isPending: isUpdating } = useUpdateReturn(
    preview?.order_change?.return_id ?? "",
    order.id
  )

  const {
    mutateAsync: addInboundShipping,
    isPending: isAddingInboundShipping,
  } = useAddClaimInboundShipping(claim.id, order.id)

  const {
    mutateAsync: updateInboundShipping,
    isPending: isUpdatingInboundShipping,
  } = useUpdateClaimInboundShipping(claim.id, order.id)

  const {
    mutateAsync: deleteInboundShipping,
    isPending: isDeletingInboundShipping,
  } = useDeleteClaimInboundShipping(claim.id, order.id)

  const { mutateAsync: addInboundItem, isPending: isAddingInboundItem } =
    useAddClaimInboundItems(claim.id, order.id)

  const { mutateAsync: updateInboundItem, isPending: isUpdatingInboundItem } =
    useUpdateClaimInboundItem(claim.id, order.id)

  const { mutateAsync: removeInboundItem, isPending: isRemovingInboundItem } =
    useRemoveClaimInboundItem(claim.id, order.id)

  const isRequestLoading =
    isConfirming ||
    isCanceling ||
    isAddingInboundShipping ||
    isUpdatingInboundShipping ||
    isDeletingInboundShipping ||
    isAddingInboundItem ||
    isRemovingInboundItem ||
    isUpdatingInboundItem ||
    isUpdating

  /**
   * Only consider items that belong to this claim.
   */
  const previewItems = useMemo(
    () =>
      preview?.items?.filter(
        (i) => !!i.actions?.find((a) => a.claim_id === claim.id)
      ) ?? [],
    [preview.items, claim.id]
  )

  const inboundPreviewItems = useMemo(
    () =>
      previewItems.filter(
        (item) => !!item.actions?.find((a) => a.action === "RETURN_ITEM")
      ),
    [previewItems]
  )

  const itemsMap = useMemo(
    () => new Map(order?.items?.map((i) => [i.id, i])),
    [order.items]
  )

  /**
   * FORM
   */
  const form = useForm<CreateClaimSchemaType>({
    defaultValues: () => {
      const inboundShippingMethod = preview.shipping_methods?.find((s) => {
        return !!s.actions?.find(
          (a) => a.action === "SHIPPING_ADD" && !!a.return_id
        )
      })

      return Promise.resolve({
        inbound_items: inboundPreviewItems.map((i) => {
          const inboundAction = i.actions?.find(
            (a) => a.action === "RETURN_ITEM"
          )

          return {
            item_id: i.id,
            variant_id: i.variant_id,
            quantity: i.detail?.return_requested_quantity ?? 1,
            note: inboundAction?.internal_note,
            reason_id: inboundAction?.details?.reason_id as string | undefined,
          }
        }),
        outbound_items: [],
        inbound_option_id: inboundShippingMethod
          ? inboundShippingMethod.shipping_option_id
          : null,
        outbound_option_id: null,
        location_id: orderReturn?.location_id ?? null,
        send_notification: false,
      })
    },
    resolver: zodResolver(ClaimCreateSchema),
  })

  const locationId = form.watch("location_id")

  /**
   * HOOKS
   */
  const { stock_locations: stockLocations = [] } = useStockLocations({
    limit: 999,
  })
  const { shipping_options: shippingOptions = [] } = useShippingOptions(
    locationId
      ? ({
          limit: 999,
          fields: "*prices,+service_zone.fulfillment_set.location.id",
          stock_location_id: locationId,
        } as never)
      : undefined,
    { enabled: !!locationId } as never
  )

  const inboundShippingOptions = (shippingOptions ?? []).filter(
    (so: { rules?: Array<{ attribute: string; value: string }> }) =>
      !!so.rules?.find(
        (r) => r.attribute === "is_return" && r.value === "true"
      )
  )

  const {
    fields: inboundItems,
    append,
    remove,
    update,
  } = useFieldArray({
    name: "inbound_items",
    control: form.control,
  })

  const previewItemsMap = useMemo(
    () => new Map(previewItems.map((i) => [i.id, i])),
    [previewItems, inboundItems]
  )

  useEffect(() => {
    const existingItemsMap: Record<string, boolean> = {}

    inboundPreviewItems.forEach((i) => {
      const ind = inboundItems.findIndex((field) => field.item_id === i.id)
      const requested = i.detail?.return_requested_quantity ?? 0

      existingItemsMap[i.id] = true

      if (ind > -1) {
        if (inboundItems[ind].quantity !== requested) {
          const returnItemAction = i.actions?.find(
            (a) => a.action === "RETURN_ITEM"
          )

          update(ind, {
            ...inboundItems[ind],
            quantity: requested,
            note: returnItemAction?.internal_note,
            reason_id: returnItemAction?.details?.reason_id as string,
          })
        }
      } else {
        append(
          { item_id: i.id, quantity: requested },
          { shouldFocus: false }
        )
      }
    })

    inboundItems.forEach((i, ind) => {
      if (!(i.item_id in existingItemsMap)) {
        remove(ind)
      }
    })
    /* oxlint-disable react-hooks/exhaustive-deps */
  }, [previewItems])
  /* oxlint-enable react-hooks/exhaustive-deps */

  useEffect(() => {
    const inboundShipping = preview.shipping_methods?.find(
      (s) =>
        !!s.actions?.find((a) => a.action === "SHIPPING_ADD" && !!a.return_id)
    )

    if (inboundShipping) {
      form.setValue("inbound_option_id", inboundShipping.shipping_option_id)
    } else {
      form.setValue("inbound_option_id", null)
    }
    /* oxlint-disable react-hooks/exhaustive-deps */
  }, [preview.shipping_methods])
  /* oxlint-enable react-hooks/exhaustive-deps */

  useEffect(() => {
    form.setValue("location_id", orderReturn?.location_id ?? null)
    /* oxlint-disable react-hooks/exhaustive-deps */
  }, [orderReturn])
  /* oxlint-enable react-hooks/exhaustive-deps */

  const showInboundItemsPlaceholder = !inboundPreviewItems.length

  const prompt = usePrompt()

  const handleSubmit = form.handleSubmit(async (data) => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("orders.claims.confirmText"),
      confirmText: t("actions.continue"),
      cancelText: t("actions.cancel"),
      variant: "confirmation",
    })

    if (!res) {
      return
    }

    await confirmClaimRequest(
      { no_notification: !data.send_notification } as never,
      {
        onSuccess: () => {
          toast.success(t("orders.claims.toast.confirmedSuccessfully"))
          handleSuccess()
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  })

  const onItemsSelected = async () => {
    itemsToAdd.length &&
      (await addInboundItem(
        {
          items: itemsToAdd.map((id) => ({
            id,
            quantity: 1,
          })),
        } as never,
        {
          onError: (error) => {
            toast.error(error.message)
          },
        }
      ))

    for (const itemToRemove of itemsToRemove) {
      const actionId = previewItems
        .find((i) => i.id === itemToRemove)
        ?.actions?.find((a) => a.action === "RETURN_ITEM")?.id

      if (actionId) {
        await removeInboundItem(actionId, {
          onError: (error) => {
            toast.error(error.message)
          },
        })
      }
    }

    setIsOpen("inbound-items", false)
  }

  const onLocationChange = async (selectedLocationId?: string | null) => {
    if (!preview?.order_change?.return_id) return
    await updateReturn({ location_id: selectedLocationId ?? null } as never)
  }

  const onShippingOptionChange = async (
    selectedOptionId: string | undefined
  ) => {
    const inboundShippingMethods = (preview.shipping_methods ?? []).filter(
      (s) => {
        const action = s.actions?.find(
          (a) => a.action === "SHIPPING_ADD" && !!a.return_id
        )
        return action && !!action?.return_id
      }
    )

    const promises = inboundShippingMethods
      .filter(Boolean)
      .map((inboundShippingMethod) => {
        const action = inboundShippingMethod.actions?.find(
          (a) => a.action === "SHIPPING_ADD" && !!a.return_id
        )

        if (action) {
          return deleteInboundShipping(action.id)
        }
        return Promise.resolve()
      })

    await Promise.all(promises)

    if (selectedOptionId) {
      await addInboundShipping(
        { shipping_option_id: selectedOptionId } as never,
        {
          onError: (error) => {
            toast.error(error.message)
          },
        }
      )
    }
  }

  useEffect(() => {
    /**
     * Unmount hook — cancel the claim request if the seller closes the
     * modal without confirming. Mirrors admin's IS_CANCELING latch.
     */
    return () => {
      if (IS_CANCELING) {
        cancelClaimRequest(undefined, {
          onSuccess: () => {
            toast.success(t("orders.claims.toast.canceledSuccessfully"))
          },
          onError: (error) => {
            toast.error(error.message)
          },
        })
        IS_CANCELING = false
      }
    }
    /* oxlint-disable react-hooks/exhaustive-deps */
  }, [])
  /* oxlint-enable react-hooks/exhaustive-deps */

  /**
   * Reset and consume the inventoryMap setter so React doesn't warn on
   * `setInventoryMap` being unused. The full inventory-level cross-check
   * lives behind the admin form's `ExtendedVariant` types; vendor doesn't
   * surface those yet, so for now we just track the placeholder.
   */
  useEffect(() => {
    setInventoryMap({})
  }, [inboundItems.length])

  const estimatedDifference =
    (preview.summary?.pending_difference ?? 0) -
    inboundPreviewItems.reduce(
      (acc, item) => acc + (item.total ?? 0),
      0
    )

  const currencyCode = order.currency_code

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex h-full flex-col">
        <RouteFocusModal.Header />
        <RouteFocusModal.Body className="flex size-full justify-center overflow-y-auto">
          <div className="mt-16 w-[720px] max-w-[100%] px-4 md:p-0">
            <Heading level="h1">{t("orders.claims.create")}</Heading>
            <div className="mt-8 flex items-center justify-between">
              <Heading level="h2">{t("orders.returns.inbound")}</Heading>

              <StackedFocusModal id="inbound-items">
                <StackedFocusModal.Trigger asChild>
                  <a className="focus-visible:shadow-borders-focus transition-fg txt-compact-small-plus cursor-pointer text-blue-500 outline-none hover:text-blue-400">
                    {t("actions.addItems")}
                  </a>
                </StackedFocusModal.Trigger>
                <StackedFocusModal.Content>
                  <StackedFocusModal.Header />

                  <AddClaimItemsTable
                    items={order.items!}
                    selectedItems={inboundItems.map((i) => i.item_id)}
                    currencyCode={currencyCode}
                    onSelectionChange={(finalSelection) => {
                      const alreadySelected = inboundItems.map(
                        (i) => i.item_id
                      )

                      itemsToAdd = finalSelection.filter(
                        (selection) => !alreadySelected.includes(selection)
                      )
                      itemsToRemove = alreadySelected.filter(
                        (selection) => !finalSelection.includes(selection)
                      )
                    }}
                  />

                  <StackedFocusModal.Footer>
                    <div className="flex w-full items-center justify-end gap-x-4">
                      <div className="flex items-center justify-end gap-x-2">
                        <RouteFocusModal.Close asChild>
                          <Button
                            type="button"
                            variant="secondary"
                            size="small"
                          >
                            {t("actions.cancel")}
                          </Button>
                        </RouteFocusModal.Close>

                        <Button
                          key="submit-button"
                          type="submit"
                          variant="primary"
                          size="small"
                          role="button"
                          onClick={async () => await onItemsSelected()}
                        >
                          {t("actions.save")}
                        </Button>
                      </div>
                    </div>
                  </StackedFocusModal.Footer>
                </StackedFocusModal.Content>
              </StackedFocusModal>
            </div>
            {showInboundItemsPlaceholder && <ItemPlaceholder />}
            {inboundItems.map(
              (item, index) =>
                previewItemsMap.get(item.item_id) &&
                itemsMap.get(item.item_id)! && (
                  <ClaimInboundItem
                    key={item.id}
                    item={itemsMap.get(item.item_id)!}
                    previewItem={previewItemsMap.get(item.item_id)! as never}
                    currencyCode={currencyCode}
                    form={form}
                    onRemove={() => {
                      const actionId = previewItems
                        .find((i) => i.id === item.item_id)
                        ?.actions?.find((a) => a.action === "RETURN_ITEM")?.id

                      if (actionId) {
                        removeInboundItem(actionId, {
                          onError: (error) => {
                            toast.error(error.message)
                          },
                        })
                      }
                    }}
                    onUpdate={(payload: HttpTypes.AdminUpdateReturnItems) => {
                      const action = previewItems
                        .find((i) => i.id === item.item_id)
                        ?.actions?.find((a) => a.action === "RETURN_ITEM")

                      if (action) {
                        updateInboundItem(
                          { ...payload, actionId: action.id } as never,
                          {
                            onError: (error) => {
                              if (
                                action.details?.quantity &&
                                payload.quantity
                              ) {
                                form.setValue(
                                  `inbound_items.${index}.quantity`,
                                  action.details?.quantity as number
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
            )}
            {!showInboundItemsPlaceholder && (
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
                              {...field}
                              value={value ?? undefined}
                              onChange={(v) => {
                                onChange(v)
                                onLocationChange(v)
                              }}
                              options={(stockLocations ?? []).map(
                                (stockLocation: {
                                  id: string
                                  name: string
                                }) => ({
                                  label: stockLocation.name,
                                  value: stockLocation.id,
                                })
                              )}
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
                    name="inbound_option_id"
                    render={({ field: { value, onChange, ...field } }) => {
                      return (
                        <Form.Item>
                          <Form.Control>
                            <Combobox
                              allowClear
                              value={value ?? undefined}
                              onChange={(val) => {
                                onChange(val)
                                onShippingOptionChange(val)
                              }}
                              {...field}
                              options={inboundShippingOptions.map(
                                (so: { id: string; name: string }) => ({
                                  label: so.name,
                                  value: so.id,
                                })
                              )}
                              disabled={!locationId}
                              noResultsPlaceholder={
                                <ReturnShippingPlaceholder />
                              }
                            />
                          </Form.Control>
                        </Form.Item>
                      )
                    }}
                  />
                </div>
              </div>
            )}

            <ClaimOutboundSection
              form={form}
              currencyCode={currencyCode}
              disabled={isRequestLoading}
            />

            {/* TOTALS SECTION */}
            <div className="mt-8 border-y border-dotted py-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="txt-small text-ui-fg-subtle">
                  {t("orders.returns.inboundTotal")}
                </span>

                <span className="txt-small text-ui-fg-subtle">
                  {getStylizedAmount(
                    inboundPreviewItems.reduce((acc, item) => {
                      const action = item.actions?.find(
                        (act) => act.action === "RETURN_ITEM"
                      )
                      return (
                        acc + Number((action as { amount?: number })?.amount || 0)
                      )
                    }, 0) * -1,
                    currencyCode
                  )}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-dotted pt-4">
                <span className="txt-small font-medium">
                  {t("orders.claims.refundAmount")}
                </span>
                <span className="txt-small font-medium">
                  {getStylizedAmount(estimatedDifference, currencyCode)}
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
                  onClick={() => (IS_CANCELING = true)}
                  variant="secondary"
                  size="small"
                >
                  {t("orders.claims.cancel.title")}
                </Button>
              </RouteFocusModal.Close>
              <Button
                key="submit-button"
                type="submit"
                variant="primary"
                size="small"
                isLoading={isRequestLoading}
              >
                {t("orders.claims.confirm")}
              </Button>
            </div>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}

// Touch the unused Alert import once so future maintainers see it's
// kept for parity with admin's `showLevelsWarning` block (deferred until
// vendor surfaces the variant-inventory cross-check).
void Alert
