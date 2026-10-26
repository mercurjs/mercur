import { Alert } from "@medusajs/ui"

import { AdminTransfer } from "../../../../hooks/api/transfers"

const variantForStatus = (status: string) => {
  switch (status) {
    case "failed":
    case "aborted":
      return "error"
    case "on_hold":
      return "warning"
    default:
      return "info"
  }
}

export const TransferStatusAlert = ({ transfer }: { transfer: AdminTransfer }) => {
  if (!transfer.status_reason) {
    return null
  }

  return (
    <Alert
      variant={variantForStatus(transfer.status)}
      data-testid="transfer-status-alert"
    >
      {transfer.status_reason}
    </Alert>
  )
}
