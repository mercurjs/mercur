import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { useRouteModal } from "../../../../components/modals"
import { TabbedForm } from "../../../../components/tabbed-form/tabbed-form"
import { useCreateOffer } from "../../../../hooks/api/offers"
import {
  findDuplicateInventoryIndexes,
  findDuplicatePriceIndexes,
} from "./schema"
import { CreateOfferFormValues, CreateOfferSchema } from "./schema"
import { CreateOfferDetailsTab } from "./create-offer-details"
import { CreateOfferPricingAndStockTab } from "./create-offer-pricing-and-stock"
import { CreateOfferVariantTab } from "./create-offer-variant"

const DEFAULTS: CreateOfferFormValues = {
  variant_id: "",
  sku: "",
  shipping_profile_id: "",
  metadata: null,
  prices: [],
  inventory_items: [],
}

export const CreateOfferForm = () => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()
  const form = useForm<CreateOfferFormValues>({
    defaultValues: DEFAULTS,
    resolver: zodResolver(CreateOfferSchema),
  })

  const { mutateAsync, isPending } = useCreateOffer()

  const handleSubmit = form.handleSubmit(async (values) => {
    const priceDuplicates = findDuplicatePriceIndexes(values.prices)
    const inventoryDuplicates = findDuplicateInventoryIndexes(
      values.inventory_items,
    )

    if (priceDuplicates.length > 0) {
      priceDuplicates.forEach((idx) => {
        form.setError(`prices.${idx}.currency_code` as const, {
          type: "manual",
          message: t("offers.validation.duplicatePriceRule"),
        })
      })
      return
    }

    if (inventoryDuplicates.length > 0) {
      inventoryDuplicates.forEach((idx) => {
        form.setError(`inventory_items.${idx}.inventory_item_id` as const, {
          type: "manual",
          message: t("offers.validation.duplicateInventoryItem"),
        })
      })
      return
    }

    const payload = {
      variant_id: values.variant_id,
      sku: values.sku,
      shipping_profile_id: values.shipping_profile_id,
      metadata: values.metadata ?? undefined,
      prices: values.prices.map((p) => {
        const rules: Record<string, string> = {}
        if (p.region_id) rules.region_id = p.region_id
        if (p.customer_group_id)
          rules.customer_group_id = p.customer_group_id
        return {
          amount: Number(p.amount),
          currency_code: p.currency_code,
          min_quantity: p.min_quantity ?? undefined,
          max_quantity: p.max_quantity ?? undefined,
          rules: Object.keys(rules).length > 0 ? rules : undefined,
        }
      }),
      inventory_items: values.inventory_items.map((i) => ({
        inventory_item_id: i.inventory_item_id,
        required_quantity: Number(i.required_quantity) || 1,
      })),
    }

    await mutateAsync(payload, {
      onSuccess: (data) => {
        toast.success(t("offers.create.successToast"))
        const offerId = (data as { offer?: { id?: string } }).offer?.id
        if (offerId) {
          handleSuccess(`/offers/${offerId}`)
        } else {
          handleSuccess("/offers")
        }
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  })

  return (
    <TabbedForm
      form={form}
      onSubmit={handleSubmit}
      isLoading={isPending}
      data-testid="offer-create-form"
    >
      <CreateOfferVariantTab />
      <CreateOfferDetailsTab />
      <CreateOfferPricingAndStockTab />
    </TabbedForm>
  )
}
