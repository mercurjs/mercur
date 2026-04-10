import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { OnboardingWizard } from "@components/onboarding-wizard";

const ONBOARDING_EMAIL_KEY = "mercur_onboarding_email";

export const Onboarding = () => {
  const location = useLocation();
  const stateEmail = (location.state as { email?: string })?.email;

  // Persist email to sessionStorage for refresh resilience
  useEffect(() => {
    if (stateEmail) {
      sessionStorage.setItem(ONBOARDING_EMAIL_KEY, stateEmail);
    }
  }, [stateEmail]);

  const email =
    stateEmail || sessionStorage.getItem(ONBOARDING_EMAIL_KEY) || "";

  if (!email) {
    return <Navigate to="/login" replace />;
  }

  return <OnboardingWizard memberEmail={email} />;
};
