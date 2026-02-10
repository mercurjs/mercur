import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import * as zod from "zod"

import { RouteFocusModal, useRouteModal } from "@components/modals"
import { KeyboundForm } from "@components/utilities/keybound-form"
import { useUpdateProductVariant } from "@hooks/api/products"
import { useRegions } from "@hooks/api/regions"
import { castNumber } from "@lib/cast-number"
import { VariantPricingForm } from "../../common/variant-pricing-form"
import { ExtendedAdminProduct } from "@custom-types/products"

export const UpdateVariantPricesSchema = zod.object({
  variants: zod.array(
    zod.object({
      prices: zod
        .record(zod.string(), zod.string().or(zod.number()).optional())
        .optional(),
    })
  ),
})

export type UpdateVariantPricesSchemaType = zod.infer<
  typeof UpdateVariantPricesSchema
>

export const PricingEdit = ({
  product,
  variantId,
}: {
  product: ExtendedAdminProduct
  variantId?: string
}) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()
  // const { mutateAsync, isPending } = useUpdateProductVariantsBatch(product.id)
  const { mutateAsync, isPending } = useUpdateProductVariant(
    product.id,
    variantId!
  )

  const { regions } = useRegions({ limit: 9999 })
  const regionsCurrencyMap = useMemo(() => {
    if (!regions?.length) {
      return {}
    }

    return regions.reduce(
      (acc, reg) => {
        acc[reg.id] = reg.currency_code
        return acc
      },
      {} as Record<string, string>
    )
  }, [regions])

  const variants = variantId
    ? product.variants?.filter((v) => v.id === variantId)
    : product.variants

  const form = useForm<UpdateVariantPricesSchemaType>({
    defaultValues: {
      variants: variants?.map((variant) => ({
        title: variant.title,
        prices:
          variant.prices?.reduce(
            (acc, price) => {
              const priceWithRules = price as HttpTypes.AdminPrice & {
                rules?: { region_id?: string; [key: string]: unknown }
              }
              if (priceWithRules.rules?.region_id) {
                acc[priceWithRules.rules.region_id] = price.amount
              } else {
                acc[price.currency_code] = price.amount
              }
              return acc
            },
            {} as Record<string, number>
          ) || {},
      })),
    },

    resolver: zodResolver(UpdateVariantPricesSchema, {}),
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    const reqData = values.variants.map((variant, ind) => {
      const currentVariant = variants?.[ind]
      if (!currentVariant) {
        return null
      }

      return {
        ...currentVariant,
        prices: Object.entries(variant.prices || {})
          .filter(
            ([_, value]) => value !== "" && typeof value !== "undefined" // deleted cells
          )
          .map(([currencyCodeOrRegionId, value]) => {
            const regionId = currencyCodeOrRegionId.startsWith("reg_")
              ? currencyCodeOrRegionId
              : undefined
            const currencyCode = currencyCodeOrRegionId.startsWith("reg_")
              ? regionsCurrencyMap[regionId as string]
              : currencyCodeOrRegionId

            let existingId: string | undefined

            if (regionId && currentVariant.prices) {
              existingId = currentVariant.prices.find((p) => {
                const priceWithRules = p as HttpTypes.AdminPrice & {
                  rules?: { region_id?: string; [key: string]: unknown }
                }
                return priceWithRules.rules?.region_id === regionId
              })?.id
            } else if (currentVariant.prices) {
              existingId = currentVariant.prices.find((p) => {
                const priceWithRules = p as HttpTypes.AdminPrice & {
                  rules?: { region_id?: string; [key: string]: unknown }
                }
                return (
                  p.currency_code === currencyCode &&
                  Object.keys(priceWithRules.rules ?? {}).length === 0
                )
              })?.id
            }

            const amount = castNumber(value!)

            return {
              id: existingId,
              currency_code: currencyCode || "",
              amount,
              ...(regionId ? { rules: { region_id: regionId } } : {}),
            }
          }),
      }
    })

    const data = reqData[0]

    if (!data) {
      return
    }

    const cleanData: HttpTypes.AdminUpdateProductVariant = {
      title: data.title || undefined,
      sku: data.sku || undefined,
      prices: data.prices,
    }

    await mutateAsync(cleanData, {
      onSuccess: () => {
        handleSuccess("..")
      },
    })
  })

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex size-full flex-col">
        <RouteFocusModal.Header />
        <RouteFocusModal.Body className="flex flex-col overflow-hidden">
          <VariantPricingForm form={form as any} product={product} />
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer>
          <div className="flex w-full items-center justify-end gap-x-2">
            <RouteFocusModal.Close asChild>
              <Button variant="secondary" size="small">
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button
              type="submit"
              variant="primary"
              size="small"
              isLoading={isPending}
            >
              {t("actions.save")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}
