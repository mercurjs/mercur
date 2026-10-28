export type Cursor = { created_at: string; id: string }

export type CursorRow = { id: string; created_at: Date | string }

const SEPARATOR = "|"

export const encodeCursor = (row: CursorRow): string =>
  `${new Date(row.created_at).toISOString()}${SEPARATOR}${row.id}`

/** Also reads the plain ISO dates earlier versions stored. */
export const decodeCursor = (value: string | null | undefined): Cursor | null => {
  if (!value) {
    return null
  }
  const [createdAt, id = ""] = value.split(SEPARATOR)
  const date = new Date(createdAt)
  return Number.isNaN(date.getTime()) ? null : { created_at: date.toISOString(), id }
}

// created_at carries microseconds while the cursor keeps milliseconds, so rows
// in the cursor's own millisecond come back once more instead of being skipped.
export const afterCursor = (cursor: Cursor | null): Record<string, unknown> =>
  cursor
    ? {
        $or: [
          { created_at: { $gt: new Date(cursor.created_at) } },
          { created_at: new Date(cursor.created_at), id: { $gt: cursor.id } },
        ],
      }
    : {}

export const CURSOR_ORDER = { created_at: "ASC", id: "ASC" } as const

export const advanceCursor = (rows: CursorRow[], previous: string | null): string | null =>
  rows.length ? encodeCursor(rows[rows.length - 1]) : previous

/** A scan that wraps: past the last row, or back to the start once a page comes back short. */
export const wrapCursor = (rows: CursorRow[], pageSize: number): string | null =>
  rows.length < pageSize ? null : encodeCursor(rows[rows.length - 1])
