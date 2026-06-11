import {
  AdminClaim,
  AdminOrder,
  AdminOrderPreview,
} from "@medusajs/types"
import { Button, Heading, toast } from "@medusajs/ui"
import { useEffect, useMemo } from "react"
import { useFieldArray, UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { HttpTypes } from "@medusajs/types"
import { Form } from "../../../../../components/common/form"
import { Combobox } from "../../../../../components/inputs/combobox"
import {
  RouteFocusModal,
  StackedFocusModal,
  useStackedModal,
} from "../../../../../components/modals"
import {
  useAddClaimOutboundItems,
  useAddClaimOutboundShipping,
  useDeleteClaimOutboundShipping,
  useRemoveClaimOutboundItem,
  useUpdateClaimOutboundItems,
} from "../../../../../hooks/api/claims"
import { OutboundShippingPlaceholder } from "../../../common/placeholders"
import { AddClaimOutboundItemsTable } from "../add-claim-outbound-items-table"
import type { ClaimOfferPickerSelection } from "../add-claim-outbound-items-table/add-claim-outbound-items-table"
import { ClaimOutboundItem } from "./claim-outbound-item"
import { ItemPlaceholder } from "./item-placeholder"
import { CreateClaimSchemaType } from "./schema"
import { useOrderShippingOptions } from "../../../../../hooks/api/orders"
import { getFormattedShippingOptionLocationName } from "../../../../../lib/shipping-options"

type ClaimOutboundSectionProps = {
  order: AdminOrder
  claim: AdminClaim
  preview: AdminOrderPreview
  form: UseFormReturn<CreateClaimSchemaType>
}

let itemsToAdd: ClaimOfferPickerSelection[] = []
let itemsToRemove: string[] = []

export const ClaimOutboundSection = ({
  order,
  preview,
  claim,
  form,
}: ClaimOutboundSectionProps) => {
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

  const { mutateAsync: addOutboundShipping } = useAddClaimOutboundShipping(
    claim.id,
    order.id
  )

  const { mutateAsync: deleteOutboundShipping } =
    useDeleteClaimOutboundShipping(claim.id, order.id)

  const { mutateAsync: addOutboundItem } = useAddClaimOutboundItems(
    claim.id,
    order.id
  )

  const { mutateAsync: updateOutboundItem } = useUpdateClaimOutboundItems(
    claim.id,
    order.id
  )

  const { mutateAsync: removeOutboundItem } = useRemoveClaimOutboundItem(
    claim.id,
    order.id
  )

  /**
   * Only consider items that belong to this claim and is an outbound item
   */
  const previewOutboundItems = useMemo(
    () =>
      preview?.items?.filter(
        (i) =>
          !!i.actions?.find(
            (a) => a.claim_id === claim.id && a.action === "ITEM_ADD"
          )
      ),
    [preview.items, claim.id]
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
	append,
	update
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

  const onShippingOptionChange = async (
    selectedOptionId: string | undefined
  ) => {
    const outboundShippingMethods = preview.shipping_methods.filter((s) => {
      const action = s.actions?.find(
        (a) => a.action === "SHIPPING_ADD" && !a.return_id
      )

      return action && !action?.return_id
    })

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

            <AddClaimOutboundItemsTable
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
            <ClaimOutboundItem
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
              onUpdate={(payload: HttpTypes.AdminUpdateReturnItems) => {
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
              <Form.Label>{t("orders.claims.outboundShipping")}</Form.Label>
              <Form.Hint className="!mt-1">
                {t("orders.claims.outboundShippingHint")}
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
                        noResultsPlaceholder={<OutboundShippingPlaceholder />}
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
