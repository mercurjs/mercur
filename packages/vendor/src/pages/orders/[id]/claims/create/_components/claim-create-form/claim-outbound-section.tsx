import { Button, Heading } from "@medusajs/ui"
import { useFieldArray, UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"

import {
  RouteFocusModal,
  StackedFocusModal,
  useStackedModal,
} from "@components/modals"

import { AddClaimOutboundItemsTable } from "../add-claim-outbound-items-table"
import { ClaimOutboundItem } from "./claim-outbound-item"
import { ItemPlaceholder } from "./item-placeholder"
import { CreateClaimSchemaType } from "./schema"

// Narrow shape of the picker row the section reads. Matches the
// `OfferPickerRowExtended` the table builds (id, sku, variant_id, and
// the nested product_variant.product.{title,thumbnail}). Re-declared
// here so the section file doesn't have to import the picker's
// internal types.
type OfferLookupRow = {
  id: string
  sku?: string | null
  variant_id?: string | null
  product_variant?: {
    id?: string | null
    title?: string | null
    product?: {
      title?: string | null
      thumbnail?: string | null
    } | null
  } | null
}

type ClaimOutboundSectionProps = {
  form: UseFormReturn<CreateClaimSchemaType>
  /**
   * Currency of the parent order — restricts the offer picker to offers
   * with a matching price.
   */
  currencyCode?: string
  /**
   * Mirrors the admin component prop surface: when the parent disables
   * adding (e.g. while a draft is still being created or canceled), the
   * trigger is disabled.
   */
  disabled?: boolean
}

const STACKED_MODAL_ID = "claim-add-outbound-items"

/**
 * Vendor port of admin's `ClaimOutboundSection`. Hosts the "Add items"
 * trigger (offer picker via `AddClaimOutboundItemsTable`) and the list
 * of replacement items being staged on the claim. Replacement items are
 * kept in form state — they're sent to the backend once on confirm via
 * `useAddClaimOutboundItems` to keep parity with the existing vendor flow
 * (admin's per-row update endpoints don't yet exist on the vendor surface).
 */
export const ClaimOutboundSection = ({
  form,
  currencyCode,
  disabled,
}: ClaimOutboundSectionProps) => {
  const { t } = useTranslation()
  const { setIsOpen } = useStackedModal()

  const {
    fields: outboundItems,
    append,
    remove,
  } = useFieldArray({
    name: "outbound_items",
    control: form.control,
  })

  const showOutboundItemsPlaceholder = !outboundItems.length

  const onItemsSelected = (
    selectedOfferIds: string[],
    offerLookup: Record<string, OfferLookupRow>
  ) => {
    const existing = new Set(outboundItems.map((row) => row.offer_id))
    selectedOfferIds
      .filter((id) => !existing.has(id))
      .forEach((id) => {
        const offer = offerLookup[id]
        const variant = offer?.product_variant
        append(
          {
            offer_id: id,
            variant_id: offer?.variant_id ?? variant?.id ?? null,
            product_title: variant?.product?.title ?? null,
            variant_title: variant?.title ?? null,
            thumbnail: variant?.product?.thumbnail ?? null,
            sku: offer?.sku ?? null,
            quantity: 1,
          },
          { shouldFocus: false }
        )
      })

    setIsOpen(STACKED_MODAL_ID, false)
  }

  return (
    <div>
      <div className="mt-8 flex items-center justify-between">
        <Heading level="h2">{t("orders.claims.outboundItems")}</Heading>

        <StackedFocusModal id={STACKED_MODAL_ID}>
          <StackedFocusModal.Trigger asChild>
            <a
              className="focus-visible:shadow-borders-focus transition-fg txt-compact-small-plus cursor-pointer text-blue-500 outline-none hover:text-blue-400"
              data-testid="claim-add-outbound-trigger"
            >
              {t("orders.claims.addOutboundItems")}
            </a>
          </StackedFocusModal.Trigger>
          <StackedFocusModal.Content>
            <StackedFocusModal.Header />
            <StackedFocusModal.Title asChild>
              <span className="sr-only">
                {t("orders.claims.addOutboundItems")}
              </span>
            </StackedFocusModal.Title>
            <StackedFocusModal.Description className="sr-only">
              {t("orders.claims.addOutboundItemsDescription")}
            </StackedFocusModal.Description>

            <StackedFocusModal.Body className="size-full overflow-hidden">
              <PickerBody
                currencyCode={currencyCode}
                onSubmit={onItemsSelected}
              />
            </StackedFocusModal.Body>
          </StackedFocusModal.Content>
        </StackedFocusModal>
      </div>

      {showOutboundItemsPlaceholder && <ItemPlaceholder />}

      {outboundItems.map((item, index) => (
        <ClaimOutboundItem
          key={item.id}
          form={form}
          index={index}
          onRemove={() => remove(index)}
        />
      ))}
      {/* Mirrors the admin prop surface for "disabled while creating draft" */}
      <span className="sr-only">{disabled ? "" : ""}</span>
    </div>
  )
}

/**
 * Internal: separate component so selection state is scoped to each open
 * picker invocation (the StackedFocusModal mounts/unmounts on toggle).
 */
const PickerBody = ({
  currencyCode,
  onSubmit,
}: {
  currencyCode?: string
  onSubmit: (
    offerIds: string[],
    offers: Record<string, OfferLookupRow>
  ) => void
}) => {
  const { t } = useTranslation()
  let selectedOfferIds: string[] = []
  let selectedOfferLookup: Record<string, OfferLookupRow> = {}

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-hidden">
        <AddClaimOutboundItemsTable
          currencyCode={currencyCode}
          onSelectionChange={(ids, lookup) => {
            selectedOfferIds = ids
            selectedOfferLookup = lookup
          }}
        />
      </div>
      <StackedFocusModal.Footer>
        <div className="flex w-full items-center justify-end gap-x-2">
          <RouteFocusModal.Close asChild>
            <Button
              type="button"
              variant="secondary"
              size="small"
              data-testid="claim-add-outbound-cancel"
            >
              {t("actions.cancel")}
            </Button>
          </RouteFocusModal.Close>
          <Button
            key="submit-button"
            type="button"
            variant="primary"
            size="small"
            role="button"
            data-testid="claim-add-outbound-save"
            onClick={() => onSubmit(selectedOfferIds, selectedOfferLookup)}
          >
            {t("actions.save")}
          </Button>
        </div>
      </StackedFocusModal.Footer>
    </div>
  )
}
