import { ChartPie, CurrencyDollar, PencilSquare } from "@medusajs/icons"
import { AdminCampaign } from "@medusajs/types"
import { Container, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { ActionMenu } from "../../../../../components/common/action-menu"

type CampaignBudgetProps = {
  campaign: AdminCampaign
}

type BudgetPill = {
  label: string
  value: string
  testId: string
  editTo?: string
}

const BudgetPills = ({ pills }: { pills: BudgetPill[] }) => {
  const { t } = useTranslation()

  return (
    <div className="overflow-hidden rounded-xl border border-ui-border-base">
      {pills.map((pill, index) => (
        <div
          key={pill.testId}
          className={
            index < pills.length - 1 ? "border-b border-ui-border-base" : ""
          }
        >
          <div
            className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_28px] items-center gap-4 bg-ui-bg-component px-3 py-2"
            data-testid={pill.testId}
          >
            <Text
              size="small"
              weight="plus"
              leading="compact"
              className="text-ui-fg-subtle"
            >
              {pill.label}
            </Text>

            <Text
              size="small"
              leading="compact"
              className="text-ui-fg-subtle"
            >
              {pill.value}
            </Text>

            {pill.editTo ? (
              <ActionMenu
                groups={[
                  {
                    actions: [
                      {
                        icon: <PencilSquare />,
                        label: t("actions.edit"),
                        to: pill.editTo,
                      },
                    ],
                  },
                ]}
                data-testid={`${pill.testId}-action-menu`}
              />
            ) : (
              <span />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

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

  const pills: BudgetPill[] = [
    {
      label: t("campaigns.fields.budget_used"),
      value: usedValue,
      testId: "campaign-budget-used",
    },
    {
      label: t("campaigns.fields.budget_limit"),
      value: limitValue,
      testId: "campaign-budget-limit",
      editTo: "edit-budget",
    },
  ]

  if (!isSpend) {
    pills.push({
      label: t("campaigns.budget.fields.budgetAttribute"),
      value: attributeKey ? t(attributeKey) : "-",
      testId: "campaign-budget-attribute",
    })
  }

  return (
    <Container className="p-0" data-testid="campaign-budget-container">
      <div
        className="flex items-center justify-between px-6 py-4"
        data-testid="campaign-budget-header"
      >
        <Heading level="h2" data-testid="campaign-budget-heading">
          {t("campaigns.budget.title")}
        </Heading>
      </div>

      <div className="flex flex-col gap-y-4">
        <div
          className="flex items-center gap-x-3 px-6"
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

        <div className="px-3 pb-3">
          <BudgetPills pills={pills} />
        </div>
      </div>
    </Container>
  )
}
