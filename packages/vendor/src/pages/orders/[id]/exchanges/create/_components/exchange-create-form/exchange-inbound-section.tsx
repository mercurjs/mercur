import { HttpTypes } from "@medusajs/types"
import { Button, Heading, Text, toast } from "@medusajs/ui"
import { useEffect, useMemo } from "react"
import { useFieldArray, UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Form } from "@components/common/form"
import { Combobox } from "@components/inputs/combobox"
import {
  RouteFocusModal,
  StackedFocusModal,
  useStackedModal,
} from "@components/modals"
import {
  useAddExchangeInboundItems,
  useAddExchangeInboundShipping,
  useRemoveExchangeInboundItem,
  useUpdateExchangeInboundItem,
} from "@hooks/api/exchanges"
import { useShippingOptions } from "@hooks/api/shipping-options"
import { useStockLocations } from "@hooks/api/stock-locations"

import { AddExchangeInboundItemsTable } from "../add-exchange-inbound-items-table"
import { ItemPlaceholder } from "../../../../claims/create/_components/claim-create-form/item-placeholder"
import { ExchangeInboundItem } from "./exchange-inbound-item"
import { CreateExchangeSchemaType } from "./schema"

// `AdminOrderPreview` isn't exported as a named type from the Mercur
// `@medusajs/types` build (2.13.4). Inline the shape we read here.
type ExchangePreview = {
  order_change?: { return_id?: string | null } | null
  items?: Array<{
    id: string
    variant_id?: string | null
    detail?: {
      return_requested_quantity?: number
      quantity?: number
    }
    actions?: Array<{
      id?: string
      action?: string
      exchange_id?: string | null
      return_id?: string | null
      internal_note?: string | null
      details?: { reason_id?: string; quantity?: number } | null
    }>
    return_requested_total?: number
    adjustments?: Array<{ code?: string | null }>
  }>
  shipping_methods?: Array<{
    shipping_option_id?: string | null
    actions?: Array<{
      id?: string
      action?: string
      return_id?: string | null
    }>
  }>
}

type ExchangeInboundSectionProps = {
  order: HttpTypes.AdminOrder
  orderReturn?: { location_id?: string | null }
  exchange: { id: string }
  preview: ExchangePreview
  form: UseFormReturn<CreateExchangeSchemaType>
}

// Module-scoped scratch matches admin's pattern: the StackedFocusModal
// callbacks mutate these between Open and Save without re-rendering the
// section. Cleared on Save.
let itemsToAdd: string[] = []
let itemsToRemove: string[] = []

/**
 * Vendor port of admin's `ExchangeInboundSection`. Hosts the "Items to
 * return" picker, the inbound items list, location + return shipping
 * selectors. The shape mirrors admin one-for-one so the parent
 * `ExchangeCreateForm` can render `<ExchangeInboundSection form={form} />`
 * exactly the way admin does.
 *
 * Vendor adaptations:
 *  - `sdk.vendor.*` hooks (`useAddExchangeInboundItems`,
 *    `useRemoveExchangeInboundItem`, `useUpdateExchangeInboundItem`,
 *    `useAddExchangeInboundShipping`).
 *  - No `useDeleteExchangeInboundShipping` / `useUpdateReturn` in the
 *    vendor surface yet — shipping option changes just call add and let
 *    the backend pick the most recent action; location changes only set
 *    the form value (`useUpdateReturn` is admin-only).
 *  - No variant-level inventory map (admin queries
 *    `sdk.admin.productVariant.list` which doesn't exist on the vendor
 *    SDK). The per-item restock preview lives on `ExchangeInboundItem`
 *    via Mercur's offer-aware `getOfferRestockPreview`.
 *  - Currency-aware offer picker: the inbound picker still reuses
 *    `AddExchangeInboundItemsTable` which already takes `currencyCode`.
 */
