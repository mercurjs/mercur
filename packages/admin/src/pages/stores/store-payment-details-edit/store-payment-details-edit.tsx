import { Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import { RouteDrawer } from "../../../components/modals";
import { useSeller } from "../../../hooks/api/sellers";
import { StorePaymentDetailsForm } from "./components/store-payment-details-form";

export const StorePaymentDetailsEdit = () => {
  const { id } = useParams();
  const { t } = useTranslation();

  const { seller, isLoading, isError, error } = useSeller(id!);

  if (isError) {
    throw error;
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>
            {t("store.paymentDetails.edit.header", "Edit Payment Details")}
          </Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description className="sr-only">
          {t(
            "store.paymentDetails.edit.description",
            "Update the payment details for this store.",
          )}
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      {!isLoading && seller && <StorePaymentDetailsForm seller={seller} />}
    </RouteDrawer>
  );
};
