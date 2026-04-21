import { Children, ReactNode } from "react";
import {
  CheckCircleSolid,
  PencilSquare,
  Trash,
  XCircleSolid,
} from "@medusajs/icons";
import { Avatar, Badge, Heading, StatusBadge, toast, usePrompt } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";

import { ActionMenu } from "../../../../components/common/action-menu";
import {
  useApproveSeller,
  useTerminateSeller,
} from "@/hooks/api/sellers";
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
          <Badge size="2xsmall" color="purple">
            {t("stores.fields.premium")}
          </Badge>
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
  const prompt = usePrompt();

  const { mutateAsync: approveSeller } = useApproveSeller(seller.id);
  const { mutateAsync: terminateSeller } = useTerminateSeller(seller.id);

  const handleAction = async (
    action: () => Promise<unknown>,
    label: { title: string; description: string; success: string },
  ) => {
    const res = await prompt({
      title: label.title,
      description: label.description,
      verificationText: seller.email || seller.name || "",
      confirmText: t("actions.confirm"),
      cancelText: t("actions.cancel"),
    });

    if (!res) return;

    await action().then(
      () => toast.success(label.success),
      (error: Error) => toast.error(error.message),
    );
  };

  const deleteAction = {
    label: t("stores.actions.delete.label"),
    onClick: () =>
      handleAction(() => terminateSeller(), {
        title: t("stores.actions.delete.title"),
        description: t("stores.actions.delete.description"),
        success: t("stores.actions.delete.success"),
      }),
    icon: <Trash />,
  };

  const statusActions = (() => {
    switch (seller.status) {
      case SellerStatus.PENDING_APPROVAL:
        return [
          {
            label: t("stores.actions.approve.label"),
            onClick: () =>
              handleAction(() => approveSeller(), {
                title: t("stores.actions.approve.title"),
                description: t("stores.actions.approve.description"),
                success: t("stores.actions.approve.success"),
              }),
            icon: <CheckCircleSolid />,
          },
          {
            label: t("stores.actions.reject.label"),
            onClick: () =>
              handleAction(() => terminateSeller(), {
                title: t("stores.actions.reject.title"),
                description: t("stores.actions.reject.description"),
                success: t("stores.actions.reject.success"),
              }),
            icon: <XCircleSolid />,
          },
        ];
      case SellerStatus.OPEN:
      case SellerStatus.SUSPENDED:
        return [deleteAction];
      default:
        return [];
    }
  })();

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
              {
                actions: statusActions,
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
