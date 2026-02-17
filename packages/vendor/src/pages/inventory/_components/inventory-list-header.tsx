import { Button, Heading, Text } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export const InventoryListHeader = () => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div>
        <Heading>{t("inventory.domain")}</Heading>
        <Text className="text-ui-fg-subtle" size="small">
          {t("inventory.subtitle")}
        </Text>
      </div>
      <InventoryListCreateButton />
    </div>
  );
};

export const InventoryListCreateButton = () => {
  const { t } = useTranslation();

  return (
    <Button size="small" variant="secondary" asChild>
      <Link to="create">{t("actions.create")}</Link>
    </Button>
  );
};
