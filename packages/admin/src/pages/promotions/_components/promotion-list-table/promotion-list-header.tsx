import { Children, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button, Heading } from "@medusajs/ui";

export const PromotionListTitle = () => {
  const { t } = useTranslation();
  return <Heading level="h2">{t("promotions.domain")}</Heading>;
};

export const PromotionListCreateButton = () => {
  const { t } = useTranslation();
  return (
    <Button size="small" variant="secondary" asChild>
      <Link to="create">{t("actions.create")}</Link>
    </Button>
  );
};

export const PromotionListActions = ({
  children,
}: {
  children?: ReactNode;
}) => {
  return (
    <div className="flex items-center justify-center gap-x-2">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <PromotionListCreateButton />
      )}
    </div>
  );
};

export const PromotionListHeader = ({
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
          <PromotionListTitle />
          <PromotionListActions />
        </>
      )}
    </div>
  );
};
