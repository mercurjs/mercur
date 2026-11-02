import { toBucket } from "../buckets"

describe("toBucket", () => {
  it.each([
    [0, "0"],
    [1, "1-10"],
    [10, "1-10"],
    [11, "11-100"],
    [100, "11-100"],
    [101, "101-1k"],
    [1_000, "101-1k"],
    [1_001, "1k-10k"],
    [10_000, "1k-10k"],
    [10_001, "10k-100k"],
    [100_000, "10k-100k"],
    [100_001, "100k+"],
  ])("maps %i to %s", (count, bucket) => {
    expect(toBucket(count)).toBe(bucket)
  })

  it("drops unknown counts instead of inventing a bucket", () => {
    expect(toBucket(undefined)).toBeUndefined()
    expect(toBucket(null)).toBeUndefined()
    expect(toBucket(-1)).toBeUndefined()
    expect(toBucket(Number.NaN)).toBeUndefined()
  })
})
