import { CurrencyDollar } from "@medusajs/icons"
import { AdminCampaign } from "@medusajs/types"
import { Container, Heading, Text } from "@medusajs/ui"
import { Trans, useTranslation } from "react-i18next"

type CampaignSpendProps = {
  campaign: AdminCampaign
}

export const CampaignSpend = ({ campaign }: CampaignSpendProps) => {
  const { t } = useTranslation()

  return (
    <Container className="flex flex-col gap-y-4 px-6 py-4" data-testid="campaign-spend-container">
      <div className="mb-2 grid grid-cols-[28px_1fr] items-center gap-x-3" data-testid="campaign-spend-header">
        <div className="bg-ui-bg-base shadow-borders-base flex size-7 items-center justify-center rounded-md" data-testid="campaign-spend-icon-container">
          <div className="bg-ui-bg-component flex size-6 items-center justify-center rounded-[4px]">
            <CurrencyDollar className="text-ui-fg-subtle" />
          </div>
        </div>

        <Heading level="h3" className="text-ui-fg-subtle font-normal" data-testid="campaign-spend-heading">
          {campaign.budget?.type === "use_by_attribute"
            ? t("campaigns.fields.totalUsedByAttribute")
            : campaign.budget?.type === "spend"
              ? t("campaigns.fields.total_spend")
              : t("campaigns.fields.total_used")}
        </Heading>
      </div>

      <div data-testid="campaign-spend-value">
        <Text
          className="text-ui-fg-subtle border-ui-border-strong border-l-4 pl-3"
          size="small"
          leading="compact"
          data-testid="campaign-spend-value-text"
        >
          <Trans
            i18nKey="campaigns.totalSpend"
            values={{
              amount: campaign?.budget?.used || 0,
              currency:
                campaign?.budget?.type === "spend"
                  ? campaign?.budget?.currency_code
                  : "",
            }}
            components={[
              <span
                key="amount"
                className="text-ui-fg-base txt-compact-medium-plus text-lg"
                data-testid="campaign-spend-value-amount"
              />,
              <span
                key="currency"
                className="text-ui-fg-base txt-compact-medium-plus text-lg"
                data-testid="campaign-spend-value-currency"
              />,
            ]}
          />
        </Text>
      </div>
    </Container>
  )
}
