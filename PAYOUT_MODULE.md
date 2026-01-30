# Payout Module - Balance Calculation Architecture

## Problem Statement

With potentially 10,000+ transactions per account, we cannot:
- Load all transactions into memory for every balance calculation
- Recalculate the entire history on each request

## Solution: Running Balance Pattern (Ledger Pattern)

Instead of calculating balance from all transactions, we:
1. **Store the current balance** on the `PayoutAccount.balance` JSON field
2. **Atomically update the balance** when creating new transactions
3. **Use proper isolation levels** to prevent race conditions

This is the standard pattern used in banking/financial systems.

---

## 1. Balance Structure

The `PayoutAccount.balance` JSON field stores balance per currency:

```typescript
// PayoutAccount.balance structure
interface PayoutAccountBalance {
  [currency_code: string]: {
    pending: number        // Awaiting finalization (e.g., order not delivered)
    available: number      // Ready to be paid out
    lifetime_earnings: number   // Total ever earned (for reporting)
    lifetime_payouts: number    // Total ever paid out (for reporting)
    updated_at: string     // ISO timestamp of last update
  }
}

// Example:
{
  "usd": {
    "pending": 5000,      // $50.00 pending
    "available": 15000,   // $150.00 available for payout
    "lifetime_earnings": 100000,  // $1000.00 total earned
    "lifetime_payouts": 80000,    // $800.00 total paid out
    "updated_at": "2024-01-30T10:00:00Z"
  },
  "eur": {
    "pending": 0,
    "available": 2500,
    "lifetime_earnings": 5000,
    "lifetime_payouts": 2500,
    "updated_at": "2024-01-30T09:00:00Z"
  }
}
```

---

## 2. Transaction Model

```typescript
// packages/core/src/modules/payout/models/payout-transaction.ts
export const PayoutTransaction = model.define('payout_transaction', {
  id: model.id({ prefix: 'ptxn' }).primaryKey(),
  amount: model.bigNumber(),           // Positive = in, Negative = out
  currency_code: model.text(),
  reference: model.text().nullable(),  // "order", "refund", "payout"
  reference_id: model.text().nullable(),
  account: model.belongsTo(() => PayoutAccount, {
    mappedBy: 'transactions'
  }),
})
```

**Note**: No `status` field on transaction. The transaction is immutable once created.
Balance updates happen atomically with transaction creation.

---

## 3. Database Transaction Isolation

### Why Isolation Matters

```
Scenario: Race Condition Without Proper Isolation

Time    Thread A (Payout $100)         Thread B (Refund $50)
─────   ─────────────────────────      ─────────────────────────
T1      Read balance: $150
T2                                     Read balance: $150
T3      Check: $150 >= $100 ✓
T4                                     Calculate: $150 - $50 = $100
T5      Calculate: $150 - $100 = $50
T6      Write balance: $50
T7                                     Write balance: $100  ← WRONG!
                                       (overwrites Thread A's update)

Result: Balance shows $100, but should be $0 ($150 - $100 - $50)
        The $100 payout is LOST from the ledger!
```

### Solution: Use Row-Level Locking

```typescript
// Use REPEATABLE READ or SERIALIZABLE for balance updates
// OR use SELECT FOR UPDATE to lock the row

context.isolationLevel = "SERIALIZABLE"
// OR
context.isolationLevel = "REPEATABLE READ"
```

**Recommended**: `REPEATABLE READ` with `SELECT FOR UPDATE` pattern

---

## 4. Service Implementation

