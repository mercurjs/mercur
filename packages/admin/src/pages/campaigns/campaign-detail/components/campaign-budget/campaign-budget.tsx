import { ChartPie, CurrencyDollar, PencilSquare } from "@medusajs/icons"
import { AdminCampaign } from "@medusajs/types"
import { Container, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { ActionMenu } from "../../../../../components/common/action-menu"

type CampaignBudgetProps = {
  campaign: AdminCampaign
}

const BudgetRow = ({
  label,
  value,
  testId,
}: {
  label: string
  value: string
  testId: string
}) => (
  <div
    className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4"
    data-testid={testId}
  >
    <Text size="small" leading="compact" weight="plus">
      {label}
    </Text>

    <Text size="small" leading="compact">
      {value}
    </Text>
  </div>
)

const ATTRIBUTE_LABEL_KEYS: Record<string, string> = {
  customer_id: "fields.customer",
  customer_email: "fields.email",
  promotion_code: "fields.promotionCode",
}

export const CampaignBudget = ({ campaign }: CampaignBudgetProps) => {
  const { t } = useTranslation()

  const budget = campaign.budget
  const isSpend = budget?.type === "spend"
  const currency = isSpend ? ` ${budget?.currency_code?.toUpperCase()}` : ""

  const usedValue = `${budget?.used ?? 0}${currency}`
  const limitValue = budget?.limit
    ? `${budget.limit}${currency}`
    : t("campaigns.budget.fields.noLimit")

  const attributeKey = budget?.attribute
    ? ATTRIBUTE_LABEL_KEYS[budget.attribute]
    : undefined

  return (
    <Container className="divide-y p-0" data-testid="campaign-budget-container">
      <div
        className="flex items-center justify-between px-6 py-4"
        data-testid="campaign-budget-header"
      >
        <Heading level="h2" data-testid="campaign-budget-heading">
          {t("campaigns.budget.create.header")}
        </Heading>

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
          data-testid="campaign-budget-action-menu"
        />
      </div>

      <div
        className="flex items-center gap-x-3 px-6 py-4"
        data-testid="campaign-budget-subtitle"
      >
        <div className="bg-ui-bg-base shadow-borders-base flex size-7 items-center justify-center rounded-md">
          <div className="bg-ui-bg-component flex size-6 items-center justify-center rounded-[4px]">
            {isSpend ? (
              <CurrencyDollar className="text-ui-fg-subtle" />
            ) : (
              <ChartPie className="text-ui-fg-subtle" />
            )}
          </div>
        </div>

        <div>
          <Text size="small" leading="compact" weight="plus">
            {t(`campaigns.budget.type.${isSpend ? "spend" : "usage"}.title`)}
          </Text>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {t(
              `campaigns.budget.type.${isSpend ? "spend" : "usage"}.description`
            )}
          </Text>
        </div>
      </div>

      <BudgetRow
        label={t("campaigns.fields.budget_used")}
        value={usedValue}
        testId="campaign-budget-used"
      />

      <BudgetRow
        label={t("campaigns.fields.budget_limit")}
        value={limitValue}
        testId="campaign-budget-limit"
      />

      {!isSpend && (
        <BudgetRow
          label={t("campaigns.budget.fields.budgetAttribute")}
          value={attributeKey ? t(attributeKey) : "-"}
          testId="campaign-budget-attribute"
        />
      )}
    </Container>
  )
}
