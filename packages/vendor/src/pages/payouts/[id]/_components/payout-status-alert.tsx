import { Alert } from "@medusajs/ui";
import { PayoutDTO } from "@mercurjs/types";
import { useTranslation } from "react-i18next";

import { getPayoutStatusReasonLabel } from "../../_components/payout-status";

const variantForStatus = (status: string) => {
  switch (status) {
    case "failed":
    case "aborted":
      return "error";
    case "on_hold":
      return "warning";
    default:
      return "info";
  }
};

export const PayoutStatusAlert = ({ payout }: { payout: PayoutDTO }) => {
  const { t } = useTranslation();

  if (!payout.status_reason) {
    return null;
  }

  return (
    <Alert variant={variantForStatus(payout.status)} data-testid="payout-status-alert">
      {getPayoutStatusReasonLabel(payout.status_reason, t)}
    </Alert>
  );
};
