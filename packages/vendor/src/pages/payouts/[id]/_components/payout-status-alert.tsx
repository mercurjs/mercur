import { Alert } from "@medusajs/ui";
import { PayoutDTO } from "@mercurjs/types";

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
  if (!payout.status_reason) {
    return null;
  }

  return (
    <Alert variant={variantForStatus(payout.status)} data-testid="payout-status-alert">
      {payout.status_reason}
    </Alert>
  );
};
