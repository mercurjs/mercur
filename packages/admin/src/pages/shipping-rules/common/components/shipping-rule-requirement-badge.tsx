import { StatusBadge, Text } from "@medusajs/ui"
import type { ShippingRuleDTO } from "@mercurjs/types"
import { useTranslation } from "react-i18next"

const requirementColors = {
  mandatory: "orange",
  optional: "green",
  not_supported: "grey",
} as const

export const ShippingRuleRequirementBadge = ({
  requirement,
}: {
  requirement?: ShippingRuleDTO["requirement"]
}) => {
  const { t } = useTranslation()

  if (!requirement) {
    return (
      <Text size="small" leading="compact" className="text-ui-fg-muted">
        {t("shippingRules.requirement.notConfigured")}
      </Text>
    )
  }

  return (
    <StatusBadge color={requirementColors[requirement]}>
      {t(`shippingRules.requirement.${requirement}`)}
    </StatusBadge>
  )
}
