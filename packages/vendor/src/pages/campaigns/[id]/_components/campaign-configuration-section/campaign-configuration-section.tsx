import { HttpTypes } from "@medusajs/types"
import { Container, Heading, Text } from "@medusajs/ui"

import { PencilSquare } from "@medusajs/icons"
import { useTranslation } from "react-i18next"
import { DisplayExtensionZone } from "@mercurjs/dashboard-shared"
import { ActionMenu } from "@components/common/action-menu"
import { DateRangeDisplay } from "@components/common/date-range-display"

type CampaignConfigurationSectionProps = {
  campaign: HttpTypes.AdminCampaign
}

export const CampaignConfigurationSection = ({
  campaign,
}: CampaignConfigurationSectionProps) => {
  const { t } = useTranslation()

  return (
    <Container className="flex flex-col gap-y-4">
      <div className="flex items-center justify-between">
        <Heading level="h2">{t("campaigns.configuration.header")}</Heading>
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
        />
      </div>
      <DateRangeDisplay
        startsAt={campaign.starts_at}
        endsAt={campaign.ends_at}
        showTime
      />
      <div className="bg-ui-bg-component shadow-elevation-card-rest border-ui-tag-orange-icon flex rounded-lg border-l-2 px-3 py-2">
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          <span className="text-ui-fg-base txt-compact-small-plus">
            {t("general.warning")}:
          </span>{" "}
          {t("campaigns.configuration.expiryWarning")}
        </Text>
      </div>
      <DisplayExtensionZone
        model="campaign"
        zone="configuration"
        data={campaign}
      />
    </Container>
  )
}
