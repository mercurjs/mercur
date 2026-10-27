import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"

import { RouteDrawer } from "../../../components/modals"
import { useShippingMethod } from "../../../hooks/api/shipping-methods"
import { useShippingProfile } from "../../../hooks/api/shipping-profiles"
import { useShippingRules } from "../../../hooks/api/shipping-rules"
import { useShippingZone } from "../../../hooks/api/shipping-zones"
import { useStore } from "../../../hooks/api/store"
import { getShippingRulesPath } from "../common/utils"
import { ConfigureShippingRuleForm } from "./components/configure-shipping-rule-form"

export const ShippingRuleConfigure = () => {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()

  const zoneId = searchParams.get("zone") ?? ""
  const methodId = searchParams.get("method") ?? ""
  const profileId = searchParams.get("profile") ?? ""

  const zoneQuery = useShippingZone(zoneId, undefined, { enabled: !!zoneId })
  const methodQuery = useShippingMethod(methodId, undefined, {
    enabled: !!methodId,
  })
  const profileQuery = useShippingProfile(profileId, undefined, {
    enabled: !!profileId,
  })
  const rulesQuery = useShippingRules(
    {
      shipping_zone_id: zoneId,
      shipping_method_id: methodId,
      shipping_profile_id: profileId,
    },
    { enabled: !!zoneId && !!methodId && !!profileId }
  )
  const storeQuery = useStore()

  const error =
    zoneQuery.error ??
    methodQuery.error ??
    profileQuery.error ??
    rulesQuery.error ??
    storeQuery.error

  if (error) {
    throw error
  }

  const zone = zoneQuery.shipping_zone
  const method = methodQuery.shipping_method
  const profile = profileQuery.shipping_profile
  const store = storeQuery.store

  const ready =
    !!zone && !!method && !!profile && !!store && !!rulesQuery.shipping_rules

  return (
    <RouteDrawer prev={getShippingRulesPath(zoneId)}>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading data-testid="shipping-rule-configure-heading">
            {t("shippingRules.edit.header")}
          </Heading>
        </RouteDrawer.Title>
        {ready && (
          <RouteDrawer.Description>
            {t("shippingRules.edit.description", {
              method: method.name,
              profile: profile.name,
              zone: zone.name,
            })}
          </RouteDrawer.Description>
        )}
      </RouteDrawer.Header>
      {ready && (
        <ConfigureShippingRuleForm
          zone={zone}
          method={method}
          profile={profile}
          rule={rulesQuery.shipping_rules?.[0]}
          currencyCodes={(store.supported_currencies ?? []).map(
            (currency) => currency.currency_code
          )}
        />
      )}
    </RouteDrawer>
  )
}
