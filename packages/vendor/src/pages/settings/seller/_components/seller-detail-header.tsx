import { Children, ReactNode } from "react";
import { PencilSquare } from "@medusajs/icons";
import { Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { ActionMenu } from "@components/common/action-menu";
import { HttpTypes } from "@mercurjs/types";

type SellerProps = {
  seller: HttpTypes.StoreSellerResponse["seller"];
};

export const SellerDetailTitle = ({ seller }: SellerProps) => {
  return (
    <div className="flex items-center gap-x-4">
      <Heading>{seller.name}</Heading>
    </div>
  );
};

export const SellerDetailEditButton = () => {
  const { t } = useTranslation();
  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              icon: <PencilSquare />,
              label: t("actions.edit"),
              to: "edit",
            },
          ],
        },
      ]}
    />
  );
};

export const SellerDetailActions = ({
  children,
}: {
  children?: ReactNode;
}) => {
  return (
    <div className="flex items-center gap-x-2">
      {Children.count(children) > 0 ? children : <SellerDetailEditButton />}
    </div>
  );
};

export const SellerDetailHeader = ({
  seller,
  children,
}: SellerProps & { children?: ReactNode }) => {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <SellerDetailTitle seller={seller} />
          <SellerDetailActions />
        </>
      )}
    </div>
  );
};
