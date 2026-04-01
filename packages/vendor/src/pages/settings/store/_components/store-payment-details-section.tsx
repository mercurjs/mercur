import { PencilSquare } from "@medusajs/icons";
import { Container, Heading, Text } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { ActionMenu } from "@components/common/action-menu";
import { HttpTypes } from "@mercurjs/types";

type StorePaymentDetailsSectionProps = {
  seller: HttpTypes.StoreSellerResponse["seller"];
};

const maskValue = (value: string | null | undefined) => {
  if (!value) return "-";
  if (value.length <= 4) return value;
  return `••••${value.slice(-4)}`;
};


export const StorePaymentDetailsSection = ({
  seller,
}: StorePaymentDetailsSectionProps) => {
  const { t } = useTranslation();
  const details = seller.payment_details;
  const isABA = details?.country_code === "us";

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">
          {t("store.paymentDetails.header", "Payment Details")}
        </Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  label: t("actions.edit"),
                  icon: <PencilSquare />,
                  to: "payment-details",
                },
              ],
            },
          ]}
        />
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("store.paymentDetails.fields.countryCode", "Country code")}
        </Text>
        <Text size="small" leading="compact">
          {details?.country_code?.toUpperCase() || "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("store.paymentDetails.fields.holderName", "Account holder")}
        </Text>
        <Text size="small" leading="compact">
          {details?.holder_name || "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("store.paymentDetails.fields.bankName", "Bank name")}
        </Text>
        <Text size="small" leading="compact">
          {details?.bank_name || "-"}
        </Text>
      </div>
      {isABA ? (
        <>
          <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
            <Text size="small" leading="compact" weight="plus">
              {t("store.paymentDetails.fields.routingNumber", "Routing number")}
            </Text>
            <Text size="small" leading="compact">
              {maskValue(details?.routing_number)}
            </Text>
          </div>
          <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
            <Text size="small" leading="compact" weight="plus">
              {t(
                "store.paymentDetails.fields.accountNumber",
                "Account number",
              )}
            </Text>
            <Text size="small" leading="compact">
              {maskValue(details?.account_number)}
            </Text>
          </div>
        </>
      ) : (
        <>
          <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
            <Text size="small" leading="compact" weight="plus">
              {t("store.paymentDetails.fields.iban", "IBAN")}
            </Text>
            <Text size="small" leading="compact">
              {maskValue(details?.iban)}
            </Text>
          </div>
          <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
            <Text size="small" leading="compact" weight="plus">
              {t("store.paymentDetails.fields.bic", "BIC / SWIFT")}
            </Text>
            <Text size="small" leading="compact">
              {details?.bic || "-"}
            </Text>
          </div>
        </>
      )}
    </Container>
  );
};
