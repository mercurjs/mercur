import { PencilSquare, Trash } from "@medusajs/icons"
import type {
  MarketplaceShippingMethodDTO,
  ShippingRuleDTO,
  ShippingZoneDTO,
} from "@mercurjs/types"
import { useTranslation } from "react-i18next"

import { ActionMenu } from "../../../../components/common/action-menu"
import { useDeleteShippingRuleAction } from "../../common/hooks/use-delete-shipping-rule-action"
import { getConfigurePath } from "../../common/utils"

type ShippingRuleRowActionsProps = {
  zone: ShippingZoneDTO
  method: MarketplaceShippingMethodDTO
  profile: { id: string; name: string }
  rule?: ShippingRuleDTO
}

export const ShippingRuleRowActions = ({
  zone,
  method,
  profile,
  rule,
}: ShippingRuleRowActionsProps) => {
  const { t } = useTranslation()

  const handleDelete = useDeleteShippingRuleAction(rule?.id ?? "", {
    zone: zone.name,
    method: method.name,
    profile: profile.name,
  })

  const testId = `shipping-rule-row-action-menu-${method.id}-${profile.id}`

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              permission: "shipping_rules:edit",
              label: t("shippingRules.actions.configure"),
              icon: <PencilSquare />,
              to: getConfigurePath(zone.id, method.id, profile.id),
            },
          ],
        },
        ...(rule
          ? [
              {
                actions: [
                  {
                    permission: "shipping_rules:manage" as const,
                    label: t("shippingRules.actions.remove"),
                    icon: <Trash />,
                    onClick: handleDelete,
                  },
                ],
              },
            ]
          : []),
      ]}
      data-testid={testId}
    />
  )
}
