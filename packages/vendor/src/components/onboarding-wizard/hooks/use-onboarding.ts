import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@medusajs/ui";
import type { OnboardingStep } from "@mercurjs/dashboard-shared";

import { useCreateSellerAccount, useLogout } from "@hooks/api";
import { queryClient } from "@lib/query-client";
import type { StepSubmission } from "../steps/types";

type StoreData = {
  name: string;
  email: string;
  phone?: string;
  currency_code: string;
  description?: string;
  handle: string;
};

type AddressData = {
  name?: string;
  address_1?: string;
  address_2?: string;
  postal_code?: string;
  city?: string;
  country_code: string;
  province?: string;
};

type CompanyData = {
  corporate_name?: string;
  registration_number?: string;
  tax_id?: string;
};

type PaymentData = {
  country_code: string;
  holder_name: string;
  iban?: string;
  bic?: string;
  routing_number?: string;
  account_number?: string;
};

const readRegisterDraft = (): {
  first_name?: string;
  last_name?: string;
  additional_data?: Record<string, unknown>;
} => {
  try {
    const raw = sessionStorage.getItem("mercur_register_draft");
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return {
      first_name: parsed.first_name || undefined,
      last_name: parsed.last_name || undefined,
      additional_data: parsed.additional_data || undefined,
    };
  } catch {
    return {};
  }
};

export const useOnboarding = (memberEmail: string, steps: OnboardingStep[]) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [furthestStep, setFurthestStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sellerIdRef = useRef<string | null>(null);
  const stepDataRef = useRef<Record<string, StepSubmission | null>>({});

  const { mutateAsync: createSeller, isPending: isCreating } =
    useCreateSellerAccount();
  const { mutateAsync: logout } = useLogout();

  const isPending = isCreating || isSubmitting;

  const createSellerWithAllData = useCallback(async () => {
    if (sellerIdRef.current) {
      navigate("/store-select", { replace: true });
      return;
    }

    const stepData = stepDataRef.current;
    const valuesOf = (id: string) => {
      const entry = stepData[id];
      if (!entry) return undefined;
      const { additional_data: _additionalData, ...values } = entry;
      return values;
    };

    const storeData = valuesOf("store") as StoreData | undefined;
    if (!storeData) return;

    const addressData = valuesOf("address") as AddressData | undefined;
    const companyData = valuesOf("company") as CompanyData | undefined;
    const paymentData = valuesOf("payment") as PaymentData | undefined;

    const hasCompanyData =
      companyData?.corporate_name ||
      companyData?.registration_number ||
      companyData?.tax_id;
    const isUS = paymentData?.country_code === "us";

    const registerDraft = readRegisterDraft();
    const additionalData = steps.reduce<Record<string, unknown>>(
      (acc, step) => ({ ...acc, ...stepData[step.id]?.additional_data }),
      { ...registerDraft.additional_data },
    );

    try {
      setIsSubmitting(true);

      const result = await createSeller({
        name: storeData.name,
        handle: storeData.handle,
        email: storeData.email,
        phone: storeData.phone || undefined,
        member_email: memberEmail,
        first_name: registerDraft.first_name,
        last_name: registerDraft.last_name,
        currency_code: storeData.currency_code.toLowerCase(),
        description: storeData.description || undefined,
        ...(Object.keys(additionalData).length
          ? { additional_data: additionalData }
          : {}),
        address: addressData
          ? {
              name: addressData.name || undefined,
              address_1: addressData.address_1 || undefined,
              address_2: addressData.address_2 || undefined,
              postal_code: addressData.postal_code || undefined,
              city: addressData.city || undefined,
              country_code: addressData.country_code,
              province: addressData.province || undefined,
            }
          : undefined,
        professional_details:
          companyData && hasCompanyData
            ? {
                corporate_name: companyData.corporate_name || undefined,
                registration_number:
                  companyData.registration_number || undefined,
                tax_id: companyData.tax_id || undefined,
              }
            : undefined,
        payment_details: paymentData
          ? {
              country_code: paymentData.country_code,
              holder_name: paymentData.holder_name,
              iban: isUS ? null : paymentData.iban || null,
              bic: isUS ? null : paymentData.bic || null,
              routing_number: isUS ? paymentData.routing_number || null : null,
              account_number: paymentData.account_number || null,
            }
          : undefined,
      });

      sellerIdRef.current = result.seller.id;

      // Force a fresh login so the new member_id lands in the JWT.
      try {
        await logout();
      } catch {
        // The user re-authenticates on /login either way.
      }
      queryClient.clear();
      sessionStorage.removeItem("mercur_onboarding_email");
      sessionStorage.removeItem("mercur_register_draft");

      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSubmitting(false);
    }
  }, [createSeller, logout, memberEmail, navigate, steps]);

  const advance = useCallback(
    async (index: number) => {
      if (index >= steps.length - 1) {
        await createSellerWithAllData();
        return;
      }
      setCurrentStep(index + 1);
      setFurthestStep((prev) => Math.max(prev, index + 1));
    },
    [steps.length, createSellerWithAllData],
  );

  const submitStep = useCallback(
    async (index: number, data: StepSubmission) => {
      stepDataRef.current[steps[index].id] = data;
      await advance(index);
    },
    [steps, advance],
  );

  const skipStep = useCallback(
    async (index: number) => {
      stepDataRef.current[steps[index].id] = null;
      await advance(index);
    },
    [steps, advance],
  );

  const goBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  return {
    currentStep,
    furthestStep,
    totalSteps: steps.length,
    isPending,
    goBack,
    submitStep,
    skipStep,
  };
};
