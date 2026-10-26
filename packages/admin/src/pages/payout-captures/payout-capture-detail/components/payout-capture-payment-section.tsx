import { Badge, Container, Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { SectionRow } from "../../../../components/common/section"
import { AdminPayoutCapture } from "../../../../hooks/api/payout-captures"

export const PayoutCapturePaymentSection = ({
  capture,
}: {
  capture: AdminPayoutCapture
}) => {
  const { t } = useTranslation()

  return (
    <Container className="divide-y p-0" data-testid="payout-capture-payment-section">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("payoutCaptures.payment.header")}</Heading>
      </div>
      <SectionRow
        title={t("payoutCaptures.fields.provider")}
        value={<Badge size="2xsmall">{capture.provider_id}</Badge>}
      />
      <SectionRow
        title={t("payoutCaptures.fields.currency")}
        value={capture.currency_code.toUpperCase()}
      />
      <SectionRow
        title={t("payoutCaptures.fields.paymentId")}
        value={<Badge size="2xsmall">{capture.payment_id}</Badge>}
      />
      <SectionRow
        title={t("payoutCaptures.fields.paymentCollectionId")}
        value={<Badge size="2xsmall">{capture.payment_collection_id}</Badge>}
      />
    </Container>
  )
}
