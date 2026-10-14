import { createServer, type Server } from "http"
import type { AddressInfo } from "net"

import { asValue } from "@medusajs/framework/awilix"
import type { ConfigModule, IUserModuleService, MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { encodeSprayTokenCalldata } from "@mercurjs/payout-spraay/chain/calldata"
import { SPRAAY_BATCH_CONTRACT_BASE, USDC_BASE } from "@mercurjs/payout-spraay/chain/constants"
import { MercurModules, PERMISSIONS_MODULE, type IPermissionResolver, type PermissionMap } from "@mercurjs/types"
import jwt from "jsonwebtoken"
import {
  createPublicClient,
  createTestClient,
  createWalletClient,
  encodeAbiParameters,
  getAddress,
  http,
  keccak256,
  numberToHex,
  pad,
  parseAbi,
  slice,
  toHex,
  type Hex,
  type PublicClient,
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { base } from "viem/chains"

/** Anvil's first default account. Public test key, only ever used against a local fork. */
export const TREASURY_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" as const
export const OTHER_KEY = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d" as const
export const FORK_RPC_URL = process.env.SPRAAY_FORK_RPC_URL ?? "http://127.0.0.1:8545"
export const GATEWAY_PORT = Number(process.env.SPRAAY_TEST_GATEWAY_PORT ?? 18402)

export const treasury = privateKeyToAccount(TREASURY_KEY)

/** Must run before the app boots: medusa-config reads these when it is loaded. */
export const spraayTestEnv = {
  SPRAAY_RPC_URL: FORK_RPC_URL,
  SPRAAY_TREASURY_ADDRESS: treasury.address,
  SPRAAY_GATEWAY_URL: `http://127.0.0.1:${GATEWAY_PORT}`,
}

const erc20 = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
])

const transport = http(FORK_RPC_URL, { retryCount: 0 })
export const chain = {
  public: createPublicClient({ chain: base, transport }) as PublicClient,
  wallet: createWalletClient({ chain: base, transport, account: treasury }),
  test: createTestClient({ chain: base, transport, mode: "anvil" }),
}

export const recipients = (count: number, seed: string): `0x${string}`[] =>
  Array.from({ length: count }, (_, i) => getAddress(slice(keccak256(toHex(`${seed}-${i}`)), 12)))

export const usdcBalance = (owner: string) =>
  chain.public.readContract({ address: USDC_BASE, abi: erc20, functionName: "balanceOf", args: [owner as Hex] })

let balanceSlot: bigint | undefined

export async function setUsdcBalance(owner: Hex, amount: bigint): Promise<void> {
  const write = async (slot: bigint) => {
    const index = keccak256(encodeAbiParameters([{ type: "address" }, { type: "uint256" }], [owner, slot]))
    const previous = (await chain.public.getStorageAt({ address: USDC_BASE, slot: index })) ?? pad("0x0")
    await chain.test.setStorageAt({ address: USDC_BASE, index, value: pad(numberToHex(amount)) })
    return { index, previous }
  }
  if (balanceSlot !== undefined) {
    await write(balanceSlot)
    return
  }
  for (let slot = 0n; slot < 20n; slot++) {
    const { index, previous } = await write(slot)
    if ((await usdcBalance(owner)) === amount) {
      balanceSlot = slot
      return
    }
    await chain.test.setStorageAt({ address: USDC_BASE, index, value: previous })
  }
  throw new Error("Could not locate the USDC balance slot on this fork")
}

export async function fundTreasury(usdc: bigint): Promise<void> {
  await chain.test.setBalance({ address: treasury.address, value: 10n ** 19n })
  await setUsdcBalance(treasury.address, usdc)
  const hash = await chain.wallet.writeContract({
    address: USDC_BASE,
    abi: erc20,
    functionName: "approve",
    args: [SPRAAY_BATCH_CONTRACT_BASE, usdc],
  })
  await chain.public.waitForTransactionReceipt({ hash })
}

export const mine = (blocks: number) => chain.test.mine({ blocks })

type GatewayMode = "honest" | "tamper" | "payment-required"

/**
 * Stands in for gateway.spraay.app so tests never spend x402 fees. In "honest"
 * mode it returns the calldata the real gateway is expected to build; "tamper"
 * swaps the first recipient to prove prepare refuses it.
 */
