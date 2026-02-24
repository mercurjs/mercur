import { Children, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button, Heading, Text } from "@medusajs/ui";

export const PriceListListTitle = () => {
  const { t } = useTranslation();
  return (
    <div>
      <Heading>{t("priceLists.domain")}</Heading>
      <Text className="text-ui-fg-subtle" size="small">
        {t("priceLists.subtitle")}
      </Text>
    </div>
  );
};

export const PriceListListCreateButton = () => {
  const { t } = useTranslation();
  return (
    <Button size="small" variant="secondary" asChild>
      <Link to="create">{t("actions.create")}</Link>
    </Button>
  );
};

export const PriceListListActions = ({
  children,
}: {
  children?: ReactNode;
}) => {
  return (
    <div className="flex items-center justify-center gap-x-2">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <PriceListListCreateButton />
      )}
    </div>
  );
};

export const PriceListListHeader = ({
  children,
}: {
  children?: ReactNode;
}) => {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <PriceListListTitle />
          <PriceListListActions />
        </>
      )}
    </div>
  );
};
