import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { usePermissions } from "@mercurjs/dashboard-shared"
import { RouteDrawer } from "@components/modals"
import { useRegions } from "@hooks/api/regions"
import { useShippingRules } from "@hooks/api/shipping-rules"
import { RegionLite } from "@pages/settings/locations/_common/shipping-methods"

import { EnableShippingRuleForm } from "./_components/enable-shipping-rule-form"

const EnableShippingRule = () => {
  const { t } = useTranslation()
  const { location_id, rule_id } = useParams()
  const { can } = usePermissions()

  const { shipping_rules, isPending, isError, error } = useShippingRules({
    stock_location_id: location_id!,
  })

  const { regions, isPending: isRegionsPending } = useRegions(
    { fields: "id,name,currency_code", limit: 999 },
    { enabled: can("regions") }
  )

  if (isError) {
    throw error
  }

  const rule = shipping_rules?.find((r) => r.id === rule_id)
  const ready =
    !isPending && !!rule && (!can("regions") || !isRegionsPending)

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>{t("shippingMethods.enable.header")}</Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description className="sr-only">
          {t("shippingMethods.enable.description", {
            name: rule?.shipping_method?.name ?? "",
          })}
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      {ready && rule && (
        <EnableShippingRuleForm
          rule={rule}
          locationId={location_id!}
          regions={(regions ?? []) as RegionLite[]}
        />
      )}
    </RouteDrawer>
  )
}

export const Component = EnableShippingRule
