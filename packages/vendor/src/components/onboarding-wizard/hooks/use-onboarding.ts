import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@medusajs/ui";

import { useCreateSellerAccount, useLogout } from "@hooks/api";
import { queryClient } from "@lib/query-client";
import {
  clearStoredOnboardingDraft,
  clearStoredRegisterDraft,
  getStoredOnboardingDraft,
  getStoredRegisterDraft,
  setStoredOnboardingDraft,
} from "@lib/onboarding-draft";
import { TOTAL_STEPS } from "../constants";

type StoreData = {
  name: string;
  email: string;
  phone?: string;
  currency_code: string;
  description?: string;
  handle?: string;
  additional_data?: Record<string, unknown>;
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

export const useOnboarding = (memberEmail: string) => {
  const navigate = useNavigate();
  const [initialDraft] = useState(() => getStoredOnboardingDraft());

  const [currentStep, setCurrentStep] = useState<number>(() => {
    if (
      typeof initialDraft.currentStep === "number" &&
      initialDraft.currentStep >= 0 &&
      initialDraft.currentStep < TOTAL_STEPS
    ) {
      return initialDraft.currentStep;
    }
    return 0;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sellerIdRef = useRef<string | null>(null);
  const [sellerIdState, setSellerIdState] = useState<string | null>(null);

  const setSellerId = (id: string) => {
    sellerIdRef.current = id;
    setSellerIdState(id);
  };

  const [storeData, setStoreData] = useState<StoreData | null>(
    (initialDraft.store as StoreData) ?? null
  );
  const [addressData, setAddressData] = useState<AddressData | null>(
    (initialDraft.address as AddressData) ?? null
  );
  const [companyData, setCompanyData] = useState<CompanyData | null>(
    (initialDraft.company as CompanyData) ?? null
  );
  const [paymentData, setPaymentData] = useState<PaymentData | null>(
    (initialDraft.payment as PaymentData) ?? null
  );

  const storeDataRef = useRef<StoreData | null>(
    (initialDraft.store as StoreData) ?? null
  );
  const addressDataRef = useRef<AddressData | null>(
    (initialDraft.address as AddressData) ?? null
  );
  const companyDataRef = useRef<CompanyData | null>(
    (initialDraft.company as CompanyData) ?? null
  );

  const { mutateAsync: createSeller, isPending: isCreating } =
    useCreateSellerAccount();
  const { mutateAsync: logout } = useLogout();

  const isPending = isCreating || isSubmitting;

  const submitStoreStep = useCallback(async (data: StoreData) => {
    storeDataRef.current = data;
    setStoreData(data);
    setStoredOnboardingDraft({ store: data, currentStep: 1 });
    setCurrentStep(1);
  }, []);

  const submitAddressStep = useCallback(async (data: AddressData) => {
    addressDataRef.current = data;
    setAddressData(data);
    setStoredOnboardingDraft({ address: data, currentStep: 2 });
    setCurrentStep(2);
  }, []);

  const skipAddressStep = useCallback(() => {
    addressDataRef.current = null;
    setAddressData(null);
    setStoredOnboardingDraft({ address: null, currentStep: 2 });
    setCurrentStep(2);
  }, []);

  const submitCompanyStep = useCallback(async (data: CompanyData) => {
    companyDataRef.current = data;
    setCompanyData(data);
    setStoredOnboardingDraft({ company: data, currentStep: 3 });
    setCurrentStep(3);
  }, []);

  const skipCompanyStep = useCallback(() => {
    companyDataRef.current = null;
    setCompanyData(null);
    setStoredOnboardingDraft({ company: null, currentStep: 3 });
    setCurrentStep(3);
  }, []);

  const createSellerWithAllData = useCallback(
    async (paymentData?: PaymentData) => {
      const storeData = storeDataRef.current;
      if (!storeData) return;

      if (sellerIdRef.current) {
        navigate("/store-select", { replace: true });
        return;
      }

      const addressData = addressDataRef.current;
      const companyData = companyDataRef.current;
      const hasCompanyData =
        companyData?.corporate_name ||
        companyData?.registration_number ||
        companyData?.tax_id;

      const isUS = paymentData?.country_code === "us";
      const registerDraft = getStoredRegisterDraft();

      try {
        setIsSubmitting(true);

        const result = await createSeller({
          name: storeData.name,
          handle: storeData.handle || undefined,
          email: storeData.email,
          phone: storeData.phone || undefined,
          member_email: memberEmail,
          first_name: registerDraft.first_name,
          last_name: registerDraft.last_name,
          currency_code: storeData.currency_code.toLowerCase(),
          description: storeData.description || undefined,
          ...(storeData.additional_data &&
          Object.keys(storeData.additional_data).length
            ? { additional_data: storeData.additional_data }
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
          professional_details: hasCompanyData
            ? {
                corporate_name: companyData!.corporate_name || undefined,
                registration_number:
                  companyData!.registration_number || undefined,
                tax_id: companyData!.tax_id || undefined,
              }
            : undefined,
          payment_details: paymentData
            ? {
                country_code: paymentData.country_code,
                holder_name: paymentData.holder_name,
                iban: isUS ? null : paymentData.iban || null,
                bic: isUS ? null : paymentData.bic || null,
                routing_number: isUS
                  ? paymentData.routing_number || null
                  : null,
                account_number: paymentData.account_number || null,
              }
            : undefined,
        });

        const newSellerId = result.seller.id;
        setSellerId(newSellerId);

        try {
          await logout();
        } catch {
          // If logout fails we still redirect to /login — user will re-auth there.
        }
        queryClient.clear();
        sessionStorage.removeItem("mercur_onboarding_email");
        clearStoredRegisterDraft();
        clearStoredOnboardingDraft();

        navigate("/login", { replace: true });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Failed to create seller";
        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [createSeller, logout, memberEmail, navigate],
  );

  const submitPaymentStep = useCallback(
    async (data: PaymentData) => {
      setPaymentData(data);
      await createSellerWithAllData(data);
    },
    [createSellerWithAllData],
  );

  const skipPaymentStep = useCallback(async () => {
    setPaymentData(null);
    await createSellerWithAllData();
  }, [createSellerWithAllData]);

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => {
        const next = prev - 1;
        setStoredOnboardingDraft({ currentStep: next });
        return next;
      });
    }
  }, [currentStep]);

  return {
    currentStep,
    totalSteps: TOTAL_STEPS,
    sellerId: sellerIdState,
    isPending,
    canGoBack: currentStep > 0,
    goBack,
    storeData,
    addressData,
    companyData,
    paymentData,
    submitStoreStep,
    submitAddressStep,
    skipAddressStep,
    submitCompanyStep,
    skipCompanyStep,
    submitPaymentStep,
    skipPaymentStep,
  };
};
