import {
  AccountOutput,
  PayoutAccountRequirements,
  PayoutAccountStatus,
  PayoutKycStatus,
} from "@mercurjs/types"

/**
 * Outstanding
 * requirements beat pending verification, a `rejected.*` disabled reason is
 * final, any other disabled reason is still under review.
 */
export function deriveKycStatus(
  requirements: PayoutAccountRequirements | null | undefined,
  disabledReason: string | null | undefined
): PayoutKycStatus {
  if ((requirements?.currently_due?.length ?? 0) > 0 || (requirements?.past_due?.length ?? 0) > 0) {
    return PayoutKycStatus.PENDING_SUBMISSION
  }

  if ((requirements?.pending_verification?.length ?? 0) > 0) {
    return PayoutKycStatus.PENDING_APPROVAL
  }

  if (disabledReason && disabledReason.startsWith("rejected")) {
    return PayoutKycStatus.REFUSED
  }

  if (disabledReason) {
    return PayoutKycStatus.PENDING_APPROVAL
  }

  return PayoutKycStatus.APPROVED
}

export function deriveAccountStatus(account: AccountOutput): PayoutAccountStatus {
  if (account.status === PayoutAccountStatus.REJECTED) {
    return PayoutAccountStatus.REJECTED
  }

  if (account.disabled_reason?.startsWith("rejected")) {
    return PayoutAccountStatus.REJECTED
  }

  if (!account.details_submitted) {
    return PayoutAccountStatus.PENDING
  }

  if (account.payouts_enabled && account.charges_enabled && !account.disabled_reason) {
    return PayoutAccountStatus.ACTIVE
  }

  return PayoutAccountStatus.RESTRICTED
}
