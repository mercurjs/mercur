import { HttpTypes } from "@medusajs/types"
import { Container, Heading, InlineTip } from "@medusajs/ui"

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
    <Container className="p-0">
      <div className="flex items-center justify-between px-6 pt-6">
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
      <div className="flex flex-col gap-y-4 px-3 pb-3 pt-4">
        <DateRangeDisplay
          startsAt={campaign.starts_at}
          endsAt={campaign.ends_at}
          showTime
        />
        <InlineTip variant="warning" label={t("general.warning")}>
          {t("campaigns.configuration.expiryWarning")}
        </InlineTip>
      </div>
      <DisplayExtensionZone
        model="campaign"
        zone="configuration"
        data={campaign}
      />
    </Container>
  )
}
