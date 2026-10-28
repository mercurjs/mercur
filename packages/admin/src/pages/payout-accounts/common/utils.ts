import { TFunction } from "i18next"

type BadgeColor = "green" | "red" | "blue" | "orange" | "grey" | "purple"

export const getPayoutAccountStatusProps = (
  status: string,
  t: TFunction,
): { color: BadgeColor; label: string } => {
  const colors: Record<string, BadgeColor> = {
    pending: "orange",
    active: "green",
    restricted: "red",
    rejected: "red",
  }

  return {
    color: colors[status] ?? "grey",
    label: t(`payoutAccounts.status.${status}`, { defaultValue: status }),
  }
}

export const getPayoutAccountKycProps = (
  status: string | null,
  t: TFunction,
): { color: BadgeColor; label: string } | null => {
  if (!status) {
    return null
  }

  const colors: Record<string, BadgeColor> = {
    pending_submission: "orange",
    pending_approval: "blue",
    approved: "green",
    refused: "red",
  }

  return {
    color: colors[status] ?? "grey",
    label: t(`payoutAccounts.kycStatus.${status}`, { defaultValue: status }),
  }
}
