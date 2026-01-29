import { PencilSquare } from "@medusajs/icons"
import { ApplicationMethodTargetTypeValues, HttpTypes, PromotionRuleTypes, } from "@medusajs/types"
import { Badge, Container, Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { ActionMenu } from "../../../../../components/common/action-menu"
import { BadgeListSummary } from "../../../../../components/common/badge-list-summary"
import { NoRecords } from "../../../../../components/common/empty-table-content"

type RuleProps = {
  rule: HttpTypes.AdminPromotionRule
}

function RuleBlock({ rule }: RuleProps) {
  return (
    <div className="bg-ui-bg-subtle shadow-borders-base align-center flex justify-around rounded-md p-2">
      <div className="text-ui-fg-subtle txt-compact-xsmall flex items-center whitespace-nowrap">
        <Badge
          size="2xsmall"
          key="rule-attribute"
          className="txt-compact-xsmall-plus tag-neutral-text mx-1 inline-block truncate"
        >
          {rule.attribute_label}
        </Badge>

        <span className="txt-compact-2xsmall mx-1 inline-block">
          {rule.operator_label}
        </span>

        <BadgeListSummary
          inline
          className="!txt-compact-small-plus"
          list={
            rule.field_type === "number"
              ? [rule.values]
              : rule.values?.map((v) => v.label)
          }
        />
      </div>
    </div>
  )
}

type PromotionConditionsSectionProps = {
  rules: HttpTypes.AdminPromotionRule[]
  ruleType: PromotionRuleTypes
  applicationMethodTargetType: ApplicationMethodTargetTypeValues
}

export const PromotionConditionsSection = ({
  rules,
  ruleType,
  applicationMethodTargetType,
}: PromotionConditionsSectionProps) => {
  const { t } = useTranslation()

  return (
    <Container className="p-0" data-testid={`promotion-conditions-section-container-${ruleType}`}>
      <div className="flex items-center justify-between px-6 py-4" data-testid={`promotion-conditions-section-header-${ruleType}`}>
        <div className="flex flex-col">
          <Heading data-testid={`promotion-conditions-section-heading-${ruleType}`}>
            {t(
              ruleType === "target-rules"
                ? `promotions.fields.conditions.${ruleType}.${applicationMethodTargetType}.title`
                : `promotions.fields.conditions.${ruleType}.title`
            )}
          </Heading>
        </div>

        <ActionMenu
          groups={[
            {
              actions: [
                {
                  icon: <PencilSquare />,
                  label: t("actions.edit"),
                  to: `${ruleType}/edit`,
                },
              ],
            },
          ]}
          data-testid={`promotion-conditions-section-action-menu-${ruleType}`}
        />
      </div>

      <div className="text-ui-fg-subtle flex flex-col gap-2 px-6 pb-4 pt-2" data-testid={`promotion-conditions-section-content-${ruleType}`}>
        {!rules.length && (
          <div data-testid={`promotion-conditions-section-no-records-${ruleType}`}>
            <NoRecords
              className="h-[180px]"
              title={t("general.noRecordsTitle")}
              message={t("promotions.conditions.list.noRecordsMessage")}
              action={{
                to: `${ruleType}/edit`,
                label: t("promotions.conditions.add"),
              }}
              buttonVariant="transparentIconLeft"
              dataTestId={`promotion-conditions-section-add-condition-button-${ruleType}`}
            />
          </div>
        )}

        {rules.map((rule) => (
          <div key={`${rule.id}-${rule.attribute}`} data-testid={`promotion-conditions-section-rule-${rule.id}`}>
            <RuleBlock rule={rule} />
          </div>
        ))}
      </div>
    </Container>
  )
}
