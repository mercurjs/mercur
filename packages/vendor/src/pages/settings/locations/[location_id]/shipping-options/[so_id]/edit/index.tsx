import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { usePermissions } from "@mercurjs/dashboard-shared"
import { RouteDrawer } from "@components/modals"
import { useRegions } from "@hooks/api/regions"
import { useShippingOption } from "@hooks/api/shipping-options"
import { useShippingRules } from "@hooks/api/shipping-rules"
import {
  RegionLite,
  VendorShippingOptionWithPrices,
} from "@pages/settings/locations/_common/shipping-methods"

import { EditShippingOptionForm } from "./_components/edit-shipping-option-form"

const EditShippingOption = () => {
  const { t } = useTranslation()
  const { location_id, so_id } = useParams()
  const { can } = usePermissions()

  const {
    shipping_option,
    isPending: isOptionPending,
    isError: isOptionError,
    error: optionError,
  } = useShippingOption(so_id!)

  const {
    shipping_rules,
    isPending: isRulesPending,
    isError: isRulesError,
    error: rulesError,
  } = useShippingRules({ stock_location_id: location_id! })

  const { regions, isPending: isRegionsPending } = useRegions(
    { fields: "id,name,currency_code", limit: 999 },
    { enabled: can("regions") }
  )

  if (isOptionError) {
    throw optionError
  }

  if (isRulesError) {
    throw rulesError
  }

  const option = shipping_option as unknown as
    | VendorShippingOptionWithPrices
    | undefined
  const rule = shipping_rules?.find((r) =>
    r.seller_shipping_options.some((o) => o.id === so_id)
  )

  const ready =
    !isOptionPending &&
    !isRulesPending &&
    (!can("regions") || !isRegionsPending) &&
    !!option

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>
            {rule
              ? t("shippingMethods.edit.header")
              : t("shippingMethods.legacy.editHeader")}
          </Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description className="sr-only">
          {rule
            ? t("shippingMethods.edit.description", {
                name: rule.shipping_method?.name ?? "",
              })
            : t("shippingMethods.legacy.editDescription", {
                name: option?.name ?? "",
              })}
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      {ready && option && (
        <EditShippingOptionForm
          option={option}
          rule={rule}
          regions={(regions ?? []) as RegionLite[]}
        />
      )}
    </RouteDrawer>
  )
}

export const Component = EditShippingOption
