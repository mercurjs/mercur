import { useMemo } from "react";

import { Trash } from "@medusajs/icons";
import { toast } from "@medusajs/ui";
import { keepPreviousData } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";

import { ActionMenu } from "../../../../../components/common/action-menu";
import { _DataTable } from "../../../../../components/table/data-table";
import { DateCell } from "../../../../../components/table/table-cells/common/date-cell";
import {
  useSellerMembers,
  useRemoveSellerMember,
} from "../../../../../hooks/api/sellers";
import { useMemberTableQuery } from "../../../../../hooks/table/query";
import { useDataTable } from "../../../../../hooks/use-data-table";
import { SellerMemberDTO, SellerRole } from "@mercurjs/types";

const PAGE_SIZE = 20;

const ROLE_TRANSLATION_MAP: Record<string, string> = {
  [SellerRole.SELLER_ADMINISTRATION]: "users.roles.administration",
  [SellerRole.INVENTORY_MANAGEMENT]: "users.roles.inventoryManagement",
  [SellerRole.ORDER_MANAGEMENT]: "users.roles.orderManagement",
  [SellerRole.ACCOUNTING]: "users.roles.accounting",
  [SellerRole.SUPPORT]: "users.roles.support",
};

type StoreMembersDataTableProps = {
  sellerId: string;
};

export const StoreMembersDataTable = ({
  sellerId,
}: StoreMembersDataTableProps) => {
  const { t } = useTranslation();

  const { searchParams, raw } = useMemberTableQuery({ pageSize: PAGE_SIZE });
  const { seller_members, count, isPending, isError, error } =
    useSellerMembers(sellerId, searchParams, {
      placeholderData: keepPreviousData,
    });

  const columns = useColumns(sellerId);

  const { table } = useDataTable({
    data: (seller_members as SellerMemberDTO[]) ?? [],
    columns,
    enablePagination: true,
    count,
    pageSize: PAGE_SIZE,
    getRowId: (row) => row.id,
  });

  if (isError) {
    throw error;
  }

  return (
    <_DataTable
      table={table}
      columns={columns}
      count={count}
      pageSize={PAGE_SIZE}
      pagination
      isLoading={isPending}
      queryObject={raw}
      orderBy={[
        { key: "created_at", label: t("fields.createdAt") },
        { key: "updated_at", label: t("fields.updatedAt") },
      ]}
      noRecords={{
        message: t("users.list.empty.description"),
      }}
    />
  );
};

const columnHelper = createColumnHelper<SellerMemberDTO>();

const useColumns = (sellerId: string) => {
  const { t } = useTranslation();

  return useMemo(
    () => [
      columnHelper.accessor("member.email", {
        header: () => (
          <div className="flex h-full w-full items-center">
            <span>{t("fields.email")}</span>
          </div>
        ),
        cell: ({ row }) => {
          return (
            <div className="flex size-full items-center overflow-hidden">
              <span className="truncate">{row.original.member?.email}</span>
            </div>
          );
        },
      }),
      columnHelper.accessor("role_id", {
        header: () => (
          <div className="flex h-full w-full items-center">
            <span>{t("fields.role")}</span>
          </div>
        ),
        cell: ({ row }) => {
          const roleId = row.original.role_id;
          const translationKey = ROLE_TRANSLATION_MAP[roleId];
          const label = translationKey ? t(translationKey) : "-";

          return (
            <div className="flex size-full items-center overflow-hidden">
              <span className="truncate">{label}</span>
            </div>
          );
        },
      }),
      columnHelper.accessor("created_at", {
        header: () => (
          <div className="flex h-full w-full items-center">
            <span>{t("fields.createdAt")}</span>
          </div>
        ),
        cell: ({ getValue }) => {
          const date = getValue();
          return <DateCell date={date ? new Date(date) : null} />;
        },
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
          return (
            <MemberActions member={row.original} sellerId={sellerId} />
          );
        },
      }),
    ],
    [t, sellerId],
  );
};

const MemberActions = ({
  member,
  sellerId,
}: {
  member: SellerMemberDTO;
  sellerId: string;
}) => {
  const { t } = useTranslation();
  const { mutateAsync: removeMember } = useRemoveSellerMember(
    sellerId,
    member.id,
  );

  const handleRemove = async () => {
    try {
      await removeMember();
      toast.success(
        t("users.deleteUserSuccess", {
          name: member.member?.email,
        }),
      );
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              icon: <Trash />,
              label: t("actions.remove"),
              onClick: handleRemove,
            },
          ],
        },
      ]}
    />
  );
};
