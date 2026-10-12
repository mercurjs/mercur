import type { OnboardingStepDefault } from "@mercurjs/dashboard-shared";

export const WIZARD_STEPS = [
  { id: "store", rank: 10, optional: false, required: true },
  { id: "address", rank: 20, optional: true },
  { id: "company", rank: 30, optional: true },
  { id: "payment", rank: 40, optional: true },
] as const satisfies readonly OnboardingStepDefault[];

export type WizardStepId = (typeof WIZARD_STEPS)[number]["id"];
