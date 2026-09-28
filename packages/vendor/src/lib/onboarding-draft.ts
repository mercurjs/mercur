export const REGISTER_DRAFT_KEY = "mercur_register_draft"
export const ONBOARDING_DRAFT_KEY = "mercur_onboarding_draft"

export type RegisterDraft = {
  first_name?: string
  last_name?: string
  email?: string
}

export type StoreDraft = {
  name?: string
  email?: string
  phone?: string
  currency_code?: string
  description?: string
  handle?: string
  additional_data?: Record<string, unknown>
}

export type AddressDraft = {
  name?: string
  address_1?: string
  address_2?: string
  postal_code?: string
  city?: string
  country_code?: string
  province?: string
}

export type CompanyDraft = {
  corporate_name?: string
  registration_number?: string
  tax_id?: string
}

export type PaymentDraft = {
  country_code?: string
  holder_name?: string
}

export type OnboardingDraft = {
  currentStep?: number
  store?: StoreDraft | null
  address?: AddressDraft | null
  company?: CompanyDraft | null
  payment?: PaymentDraft | null
}

const getStorage = (): Storage | null => {
  if (typeof window !== "undefined" && window.sessionStorage) {
    return window.sessionStorage
  }
  if (typeof globalThis !== "undefined" && globalThis.sessionStorage) {
    return globalThis.sessionStorage
  }
  return null
}

export const getStoredRegisterDraft = (): RegisterDraft => {
  const storage = getStorage()
  if (!storage) return {}

  try {
    const raw = storage.getItem(REGISTER_DRAFT_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return {
          first_name: typeof parsed.first_name === "string" ? parsed.first_name : undefined,
          last_name: typeof parsed.last_name === "string" ? parsed.last_name : undefined,
          email: typeof parsed.email === "string" ? parsed.email : undefined,
        }
      }
    }
  } catch {
    // Ignore storage parse error
  }
  return {}
}

export const setStoredRegisterDraft = (draft: Partial<RegisterDraft>): void => {
  const storage = getStorage()
  if (!storage) return

  try {
    const current = getStoredRegisterDraft()
    const updated: RegisterDraft = {
      first_name: typeof draft.first_name === "string" ? draft.first_name : current.first_name,
      last_name: typeof draft.last_name === "string" ? draft.last_name : current.last_name,
      email: typeof draft.email === "string" ? draft.email : current.email,
    }
    storage.setItem(REGISTER_DRAFT_KEY, JSON.stringify(updated))
  } catch {
    // Ignore storage write error
  }
}

export const clearStoredRegisterDraft = (): void => {
  const storage = getStorage()
  if (!storage) return

  try {
    storage.removeItem(REGISTER_DRAFT_KEY)
  } catch {
    // Ignore storage error
  }
}

export const getStoredOnboardingDraft = (): OnboardingDraft => {
  const storage = getStorage()
  if (!storage) return {}

  try {
    const raw = storage.getItem(ONBOARDING_DRAFT_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return {
          currentStep: typeof parsed.currentStep === "number" ? parsed.currentStep : undefined,
          store: parsed.store ?? null,
          address: parsed.address ?? null,
          company: parsed.company ?? null,
          payment: parsed.payment
            ? {
                country_code: parsed.payment.country_code,
                holder_name: parsed.payment.holder_name,
              }
            : null,
        }
      }
    }
  } catch {
    // Ignore storage parse error
  }
  return {}
}

export const setStoredOnboardingDraft = (patch: Partial<OnboardingDraft>): void => {
  const storage = getStorage()
  if (!storage) return

  try {
    const current = getStoredOnboardingDraft()
    const sanitizedPayment =
      patch.payment !== undefined
        ? patch.payment
          ? {
              country_code: patch.payment.country_code,
              holder_name: patch.payment.holder_name,
            }
          : null
        : current.payment

    const updated: OnboardingDraft = {
      ...current,
      ...patch,
      payment: sanitizedPayment,
    }
    storage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(updated))
  } catch {
    // Ignore storage write error
  }
}

export const clearStoredOnboardingDraft = (): void => {
  const storage = getStorage()
  if (!storage) return

  try {
    storage.removeItem(ONBOARDING_DRAFT_KEY)
  } catch {
    // Ignore storage error
  }
}
