export type CountBucket = "0" | "1-10" | "11-100" | "101-1k" | "1k-10k" | "10k-100k" | "100k+"

export function toBucket(count: number | null | undefined): CountBucket | undefined {
  if (count === null || count === undefined || !Number.isFinite(count) || count < 0) {
    return undefined
  }
  if (count === 0) return "0"
  if (count <= 10) return "1-10"
  if (count <= 100) return "11-100"
  if (count <= 1_000) return "101-1k"
  if (count <= 10_000) return "1k-10k"
  if (count <= 100_000) return "10k-100k"
  return "100k+"
}
