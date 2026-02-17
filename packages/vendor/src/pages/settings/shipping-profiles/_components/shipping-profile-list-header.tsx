import { Children, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button, Heading, Text } from "@medusajs/ui";

export const ShippingProfileListTitle = () => {
  const { t } = useTranslation();
  return (
    <div>
      <Heading>{t("shippingProfile.domain")}</Heading>
      <Text className="text-ui-fg-subtle" size="small">
        {t("shippingProfile.subtitle")}
      </Text>
    </div>
  );
};

export const ShippingProfileListCreateButton = () => {
  const { t } = useTranslation();
  return (
    <Button size="small" variant="secondary" asChild>
      <Link to="create">{t("actions.create")}</Link>
    </Button>
  );
};

export const ShippingProfileListActions = ({
  children,
}: {
  children?: ReactNode;
}) => {
  return (
    <div className="flex items-center justify-center gap-x-2">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <ShippingProfileListCreateButton />
      )}
    </div>
  );
};

export const ShippingProfileListHeader = ({
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
          <ShippingProfileListTitle />
          <ShippingProfileListActions />
        </>
      )}
    </div>
  );
};
