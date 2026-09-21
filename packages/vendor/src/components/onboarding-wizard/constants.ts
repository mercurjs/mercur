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
