import { CreditCard, PencilSquare } from "@medusajs/icons";
import { Container, Heading, Text } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { ActionMenu } from "@components/common/action-menu";
import { IconAvatar } from "@components/common/icon-avatar";
import { HttpTypes } from "@mercurjs/types";

type StorePaymentDetailsSectionProps = {
  seller: HttpTypes.StoreSellerResponse["seller"];
};

export const StorePaymentDetailsSection = ({
  seller,
}: StorePaymentDetailsSectionProps) => {
  const { t } = useTranslation();
  const details = seller.payment_details;
  const isABA = details?.country_code === "us";

  const accountIdentifier = isABA
    ? details?.account_number
    : details?.iban;

  const subtitle = [details?.bank_name, accountIdentifier]
    .filter(Boolean)
    .join(" \u2022 ");

  return (
    <Container className="p-0">
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
      <div className="flex flex-col gap-2 px-2 pb-2">
        <div className="px-4 pb-2">
          <div className="flex items-center gap-4">
            <IconAvatar size="large" variant="squared">
              <CreditCard />
            </IconAvatar>
            <div className="flex flex-1 flex-col">
              <Text size="small" leading="compact" weight="plus">
                {details?.holder_name || "-"}
              </Text>
              <Text
                size="small"
                leading="compact"
                className="text-ui-fg-subtle"
              >
                {subtitle || "-"}
              </Text>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};
