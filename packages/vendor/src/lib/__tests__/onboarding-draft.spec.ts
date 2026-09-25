import { beforeEach, describe, expect, test } from "vitest"

import {
  ONBOARDING_DRAFT_KEY,
  REGISTER_DRAFT_KEY,
  clearStoredOnboardingDraft,
  clearStoredRegisterDraft,
  getStoredOnboardingDraft,
  getStoredRegisterDraft,
  setStoredOnboardingDraft,
  setStoredRegisterDraft,
} from "../onboarding-draft"

class MockStorage implements Storage {
  private store = new Map<string, string>()

  get length() {
    return this.store.size
  }

  clear() {
    this.store.clear()
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null
  }

  removeItem(key: string): void {
    this.store.delete(key)
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value))
  }
}

if (typeof globalThis.sessionStorage === "undefined") {
  globalThis.sessionStorage = new MockStorage()
}

describe("registration draft storage", () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  test("returns empty object when no draft exists", () => {
    expect(getStoredRegisterDraft()).toEqual({})
  })

  test("handles malformed JSON in sessionStorage gracefully", () => {
    sessionStorage.setItem(REGISTER_DRAFT_KEY, "{invalid-json")
    expect(getStoredRegisterDraft()).toEqual({})
  })

  test("handles non-object JSON gracefully", () => {
    sessionStorage.setItem(REGISTER_DRAFT_KEY, JSON.stringify(["not", "an", "object"]))
    expect(getStoredRegisterDraft()).toEqual({})
  })

  test("stores and retrieves first_name, last_name, and email", () => {
    setStoredRegisterDraft({
      first_name: "Jane",
      last_name: "Doe",
      email: "jane@example.com",
    })

    expect(getStoredRegisterDraft()).toEqual({
      first_name: "Jane",
      last_name: "Doe",
      email: "jane@example.com",
    })
  })

  test("never persists password even if present in raw storage", () => {
    sessionStorage.setItem(
      REGISTER_DRAFT_KEY,
      JSON.stringify({
        first_name: "Jane",
        last_name: "Doe",
        email: "jane@example.com",
        password: "SecretPassword123!",
      })
    )

    const draft = getStoredRegisterDraft()
    expect(draft).toEqual({
      first_name: "Jane",
      last_name: "Doe",
      email: "jane@example.com",
    })
    expect((draft as Record<string, unknown>).password).toBeUndefined()
  })

  test("merges partial updates cleanly", () => {
    setStoredRegisterDraft({ first_name: "Jane", email: "jane@example.com" })
    setStoredRegisterDraft({ last_name: "Smith" })

    expect(getStoredRegisterDraft()).toEqual({
      first_name: "Jane",
      last_name: "Smith",
      email: "jane@example.com",
    })
  })

  test("clears stored register draft", () => {
    setStoredRegisterDraft({ email: "jane@example.com" })
    clearStoredRegisterDraft()
    expect(getStoredRegisterDraft()).toEqual({})
    expect(sessionStorage.getItem(REGISTER_DRAFT_KEY)).toBeNull()
  })
})

describe("onboarding draft storage", () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  test("returns empty object when no draft exists", () => {
    expect(getStoredOnboardingDraft()).toEqual({})
  })

  test("handles malformed JSON gracefully", () => {
    sessionStorage.setItem(ONBOARDING_DRAFT_KEY, "invalid")
    expect(getStoredOnboardingDraft()).toEqual({})
  })

  test("persists currentStep, store, address, and company data", () => {
    setStoredOnboardingDraft({
      currentStep: 2,
      store: {
        name: "Acme Corp",
        email: "store@acme.com",
        currency_code: "usd",
      },
      address: {
        city: "San Francisco",
        country_code: "us",
      },
      company: {
        corporate_name: "Acme Incorporated",
        tax_id: "US-123456",
      },
    })

    const draft = getStoredOnboardingDraft()
    expect(draft.currentStep).toBe(2)
    expect(draft.store?.name).toBe("Acme Corp")
    expect(draft.address?.city).toBe("San Francisco")
    expect(draft.company?.corporate_name).toBe("Acme Incorporated")
  })

  test("does NOT persist sensitive payment fields (IBAN, account number)", () => {
    setStoredOnboardingDraft({
      payment: {
        country_code: "us",
        holder_name: "Jane Doe",
        // @ts-expect-error test runtime prevention of sensitive fields
        iban: "DE89370400440532013000",
        // @ts-expect-error test runtime prevention of sensitive fields
        account_number: "1234567890",
      },
    })

    const draft = getStoredOnboardingDraft()
    expect(draft.payment).toEqual({
      country_code: "us",
      holder_name: "Jane Doe",
    })
    expect((draft.payment as Record<string, unknown> | null)?.iban).toBeUndefined()
    expect((draft.payment as Record<string, unknown> | null)?.account_number).toBeUndefined()

    // Also inspect raw sessionStorage
    const raw = JSON.parse(sessionStorage.getItem(ONBOARDING_DRAFT_KEY) || "{}")
    expect(raw.payment?.iban).toBeUndefined()
    expect(raw.payment?.account_number).toBeUndefined()
  })

  test("merges partial step updates without overwriting existing slices", () => {
    setStoredOnboardingDraft({
      currentStep: 1,
      store: { name: "My Store", email: "store@test.com", currency_code: "eur" },
    })

    setStoredOnboardingDraft({
      currentStep: 2,
      address: { city: "Berlin", country_code: "de" },
    })

    const draft = getStoredOnboardingDraft()
    expect(draft.currentStep).toBe(2)
    expect(draft.store?.name).toBe("My Store")
    expect(draft.address?.city).toBe("Berlin")
  })

  test("clears stored onboarding draft", () => {
    setStoredOnboardingDraft({ currentStep: 1 })
    clearStoredOnboardingDraft()
    expect(getStoredOnboardingDraft()).toEqual({})
    expect(sessionStorage.getItem(ONBOARDING_DRAFT_KEY)).toBeNull()
  })
})
