type BadgeColor = "green" | "red" | "orange" | "grey" | "blue" | "purple"

export const PAYOUT_STATUS_COLOR: Record<string, BadgeColor> = {
  pending: "blue",
  processing: "blue",
  paid: "green",
  failed: "red",
  on_hold: "orange",
  aborted: "grey",
}

export const PAYOUT_STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  paid: "Paid",
  failed: "Failed",
  on_hold: "On hold",
  aborted: "Aborted",
}

export const SETTLEMENT_STATUS_COLOR: Record<string, BadgeColor> = {
  open: "blue",
  paid_out: "green",
  failed: "red",
  aborted: "grey",
}

export const SETTLEMENT_STATUS_LABEL: Record<string, string> = {
  open: "Open",
  paid_out: "Paid out",
  failed: "Failed",
  aborted: "Aborted",
}

type StripeRequirements = {
  currently_due: string[]
  past_due: string[]
  pending_verification: string[]
}

/** The connected account Stripe returned, kept on the payout account as `data`. */
export const stripeRequirementsOf = (data: Record<string, unknown> | null | undefined): StripeRequirements => {
  const requirements = data?.requirements as Partial<StripeRequirements> | undefined
  return {
    currently_due: requirements?.currently_due ?? [],
    past_due: requirements?.past_due ?? [],
    pending_verification: requirements?.pending_verification ?? [],
  }
}

// Requirement entries are field paths such as `individual.verification.document`.
export const humanizeRequirement = (requirement: string) => {
  const text = requirement.split(".").join(" › ").replace(/_/g, " ")
  return text.charAt(0).toUpperCase() + text.slice(1)
}
