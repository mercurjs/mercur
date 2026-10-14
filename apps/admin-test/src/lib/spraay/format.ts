const USDC_DECIMALS = 6
const ETH_DECIMALS = 18
const BASESCAN_URL = "https://basescan.org"

const formatUnits = (raw: string | bigint | null | undefined, decimals: number, maxFraction = decimals) => {
  if (raw === null || raw === undefined || raw === "") {
    return "-"
  }
  const value = typeof raw === "bigint" ? raw : BigInt(raw)
  const base = 10n ** BigInt(decimals)
  const whole = value / base
  const fraction = (value % base)
    .toString()
    .padStart(decimals, "0")
    .slice(0, maxFraction)
    .replace(/0+$/, "")

  return `${whole.toLocaleString("en-US")}${fraction ? `.${fraction}` : ""}`
}

export const formatUsdc = (raw: string | bigint | null | undefined) => {
  const formatted = formatUnits(raw, USDC_DECIMALS)
  return formatted === "-" ? formatted : `${formatted} USDC`
}

export const formatEth = (raw: string | bigint | null | undefined) => {
  const formatted = formatUnits(raw, ETH_DECIMALS, 6)
  return formatted === "-" ? formatted : `${formatted} ETH`
}

export const shortHex = (value: string | null | undefined, chars = 6) => {
  if (!value) {
    return "-"
  }
  return value.length <= chars * 2 + 2 ? value : `${value.slice(0, chars + 2)}…${value.slice(-chars)}`
}

export const basescanTx = (hash: string) => `${BASESCAN_URL}/tx/${hash}`
export const basescanAddress = (address: string) => `${BASESCAN_URL}/address/${address}`
