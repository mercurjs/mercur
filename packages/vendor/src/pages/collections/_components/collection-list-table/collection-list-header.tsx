import { Children, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button, Heading, Text } from "@medusajs/ui";

export const CollectionListTitle = () => {
  const { t } = useTranslation();
  return (
    <div>
      <Heading>{t("collections.domain")}</Heading>
      <Text className="text-ui-fg-subtle" size="small">
        {t("collections.subtitle")}
      </Text>
    </div>
  );
};

export const CollectionListCreateButton = () => {
  const { t } = useTranslation();
  return (
    <Button size="small" variant="primary" asChild>
      <Link to="create">{t("actions.create")}</Link>
    </Button>
  );
};

export const CollectionListActions = ({
  children,
}: {
  children?: ReactNode;
}) => {
  return (
    <div className="flex items-center justify-center gap-x-2">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <CollectionListCreateButton />
      )}
    </div>
  );
};

export const CollectionListHeader = ({
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
          <CollectionListTitle />
          <CollectionListActions />
        </>
      )}
    </div>
  );
};