export function startGatewayStub() {
  let mode: GatewayMode = "honest"
  const requests: Array<{ recipients: string[]; amounts: string[]; sender: string; chain: string; token: string }> = []

  const server: Server = createServer((req, res) => {
    let raw = ""
    req.on("data", (chunk) => (raw += chunk))
    req.on("end", () => {
      const body = JSON.parse(raw || "{}")
      requests.push(body)
      if (mode === "payment-required") {
        res.writeHead(402, { "content-type": "application/json" }).end(JSON.stringify({ x402Version: 1, accepts: [] }))
        return
      }
      const items = body.recipients.map((recipient: string, i: number) => ({
        recipient: mode === "tamper" && i === 0 ? recipients(1, "attacker")[0] : recipient,
        amount: BigInt(body.amounts[i]),
      }))
      res.writeHead(200, { "content-type": "application/json" }).end(
        JSON.stringify({
          success: true,
          contract: SPRAAY_BATCH_CONTRACT_BASE,
          transaction: {
            to: SPRAAY_BATCH_CONTRACT_BASE,
            data: encodeSprayTokenCalldata(items),
            value: "0",
            chainId: 8453,
            // The live spec returns gasLimit as a hex quantity.
            gasLimit: numberToHex(5_000_000),
          },
        })
      )
    })
  })

  return {
    start: () => new Promise<void>((resolve) => server.listen(GATEWAY_PORT, "127.0.0.1", () => resolve())),
    stop: () => new Promise<void>((resolve) => server.close(() => resolve())),
    port: () => (server.address() as AddressInfo).port,
    setMode: (next: GatewayMode) => (mode = next),
    requests,
  }
}

export const adminHeaders = { headers: {} as Record<string, string> }

export async function createAdmin(container: MedusaContainer): Promise<void> {
  const users: IUserModuleService = container.resolve(Modules.USER)
  const user = await users.createUsers({ email: `treasury-${Date.now()}@spraay.test` })
  const { projectConfig } = container.resolve<ConfigModule>(ContainerRegistrationKeys.CONFIG_MODULE)
  const token = jwt.sign(
    { actor_id: user.id, actor_type: "user", auth_identity_id: "authid_test" },
    projectConfig.http.jwtSecret as string,
    { expiresIn: "1d" }
  )
  adminHeaders.headers.authorization = `Bearer ${token}`
}

/** Plugs a fixed permission map in as the permissions module, the way core's own specs do. */
export function usePermissions(container: MedusaContainer, permissions: PermissionMap | null): void {
  const config = container.resolve<ConfigModule>(ContainerRegistrationKeys.CONFIG_MODULE)
  const modules = (config.modules ??= {}) as Record<string, unknown>
  if (!permissions) {
    delete modules[PERMISSIONS_MODULE]
    return
  }
  const resolver: IPermissionResolver = { resolvePermissions: async () => permissions }
  modules[PERMISSIONS_MODULE] = { resolve: "spraay-test-permissions" }
  container.register(PERMISSIONS_MODULE, asValue(resolver))
}

export const TREASURY_OPERATOR: PermissionMap = { payouts: "edit", "spraay.sign": "edit" }
export const PAYOUT_EDITOR: PermissionMap = { payouts: "edit" }

type PayoutModule = {
  createPayoutAccount(input: { data: Record<string, unknown> }): Promise<{ id: string }>
  createPayouts(input: { account_id: string; amount: number; currency_code: string }): Promise<{ id: string }>
  listPayouts(filters: { id: string[] }): Promise<Array<{ id: string; status: string; data: Record<string, unknown> | null }>>
}

export const payoutModule = (container: MedusaContainer) => container.resolve<PayoutModule>(MercurModules.PAYOUT)

/** Creates pending Spraay payouts through the real payout module and provider. */
export async function seedPayouts(
  container: MedusaContainer,
  wallets: string[],
  amountFor: (i: number) => number,
  currencyFor: (i: number) => string = () => "usdc"
) {
  const payouts = payoutModule(container)
  const created: Array<{ id: string; wallet: string; amount: number }> = []
  for (const [i, wallet] of wallets.entries()) {
    const account = await payouts.createPayoutAccount({ data: { wallet_address: wallet } })
    const payout = await payouts.createPayouts({ account_id: account.id, amount: amountFor(i), currency_code: currencyFor(i) })
    created.push({ id: payout.id, wallet, amount: amountFor(i) })
  }
  return created
}

type PreparedBatch = {
  unsigned_tx_to: string | null
  unsigned_tx_data: string | null
  unsigned_tx_nonce: number | null
  unsigned_tx_gas: string | null
}

/** What the treasury operator does in their own wallet: sign the pinned request. */
export async function signPrepared(batch: PreparedBatch, key: Hex = TREASURY_KEY, fees?: { maxFeePerGas: bigint }) {
  const account = privateKeyToAccount(key)
  const estimate = await chain.public.estimateFeesPerGas()
  const maxFeePerGas = fees?.maxFeePerGas ?? estimate.maxFeePerGas * 2n
  return account.signTransaction({
    type: "eip1559",
    chainId: 8453,
    to: batch.unsigned_tx_to as Hex,
    data: batch.unsigned_tx_data as Hex,
    value: 0n,
    nonce: batch.unsigned_tx_nonce!,
    gas: BigInt(batch.unsigned_tx_gas!),
    maxFeePerGas,
    maxPriorityFeePerGas: maxFeePerGas / 2n,
  })
}
