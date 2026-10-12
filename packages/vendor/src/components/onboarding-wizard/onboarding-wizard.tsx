import { ComponentType, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { useExtension, useLinkQuery } from "@mercurjs/dashboard-shared";
import { useLogout, useSellers } from "@hooks/api";
import { queryClient } from "@lib/query-client";
import { WIZARD_STEPS, WizardStepId } from "./constants";
import { WizardSidebar } from "./wizard-sidebar";
import { WizardPreview } from "./wizard-preview";
import { WizardStep } from "./wizard-step";
import { useOnboarding } from "./hooks/use-onboarding";
import { StoreStep } from "./steps/store-step";
import { AddressStep } from "./steps/address-step";
import { CompanyStep } from "./steps/company-step";
import { PaymentStep } from "./steps/payment-step";
import { CustomStep } from "./steps/custom-step";
import { StepProps, StepSubmission } from "./steps/types";

const BUILT_IN_STEPS: Record<WizardStepId, ComponentType<StepProps>> = {
  store: StoreStep,
  address: AddressStep,
  company: CompanyStep,
  payment: PaymentStep,
};

type OnboardingWizardProps = {
  memberEmail: string;
};

export const OnboardingWizard = ({ memberEmail }: OnboardingWizardProps) => {
  const navigate = useNavigate();
  const extension = useExtension();
  const { mutateAsync: logoutMutation } = useLogout();
  const { seller_members } = useSellers(useLinkQuery("seller"));
  const hasStores = (seller_members?.length ?? 0) > 0;

  const steps = useMemo(
    () => extension.getOnboardingSteps("seller", [...WIZARD_STEPS]),
    [extension],
  );

  const { currentStep, furthestStep, isPending, goBack, submitStep, skipStep } =
    useOnboarding(memberEmail, steps);

  const handleBack = async () => {
    if (currentStep === 0) {
      if (hasStores) {
        navigate("/store-select", { replace: true });
      } else {
        await logoutMutation(undefined, {
          onSuccess: () => queryClient.clear(),
          onSettled: () => navigate("/login"),
        });
      }
    } else {
      goBack();
    }
  };

  const renderStep = (index: number) => {
    const step = steps[index];

    const props: StepProps = {
      onSubmit: (data: StepSubmission) => submitStep(index, data),
      onSkip: step.optional ? () => skipStep(index) : undefined,
      isLast: index === steps.length - 1,
      isPending,
    };

    const BuiltIn = step.custom
      ? undefined
      : BUILT_IN_STEPS[step.id as WizardStepId];

    return (
      <WizardStep key={step.id} active={index === currentStep}>
        <div data-testid={`onboarding-step-${step.id}`}>
          {BuiltIn ? (
            <BuiltIn {...props} />
          ) : (
            <CustomStep id={step.id} label={step.label} {...props} />
          )}
        </div>
      </WizardStep>
    );
  };

  return (
    <div className="flex h-dvh w-dvw overflow-hidden">
      <WizardSidebar
        currentStep={currentStep}
        totalSteps={steps.length}
        onBack={handleBack}
        showBack
      >
        {/* Visited steps stay mounted (just hidden) so going back, or retrying
            after a failed Finish, keeps everything the user typed. */}
        {steps.slice(0, furthestStep + 1).map((_, index) => renderStep(index))}
      </WizardSidebar>
      <WizardPreview />
    </div>
  );
};
