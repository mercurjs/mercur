import { nextCronRun } from "../cron"

describe("nextCronRun", () => {
  it("finds the next minute of a stepped schedule", () => {
    const next = nextCronRun("1-59/5 * * * *", new Date("2026-10-22T10:03:30Z"))
    expect(next?.toISOString()).toBe("2026-10-22T10:06:00.000Z")
  })

  it("finds the daily 01:03 run on the next day", () => {
    const next = nextCronRun("3 1 * * *", new Date("2026-10-22T10:00:00Z"))
    expect(next?.toISOString()).toBe("2026-10-23T01:03:00.000Z")
  })

  it("handles every six hours", () => {
    const next = nextCronRun("0 */6 * * *", new Date("2026-10-22T07:00:00Z"))
    expect(next?.toISOString()).toBe("2026-10-22T12:00:00.000Z")
  })
})
