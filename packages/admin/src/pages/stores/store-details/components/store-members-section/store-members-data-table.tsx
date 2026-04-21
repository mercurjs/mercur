import { useMemo } from "react";

import { ArrowPath, Link as LinkIcon, Trash } from "@medusajs/icons";
import { StatusBadge, toast } from "@medusajs/ui";
import { keepPreviousData } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";

import { ActionMenu } from "../../../../../components/common/action-menu";
import { _DataTable } from "../../../../../components/table/data-table";
import { DateCell } from "../../../../../components/table/table-cells/common/date-cell";
import {
  useSellerMembers,
  useSellerInvites,
  useRemoveSellerMember,
  useDeleteSellerInvite,
  useResendSellerInvite,
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

type MemberRow = {
  kind: "member";
  id: string;
  email: string;
  role_id: string;
  created_at: string | null;
  member: SellerMemberDTO;
};

type InviteRow = {
  kind: "invite";
  id: string;
  email: string;
  role_id: string;
  created_at: string | null;
  invite_url?: string | null;
};

type UserRow = MemberRow | InviteRow;

type StoreMembersDataTableProps = {
  sellerId: string;
};

export const StoreMembersDataTable = ({
  sellerId,
}: StoreMembersDataTableProps) => {
  const { t } = useTranslation();

  const { raw } = useMemberTableQuery({ pageSize: PAGE_SIZE });
  const {
    seller_members,
    isPending: isMembersPending,
    isError,
    error,
  } = useSellerMembers(
    sellerId,
    { limit: 100, offset: 0 },
    { placeholderData: keepPreviousData },
  );

  const { member_invites, isPending: isInvitesPending } =
    useSellerInvites(sellerId);

  const rows: UserRow[] = useMemo(() => {
    const members: MemberRow[] = (
      (seller_members as SellerMemberDTO[] | undefined) ?? []
    ).map((m) => ({
      kind: "member",
      id: m.id,
      email: m.member?.email ?? "-",
      role_id: m.role_id,
      created_at: m.created_at ?? null,
      member: m,
    }));

    const invites: InviteRow[] = (
      (member_invites as any[] | undefined) ?? []
    )
      .filter((invite) => !invite.accepted)
      .map((invite) => ({
        kind: "invite",
        id: invite.id,
        email: invite.email,
        role_id: invite.role_id,
        created_at: invite.created_at ?? null,
        invite_url: invite.invite_url ?? null,
      }));

    return [...invites, ...members];
  }, [seller_members, member_invites]);

  const columns = useColumns(sellerId);

  const { table } = useDataTable({
    data: rows,
    columns,
    enablePagination: true,
    count: rows.length,
    pageSize: PAGE_SIZE,
    getRowId: (row) => `${row.kind}:${row.id}`,
  });

  if (isError) {
    throw error;
  }

  return (
    <_DataTable
      table={table}
      columns={columns}
      count={rows.length}
      pageSize={PAGE_SIZE}
      pagination
      isLoading={isMembersPending || isInvitesPending}
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

const columnHelper = createColumnHelper<UserRow>();

const useColumns = (sellerId: string) => {
  const { t } = useTranslation();

  return useMemo(
    () => [
      columnHelper.accessor("email", {
        header: () => (
          <div className="flex h-full w-full items-center">
            <span>{t("fields.email")}</span>
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex size-full items-center overflow-hidden">
            <span className="truncate">{row.original.email}</span>
          </div>
        ),
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
      columnHelper.display({
        id: "status",
        header: () => (
          <div className="flex h-full w-full items-center">
            <span>{t("fields.status")}</span>
          </div>
        ),
        cell: ({ row }) => {
          const isPending = row.original.kind === "invite";
          return (
            <div className="flex size-full items-center">
              <StatusBadge color={isPending ? "orange" : "green"}>
                {isPending
                  ? t("users.status.pending")
                  : t("users.status.active")}
              </StatusBadge>
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
          const isAdminRole =
            row.original.role_id === SellerRole.SELLER_ADMINISTRATION;

          if (row.original.kind === "member") {
            if (isAdminRole) return null;
            return (
              <MemberActions
                member={row.original.member}
                sellerId={sellerId}
              />
            );
          }

          return (
            <InviteActions
              invite={row.original}
              sellerId={sellerId}
              allowDelete={!isAdminRole}
            />
          );
        },
      }),
    ],
    [t, sellerId],
  );
};

const InviteActions = ({
  invite,
  sellerId,
  allowDelete = true,
}: {
  invite: InviteRow;
  sellerId: string;
  allowDelete?: boolean;
}) => {
  const { t } = useTranslation();
  const { mutateAsync: resend } = useResendSellerInvite(sellerId);
  const { mutateAsync: deleteInvite } = useDeleteSellerInvite(sellerId);

  const handleResend = async () => {
    try {
      await resend({ invite_id: invite.id });
      toast.success(
        t("stores.members.invite.resendSuccess", { email: invite.email }),
      );
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleCopyLink = async () => {
    try {
      let url = invite.invite_url;
      if (!url) {
        const response = (await resend({ invite_id: invite.id })) as {
          member_invite?: { invite_url?: string | null };
        };
        url = response?.member_invite?.invite_url ?? null;
      }

      if (!url) {
        toast.error(t("stores.members.invite.noVendorUrl"));
        return;
      }

      await navigator.clipboard.writeText(url);
      toast.success(t("stores.members.invite.linkCopied"));
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteInvite({ invite_id: invite.id });
      toast.success(
        t("stores.members.invite.deleteSuccess", { email: invite.email }),
      );
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const groups = [
    {
      actions: [
        {
          icon: <ArrowPath />,
          label: t("users.resendInvite"),
          onClick: handleResend,
        },
        {
          icon: <LinkIcon />,
          label: t("users.copyInviteLink"),
          onClick: handleCopyLink,
        },
      ],
    },
  ];

  if (allowDelete) {
    groups.push({
      actions: [
        {
          icon: <Trash />,
          label: t("actions.delete"),
          onClick: handleDelete,
        },
      ],
    });
  }

  return <ActionMenu groups={groups} />;
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
