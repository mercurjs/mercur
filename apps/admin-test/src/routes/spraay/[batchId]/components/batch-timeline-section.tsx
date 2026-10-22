import { Container, Heading } from "@medusajs/ui"
import { SectionRow, useDate } from "@mercurjs/dashboard-shared"
import { useTranslation } from "react-i18next"

import type { SpraayBatch } from "../../../../lib/spraay/api"

export const BatchTimelineSection = ({ batch }: { batch: SpraayBatch }) => {
  const { t } = useTranslation()
  const { getFullDate } = useDate()

  const format = (date: string | Date | null) => (date ? getFullDate({ date, includeTime: true }) : "-")
  const awaitingSignature = batch.status === "assembling" || batch.status === "awaiting_signature"

  return (
    <Container className="divide-y p-0" data-testid="spraay-batch-timeline-section">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("spraay.timeline.title")}</Heading>
      </div>
      <SectionRow title={t("spraay.timeline.assembled")} value={format(batch.assembled_at)} />
      <SectionRow title={t("spraay.timeline.signed")} value={format(batch.signed_at)} />
      <SectionRow title={t("spraay.timeline.broadcast")} value={format(batch.broadcast_at)} />
      <SectionRow title={t("spraay.timeline.settled")} value={format(batch.settled_at)} />
      {awaitingSignature && (
        <SectionRow title={t("spraay.timeline.expires")} value={format(batch.expires_at)} />
      )}
    </Container>
  )
}
