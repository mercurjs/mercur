import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@medusajs/ui";

import { useCreateSellerAccount } from "@hooks/api";
import { sdk } from "@lib/client";
import { TOTAL_STEPS } from "../constants";

type StoreData = {
  name: string;
  email: string;
  currency_code: string;
  description?: string;
  handle?: string;
};

type AddressData = {
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
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sellerIdRef = useRef<string | null>(null);
  const [sellerIdState, setSellerIdState] = useState<string | null>(null);

  const setSellerId = (id: string) => {
    sellerIdRef.current = id;
    setSellerIdState(id);
  };

  const storeDataRef = useRef<StoreData | null>(null);
  const addressDataRef = useRef<AddressData | null>(null);
  const companyDataRef = useRef<CompanyData | null>(null);

  const { mutateAsync: createSeller, isPending: isCreating } =
    useCreateSellerAccount();

  const isPending = isCreating || isSubmitting;

  // Step 1: Store — save locally
  const submitStoreStep = useCallback(async (data: StoreData) => {
    storeDataRef.current = data;
    setCurrentStep(1);
  }, []);

  // Step 2: Address — save locally
  const submitAddressStep = useCallback(async (data: AddressData) => {
    addressDataRef.current = data;
    setCurrentStep(2);
  }, []);

  const skipAddressStep = useCallback(() => {
    addressDataRef.current = null;
    setCurrentStep(2);
  }, []);

  // Step 3: Company — save locally
  const submitCompanyStep = useCallback(async (data: CompanyData) => {
    companyDataRef.current = data;
    setCurrentStep(3);
  }, []);

  const skipCompanyStep = useCallback(() => {
    companyDataRef.current = null;
    setCurrentStep(3);
  }, []);

  /**
   * Creates seller with ALL collected data (Steps 1-4) in one API call.
   * This goes through POST /vendor/sellers which is unauthenticated —
   * no seller_context needed, no session issues.
   */
  const createSellerWithAllData = useCallback(
    async (paymentData?: PaymentData) => {
      const storeData = storeDataRef.current;
      if (!storeData) return;

      // Already created (user went back and forward)
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

      try {
        setIsSubmitting(true);

        const result = await createSeller({
          name: storeData.name,
          handle: storeData.handle || undefined,
          email: storeData.email,
          member_email: memberEmail,
          currency_code: storeData.currency_code.toLowerCase(),
          description: storeData.description || undefined,
          address: addressData
            ? {
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
                account_number: isUS
                  ? null
                  : paymentData.account_number || null,
              }
            : undefined,
        });

        const newSellerId = result.seller.id;
        setSellerId(newSellerId);

        try {
          await sdk.auth.session.mutate({});
        } catch {
          // The backend also falls back to auth identity metadata, so this
          // refresh only optimizes the immediate post-onboarding session.
        }

        navigate("/store-select", { replace: true });
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [createSeller, memberEmail, navigate],
  );

  // Step 4: Payment — create seller with everything and finish
  const submitPaymentStep = useCallback(
    async (data: PaymentData) => {
      await createSellerWithAllData(data);
    },
    [createSellerWithAllData],
  );

  // Skip payment — create seller without payment details
  const skipPaymentStep = useCallback(async () => {
    await createSellerWithAllData();
  }, [createSellerWithAllData]);

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  return {
    currentStep,
    totalSteps: TOTAL_STEPS,
    sellerId: sellerIdState,
    isPending,
    canGoBack: currentStep > 0,
    goBack,
    submitStoreStep,
    submitAddressStep,
    skipAddressStep,
    submitCompanyStep,
    skipCompanyStep,
    submitPaymentStep,
    skipPaymentStep,
  };
};
