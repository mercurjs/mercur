import { Children, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Heading } from "@medusajs/ui";

export const ProductTagListTitle = () => {
  const { t } = useTranslation();
  return <Heading>{t("productTags.domain")}</Heading>;
};

export const ProductTagListActions = ({
  children,
}: {
  children?: ReactNode;
}) => {
  return (
    <div className="flex items-center justify-center gap-x-2">
      {Children.count(children) > 0 ? children : null}
    </div>
  );
};

export const ProductTagListHeader = ({
  children,
}: {
  children?: ReactNode;
}) => {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <ProductTagListTitle />
      )}
    </div>
  );
};