```typescript
// packages/core/src/modules/payout/services/payout-service.ts

import {
  InjectManager,
  InjectTransactionManager,
  MedusaContext,
  MedusaService,
  MedusaError,
  MathBN,
} from "@medusajs/framework/utils"
import { Context } from "@medusajs/framework/types"

type BalanceOperation = "add_pending" | "finalize" | "deduct" | "cancel_pending"

interface UpdateBalanceInput {
  account_id: string
  currency_code: string
  amount: BigNumberInput
  operation: BalanceOperation
}

export default class PayoutService extends MedusaService({...}) {

  /**
   * Get current balance - O(1) operation, just reads from account
   */
  @InjectManager()
  async getAccountBalance(
    accountId: string,
    currencyCode?: string,
    @MedusaContext() sharedContext?: Context
  ): Promise<PayoutAccountBalance> {
    const account = await this.retrievePayoutAccount(
      accountId,
      { select: ["balance"] },
      sharedContext
    )

    if (currencyCode) {
      return account.balance?.[currencyCode] ?? this.getEmptyBalance()
    }

    return account.balance ?? {}
  }

  /**
   * Create transaction AND update balance atomically
   * Uses SERIALIZABLE isolation to prevent race conditions
   */
  @InjectTransactionManager()
  async createPayoutTransactionWithBalanceUpdate(
    input: CreatePayoutTransactionInput,
    @MedusaContext() sharedContext?: Context
  ): Promise<PayoutTransactionDTO> {
    // 1. Lock and fetch the account (SELECT FOR UPDATE equivalent)
    const account = await this.retrievePayoutAccountForUpdate_(
      input.account_id,
      sharedContext
    )

    // 2. Get current balance for currency
    const balance = account.balance ?? {}
    const currencyBalance = balance[input.currency_code] ?? this.getEmptyBalance()

    // 3. Calculate new balance based on operation
    const newBalance = this.calculateNewBalance_(
      currencyBalance,
      input.amount,
      input.operation
    )

    // 4. Validate the operation
    this.validateBalanceOperation_(newBalance, input)

    // 5. Create the transaction record
    const transaction = await this.createPayoutTransactions(
      {
        account_id: input.account_id,
        amount: input.amount,
        currency_code: input.currency_code,
        reference: input.reference,
        reference_id: input.reference_id,
      },
      sharedContext
    )

    // 6. Update the account balance
    balance[input.currency_code] = {
      ...newBalance,
      updated_at: new Date().toISOString(),
    }

    await this.updatePayoutAccounts(
      { id: input.account_id, balance },
      sharedContext
    )

    return transaction
  }

  /**
   * Lock account row for update (prevents race conditions)
   */
  @InjectTransactionManager()
  protected async retrievePayoutAccountForUpdate_(
    accountId: string,
    @MedusaContext() sharedContext?: Context
  ): Promise<PayoutAccountDTO> {
    // MikroORM: Use query builder with FOR UPDATE
    const manager = sharedContext?.transactionManager

    const account = await manager
      .createQueryBuilder(PayoutAccount)
      .select("*")
      .where({ id: accountId })
      .setLockMode("pessimistic_write")  // SELECT FOR UPDATE
      .getSingleResult()

    if (!account) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Payout account ${accountId} not found`
      )
    }

    return account
  }

  /**
   * Calculate new balance based on operation type
   */
  private calculateNewBalance_(
    current: CurrencyBalance,
    amount: BigNumberInput,
    operation: BalanceOperation
  ): CurrencyBalance {
    const amt = MathBN.convert(amount)
    const absAmt = MathBN.abs(amt)

    switch (operation) {
      case "add_pending":
        // New earning, not yet finalized
        return {
          ...current,
          pending: MathBN.add(current.pending, absAmt),
          lifetime_earnings: MathBN.add(current.lifetime_earnings, absAmt),
        }

      case "finalize":
        // Move from pending to available
        return {
          ...current,
          pending: MathBN.sub(current.pending, absAmt),
          available: MathBN.add(current.available, absAmt),
        }

      case "deduct":
        // Payout or refund - deduct from available
        return {
          ...current,
          available: MathBN.sub(current.available, absAmt),
          lifetime_payouts: MathBN.add(current.lifetime_payouts, absAmt),
        }

      case "cancel_pending":
        // Cancel a pending earning
        return {
          ...current,
          pending: MathBN.sub(current.pending, absAmt),
          lifetime_earnings: MathBN.sub(current.lifetime_earnings, absAmt),
        }

      default:
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Unknown balance operation: ${operation}`
        )
    }
  }

  /**
   * Validate that the operation is allowed
   */
  private validateBalanceOperation_(
    newBalance: CurrencyBalance,
    input: CreatePayoutTransactionInput
  ): void {
    // Check for negative available balance on payout
    if (input.operation === "deduct" && input.reference === "payout") {
      if (MathBN.lt(newBalance.available, 0)) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          `Insufficient balance. Available: ${newBalance.available}, Requested: ${input.amount}`
        )
      }
    }

    // Note: We ALLOW negative available balance for refunds
    // This handles the case where refund happens after payout
  }

  private getEmptyBalance(): CurrencyBalance {
    return {
      pending: 0,
      available: 0,
      lifetime_earnings: 0,
      lifetime_payouts: 0,
      updated_at: new Date().toISOString(),
    }
  }
}
```

---

## 5. Workflow Integration

```typescript
// workflows/payout/create-seller-earning.ts

export const createSellerEarningWorkflow = createWorkflow(
  "create-seller-earning",
  (input: { order_id: string, seller_id: string, amount: number, currency: string }) => {

    // Step 1: Get seller's payout account
    const account = getSellerPayoutAccountStep({ seller_id: input.seller_id })

    // Step 2: Create earning transaction (pending)
    const transaction = createPayoutTransactionStep({
      account_id: account.id,
      amount: input.amount,
      currency_code: input.currency,
      operation: "add_pending",
      reference: "order",
      reference_id: input.order_id,
    })

    return transaction
  }
)

// workflows/payout/finalize-seller-earning.ts
export const finalizeSellerEarningWorkflow = createWorkflow(
  "finalize-seller-earning",
  (input: { transaction_id: string }) => {

    // Move earning from pending to available
    const result = finalizePayoutTransactionStep({
      transaction_id: input.transaction_id,
      operation: "finalize",
    })

    return result
  }
)

// workflows/payout/create-payout.ts
export const createPayoutWorkflow = createWorkflow(
  "create-payout",
  (input: { account_id: string, amount: number, currency: string }) => {

    // This will:
    // 1. Lock the account row
    // 2. Check available balance
    // 3. Create transaction with negative amount
    // 4. Update balance (deduct from available)
    // All in one atomic transaction

    const transaction = createPayoutTransactionStep({
      account_id: input.account_id,
      amount: input.amount,  // Will be stored as negative
      currency_code: input.currency,
      operation: "deduct",
      reference: "payout",
      reference_id: null,  // Will be set after payout is created
    })

    // Create actual payout record
    const payout = createPayoutStep({
      account_id: input.account_id,
      amount: input.amount,
      currency_code: input.currency,
      transaction_id: transaction.id,
    })

    return payout
  }
)
```

---

## 6. Flow Diagram

```
ORDER COMPLETED ($100 sale, $10 commission = $90 to seller)
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  createPayoutTransactionWithBalanceUpdate()             │
│  ┌───────────────────────────────────────────────────┐  │
│  │ BEGIN TRANSACTION (SERIALIZABLE)                  │  │
│  │                                                   │  │
│  │ 1. SELECT * FROM payout_account                   │  │
│  │    WHERE id = 'pacc_123' FOR UPDATE  ← Lock row   │  │
│  │                                                   │  │
│  │ 2. Read current balance: { pending: 0, avail: 0 } │  │
│  │                                                   │  │
│  │ 3. Calculate: { pending: 90, avail: 0 }           │  │
│  │                                                   │  │
│  │ 4. INSERT INTO payout_transaction (amount: +90)   │  │
│  │                                                   │  │
│  │ 5. UPDATE payout_account SET balance = {...}      │  │
│  │                                                   │  │
│  │ COMMIT                                            │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
    │
    ▼
Balance: { pending: $90, available: $0 }


ORDER DELIVERED (finalize earning)
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  BEGIN TRANSACTION                                      │
│  1. Lock account row                                    │
│  2. Move $90 from pending → available                   │
│  3. Create transaction record                           │
│  COMMIT                                                 │
└─────────────────────────────────────────────────────────┘
    │
    ▼
Balance: { pending: $0, available: $90 }


SELLER REQUESTS PAYOUT ($90)
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  BEGIN TRANSACTION                                      │
│  1. Lock account row                                    │
│  2. Check: available ($90) >= requested ($90) ✓         │
│  3. Deduct $90 from available                           │
│  4. Create transaction (amount: -90)                    │
│  5. Create payout record                                │
│  COMMIT                                                 │
└─────────────────────────────────────────────────────────┘
    │
    ▼
Balance: { pending: $0, available: $0 }


LATER: CUSTOMER REFUND ($50)
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  BEGIN TRANSACTION                                      │
│  1. Lock account row                                    │
│  2. Deduct $50 from available (goes negative!)          │
│  3. Create transaction (amount: -50, ref: "refund")     │
│  COMMIT                                                 │
└─────────────────────────────────────────────────────────┘
    │
    ▼
Balance: { pending: $0, available: -$50 }  ← NEGATIVE (seller owes marketplace)
```

---

## 7. Database Isolation Levels Comparison

| Level | Dirty Read | Non-Repeatable Read | Phantom Read | Use Case |
|-------|------------|---------------------|--------------|----------|
| READ UNCOMMITTED | ✓ | ✓ | ✓ | Never for financial |
| READ COMMITTED | ✗ | ✓ | ✓ | General reads |
| REPEATABLE READ | ✗ | ✗ | ✓ | **Balance updates** |
| SERIALIZABLE | ✗ | ✗ | ✗ | Critical operations |

**Recommendation**: Use `REPEATABLE READ` + `SELECT FOR UPDATE` (row locking)

This provides:
- Protection against lost updates
- Good performance (only locks the specific row)
- Works with PostgreSQL, MySQL, etc.

---

## 8. Querying Historical Transactions

When you need transaction history (for reports, audits):

```typescript
// Get recent transactions with pagination
async getTransactionHistory(
  accountId: string,
  options: {
    currency?: string
    limit?: number
    offset?: number
    from_date?: Date
    to_date?: Date
  }
): Promise<{ transactions: PayoutTransactionDTO[], count: number }> {
  return this.listAndCountPayoutTransactions(
    {
      account_id: accountId,
      currency_code: options.currency,
      created_at: {
        $gte: options.from_date,
        $lte: options.to_date,
      }
    },
    {
      take: options.limit ?? 50,
      skip: options.offset ?? 0,
      order: { created_at: "DESC" }
    }
  )
}
```

---

## 9. Summary

| Approach | Pros | Cons |
|----------|------|------|
| **Calculate from all transactions** | Simple, always accurate | O(n) - doesn't scale |
| **Running balance (this approach)** | O(1) reads, scales well | Requires careful locking |
| **Periodic snapshots** | Good for reporting | Stale data between snapshots |

**We use Running Balance because**:
- Balance reads are O(1) - just read `account.balance`
- Transaction creation is O(1) - atomic update
- Proper locking prevents race conditions
- Transactions table serves as audit log
- Can still query transaction history when needed

**Key Points**:
1. Balance is stored on `PayoutAccount.balance` JSON field
2. Every transaction atomically updates the balance
3. Use `SELECT FOR UPDATE` to prevent race conditions
4. Use `REPEATABLE READ` isolation level
5. Allow negative balance for refunds (seller owes marketplace)
6. Transaction history is still available for audits/reports
