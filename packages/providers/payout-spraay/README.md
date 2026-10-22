# @mercurjs/payout-spraay

Noncustodial batch payouts for Mercur: seller payouts in USDC on Base, paid out in batches of up to 200 recipients per transaction through the [Spraay](https://spraay.app) batch contract.

Neither Spraay nor Mercur ever holds funds or private keys. The marketplace treasury signs every batch in its own wallet; the server only verifies and broadcasts the signed transaction, and marks payouts paid after it has verified the settlement on chain.

## How a payout moves

```
createPayout (provider)          payout stored as PENDING, provider: "spraay", wallet_address, batch_id: null
        |
aggregation job (every 15 min)   pending payouts claimed into one batch (2..200), in one DB transaction
        |
POST .../prepare                 Spraay gateway builds the unsigned sprayToken transaction; the server
        |                        decodes it and checks contract, chain, value and every recipient/amount
        |                        against the batch, then pins the treasury nonce
        |
treasury wallet                  operator signs the exact signing request (outside Mercur)
        |
POST .../sign                    signature checked against signer, contract, calldata, chain, nonce and gas;
        |                        tx hash recorded *before* broadcast
        |
reconciler job (every 5 min)     after 10 confirmations: transaction + SprayTokenExecuted event + USDC Transfer
                                 logs must all match the batch, then each payout is marked PAID
```

Batch statuses: `assembling → awaiting_signature → broadcasting → confirming → settled`, or `failed`, `expired` (24h signing window), `canceled`.

Payouts are only released for rebatching when the batch's transaction provably can no longer execute: it reverted, or the pinned treasury nonce was consumed by a transaction that is not a matching Spraay execution. A canceled or expired batch whose transaction was already prepared keeps its payouts until then, and a wallet "speed up" of the same call is detected and settled rather than paid twice.

## Package contents

| Path | |
|------|-|
| `.` | `ModuleProvider` for the Mercur payout module (`identifier: "spraay"`) |
| `./amounts` | Address normalisation, exact USDC decimal ↔ base-unit conversion, protocol fee |
| `./chain/*` | Constants, ABI, calldata encode/decode/diff, read-only chain reader, signed-transaction inspection, settlement verification |
| `./gateway/*` | Spraay gateway client (`/api/v1/batch/execute`, `/api/v1/batch/estimate`) |

The batch module, jobs, admin API routes and dashboard pages that drive this provider live in the starter apps: `apps/api/src/modules/spraay-batch`, `apps/api/src/jobs/spraay-*`, `apps/api/src/api/admin/spraay` and `apps/admin-test/src/routes/spraay`.

## Configuration

```ts
// medusa-config.ts
modules: [
  {
    resolve: "@mercurjs/core/modules/payout",
    options: {
      providers: [
        {
          resolve: "@mercurjs/payout-spraay",
          id: "spraay",
          options: {
            rpcUrl: process.env.SPRAAY_RPC_URL,
            treasuryAddress: process.env.SPRAAY_TREASURY_ADDRESS,
            gatewayBaseUrl: process.env.SPRAAY_GATEWAY_URL,
          },
        },
      ],
    },
  },
  { resolve: "./src/modules/spraay-batch" },
]
```

| Variable | Required | |
|----------|----------|-|
| `SPRAAY_RPC_URL` | yes | Base mainnet RPC. Used for reads, nonce pinning and broadcasting signed transactions. |
| `SPRAAY_TREASURY_ADDRESS` | yes | The marketplace treasury that signs batches. The provider refuses to start without it. |
| `SPRAAY_GATEWAY_URL` | no | Defaults to `https://gateway.spraay.app`. |

The payout module accepts exactly one provider, so enabling Spraay replaces any other payout provider. Seller payout accounts need a `wallet_address`.

Payouts must have `currency_code` `usdc` or `usd`; every other currency is rejected. `usd` is a label mapping, not an exchange rate: a 12.50 USD payout is paid as exactly 12.50 USDC, with no conversion or price lookup. This lets USD-priced marketplaces, whose payouts Mercur creates in the order's currency, pay out through Spraay. The marketplace carries any USD/USDC peg difference.

Before signing, the treasury needs ETH for gas, enough USDC for the batch plus the 0.3% protocol fee, and a USDC allowance for the Spraay contract (`0x1646452F98E36A3c9Cfc3eDD8868221E207B5eEC`). `GET /admin/spraay/preflight` reports all three.

## Permissions

| Route | Permission |
|-------|------------|
| `GET /admin/spraay/batches`, `GET /admin/spraay/batches/:id`, `GET /admin/spraay/preflight` | `payouts:view` |
| `POST /admin/spraay/batches/:id/prepare`, `.../cancel`, `POST /admin/spraay/trigger` | `payouts:edit` |
| `POST /admin/spraay/batches/:id/sign` | `spraay.sign:edit` |

`spraay.sign` fails closed. Core's `requirePermission` lets every request through when no permissions module is configured; the sign route does not, so **nobody can sign until a permissions module grants `spraay.sign:edit` to the treasury operators.**

## Gateway fees (x402)

`POST /api/v1/batch/execute` is a paid endpoint ($0.02 per call via x402 or MPP, USDC on Base; see `https://gateway.spraay.app/openapi.json`). Paying it requires a wallet to sign a payment authorization per call. This package does not do that: the client raises `SpraayGatewayPaymentRequiredError` on a 402 and the batch stays in `assembling`. Supplying a payment-capable `fetch` to `SpraayGatewayClient` is the extension point, but where that payer key lives is a deployment decision, because it is a signing key.

## Tests

```bash
bun run test                                   # unit specs
SPRAAY_FORK_RPC_URL=http://127.0.0.1:8545 bun run test   # + fork specs against an Anvil fork of Base
```

Fork specs pay 100 recipients through the deployed Spraay contract and verify the real receipt. The end-to-end suite (`apps/api/integration-tests/http/spraay-batch-lifecycle.spec.ts`) runs the whole lifecycle through the Medusa app against Postgres, Redis and the fork, with a local stand-in for the gateway so tests never pay x402 fees.
