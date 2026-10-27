import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Text, toast } from "@medusajs/ui"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { RouteDrawer, useRouteModal } from "@components/modals"
import { KeyboundForm } from "@components/utilities/keybound-form"
import { useUpdateShippingOptions } from "@hooks/api/shipping-options"
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
  TRANSIT_MAX_KEY,
  TRANSIT_MIN_KEY,
  VendorShippingOptionWithPrices,
  VendorShippingRule,
  buildOptionPriceRows,
  buildOptionPriceUpdate,
  buildRulePriceRows,
  getEffectiveTransit,
} from "@pages/settings/locations/_common/shipping-methods"

type EditShippingOptionFormProps = {
  option: VendorShippingOptionWithPrices
  rule?: VendorShippingRule
  regions: RegionLite[]
}

export const EditShippingOptionForm = ({
  option,
  rule,
  regions,
}: EditShippingOptionFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const name = rule?.shipping_method?.name ?? option.name
  const isFlat = (rule?.price_type ?? option.price_type) === "flat"
  const canEditPrice = isFlat && (rule ? rule.seller_can_edit_price : true)
  const canEditTransit = !!rule?.seller_can_edit_transit

  const rows = useMemo(
    () =>
      rule
        ? buildRulePriceRows(rule, regions, option)
        : buildOptionPriceRows(option, regions),
    [rule, regions, option]
  )

  const transit = rule
    ? getEffectiveTransit(rule, option.metadata)
    : { min: null, max: null }

  const form = useForm<ShippingMethodFormValues>({
    defaultValues: {
      prices: Object.fromEntries(
        rows.map((row) => [row.key, toFormAmount(row.amount)])
      ),
      transit_min_days: toFormDays(transit.min),
      transit_max_days: toFormDays(transit.max),
    },
    resolver: zodResolver(ShippingMethodFormSchema),
  })

  const { mutateAsync, isPending } = useUpdateShippingOptions(option.id)

  const handleSubmit = form.handleSubmit(async (values) => {
    let prices: ReturnType<typeof buildOptionPriceUpdate> | undefined

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

      prices = buildOptionPriceUpdate(rows, amounts, option)
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
        ...(prices ? { prices } : {}),
        ...(canEditTransit
          ? {
              metadata: {
                ...(option.metadata ?? {}),
                [TRANSIT_MIN_KEY]: parseDays(values.transit_min_days),
                [TRANSIT_MAX_KEY]: parseDays(values.transit_max_days),
              },
            }
          : {}),
      },
      {
        onSuccess: () => {
          toast.success(
            rule
              ? t("shippingMethods.edit.successToast", { name })
              : t("shippingMethods.legacy.editSuccessToast", { name })
          )
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
              {rule
                ? t("shippingMethods.edit.description", { name })
                : t("shippingMethods.legacy.editDescription", { name })}
            </Text>
          </div>
          <ShippingMethodFormFields
            form={form}
            rows={rows}
            showPrices={isFlat}
            canEditPrice={canEditPrice}
            showTransit={!!rule}
            canEditTransit={canEditTransit}
          />
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center gap-x-2">
            <RouteDrawer.Close asChild>
              <Button
                size="small"
                variant="secondary"
                data-testid="shipping-option-edit-cancel-button"
              >
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button
              size="small"
              type="submit"
              isLoading={isPending}
              disabled={!canEditPrice && !canEditTransit}
              data-testid="shipping-option-edit-submit-button"
            >
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
