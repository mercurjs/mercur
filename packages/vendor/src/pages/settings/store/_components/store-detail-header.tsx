import { Children, ReactNode } from "react";
import { PencilSquare } from "@medusajs/icons";
import { Avatar, Heading, StatusBadge } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { ActionMenu } from "@components/common/action-menu";
import { HttpTypes } from "@mercurjs/types";
import { SellerStatus } from "@mercurjs/types";
import { TFunction } from "i18next";

type StoreProps = {
  seller: HttpTypes.StoreSellerResponse["seller"];
};

const getStatusColor = (status: string) => {
  switch (status) {
    case SellerStatus.OPEN:
      return "green";
    case SellerStatus.PENDING_APPROVAL:
      return "orange";
    case SellerStatus.SUSPENDED:
    case SellerStatus.TERMINATED:
      return "red";
    default:
      return "grey";
  }
};

const getStatusLabel = (status: string, t: TFunction) => {
  switch (status) {
    case SellerStatus.OPEN:
      return t("store.status.active", "Active");
    case SellerStatus.PENDING_APPROVAL:
      return t("store.status.pendingApproval", "Pending");
    case SellerStatus.SUSPENDED:
      return t("store.status.suspended", "Suspended");
    case SellerStatus.TERMINATED:
      return t("store.status.terminated", "Terminated");
    default:
      return status;
  }
};

export const StoreDetailTitle = ({ seller }: StoreProps) => {
  return (
    <div className="flex items-center gap-x-4">
      <Avatar
        variant="squared"
        size="large"
        src={seller.logo || undefined}
        fallback={seller.name.charAt(0).toUpperCase()}
      />
      <Heading>{seller.name}</Heading>
    </div>
  );
};

export const StoreDetailEditButton = () => {
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

export const StoreDetailActions = ({
  seller,
  children,
}: StoreProps & { children?: ReactNode }) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-x-2">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <StatusBadge color={getStatusColor(seller.status)}>
            {getStatusLabel(seller.status, t)}
          </StatusBadge>
          <StoreDetailEditButton />
        </>
      )}
    </div>
  );
};

export const StoreDetailHeader = ({
  seller,
  children,
}: StoreProps & { children?: ReactNode }) => {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <StoreDetailTitle seller={seller} />
          <StoreDetailActions seller={seller} />
        </>
      )}
    </div>
  );
};
