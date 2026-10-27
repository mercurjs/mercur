import { CheckCircle, PencilSquare, XCircle } from "@medusajs/icons"
import {
  Badge,
  Container,
  Heading,
  StatusBadge,
  Text,
  toast,
  usePrompt,
} from "@medusajs/ui"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { usePermissions } from "@mercurjs/dashboard-shared"
import { ActionMenu, ActionGroup } from "@components/common/action-menu"
import { NoRecords } from "@components/common/empty-table-content"
import { Skeleton } from "@components/common/skeleton"
import { useRegions } from "@hooks/api/regions"
import { useDeleteShippingOption } from "@hooks/api/shipping-options"
import { useShippingProfiles } from "@hooks/api/shipping-profiles"
import { useShippingRules } from "@hooks/api/shipping-rules"
import {
  RegionLite,
  VendorShippingRule,
  formatRulePrice,
  formatTransit,
  getEffectiveTransit,
  getProfileDisplayName,
} from "@pages/settings/locations/_common/shipping-methods"

type ZoneGroup = {
  id: string
  name: string
  countryCount: number
  rules: VendorShippingRule[]
}

const groupByZone = (rules: VendorShippingRule[]): ZoneGroup[] => {
  const groups = new Map<string, ZoneGroup>()

  for (const rule of rules) {
    const zone = rule.shipping_zone
    const id = zone?.id ?? rule.shipping_zone_id
    const group = groups.get(id) ?? {
      id,
      name: zone?.name ?? id,
      countryCount: new Set(zone?.geo_zones.map((geo) => geo.country_code))
        .size,
      rules: [],
    }

    group.rules.push(rule)
    groups.set(id, group)
  }

  return Array.from(groups.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  )
}

type ShippingMethodRowProps = {
  rule: VendorShippingRule
  profileName: string | null
  regions: RegionLite[]
}

const ShippingMethodRow = ({
  rule,
  profileName,
  regions,
}: ShippingMethodRowProps) => {
  const { t } = useTranslation()
  const prompt = usePrompt()

  const option = rule.seller_shipping_options[0]
  const isEnabled = !!option
  const name = rule.shipping_method?.name ?? rule.shipping_method_id
  const isMandatory = rule.requirement === "mandatory"

  const { mutateAsync: deleteOption } = useDeleteShippingOption(
    option?.id ?? ""
  )

  const handleDisable = async () => {
    const confirmed = await prompt({
      title: t("general.areYouSure"),
      description: t("shippingMethods.disable.confirmation", { name }),
      confirmText: t("shippingMethods.actions.disable"),
      cancelText: t("actions.cancel"),
    })

    if (!confirmed) {
      return
    }

    await deleteOption(undefined, {
      onSuccess: () => {
        toast.success(t("shippingMethods.disable.successToast", { name }))
      },
      onError: (e) => {
        toast.error(e.message)
      },
    })
  }

  const price = formatRulePrice(t, rule, regions)
  const transit = formatTransit(
    t,
    getEffectiveTransit(rule, option?.metadata)
  )
  const details = [profileName, price, transit].filter(Boolean).join(" · ")

  const canEdit =
    (rule.price_type === "flat" && rule.seller_can_edit_price) ||
    rule.seller_can_edit_transit

  const groups: ActionGroup[] = isEnabled
    ? [
        ...(canEdit
          ? [
              {
                actions: [
                  {
                    icon: <PencilSquare />,
                    label: t("shippingMethods.actions.edit"),
                    permission: "shipping_options:edit" as const,
                    to: `shipping-options/${option.id}/edit`,
                  },
                ],
              },
            ]
          : []),
        {
          actions: [
            {
              icon: <XCircle />,
              label: t("shippingMethods.actions.disable"),
              permission: "shipping_options:manage" as const,
              onClick: handleDisable,
            },
          ],
        },
      ]
    : [
        {
          actions: [
            {
              icon: <CheckCircle />,
              label: t("shippingMethods.actions.enable"),
              permission: "shipping_options:edit" as const,
              to: `shipping-rules/${rule.id}/enable`,
            },
          ],
        },
      ]

  return (
    <div
      className="flex items-center justify-between gap-x-4 px-6 py-4"
      data-testid={`location-shipping-method-row-${rule.id}`}
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <Text size="small" leading="compact" weight="plus">
          {name}
        </Text>
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          {details}
        </Text>
      </div>
      <div className="flex shrink-0 items-center gap-x-2">
        <Badge size="2xsmall" color={isMandatory ? "orange" : "grey"}>
          {isMandatory
            ? t("shippingMethods.requirement.mandatory")
            : t("shippingMethods.requirement.optional")}
        </Badge>
        <StatusBadge color={isEnabled ? "green" : "grey"}>
          {isEnabled
            ? t("shippingMethods.status.enabled")
            : t("shippingMethods.status.notEnabled")}
        </StatusBadge>
        <ActionMenu groups={groups} />
      </div>
    </div>
  )
}

type LocationShippingMethodsSectionProps = {
  locationId: string
}

export const LocationShippingMethodsSection = ({
  locationId,
}: LocationShippingMethodsSectionProps) => {
  const { t } = useTranslation()
  const { can } = usePermissions()

  const { shipping_rules, isPending, isError, error } = useShippingRules({
    stock_location_id: locationId,
  })

  const { shipping_profiles } = useShippingProfiles(
    { fields: "id,name", limit: 999 },
    { enabled: can("shipping_profiles") }
  )

  const { regions } = useRegions(
    { fields: "id,name,currency_code", limit: 999 },
    { enabled: can("regions") }
  )

  const zones = useMemo(
    () => groupByZone(shipping_rules ?? []),
    [shipping_rules]
  )

  if (isError) {
    throw error
  }

  const getProfileName = (id: string) =>
    getProfileDisplayName(
      shipping_profiles?.find((profile) => profile.id === id)?.name
    )

  return (
    <Container
      className="divide-y p-0"
      data-testid="location-shipping-methods-section"
    >
      <div className="flex flex-col px-6 py-4">
        <Heading level="h2">{t("shippingMethods.header")}</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          {t("shippingMethods.description")}
        </Text>
      </div>

      {isPending && (
        <div className="flex flex-col gap-y-2 px-6 py-4">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
        </div>
      )}

      {!isPending && zones.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <NoRecords
            className="h-fit"
            message={t("shippingMethods.noRecords")}
          />
        </div>
      )}

      {zones.map((zone) => (
        <div
          key={zone.id}
          className="flex flex-col divide-y"
          data-testid={`location-shipping-zone-${zone.id}`}
        >
          <div className="bg-ui-bg-subtle flex items-center justify-between px-6 py-2">
            <Text size="small" leading="compact" weight="plus">
              {zone.name}
            </Text>
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              {t("shippingMethods.zoneCountries", {
                count: zone.countryCount,
              })}
            </Text>
          </div>
          {zone.rules.map((rule) => (
            <ShippingMethodRow
              key={rule.id}
              rule={rule}
              profileName={getProfileName(rule.shipping_profile_id)}
              regions={(regions ?? []) as RegionLite[]}
            />
          ))}
        </div>
      ))}
    </Container>
  )
}
