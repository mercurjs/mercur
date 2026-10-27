import { Alert, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { useShippingRules } from "@hooks/api/shipping-rules"

export const MissingMandatoryShippingAlert = () => {
  const { t } = useTranslation()

  const { shipping_rules } = useShippingRules({ missing_mandatory: true })

  if (!shipping_rules?.length) {
    return null
  }

  const methods = shipping_rules
    .map((rule) => {
      const method = rule.shipping_method?.name ?? rule.shipping_method_id
      const zone = rule.shipping_zone?.name

      return zone ? `${method} (${zone})` : method
    })
    .join(", ")

  return (
    <Alert variant="warning" data-testid="location-missing-mandatory-shipping-alert">
      <div className="flex flex-col gap-y-1">
        <Text size="small" leading="compact" weight="plus">
          {t("shippingMethods.missingMandatory.title")}
        </Text>
        <Text size="small" leading="compact">
          {t("shippingMethods.missingMandatory.description", { methods })}
        </Text>
      </div>
    </Alert>
  )
}
