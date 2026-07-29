import { PencilSquare } from "@medusajs/icons"
import { AdminCampaign } from "@medusajs/types"
import { Container, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { DisplayExtensionZone } from "@mercurjs/dashboard-shared"
import { ActionMenu } from "@components/common/action-menu"

type CampaignBudgetProps = {
  campaign: AdminCampaign
}

const BudgetRow = ({ label, value }: { label: string; value: string }) => (
  <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
    <Text size="small" leading="compact" weight="plus">
      {label}
    </Text>
    <Text size="small" leading="compact">
      {value}
    </Text>
  </div>
)

export const CampaignBudget = ({ campaign }: CampaignBudgetProps) => {
  const { t } = useTranslation()

  const budget = campaign.budget as
    | (typeof campaign.budget & { attribute?: string | null })
    | undefined
  const isSpend = budget?.type === "spend"
  const currency = budget?.currency_code?.toUpperCase()

  const formatAmount = (amount: number | string) =>
    isSpend && currency ? `${amount} ${currency}` : `${amount}`

  const attributeLabel = budget?.attribute
    ? t(`campaigns.budget.attribute.${budget.attribute}`, {
        defaultValue: budget.attribute,
      })
    : "-"

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("campaigns.budget.details")}</Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  icon: <PencilSquare />,
                  label: t("actions.edit"),
                  to: "edit-budget",
                },
              ],
            },
          ]}
        />
      </div>

      <div className="px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {isSpend
            ? t("campaigns.budget.type.spend.title")
            : t("campaigns.budget.type.usage.title")}
        </Text>
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          {isSpend
            ? t("campaigns.budget.type.spend.description")
            : t("campaigns.budget.type.usage.description")}
        </Text>
      </div>

      <BudgetRow
        label={t("campaigns.fields.total_used")}
        value={formatAmount(budget?.used ?? 0)}
      />

      <BudgetRow
        label={t("campaigns.fields.budget_limit")}
        value={budget?.limit != null ? formatAmount(budget.limit) : "-"}
      />

      {!isSpend && (
        <BudgetRow
          label={t("campaigns.budget.fields.budgetAttribute")}
          value={attributeLabel}
        />
      )}

      <DisplayExtensionZone model="campaign" zone="spend" data={campaign} />
      <DisplayExtensionZone model="campaign" zone="budget" data={campaign} />
    </Container>
  )
}
