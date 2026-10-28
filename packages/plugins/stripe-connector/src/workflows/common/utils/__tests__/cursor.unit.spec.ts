import { advanceCursor, afterCursor, decodeCursor, encodeCursor, wrapCursor } from "../cursor"

const at = "2026-10-20T10:00:00.000Z"

// Applies a cursor filter the way Postgres would, for rows of the same shape.
const matches = (filter: Record<string, unknown>, row: { id: string; created_at: string }) => {
  const clauses = (filter.$or ?? []) as { created_at: Date | { $gt: Date }; id?: { $gt: string } }[]
  if (!clauses.length) return true
  return clauses.some((clause) => {
    const time = new Date(row.created_at).getTime()
    const createdOk =
      clause.created_at instanceof Date
        ? time === clause.created_at.getTime()
        : time > clause.created_at.$gt.getTime()
    return createdOk && (!clause.id || row.id > clause.id.$gt)
  })
}

describe("cursor", () => {
  it("round-trips the created_at and id of the last row", () => {
    expect(decodeCursor(encodeCursor({ id: "order_2", created_at: new Date(at) }))).toEqual({ created_at: at, id: "order_2" })
  })

  it("reads a plain date stored by an earlier version", () => {
    expect(decodeCursor(at)).toEqual({ created_at: at, id: "" })
    expect(decodeCursor(null)).toBeNull()
    expect(decodeCursor("garbage")).toBeNull()
  })

  it("does not skip rows that share the boundary timestamp", () => {
    const rows = Array.from({ length: 5 }, (_, i) => ({ id: `order_${i}`, created_at: at }))
    const filter = afterCursor(decodeCursor(encodeCursor(rows[1])))
    expect(rows.filter((row) => matches(filter, row)).map((row) => row.id)).toEqual(["order_2", "order_3", "order_4"])
  })

  it("moves a forward scan past the last row, or keeps it when nothing came", () => {
    expect(advanceCursor([{ id: "order_9", created_at: at }], "prev")).toBe(`${at}|order_9`)
    expect(advanceCursor([], "prev")).toBe("prev")
  })

  it("wraps a backlog scan to the start once a page comes back short", () => {
    const full = [{ id: "pout_1", created_at: at }, { id: "pout_2", created_at: at }]
    expect(wrapCursor(full, 2)).toBe(`${at}|pout_2`)
    expect(wrapCursor(full.slice(0, 1), 2)).toBeNull()
  })
})
