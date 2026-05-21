import { Container, Heading, StatusBadge, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { SectionRow } from "../../../../components/common/section"
import {
  computeEffectiveStock,
  getStockStatus,
  getStockStatusColor,
} from "../../common/utils"
import { OfferDetail } from "../../common/types"

type Props = { offer: OfferDetail }

export const OfferStatusSidebar = ({ offer }: Props) => {
  const { t } = useTranslation()
  const status = getStockStatus(offer)
  const available = computeEffectiveStock(offer)

  return (
    <Container
      className="divide-y p-0"
      data-testid="offer-detail-status-section"
    >
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("offers.fields.stockStatus")}</Heading>
        <StatusBadge color={getStockStatusColor(status)}>
          {t(`offers.stockStatus.${status}`)}
        </StatusBadge>
      </div>
      <SectionRow
        title={t("offers.fields.requiredQuantity")}
        value={
          <Text size="small">
            {available}
          </Text>
        }
      />
      {offer.deleted_at && (
        <SectionRow
          title={t("statuses.deleted")}
          value={
            <Text size="small" className="text-ui-fg-subtle">
              {new Date(offer.deleted_at).toLocaleDateString()}
            </Text>
          }
        />
      )}
    </Container>
  )
}
