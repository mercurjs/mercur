import { Button, Container, Heading, Table, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { ListSummary } from "../../../../../components/common/list-summary"
import { useShippingRules } from "../../../../../hooks/api/shipping-rules"
import { ShippingRuleRequirementBadge } from "../../../../shipping-rules/common/components/shipping-rule-requirement-badge"
import {
  formatRulePrices,
  getShippingRulesPath,
} from "../../../../shipping-rules/common/utils"

export const ShippingProfileRulesSection = ({
  profileId,
}: {
  profileId: string
}) => {
  const { t } = useTranslation()

  const { shipping_rules, isLoading, isError, error } = useShippingRules({
    shipping_profile_id: profileId,
    limit: 1000,
  })

  if (isError) {
    throw error
  }

  const rules = shipping_rules ?? []

  return (
    <Container
      className="divide-y p-0"
      data-testid="shipping-profile-rules-section"
    >
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2" data-testid="shipping-profile-rules-section-heading">
          {t("shippingRules.profileSection.title")}
        </Heading>
        <Button
          size="small"
          variant="secondary"
          asChild
          data-testid="shipping-profile-rules-section-manage-button"
        >
          <Link to={getShippingRulesPath()}>
            {t("shippingRules.actions.manage")}
          </Link>
        </Button>
      </div>
      {!isLoading && rules.length === 0 ? (
        <div className="px-6 py-4">
          <Text size="small" className="text-ui-fg-subtle">
            {t("shippingRules.profileSection.empty")}
          </Text>
        </div>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>{t("shippingRules.columns.zone")}</Table.HeaderCell>
              <Table.HeaderCell>
                {t("shippingRules.columns.method")}
              </Table.HeaderCell>
              <Table.HeaderCell>
                {t("shippingRules.columns.requirement")}
              </Table.HeaderCell>
              <Table.HeaderCell>{t("shippingRules.columns.price")}</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {rules.map((rule) => {
              const prices = formatRulePrices(rule)

              return (
                <Table.Row
                  key={rule.id}
                  data-testid={`shipping-profile-rules-section-row-${rule.id}`}
                >
                  <Table.Cell>
                    <Link
                      to={getShippingRulesPath(rule.shipping_zone_id)}
                      className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
                    >
                      {rule.shipping_zone?.name ?? rule.shipping_zone_id}
                    </Link>
                  </Table.Cell>
                  <Table.Cell>
                    {rule.shipping_method?.name ?? rule.shipping_method_id}
                  </Table.Cell>
                  <Table.Cell>
                    <ShippingRuleRequirementBadge
                      requirement={rule.requirement}
                    />
                  </Table.Cell>
                  <Table.Cell>
                    {prices.length ? <ListSummary list={prices} /> : "-"}
                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table>
      )}
    </Container>
  )
}
