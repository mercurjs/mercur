import { Table, Text } from "@medusajs/ui"
import type {
  MarketplaceShippingMethodDTO,
  ShippingRuleDTO,
  ShippingZoneDTO,
} from "@mercurjs/types"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { ListSummary } from "../../../../components/common/list-summary"
import { NoRecords } from "../../../../components/common/empty-table-content"
import { TableSkeleton } from "../../../../components/common/skeleton"
import { useShippingRules } from "../../../../hooks/api/shipping-rules"
import { ShippingRuleRequirementBadge } from "../../common/components/shipping-rule-requirement-badge"
import {
  formatRulePrices,
  formatTransit,
  getConfigurePath,
} from "../../common/utils"
import { ShippingRuleRowActions } from "./shipping-rule-row-actions"

type ShippingProfileOption = { id: string; name: string }

type ShippingRuleMatrixProps = {
  zone: ShippingZoneDTO
  methods: MarketplaceShippingMethodDTO[]
  profiles: ShippingProfileOption[]
}

const Placeholder = () => (
  <Text size="small" leading="compact" className="text-ui-fg-muted">
    -
  </Text>
)

export const ShippingRuleMatrix = ({
  zone,
  methods,
  profiles,
}: ShippingRuleMatrixProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { shipping_rules, isLoading, isError, error } = useShippingRules({
    shipping_zone_id: zone.id,
    limit: 1000,
  })

  const rows = useMemo(() => {
    const rulesByCell = new Map<string, ShippingRuleDTO>(
      (shipping_rules ?? []).map((rule) => [
        `${rule.shipping_method_id}:${rule.shipping_profile_id}`,
        rule,
      ])
    )

    return methods.flatMap((method) =>
      profiles.map((profile) => ({
        method,
        profile,
        rule: rulesByCell.get(`${method.id}:${profile.id}`),
      }))
    )
  }, [shipping_rules, methods, profiles])

  if (isError) {
    throw error
  }

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

  if (!rows.length) {
    return <NoRecords />
  }

  return (
    <Table data-testid="shipping-rule-matrix">
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>{t("shippingRules.columns.method")}</Table.HeaderCell>
          <Table.HeaderCell>{t("shippingRules.columns.profile")}</Table.HeaderCell>
          <Table.HeaderCell>
            {t("shippingRules.columns.requirement")}
          </Table.HeaderCell>
          <Table.HeaderCell>{t("shippingRules.columns.price")}</Table.HeaderCell>
          <Table.HeaderCell>
            {t("shippingRules.columns.sellerCanEditPrice")}
          </Table.HeaderCell>
          <Table.HeaderCell>{t("shippingRules.columns.transit")}</Table.HeaderCell>
          <Table.HeaderCell />
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {rows.map(({ method, profile, rule }) => {
          const prices = rule ? formatRulePrices(rule) : []
          const transit = rule ? formatTransit(rule, t) : undefined

          return (
            <Table.Row
              key={`${method.id}-${profile.id}`}
              className="cursor-pointer"
              onClick={() =>
                navigate(getConfigurePath(zone.id, method.id, profile.id))
              }
              data-testid={`shipping-rule-row-${method.id}-${profile.id}`}
            >
              <Table.Cell>
                <Text size="small" leading="compact" weight="plus">
                  {method.name}
                </Text>
              </Table.Cell>
              <Table.Cell>{profile.name}</Table.Cell>
              <Table.Cell>
                <ShippingRuleRequirementBadge requirement={rule?.requirement} />
              </Table.Cell>
              <Table.Cell>
                {prices.length ? <ListSummary list={prices} /> : <Placeholder />}
              </Table.Cell>
              <Table.Cell>
                {rule ? (
                  rule.seller_can_edit_price ? (
                    t("general.yes")
                  ) : (
                    t("general.no")
                  )
                ) : (
                  <Placeholder />
                )}
              </Table.Cell>
              <Table.Cell>{transit ?? <Placeholder />}</Table.Cell>
              <Table.Cell onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-end">
                  <ShippingRuleRowActions
                    zone={zone}
                    method={method}
                    profile={profile}
                    rule={rule}
                  />
                </div>
              </Table.Cell>
            </Table.Row>
          )
        })}
      </Table.Body>
    </Table>
  )
}
