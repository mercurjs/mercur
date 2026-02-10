import { PencilSquare } from "@medusajs/icons"
import { Badge, Container, Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { ActionMenu } from "@components/common/action-menu"
import { BadgeListSummary } from "@components/common/badge-list-summary"
import { NoRecords } from "@components/common/empty-table-content"
import { ExtendedPromotionRuleWithValues, FormattedPromotionRuleTypes } from "@custom-types/promotion"

type RuleProps = {
  rule: ExtendedPromotionRuleWithValues
}
function RuleBlock({ rule }: RuleProps) {
  const getValuesList = (): string[] => {
    if (rule.field_type === "number") {
      return Array.isArray(rule.values) 
        ? rule.values.map((v) => String(v.value || v))
        : [String(rule.values)]
    }
    return rule.values?.map((v) => v.label || v.value || String(v)).filter(Boolean) || []
  }

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
          list={getValuesList()}
        />
      </div>
    </div>
  )
}

type PromotionConditionsSectionProps = {
  rules: ExtendedPromotionRuleWithValues[]
  ruleType: FormattedPromotionRuleTypes
}

export const PromotionConditionsSection = ({
  rules,
  ruleType,
}: PromotionConditionsSectionProps) => {
  const { t } = useTranslation()
  const translationKey = `promotions.fields.conditions.${ruleType}.title` as const
  
  return (
    <Container className="p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex flex-col">
          <Heading>
            {t(translationKey)}
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
        />
      </div>

      <div className="text-ui-fg-subtle flex flex-col gap-2 px-6 pb-4 pt-2">
        {!rules.length && (
          <NoRecords
            className="h-[180px]"
            title={t("general.noRecordsTitle")}
            message={t("promotions.conditions.list.noRecordsMessage")}
            action={{
              to: `${ruleType}/edit`,
              label: t("promotions.conditions.add"),
            }}
            buttonVariant="transparentIconLeft"
          />
        )}

        {rules.map((rule) => (
          <RuleBlock key={`${rule.id}-${rule.attribute}`} rule={rule} />
        ))}
      </div>
    </Container>
  )
}
