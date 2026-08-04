import { PencilSquare } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Container, Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { DisplayExtensionZone } from "@mercurjs/dashboard-shared"

import { ActionMenu } from "@components/common/action-menu"
import { DateRangeDisplay } from "@components/common/date-range-display"

type PriceListConfigurationSectionProps = {
  priceList: HttpTypes.AdminPriceList
}

export const PriceListConfigurationSection = ({
  priceList,
}: PriceListConfigurationSectionProps) => {
  const { t } = useTranslation()

  return (
    <Container className="flex flex-col gap-y-4" data-testid="price-list-configuration-section-container">
      <div className="flex items-center justify-between" data-testid="price-list-configuration-section-header">
        <Heading level="h2" data-testid="price-list-configuration-section-heading">{t("priceLists.configuration.header")}</Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  label: t("actions.edit"),
                  to: "configuration",
                  icon: <PencilSquare />,
                },
              ],
            },
          ]}
        />
      </div>

      <DateRangeDisplay
        endsAt={priceList.ends_at}
        startsAt={priceList.starts_at}
        showTime
      />

      <DisplayExtensionZone
        model="price_list"
        zone="configuration"
        data={priceList}
      />
    </Container>
  )
}
