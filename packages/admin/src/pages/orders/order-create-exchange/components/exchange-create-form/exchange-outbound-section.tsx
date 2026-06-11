import {
  AdminExchange,
  AdminOrder,
  AdminOrderPreview,
} from "@medusajs/types"
import { Button, Heading, toast } from "@medusajs/ui"
import { useEffect, useMemo } from "react"
import { useFieldArray, UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Form } from "../../../../../components/common/form"
import { Combobox } from "../../../../../components/inputs/combobox"
import {
  RouteFocusModal,
  StackedFocusModal,
  useStackedModal,
} from "../../../../../components/modals"
import {
  useAddExchangeOutboundItems,
  useAddExchangeOutboundShipping,
  useDeleteExchangeOutboundShipping,
  useRemoveExchangeOutboundItem,
  useUpdateExchangeOutboundItems,
} from "../../../../../hooks/api/exchanges"
import { OutboundShippingPlaceholder } from "../../../common/placeholders"
import { ItemPlaceholder } from "../../../order-create-claim/components/claim-create-form/item-placeholder"
import { AddExchangeOutboundItemsTable } from "../add-exchange-outbound-items-table"
import type { ExchangeOfferPickerSelection } from "../add-exchange-outbound-items-table/add-exchange-outbound-items-table"
import { ExchangeOutboundItem } from "./exchange-outbound-item"
import { useOrderShippingOptions } from "../../../../../hooks/api/orders"
import { CreateExchangeSchemaType } from "./schema"
import { getFormattedShippingOptionLocationName } from "../../../../../lib/shipping-options"

type ExchangeOutboundSectionProps = {
  order: AdminOrder
  exchange: AdminExchange
  preview: AdminOrderPreview
  form: UseFormReturn<CreateExchangeSchemaType>
}

let itemsToAdd: ExchangeOfferPickerSelection[] = []
let itemsToRemove: string[] = []

