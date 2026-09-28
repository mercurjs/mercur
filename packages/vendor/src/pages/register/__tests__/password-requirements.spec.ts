import { describe, expect, test } from "vitest"

import { RegisterSchema } from "../register-schema"

const checkPasswordRequirements = (value = "") => {
  const trimmed = value.trim()
  const hasMinLength = trimmed.length >= 8
  const hasLower = /[a-z]/.test(value)
  const hasUpper = /[A-Z]/.test(value)
  const hasNumberOrSymbol = /[\d\W]/.test(value)

  return {
    minLength: hasMinLength,
    lowercase: hasLower,
    uppercase: hasUpper,
    numberOrSymbol: hasNumberOrSymbol,
    allMet: hasMinLength && hasLower && hasUpper && hasNumberOrSymbol,
  }
}

describe("password requirements checklist", () => {
  test("empty password meets no requirements", () => {
    const result = checkPasswordRequirements("")
    expect(result.minLength).toBe(false)
    expect(result.lowercase).toBe(false)
    expect(result.uppercase).toBe(false)
    expect(result.numberOrSymbol).toBe(false)
    expect(result.allMet).toBe(false)
  })

  test("whitespace-only password fails minLength and complexity", () => {
    const result = checkPasswordRequirements("        ")
    expect(result.minLength).toBe(false)
    expect(result.allMet).toBe(false)
  })

  test("detects lowercase letter", () => {
    const result = checkPasswordRequirements("a")
    expect(result.lowercase).toBe(true)
    expect(result.uppercase).toBe(false)
    expect(result.allMet).toBe(false)
  })

  test("detects uppercase letter", () => {
    const result = checkPasswordRequirements("A")
    expect(result.uppercase).toBe(true)
    expect(result.lowercase).toBe(false)
    expect(result.allMet).toBe(false)
  })

  test("detects digit or symbol", () => {
    const withDigit = checkPasswordRequirements("1")
    expect(withDigit.numberOrSymbol).toBe(true)

    const withSymbol = checkPasswordRequirements("!")
    expect(withSymbol.numberOrSymbol).toBe(true)
  })

  test("validates complete password meeting all requirements", () => {
    const result = checkPasswordRequirements("Passw0rd!")
    expect(result.minLength).toBe(true)
    expect(result.lowercase).toBe(true)
    expect(result.uppercase).toBe(true)
    expect(result.numberOrSymbol).toBe(true)
    expect(result.allMet).toBe(true)
  })

  test("aligns exactly with RegisterSchema password validation", () => {
    const validPasswords = [
      "Password123",
      "Secret!99",
      "ValidP@ssw0rd",
      "Str0ngP#ss",
    ]

    for (const pw of validPasswords) {
      const checklist = checkPasswordRequirements(pw)
      expect(checklist.allMet).toBe(true)

      const schemaResult = RegisterSchema.safeParse({
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        password: pw,
      })
      expect(schemaResult.success).toBe(true)
    }

    const invalidPasswords = [
      "short", // < 8
      "alllowercase1!", // no uppercase
      "ALLUPPERCASE1!", // no lowercase
      "NoNumbersOrSymbolsHere", // no digit/symbol
    ]

    for (const pw of invalidPasswords) {
      const checklist = checkPasswordRequirements(pw)
      expect(checklist.allMet).toBe(false)

      const schemaResult = RegisterSchema.safeParse({
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        password: pw,
      })
      expect(schemaResult.success).toBe(false)
    }
  })
})
