import { Children, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { PermissionGuard } from "@mercurjs/dashboard-shared"
import { Button, Heading } from "@medusajs/ui";

export const PriceListListTitle = () => {
  const { t } = useTranslation();
  return (
    <div>
      <Heading>{t("priceLists.domain")}</Heading>
    </div>
  );
};

export const PriceListListCreateButton = () => {
  const { t } = useTranslation();
  return (
    <PermissionGuard resource="price_list" operation="create">
      <Button size="small" variant="secondary" asChild>
        <Link to="create">{t("actions.create")}</Link>
      </Button>
    </PermissionGuard>
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