export const ExchangeOutboundSection = ({
  order,
  preview,
  exchange,
  form,
}: ExchangeOutboundSectionProps) => {
  const { t } = useTranslation()

  const { setIsOpen } = useStackedModal()

  /**
   * HOOKS
   */
  const { shipping_options = [] } = useOrderShippingOptions(order.id)

  // TODO: filter in the API when boolean filter is supported and fulfillment module support partial rule SO filtering
  const outboundShippingOptions = shipping_options.filter(
    (so) =>
      !so.rules?.find((r) => r.attribute === "is_return" && r.value === "true")
  )

  const { mutateAsync: addOutboundShipping } = useAddExchangeOutboundShipping(
    exchange.id,
    order.id
  )

  const { mutateAsync: deleteOutboundShipping } =
    useDeleteExchangeOutboundShipping(exchange.id, order.id)

  const { mutateAsync: addOutboundItem } = useAddExchangeOutboundItems(
    exchange.id,
    order.id
  )

  const { mutateAsync: updateOutboundItem } = useUpdateExchangeOutboundItems(
    exchange.id,
    order.id
  )

  const { mutateAsync: removeOutboundItem } = useRemoveExchangeOutboundItem(
    exchange.id,
    order.id
  )

  /**
   * Only consider items that belong to this exchange and is an outbound item
   */
  const previewOutboundItems = useMemo(
    () =>
      preview?.items?.filter(
        (i) =>
          !!i.actions?.find(
            (a) => a.exchange_id === exchange.id && a.action === "ITEM_ADD"
          )
      ),
    [preview.items, exchange.id]
  )

  const {
    fields: outboundItems,
    append,
    remove,
    update,
  } = useFieldArray({
    name: "outbound_items",
    control: form.control,
  })

  const variantOutboundMap = useMemo(
    () => new Map(previewOutboundItems.map((i) => [i.variant_id, i])),
    [previewOutboundItems]
  )

  useEffect(() => {
    const existingItemsMap: Record<string, boolean> = {}

    previewOutboundItems.forEach((i) => {
      const ind = outboundItems.findIndex((field) => field.item_id === i.id)

      existingItemsMap[i.id] = true

      if (ind > -1) {
        if (outboundItems[ind].quantity !== i.detail.quantity) {
          update(ind, {
            ...outboundItems[ind],
            quantity: i.detail.quantity,
          })
        }
      } else {
        append(
          {
            item_id: i.id,
            quantity: i.detail.quantity,
            variant_id: i.variant_id,
          },
          { shouldFocus: false }
        )
      }
    })

    outboundItems.forEach((i, ind) => {
      if (!(i.item_id in existingItemsMap)) {
        remove(ind)
      }
    })
  }, [
	previewOutboundItems,
	remove,
	outboundItems,
	update,
	append
])

  const showOutboundItemsPlaceholder = !outboundItems.length

  const onItemsSelected = async () => {
    if (itemsToAdd.length) {
      await addOutboundItem(
        {
          items: itemsToAdd.map(({ variantId, offerId }) => ({
            variant_id: variantId,
            quantity: 1,
            metadata: { offer_id: offerId },
          })),
        },
        {
          onError: (error) => {
            toast.error(error.message)
          },
        }
      )
    }

    for (const itemToRemove of itemsToRemove) {
      const action = previewOutboundItems
        .find((i) => i.variant_id === itemToRemove)
        ?.actions?.find((a) => a.action === "ITEM_ADD")

      if (action?.id) {
        await removeOutboundItem(action?.id, {
          onError: (error) => {
            toast.error(error.message)
          },
        })
      }
    }

    setIsOpen("outbound-items", false)
  }

  useEffect(() => {
    const outboundShipping = preview.shipping_methods.find(
      (s) =>
        !!s.actions?.find((a) => a.action === "SHIPPING_ADD" && !a.return_id)
    )

    if (outboundShipping) {
      form.setValue("outbound_option_id", outboundShipping.shipping_option_id)
    } else {
      form.setValue("outbound_option_id", "")
    }
  }, [preview.shipping_methods, form])

  const onShippingOptionChange = async (
    selectedOptionId: string | undefined
  ) => {
    const outboundShippingMethods = preview.shipping_methods.filter(
      (s) =>
        !!s.actions?.find((a) => a.action === "SHIPPING_ADD" && !a.return_id)
    )

    const promises = outboundShippingMethods
      .filter(Boolean)
      .map((outboundShippingMethod) => {
        const action = outboundShippingMethod.actions?.find(
          (a) => a.action === "SHIPPING_ADD" && !a.return_id
        )

        if (action) {
          return deleteOutboundShipping(action.id)
        }
      })

    await Promise.all(promises)

    if (selectedOptionId) {
      await addOutboundShipping(
        { shipping_option_id: selectedOptionId },
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
        <Heading level="h2">{t("orders.returns.outbound")}</Heading>

        <StackedFocusModal id="outbound-items">
          <StackedFocusModal.Trigger asChild>
            <button type="button" className="focus-visible:shadow-borders-focus transition-fg txt-compact-small-plus cursor-pointer text-blue-500 outline-none hover:text-blue-400">
              {t("actions.addItems")}
            </button>
          </StackedFocusModal.Trigger>
          <StackedFocusModal.Content>
            <StackedFocusModal.Header />

            <AddExchangeOutboundItemsTable
              // Picker keys on offer id; hydrate from each outbound item's
              // stored offer_id metadata (or fallback to its variant id if the
              // item pre-dates the offer-link wiring).
              selectedItems={outboundItems
                .map(
                  (i) =>
                    (typeof i.metadata?.offer_id === "string"
                      ? i.metadata.offer_id
                      : null) ?? i.variant_id
                )
                .filter((v): v is string => !!v)}
              currencyCode={order.currency_code}
              onSelectionChange={(finalSelection) => {
                const alreadyVariantIds = outboundItems
                  .map((i) => i.variant_id)
                  .filter((v): v is string => !!v)

                itemsToAdd = finalSelection.filter(
                  ({ variantId }) => !alreadyVariantIds.includes(variantId)
                )
                const finalVariantIds = finalSelection.map((s) => s.variantId)
                itemsToRemove = alreadyVariantIds.filter(
                  (variantId) => !finalVariantIds.includes(variantId)
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
                  <Button tabIndex={0}
                    key="submit-button"
                    type="submit"
                    variant="primary"
                    size="small"
                    // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
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

      {showOutboundItemsPlaceholder && <ItemPlaceholder />}

      {outboundItems.map(
        (item, index) =>
          variantOutboundMap.get(item.variant_id) && (
            <ExchangeOutboundItem
              key={item.id}
              previewItem={variantOutboundMap.get(item.variant_id)!}
              currencyCode={order.currency_code}
              form={form}
              onRemove={() => {
                const actionId = previewOutboundItems
                  .find((i) => i.id === item.item_id)
                  ?.actions?.find((a) => a.action === "ITEM_ADD")?.id

                if (actionId) {
                  removeOutboundItem(actionId, {
                    onError: (error) => {
                      toast.error(error.message)
                    },
                  })
                }
              }}
              onUpdate={(payload) => {
                const actionId = previewOutboundItems
                  .find((i) => i.id === item.item_id)
                  ?.actions?.find((a) => a.action === "ITEM_ADD")?.id

                if (actionId) {
                  updateOutboundItem(
                    { ...payload, actionId },
                    {
                      onError: (error) => {
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
      {!showOutboundItemsPlaceholder && (
        <div className="mt-8 flex flex-col gap-y-4">
          {/*OUTBOUND SHIPPING*/}
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <div>
              <Form.Label>{t("orders.exchanges.outboundShipping")}</Form.Label>
              <Form.Hint className="!mt-1">
                {t("orders.exchanges.outboundShippingHint")}
              </Form.Hint>
            </div>

            <Form.Field
              control={form.control}
              name="outbound_option_id"
              render={({ field: { value, onChange, ...field } }) => {
                return (
                  <Form.Item>
                    <Form.Control>
                      <Combobox
                        allowClear
                        noResultsPlaceholder={<OutboundShippingPlaceholder />}
                        value={value ?? undefined}
                        onChange={(val) => {
                          onChange(val)
                          onShippingOptionChange(val)
                        }}
                        {...field}
                        options={outboundShippingOptions.map((so) => ({
                          label: `${so.name} (${getFormattedShippingOptionLocationName(so)})`,
                          value: so.id,
                        }))}
                        disabled={!outboundShippingOptions.length}
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
