import { Container, Heading, StatusBadge } from "@medusajs/ui";
import { PayoutDTO } from "@mercurjs/types";
import { DisplayExtensionZone, DisplayField } from "@mercurjs/dashboard-shared";
import { useTranslation } from "react-i18next";

import { SectionRow } from "@components/common/section";
import { useDate } from "@hooks/use-date";
import { getStylizedAmount } from "@lib/money-amount-helpers";

import { payoutStatusColor } from "../../_components/payout-status";

const GENERAL_FIELD_IDS = ["amount", "status", "display_id", "created_at", "updated_at"];

export const PayoutGeneralSection = ({ payout }: { payout: PayoutDTO }) => {
  const { t } = useTranslation();
  const { getFullDate } = useDate();

  const formatDate = (value: Date | string | null | undefined) =>
    value ? getFullDate({ date: value, includeTime: true }) : "-";

  return (
    <Container className="divide-y p-0" data-testid="payout-general-section">
      <div className="flex items-center justify-between px-6 py-4">
        <DisplayField model="payout" zone="general" id="amount" data={payout}>
          <Heading data-testid="payout-general-section-heading">
            {getStylizedAmount(Number(payout.amount), payout.currency_code)}
          </Heading>
        </DisplayField>
        <DisplayField model="payout" zone="general" id="status" data={payout}>
          <StatusBadge
            color={payoutStatusColor(payout.status)}
            data-testid="payout-general-section-status-badge"
          >
            {t(`payouts.status.${payout.status}`)}
          </StatusBadge>
        </DisplayField>
      </div>
      <DisplayField model="payout" zone="general" id="display_id" data={payout}>
        <SectionRow title={t("fields.id")} value={`#${payout.display_id}`} />
      </DisplayField>
      <DisplayField model="payout" zone="general" id="created_at" data={payout}>
        <SectionRow title={t("fields.createdAt")} value={formatDate(payout.created_at)} />
      </DisplayField>
      <DisplayField model="payout" zone="general" id="updated_at" data={payout}>
        <SectionRow title={t("fields.updatedAt")} value={formatDate(payout.updated_at)} />
      </DisplayField>
      <DisplayExtensionZone
        model="payout"
        zone="general"
        data={payout}
        builtInFieldIds={GENERAL_FIELD_IDS}
      />
    </Container>
  );
};
