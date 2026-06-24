import { describe, it, expect } from "vitest"
import {
  encodeCursor,
  decodeCursor,
} from "../../modules/messaging/service"

describe("Cursor Encoding", () => {
  describe("encodeCursor", () => {
    it("encodes a conversation cursor (last_message_at, id)", () => {
      const cursor = encodeCursor({
        last_message_at: "2026-01-15T10:30:00.000Z",
        id: "conv_abc123",
      })

      expect(cursor).toBeTruthy()
      expect(typeof cursor).toBe("string")

      // Should be base64url encoded
      expect(cursor).not.toContain("+")
      expect(cursor).not.toContain("/")
      expect(cursor).not.toContain("=")
    })

    it("encodes a message cursor (created_at, id)", () => {
      const cursor = encodeCursor({
        created_at: "2026-01-15T10:30:00.000Z",
        id: "msg_xyz789",
      })

      expect(cursor).toBeTruthy()
      expect(typeof cursor).toBe("string")
    })

    it("handles null values in cursor", () => {
      const cursor = encodeCursor({
        last_message_at: null,
        id: null,
      })

      expect(cursor).toBeTruthy()
      const decoded = decodeCursor(cursor)
      expect(decoded).toEqual({
        last_message_at: null,
        id: null,
      })
    })

    it("handles numeric values", () => {
      const cursor = encodeCursor({
        last_message_at: 1705312200000,
        id: "conv_123",
      })

      const decoded = decodeCursor(cursor)
      expect(decoded?.last_message_at).toBe(1705312200000)
      expect(decoded?.id).toBe("conv_123")
    })
  })

  describe("decodeCursor", () => {
    it("decodes a valid cursor back to original values", () => {
      const original = {
        last_message_at: "2026-01-15T10:30:00.000Z",
        id: "conv_abc123",
      }

      const cursor = encodeCursor(original)
      const decoded = decodeCursor(cursor)

      expect(decoded).toEqual(original)
    })

    it("returns null for empty string", () => {
      const decoded = decodeCursor("")
      expect(decoded).toBeNull()
    })

    it("returns null for malformed input", () => {
      expect(decodeCursor("not-valid-base64url!!!")).toBeNull()
    })

    it("returns null for invalid JSON after decoding", () => {
      // Valid base64url but not JSON
      const notJson = Buffer.from("hello world").toString("base64url")
      expect(decodeCursor(notJson)).toBeNull()
    })

    it("roundtrips correctly for conversation cursors", () => {
      const values = {
        last_message_at: "2026-03-27T15:00:00.000Z",
        id: "conv_m3rcur",
      }

      expect(decodeCursor(encodeCursor(values))).toEqual(values)
    })

    it("roundtrips correctly for message cursors", () => {
      const values = {
        created_at: "2026-03-27T15:00:00.000Z",
        id: "msg_abc123",
      }

      expect(decodeCursor(encodeCursor(values))).toEqual(values)
    })
  })
})
