import { ChartPie, CurrencyDollar, PencilSquare } from "@medusajs/icons"
import { AdminCampaign } from "@medusajs/types"
import { Container, Heading, Text } from "@medusajs/ui"
import { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { DisplayExtensionZone } from "@mercurjs/dashboard-shared"
import { ActionMenu } from "@components/common/action-menu"

type CampaignBudgetProps = {
  campaign: AdminCampaign
}

const BudgetRow = ({
  label,
  value,
  action,
  divider,
}: {
  label: string
  value: string
  action?: ReactNode
  divider?: boolean
}) => (
  <div
    className={
      divider
        ? "border-b border-ui-border-base"
        : ""
    }
  >
    <div className="bg-ui-bg-component text-ui-fg-subtle grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_28px] items-center gap-4 px-3 py-2">
      <Text size="small" leading="compact" weight="plus">
        {label}
      </Text>
      <Text size="small" leading="compact">
        {value}
      </Text>
      <div className="flex justify-end">{action}</div>
    </div>
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
    <Container className="p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("campaigns.budget.details")}</Heading>
      </div>

      <div className="flex items-start gap-x-3 px-6 pb-4">
        <div className="text-ui-fg-subtle bg-ui-bg-component shadow-elevation-card-rest flex size-7 shrink-0 items-center justify-center rounded-md">
          {isSpend ? <CurrencyDollar /> : <ChartPie />}
        </div>
        <div>
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
      </div>

      <div className="px-3 pb-3">
        <div className="overflow-hidden rounded-xl border border-ui-border-base">
          <BudgetRow
            label={t("campaigns.fields.total_used")}
            value={formatAmount(budget?.used ?? 0)}
            divider
          />

          <BudgetRow
            label={t("campaigns.fields.budget_limit")}
            value={budget?.limit != null ? formatAmount(budget.limit) : "-"}
            divider={!isSpend}
            action={
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
            }
          />

          {!isSpend && (
            <BudgetRow
              label={t("campaigns.budget.fields.budgetAttribute")}
              value={attributeLabel}
            />
          )}
        </div>
      </div>

      <DisplayExtensionZone model="campaign" zone="spend" data={campaign} />
      <DisplayExtensionZone model="campaign" zone="budget" data={campaign} />
    </Container>
  )
}
