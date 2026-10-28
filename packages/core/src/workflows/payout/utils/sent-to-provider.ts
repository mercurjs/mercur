import { PayoutStatus } from "@mercurjs/types"

type Attempted = { status: PayoutStatus; data?: Record<string, unknown> | null }

const attemptsOf = (row: Pick<Attempted, "data"> | null | undefined) => Number(row?.data?.attempts ?? 0)

/**
 * Whether the payout or reversal went to the provider after `previous` was
 * read. A rollback must leave such a row alone: the money may have left.
 */
export function sentToProvider(current: Attempted, previous?: Pick<Attempted, "data"> | null): boolean {
  return (
    current.status === PayoutStatus.PROCESSING ||
    current.status === PayoutStatus.PAID ||
    attemptsOf(current) > attemptsOf(previous)
  )
}
