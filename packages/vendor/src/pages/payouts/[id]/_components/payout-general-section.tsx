import { Container, Heading, StatusBadge, Text } from "@medusajs/ui";
import { PayoutDTO } from "@mercurjs/types";
import { DisplayExtensionZone, DisplayField } from "@mercurjs/dashboard-shared";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { getStylizedAmount } from "@lib/money-amount-helpers";

import { payoutStatusColor } from "../../_components/payout-status";

const GENERAL_FIELD_IDS = [
  "display_id",
  "status",
  "amount",
  "order_id",
  "status_reason",
  "created_at",
  "updated_at",
];

export const PayoutGeneralSection = ({ payout }: { payout: PayoutDTO }) => {
  const { t } = useTranslation();

  const statusText = t(`payouts.status.${payout.status}`, {
    defaultValue:
      payout.status.charAt(0).toUpperCase() + payout.status.slice(1),
  });

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <DisplayField model="payout" zone="general" id="display_id" data={payout}>
          <Heading>#{payout.display_id}</Heading>
        </DisplayField>
        <div className="flex items-center gap-x-2">
          <DisplayField model="payout" zone="general" id="status" data={payout}>
            <StatusBadge color={payoutStatusColor(payout.status)}>
              {statusText}
            </StatusBadge>
          </DisplayField>
        </div>
      </div>
      <DisplayField model="payout" zone="general" id="amount" data={payout}>
        <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
          <Text size="small" leading="compact" weight="plus">
            {t("fields.amount")}
          </Text>
          <Text size="small" leading="compact">
            {getStylizedAmount(payout.amount as number, payout.currency_code)}
          </Text>
        </div>
      </DisplayField>
      <DisplayField model="payout" zone="general" id="order_id" data={payout}>
        <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
          <Text size="small" leading="compact" weight="plus">
            {t("payouts.order")}
          </Text>
          {payout.order_id ? (
            <Link
              to={`/orders/${payout.order_id}`}
              className="text-ui-fg-interactive txt-compact-small truncate"
              data-testid="payout-general-section-order-link"
            >
              {payout.order_id}
            </Link>
          ) : (
            <Text size="small" leading="compact">
              -
            </Text>
          )}
        </div>
      </DisplayField>
      {payout.status_reason && (
        <DisplayField model="payout" zone="general" id="status_reason" data={payout}>
          <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
            <Text size="small" leading="compact" weight="plus">
              {t("payouts.statusReason")}
            </Text>
            <Text size="small" leading="compact">
              {payout.status_reason}
            </Text>
          </div>
        </DisplayField>
      )}
      <DisplayField model="payout" zone="general" id="created_at" data={payout}>
        <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
          <Text size="small" leading="compact" weight="plus">
            {t("fields.createdAt")}
          </Text>
          <Text size="small" leading="compact">
            {new Date(payout.created_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </div>
      </DisplayField>
      <DisplayField model="payout" zone="general" id="updated_at" data={payout}>
        <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
          <Text size="small" leading="compact" weight="plus">
            {t("fields.updatedAt")}
          </Text>
          <Text size="small" leading="compact">
            {new Date(payout.updated_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </div>
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
