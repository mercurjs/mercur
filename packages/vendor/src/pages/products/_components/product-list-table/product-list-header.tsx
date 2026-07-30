import { Children, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button, Heading, Tooltip } from "@medusajs/ui";

import { useStore } from "@hooks/api/store";

export const ProductListTitle = () => {
  const { t } = useTranslation();
  return <Heading level="h2">{t("products.domain")}</Heading>;
};

export const ProductListCreateButton = () => {
  const { t } = useTranslation();
  const { store } = useStore();

  const allowCreationValue = store?.metadata?.allow_vendor_product_creation;
  const allowCreation =
    typeof allowCreationValue === "boolean" ? allowCreationValue : true;

  if (!allowCreation) {
    return (
      <Tooltip content={t("products.create.disabledTooltip")}>
        <Button size="small" variant="secondary" disabled>
          {t("actions.create")}
        </Button>
      </Tooltip>
    );
  }

  return (
    <Button size="small" variant="secondary" asChild>
      <Link to="create">{t("actions.create")}</Link>
    </Button>
  );
};

export const ProductListActions = ({ children }: { children?: ReactNode }) => {
  return (
    <div className="flex items-center justify-center gap-x-2">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <ProductListCreateButton />
        </>
      )}
    </div>
  );
};

export const ProductListHeader = ({ children }: { children?: ReactNode }) => {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <ProductListTitle />
          <ProductListActions />
        </>
      )}
    </div>
  );
};
