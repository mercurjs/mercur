import { Children, ReactNode } from "react";
import { CheckCircleSolid, PencilSquare } from "@medusajs/icons";
import { Avatar, Heading, StatusBadge, Tooltip } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";

import { ActionMenu } from "../../../../components/common/action-menu";
import { InferClientOutput } from "@mercurjs/client";
import { sdk } from "@lib/client";
import { SellerStatus } from "@mercurjs/types";

type Seller = InferClientOutput<typeof sdk.admin.sellers.$id.query>["seller"];

type StoreProps = {
  seller: Seller;
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
      return t("stores.status.open");
    case SellerStatus.PENDING_APPROVAL:
      return t("stores.status.pending_approval");
    case SellerStatus.SUSPENDED:
      return t("stores.status.suspended");
    case SellerStatus.TERMINATED:
      return t("stores.status.terminated");
    default:
      return status;
  }
};

export const StoreDetailTitle = ({ seller }: StoreProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-x-4">
      <Avatar
        variant="squared"
        size="large"
        src={seller.logo || undefined}
        fallback={seller.name.charAt(0).toUpperCase()}
      />
      <div className="flex items-center gap-x-2">
        <Heading>{seller.name}</Heading>
        {seller.is_premium && (
          <Tooltip content={t("stores.fields.premium")}>
            <CheckCircleSolid className="text-ui-tag-blue-icon" />
          </Tooltip>
        )}
      </div>
    </div>
  );
};

export const StoreDetailEditButton = ({ seller }: StoreProps) => {
  const { t } = useTranslation();
  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              icon: <PencilSquare />,
              label: t("actions.edit"),
              to: `/stores/${seller.id}/edit`,
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
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    icon: <PencilSquare />,
                    label: t("actions.edit"),
                    to: `/stores/${seller.id}/edit`,
                  },
                ],
              },
            ]}
          />
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