export const ExchangeInboundSection = ({
  order,
  preview,
  exchange,
  form,
  orderReturn,
}: ExchangeInboundSectionProps) => {
  const { t } = useTranslation()

  const { setIsOpen } = useStackedModal()

  const { mutateAsync: addInboundShipping } = useAddExchangeInboundShipping(
    exchange.id,
    order.id
  )

  const { mutateAsync: addInboundItem } = useAddExchangeInboundItems(
    exchange.id,
    order.id
  )

  const { mutateAsync: updateInboundItem } = useUpdateExchangeInboundItem(
    exchange.id,
    order.id
  )

  const { mutateAsync: removeInboundItem } = useRemoveExchangeInboundItem(
    exchange.id,
    order.id
  )

  /**
   * Only consider items that belong to this exchange.
   */
  const previewInboundItems = useMemo(
    () =>
      (preview?.items ?? []).filter(
        (i) => !!i.actions?.find((a) => a.exchange_id === exchange.id)
      ),
    [preview.items, exchange.id]
  )

  const inboundPreviewItems = previewInboundItems.filter(
    (item) => !!item.actions?.find((a) => a.action === "RETURN_ITEM")
  )

  const itemsMap = useMemo(
    () => new Map((order?.items ?? []).map((i) => [i.id, i])),
    [order.items]
  )

  const locationId = form.watch("location_id")

  const { stock_locations: stock_locations = [] } = useStockLocations({
    limit: 999,
  } as never)
  // Vendor's typed `useShippingOptions` overload requires a `queryKey` in
  // the options object — `enabled` alone is rejected. Cast through the
  // existing parameter shape to keep the call site readable.
  const { shipping_options: shipping_options = [] } = useShippingOptions(
    {
      limit: 999,
      stock_location_id: locationId,
    } as never,
    { enabled: !!locationId } as unknown as Parameters<
      typeof useShippingOptions
    >[1]
  )

  const inboundShippingOptions = (shipping_options as Array<{
    id: string
    name: string
    rules?: Array<{ attribute: string; value: string }>
  }>).filter(
    (shippingOption) =>
      !!shippingOption.rules?.find(
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

  const inboundItemsMap = useMemo(
    () => new Map(previewInboundItems.map((i) => [i.id, i])),
    [previewInboundItems, inboundItems]
  )

  // Reconcile RHF field array with the change-preview items the server
  // currently knows about. Mirrors admin's effect verbatim.
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
            note: returnItemAction?.internal_note ?? undefined,
            reason_id: returnItemAction?.details?.reason_id,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewInboundItems])

  useEffect(() => {
    const inboundShippingMethod = (preview.shipping_methods ?? []).find((s) =>
      s.actions?.find((a) => a.action === "SHIPPING_ADD" && !!a.return_id)
    )

    if (inboundShippingMethod?.shipping_option_id) {
      form.setValue("inbound_option_id", inboundShippingMethod.shipping_option_id)
    } else {
      form.setValue("inbound_option_id", "")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview.shipping_methods])

  useEffect(() => {
    if (orderReturn?.location_id) {
      form.setValue("location_id", orderReturn.location_id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderReturn])

  const showInboundItemsPlaceholder = !inboundItems.length

  const onItemsSelected = async () => {
    if (itemsToAdd.length) {
      await addInboundItem(
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
      )
    }

    for (const itemToRemove of itemsToRemove) {
      const actionId = previewInboundItems
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

  // Vendor: `useUpdateReturn` isn't exposed here. Location changes only
  // mutate the form — the parent `ExchangeCreateForm` passes
  // `location_id` to `addInboundItems` on confirm, so the server picks it
  // up at request time.
  const onLocationChange = (_selectedLocationId?: string | null) => {
    /* no-op for vendor — admin parity preserved at the form level */
  }

  // Vendor doesn't have `useDeleteExchangeInboundShipping`; the backend
  // overwrites the previous SHIPPING_ADD action when a new one is added,
  // so we just call add. Errors surface via toast.
  const onShippingOptionChange = async (
    selectedOptionId: string | undefined
  ) => {
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

  return (
    <div>
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

            <AddExchangeInboundItemsTable
              items={order.items ?? []}
              selectedItems={inboundItems.map((i) => i.item_id)}
              currencyCode={order.currency_code}
              onSelectionChange={(finalSelection) => {
                const alreadySelected = inboundItems.map((i) => i.item_id)

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
                    <Button type="button" variant="secondary" size="small">
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

      {inboundItems.map((item, index) => {
        const previewItem = inboundItemsMap.get(item.item_id)
        const sourceItem = itemsMap.get(item.item_id)
        if (!previewItem || !sourceItem) {
          return null
        }
        const locationName =
          (stock_locations as Array<{ id: string; name: string }>).find(
            (l) => l.id === locationId
          )?.name ?? null

        return (
          <ExchangeInboundItem
            key={item.id}
            item={sourceItem}
            previewItem={previewItem}
            currencyCode={order.currency_code}
            form={form}
            locationName={locationName}
            onRemove={() => {
              const actionId = previewInboundItems
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
              const action = previewInboundItems
                .find((i) => i.id === item.item_id)
                ?.actions?.find((a) => a.action === "RETURN_ITEM")

              if (action?.id) {
                updateInboundItem(
                  { $actionId: action.id, ...payload } as never,
                  {
                    onError: (error) => {
                      if (action.details?.quantity && payload.quantity) {
                        form.setValue(
                          `inbound_items.${index}.quantity`,
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
                        options={(
                          stock_locations as Array<{ id: string; name: string }>
                        ).map((stockLocation) => ({
                          label: stockLocation.name,
                          value: stockLocation.id,
                        }))}
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
                        options={inboundShippingOptions.map((so) => ({
                          label: so.name,
                          value: so.id,
                        }))}
                        disabled={!locationId}
                      />
                    </Form.Control>
                  </Form.Item>
                )
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
