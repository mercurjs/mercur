import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@medusajs/ui";

import { useCreateSellerAccount, useLogout } from "@hooks/api";
import { queryClient } from "@lib/query-client";
import {
  TOTAL_STEPS,
  ONBOARDING_DRAFT_KEY,
  getStoredOnboardingDraft,
  setStoredOnboardingDraft,
} from "../constants";
import {
  REGISTER_DRAFT_KEY,
  getStoredRegisterDraft,
} from "../../../pages/register";

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

  // Step 1: Store — save locally & in draft
  const submitStoreStep = useCallback(async (data: StoreData) => {
    storeDataRef.current = data;
    setStoreData(data);
    setStoredOnboardingDraft({ store: data, currentStep: 1 });
    setCurrentStep(1);
  }, []);

  // Step 2: Address — save locally & in draft
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

  // Step 3: Company — save locally & in draft
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

  /**
   * Creates seller with ALL collected data (Steps 1-4) in one API call.
   * This goes through POST /vendor/sellers which is unauthenticated —
   * no seller_context needed, no session issues.
   */
  const createSellerWithAllData = useCallback(
    async (currentPayment?: PaymentData) => {
      const currentStore = storeDataRef.current;
      if (!currentStore) return;

      // Already created (user went back and forward)
      if (sellerIdRef.current) {
        navigate("/store-select", { replace: true });
        return;
      }

      const currentAddress = addressDataRef.current;
      const currentCompany = companyDataRef.current;
      const hasCompanyData =
        currentCompany?.corporate_name ||
        currentCompany?.registration_number ||
        currentCompany?.tax_id;

      const isUS = currentPayment?.country_code === "us";

      const registerDraft = getStoredRegisterDraft();

      try {
        setIsSubmitting(true);

        const result = await createSeller({
          name: currentStore.name,
          handle: currentStore.handle || undefined,
          email: currentStore.email,
          phone: currentStore.phone || undefined,
          member_email: memberEmail,
          first_name: registerDraft.first_name,
          last_name: registerDraft.last_name,
          currency_code: currentStore.currency_code.toLowerCase(),
          description: currentStore.description || undefined,
          ...(currentStore.additional_data &&
          Object.keys(currentStore.additional_data).length
            ? { additional_data: currentStore.additional_data }
            : {}),
          address: currentAddress
            ? {
                name: currentAddress.name || undefined,
                address_1: currentAddress.address_1 || undefined,
                address_2: currentAddress.address_2 || undefined,
                postal_code: currentAddress.postal_code || undefined,
                city: currentAddress.city || undefined,
                country_code: currentAddress.country_code,
                province: currentAddress.province || undefined,
              }
            : undefined,
          professional_details: hasCompanyData
            ? {
                corporate_name: currentCompany!.corporate_name || undefined,
                registration_number:
                  currentCompany!.registration_number || undefined,
                tax_id: currentCompany!.tax_id || undefined,
              }
            : undefined,
          payment_details: currentPayment
            ? {
                country_code: currentPayment.country_code,
                holder_name: currentPayment.holder_name,
                iban: isUS ? null : currentPayment.iban || null,
                bic: isUS ? null : currentPayment.bic || null,
                routing_number: isUS
                  ? currentPayment.routing_number || null
                  : null,
                account_number: currentPayment.account_number || null,
              }
            : undefined,
        });

        const newSellerId = result.seller.id;
        setSellerId(newSellerId);

        // Force a fresh login so the new member_id lands in the JWT.
        try {
          await logout();
        } catch {
          // If logout fails we still redirect to /login — user will re-auth there.
        }
        queryClient.clear();
        sessionStorage.removeItem("mercur_onboarding_email");
        sessionStorage.removeItem(REGISTER_DRAFT_KEY);
        sessionStorage.removeItem(ONBOARDING_DRAFT_KEY);

        navigate("/login", { replace: true });
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [createSeller, logout, memberEmail, navigate],
  );

  // Step 4: Payment — create seller with everything and finish
  const submitPaymentStep = useCallback(
    async (data: PaymentData) => {
      setPaymentData(data);
      setStoredOnboardingDraft({ payment: data });
      await createSellerWithAllData(data);
    },
    [createSellerWithAllData],
  );

  // Skip payment — create seller without payment details
  const skipPaymentStep = useCallback(async () => {
    setPaymentData(null);
    setStoredOnboardingDraft({ payment: null });
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
