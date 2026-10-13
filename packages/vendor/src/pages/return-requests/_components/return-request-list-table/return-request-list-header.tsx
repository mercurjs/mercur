import { useTranslation } from "react-i18next";
import { Heading, Text } from "@medusajs/ui";

export const ReturnRequestListHeader = () => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div>
        <Heading>{t("returnRequests.domain")}</Heading>
        <Text className="text-ui-fg-subtle" size="small">
          {t("returnRequests.subtitle")}
        </Text>
      </div>
    </div>
  );
};
