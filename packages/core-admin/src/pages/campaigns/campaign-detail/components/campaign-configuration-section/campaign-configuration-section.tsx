import { HttpTypes } from "@medusajs/types"
import { Container, Heading } from "@medusajs/ui"

import { PencilSquare } from "@medusajs/icons"
import { useTranslation } from "react-i18next"
import { ActionMenu } from "../../../../../components/common/action-menu"
import { DateRangeDisplay } from "../../../../../components/common/date-range-display"

type CampaignConfigurationSectionProps = {
  campaign: HttpTypes.AdminCampaign
}

export const CampaignConfigurationSection = ({
  campaign,
}: CampaignConfigurationSectionProps) => {
  const { t } = useTranslation()

  return (
    <Container className="flex flex-col gap-y-4" data-testid="campaign-configuration-section-container">
      <div className="flex items-center justify-between" data-testid="campaign-configuration-section-header">
        <Heading level="h2" data-testid="campaign-configuration-section-heading">{t("campaigns.configuration.header")}</Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  label: t("actions.edit"),
                  icon: <PencilSquare />,
                  to: "configuration",
                },
              ],
            },
          ]}
          data-testid="campaign-configuration-section-action-menu"
        />
      </div>
      <DateRangeDisplay
        startsAt={campaign.starts_at}
        endsAt={campaign.ends_at}
        showTime
        data-testid="campaign-configuration-section-date-range"
      />
    </Container>
  )
}
