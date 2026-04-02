import { Buildings, PencilSquare } from "@medusajs/icons";
import { Container, Heading, Text } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { ActionMenu } from "@components/common/action-menu";
import { IconAvatar } from "@components/common/icon-avatar";
import { HttpTypes } from "@mercurjs/types";

type StoreProfessionalDetailsSectionProps = {
  seller: HttpTypes.StoreSellerResponse["seller"];
};

export const StoreProfessionalDetailsSection = ({
  seller,
}: StoreProfessionalDetailsSectionProps) => {
  const { t } = useTranslation();
  const details = seller.professional_details;

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">
          {t("store.professionalDetails.header", "Company Details")}
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
      <div className="flex flex-col gap-2 px-2 pb-2">
        <div className="px-4 pb-2">
          <div className="flex items-center gap-4">
            <IconAvatar size="large" variant="squared">
              <Buildings />
            </IconAvatar>
            <div className="flex flex-1 flex-col">
              <Text size="small" leading="compact" weight="plus">
                {details?.corporate_name || "-"}
              </Text>
              <Text
                size="small"
                leading="compact"
                className="text-ui-fg-subtle"
              >
                {[details?.registration_number, details?.tax_id]
                  .filter(Boolean)
                  .join(" · ") || "-"}
              </Text>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};
