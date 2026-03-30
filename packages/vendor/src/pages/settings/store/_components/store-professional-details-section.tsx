import { PencilSquare } from "@medusajs/icons";
import { Container, Heading, StatusBadge, Text } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { ActionMenu } from "@components/common/action-menu";
import { HttpTypes } from "@mercurjs/types";

type StoreProfessionalDetailsSectionProps = {
  seller: HttpTypes.StoreSellerResponse["seller"];
};

export const StoreProfessionalDetailsSection = ({
  seller,
}: StoreProfessionalDetailsSectionProps) => {
  const { t } = useTranslation();
  const details = seller.professional_details;
  const isProfessional = !!details;

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">
          {t(
            "store.professionalDetails.header",
            "Professional Details",
          )}
        </Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  label: t("actions.edit"),
                  icon: <PencilSquare />,
                  to: "professional-details",
                },
              ],
            },
          ]}
        />
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("fields.professional")}
        </Text>
        <div>
          <StatusBadge color={isProfessional ? "green" : "grey"}>
            {isProfessional ? t("fields.true") : t("fields.false")}
          </StatusBadge>
        </div>
      </div>
      {isProfessional && (
        <>
          <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
            <Text size="small" leading="compact" weight="plus">
              {t(
                "store.professionalDetails.fields.corporateName",
                "Corporate name",
              )}
            </Text>
            <Text size="small" leading="compact">
              {details.corporate_name || "-"}
            </Text>
          </div>
          <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
            <Text size="small" leading="compact" weight="plus">
              {t(
                "store.professionalDetails.fields.registrationNumber",
                "Registration number",
              )}
            </Text>
            <Text size="small" leading="compact">
              {details.registration_number || "-"}
            </Text>
          </div>
          <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
            <Text size="small" leading="compact" weight="plus">
              {t(
                "store.professionalDetails.fields.taxId",
                "Tax ID",
              )}
            </Text>
            <Text size="small" leading="compact">
              {details.tax_id || "-"}
            </Text>
          </div>
        </>
      )}
    </Container>
  );
};
