import { Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { RouteDrawer } from "@components/modals";
import { useMe } from "@hooks/api";

import { StorePaymentDetailsForm } from "./store-payment-details-form";

export const Component = () => {
  const { t } = useTranslation();
  const { seller_member, isPending, isError, error } = useMe();

  const seller = seller_member?.seller;

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
            "Update the payment details for your store.",
          )}
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      {!isPending && seller && <StorePaymentDetailsForm seller={seller} />}
    </RouteDrawer>
  );
};
