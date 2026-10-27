import { Container, Heading, Select, Text } from "@medusajs/ui"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"

import { NoRecords } from "../../../../components/common/empty-table-content"
import { TableSkeleton } from "../../../../components/common/skeleton"
import { useShippingMethods } from "../../../../hooks/api/shipping-methods"
import { useShippingProfiles } from "../../../../hooks/api/shipping-profiles"
import { useShippingZones } from "../../../../hooks/api/shipping-zones"
import { useDocumentDirection } from "../../../../hooks/use-document-direction"
import { ShippingRuleMatrix } from "./shipping-rule-matrix"

export const ShippingRuleListTitle = () => {
  const { t } = useTranslation()

  return (
    <div>
      <Heading data-testid="shipping-rule-list-heading">
        {t("shippingRules.domain")}
      </Heading>
      <Text
        className="text-ui-fg-subtle"
        size="small"
        data-testid="shipping-rule-list-subtitle"
      >
        {t("shippingRules.subtitle")}
      </Text>
    </div>
  )
}

export const ShippingRuleListView = () => {
  const { t } = useTranslation()
  const direction = useDocumentDirection()
  const [searchParams, setSearchParams] = useSearchParams()

  const zonesQuery = useShippingZones({ limit: 1000 })
  const methodsQuery = useShippingMethods({ limit: 1000 })
  const profilesQuery = useShippingProfiles({ limit: 1000 })

  const zones = zonesQuery.shipping_zones ?? []
  const methods = methodsQuery.shipping_methods ?? []
  const profiles = profilesQuery.shipping_profiles ?? []

  const requestedZoneId = searchParams.get("zone")
  const zone = zones.find((z) => z.id === requestedZoneId) ?? zones[0]

  useEffect(() => {
    if (zone && zone.id !== requestedZoneId) {
      setSearchParams(
        (prev) => {
          prev.set("zone", zone.id)
          return prev
        },
        { replace: true }
      )
    }
  }, [zone, requestedZoneId, setSearchParams])

  const error = zonesQuery.error ?? methodsQuery.error ?? profilesQuery.error

  if (error) {
    throw error
  }

  const isLoading =
    zonesQuery.isLoading || methodsQuery.isLoading || profilesQuery.isLoading

  const renderContent = () => {
    if (isLoading) {
      return (
        <TableSkeleton
          rowCount={5}
          search={false}
          filters={false}
          orderBy={false}
          pagination={false}
        />
      )
    }

    if (!zone) {
      return (
        <NoRecords
          title={t("shippingRules.noZones.title")}
          message={t("shippingRules.noZones.message")}
          action={{
            to: "/settings/locations/shipping-zones/create",
            label: t("shippingRules.noZones.action"),
            permission: "shipping_rules:edit",
          }}
          dataTestId="shipping-rule-list-no-zones-action"
        />
      )
    }

    if (!methods.length) {
      return (
        <NoRecords
          title={t("shippingRules.noMethods.title")}
          message={t("shippingRules.noMethods.message")}
          action={{
            to: "/settings/locations/shipping-methods/create",
            label: t("shippingRules.noMethods.action"),
            permission: "shipping_rules:edit",
          }}
          dataTestId="shipping-rule-list-no-methods-action"
        />
      )
    }

    if (!profiles.length) {
      return (
        <NoRecords
          title={t("shippingRules.noProfiles.title")}
          message={t("shippingRules.noProfiles.message")}
          action={{
            to: "/settings/locations/shipping-profiles/create",
            label: t("shippingRules.noProfiles.action"),
            permission: "shipping_profiles:edit",
          }}
          dataTestId="shipping-rule-list-no-profiles-action"
        />
      )
    }

    return (
      <ShippingRuleMatrix zone={zone} methods={methods} profiles={profiles} />
    )
  }

  return (
    <Container className="divide-y p-0" data-testid="shipping-rule-list">
      <div className="flex flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <ShippingRuleListTitle />
        {zones.length > 0 && (
          <div className="w-full md:w-[240px]">
            <Select
              dir={direction}
              value={zone?.id}
              onValueChange={(value) =>
                setSearchParams(
                  (prev) => {
                    prev.set("zone", value)
                    return prev
                  },
                  { replace: true }
                )
              }
            >
              <Select.Trigger
                aria-label={t("shippingRules.zone")}
                data-testid="shipping-rule-list-zone-select"
              >
                <Select.Value placeholder={t("shippingRules.zonePlaceholder")} />
              </Select.Trigger>
              <Select.Content>
                {zones.map((z) => (
                  <Select.Item
                    key={z.id}
                    value={z.id}
                    data-testid={`shipping-rule-list-zone-option-${z.id}`}
                  >
                    {z.name}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>
        )}
      </div>
      {renderContent()}
    </Container>
  )
}
