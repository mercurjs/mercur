import { zodResolver } from "@hookform/resolvers/zod"
import { Button, toast } from "@medusajs/ui"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { RouteFocusModal, useRouteModal } from "../../../../components/modals"
import { TabbedForm } from "../../../../components/tabbed-form/tabbed-form"
import { useCreateOffer } from "../../../../hooks/api/offers"
import { useCreateInventoryItem } from "../../../../hooks/api/inventory"
import { useStore } from "../../../../hooks/api/store"
import { CreateOfferCatalogueTab } from "./create-offer-catalogue"
import { CreateOfferStockLevelsAndPricesTab } from "./create-offer-stock-levels-and-prices"
import {
  CreateOfferFormValues,
  CreateOfferSchema,
  isRowPublishable,
  requiresSku,
} from "./schema"

const DEFAULTS: CreateOfferFormValues = {
  selected_variant_ids: [],
  selected_variants: [],
  rows: {},
  shipping_profile_id: "",
}

type CurrencyLite = { currency_code: string }

export const CreateOfferForm = () => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const form = useForm<CreateOfferFormValues>({
    defaultValues: DEFAULTS,
    resolver: zodResolver(CreateOfferSchema),
  })

  const { mutateAsync: createOffer } = useCreateOffer()
  const { mutateAsync: createInventoryItem } = useCreateInventoryItem()
  const { store } = useStore({ fields: "+supported_currencies" })

  const supportedCurrencies: CurrencyLite[] =
    (store?.supported_currencies as CurrencyLite[] | undefined) ?? []

  const handleSubmit = form.handleSubmit(async (values) => {
    const rows = values.rows ?? {}
    const selectedVariants = values.selected_variants ?? []
    const shippingProfileId = values.shipping_profile_id

    const publishable = selectedVariants.filter((v) => {
      const row = rows[v.variant_id]
      return row ? isRowPublishable(row) : false
    })

    if (publishable.length === 0) {
      toast.error(t("offers.validation.noPublishableRows"))
      return
    }

    // SKU-required validation (rows that toggled a location or set a non-zero price must have SKU)
    let hasValidationError = false
    const skuSeen = new Map<string, string>()
    for (const v of publishable) {
      const row = rows[v.variant_id]!
      const sku = (row.sku ?? "").trim()
      if (requiresSku(row) && !sku) {
        form.setError(`rows.${v.variant_id}.sku`, {
          type: "manual",
          message: t("offers.validation.skuRequired"),
        })
        hasValidationError = true
        continue
      }
      if (sku) {
        if (skuSeen.has(sku)) {
          form.setError(`rows.${v.variant_id}.sku`, {
            type: "manual",
            message: t("offers.validation.duplicateSku"),
          })
          hasValidationError = true
          continue
        }
        skuSeen.set(sku, v.variant_id)
      }
    }

    if (hasValidationError) return

    setIsSubmitting(true)
    const failed: string[] = []

    for (const variant of publishable) {
      const row = rows[variant.variant_id]!
      const sku = (row.sku ?? "").trim() || variant.variant_sku || variant.variant_id

      try {
        const inventoryItemResp = await createInventoryItem({
          sku,
          title: variant.variant_title,
        } as Parameters<typeof createInventoryItem>[0])

        const inventoryItemId =
          (inventoryItemResp as { inventory_item?: { id?: string } })
            ?.inventory_item?.id

        if (!inventoryItemId) {
          throw new Error("Inventory item creation returned no id")
        }

        const prices: {
          amount: number
          currency_code: string
        }[] = []
        for (const c of supportedCurrencies) {
          const raw = row.prices?.[c.currency_code]
          const amount = Number(raw ?? 0)
          if (!Number.isFinite(amount)) continue
          prices.push({ amount, currency_code: c.currency_code })
        }

        if (prices.length === 0) {
          for (const c of supportedCurrencies.slice(0, 1)) {
            prices.push({ amount: 0, currency_code: c.currency_code })
          }
        }

        await createOffer({
          sku,
          variant_id: variant.variant_id,
          shipping_profile_id: shippingProfileId,
          inventory_items: [
            { inventory_item_id: inventoryItemId, required_quantity: 1 },
          ],
          prices,
        } as Parameters<typeof createOffer>[0])

        // Remove the variant from the form once it succeeds.
        const nextIds = (form.getValues("selected_variant_ids") ?? []).filter(
          (id) => id !== variant.variant_id,
        )
        const nextSnapshots = (form.getValues("selected_variants") ?? []).filter(
          (v) => v.variant_id !== variant.variant_id,
        )
        const nextRows = { ...(form.getValues("rows") ?? {}) }
        delete nextRows[variant.variant_id]
        form.setValue("selected_variant_ids", nextIds)
        form.setValue("selected_variants", nextSnapshots)
        form.setValue("rows", nextRows)
      } catch (err) {
        failed.push(variant.variant_id)
        const message = err instanceof Error ? err.message : "Unknown error"
        form.setError(`rows.${variant.variant_id}.sku`, {
          type: "manual",
          message,
        })
      }
    }

    setIsSubmitting(false)

    const succeeded = publishable.length - failed.length
    if (failed.length === 0) {
      toast.success(t("offers.create.successToast"))
      handleSuccess("/offers")
    } else if (succeeded > 0) {
      toast.warning(
        t("offers.bulkDelete.partialToast", {
          succeeded,
          total: publishable.length,
          failed: failed.length,
        }),
      )
    } else {
      toast.error(t("offers.create.successToast"))
    }
  })

  return (
    <TabbedForm
      form={form}
      onSubmit={handleSubmit}
      isLoading={isSubmitting}
      footer={({ isLastTab, onNext, isLoading }) => (
        <div className="flex items-center justify-end gap-x-2">
          <RouteFocusModal.Close asChild>
            <Button variant="secondary" size="small">
              {t("actions.cancel")}
            </Button>
          </RouteFocusModal.Close>
          {isLastTab ? (
            <Button
              key="publish-button"
              type="submit"
              variant="primary"
              size="small"
              isLoading={isLoading}
              data-testid="offer-create-publish"
            >
              {t("offers.create.publish")}
            </Button>
          ) : (
            <Button
              key="next-button"
              type="button"
              variant="primary"
              size="small"
              onClick={() => onNext()}
              disabled={
                (form.watch("selected_variant_ids")?.length ?? 0) === 0
              }
            >
              {t("actions.continue")}
            </Button>
          )}
        </div>
      )}
    >
      <CreateOfferCatalogueTab />
      <CreateOfferStockLevelsAndPricesTab />
    </TabbedForm>
  )
}
