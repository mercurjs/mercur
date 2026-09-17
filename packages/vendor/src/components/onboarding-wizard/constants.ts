export const WIZARD_STEPS = [
  {
    id: "store",
    number: 1,
    labelKey: "onboarding.wizard.steps.store",
  },
  {
    id: "address",
    number: 2,
    labelKey: "onboarding.wizard.steps.address",
  },
  {
    id: "company",
    number: 3,
    labelKey: "onboarding.wizard.steps.company",
  },
  {
    id: "payment",
    number: 4,
    labelKey: "onboarding.wizard.steps.payment",
  },
] as const;

export type WizardStepId = (typeof WIZARD_STEPS)[number]["id"];

export const TOTAL_STEPS = WIZARD_STEPS.length;

export const ONBOARDING_DRAFT_KEY = "mercur_onboarding_draft";

export type OnboardingDraft = {
  currentStep?: number;
  store?: Record<string, any> | null;
  address?: Record<string, any> | null;
  company?: Record<string, any> | null;
  payment?: Record<string, any> | null;
};

export const getStoredOnboardingDraft = (): OnboardingDraft => {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(ONBOARDING_DRAFT_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore error
  }
  return {};
};

export const setStoredOnboardingDraft = (patch: Partial<OnboardingDraft>) => {
  if (typeof window === "undefined") return;
  try {
    const current = getStoredOnboardingDraft();
    const updated = { ...current, ...patch };
    sessionStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(updated));
  } catch {
    // Ignore error
  }
};
