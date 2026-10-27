import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Text, toast } from "@medusajs/ui"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { RouteDrawer, useRouteModal } from "@components/modals"
import { KeyboundForm } from "@components/utilities/keybound-form"
import { useEnableShippingRule } from "@hooks/api/shipping-rules"
import {
  ShippingMethodFormFields,
  ShippingMethodFormSchema,
  ShippingMethodFormValues,
  collectAmounts,
  parseDays,
  toFormAmount,
  toFormDays,
  validateTransitRange,
} from "@pages/settings/locations/_common/components/shipping-method-form-fields"
import {
  RegionLite,
  VendorShippingRule,
  buildRulePriceRows,
} from "@pages/settings/locations/_common/shipping-methods"

type EnableShippingRuleFormProps = {
  rule: VendorShippingRule
  locationId: string
  regions: RegionLite[]
}

export const EnableShippingRuleForm = ({
  rule,
  locationId,
  regions,
}: EnableShippingRuleFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const name = rule.shipping_method?.name ?? ""
  const isFlat = rule.price_type === "flat"
  const canEditPrice = isFlat && rule.seller_can_edit_price
  const canEditTransit = rule.seller_can_edit_transit

  const rows = useMemo(() => buildRulePriceRows(rule, regions), [rule, regions])

  const form = useForm<ShippingMethodFormValues>({
    defaultValues: {
      prices: Object.fromEntries(
        rows.map((row) => [row.key, toFormAmount(row.amount)])
      ),
      transit_min_days: toFormDays(rule.transit_min_days),
      transit_max_days: toFormDays(rule.transit_max_days),
    },
    resolver: zodResolver(ShippingMethodFormSchema),
  })

  const { mutateAsync, isPending } = useEnableShippingRule(rule.id)

  const handleSubmit = form.handleSubmit(async (values) => {
    let prices: { currency_code?: string; region_id?: string; amount: number }[] | undefined

    if (canEditPrice) {
      const amounts = collectAmounts(
        form,
        rows,
        values,
        t("shippingMethods.validation.priceRequired")
      )

      if (!amounts) {
        return
      }

      prices = rows.map((row) =>
        row.region_id
          ? { region_id: row.region_id, amount: amounts[row.key] }
          : { currency_code: row.currency_code, amount: amounts[row.key] }
      )
    }

    if (
      canEditTransit &&
      !validateTransitRange(
        form,
        values,
        t("shippingMethods.validation.transitRange")
      )
    ) {
      return
    }

    await mutateAsync(
      {
        stock_location_id: locationId,
        ...(prices ? { prices } : {}),
        ...(canEditTransit
          ? {
              transit_min_days: parseDays(values.transit_min_days),
              transit_max_days: parseDays(values.transit_max_days),
            }
          : {}),
      },
      {
        onSuccess: () => {
          toast.success(t("shippingMethods.enable.successToast", { name }))
          handleSuccess()
        },
        onError: (e) => {
          toast.error(e.message)
        },
      }
    )
  })

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <RouteDrawer.Body className="flex flex-col gap-y-8 overflow-y-auto">
          <div className="flex flex-col">
            <Text size="small" weight="plus" leading="compact">
              {name}
            </Text>
            <Text size="small" className="text-ui-fg-subtle">
              {t("shippingMethods.enable.description", { name })}
            </Text>
          </div>
          <ShippingMethodFormFields
            form={form}
            rows={rows}
            showPrices={isFlat}
            canEditPrice={canEditPrice}
            showTransit
            canEditTransit={canEditTransit}
          />
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center gap-x-2">
            <RouteDrawer.Close asChild>
              <Button
                size="small"
                variant="secondary"
                data-testid="shipping-method-enable-cancel-button"
              >
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button
              size="small"
              type="submit"
              isLoading={isPending}
              data-testid="shipping-method-enable-submit-button"
            >
              {t("shippingMethods.actions.enable")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
