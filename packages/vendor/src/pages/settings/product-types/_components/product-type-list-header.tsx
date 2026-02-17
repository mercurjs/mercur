import { Children, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Heading, Text } from "@medusajs/ui";

export const ProductTypeListTitle = () => {
  const { t } = useTranslation();
  return (
    <div>
      <Heading>{t("productTypes.domain")}</Heading>
      <Text className="text-ui-fg-subtle" size="small">
        {t("productTypes.subtitle")}
      </Text>
    </div>
  );
};

export const ProductTypeListActions = ({
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

export const ProductTypeListHeader = ({
  children,
}: {
  children?: ReactNode;
}) => {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <ProductTypeListTitle />
      )}
    </div>
  );
};
