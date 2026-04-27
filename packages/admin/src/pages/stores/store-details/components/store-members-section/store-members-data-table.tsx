import { useMemo } from "react";

import { ArrowPath, Link as LinkIcon, Trash, User } from "@medusajs/icons";
import { Badge, toast } from "@medusajs/ui";
import { keepPreviousData } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";

import { ActionMenu } from "../../../../../components/common/action-menu";
import { DataTableStatusCell } from "../../../../../components/data-table/components/data-table-status-cell/data-table-status-cell";
import { _DataTable } from "../../../../../components/table/data-table";
import {
  useSellerMembers,
  useSellerInvites,
  useRemoveSellerMember,
  useDeleteSellerInvite,
  useResendSellerInvite,
} from "../../../../../hooks/api/sellers";
import { useMemberTableQuery } from "../../../../../hooks/table/query";
import { useDataTable } from "../../../../../hooks/use-data-table";
import { MemberInviteDTO, SellerMemberDTO, SellerRole } from "@mercurjs/types";

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
  is_owner: boolean;
  created_at: Date;
  updated_at: Date;
  member: SellerMemberDTO;
};

type InviteRow = {
  kind: "invite";
  id: string;
  email: string;
  role_id: string;
  token: string;
  is_owner: boolean;
  created_at: Date;
  updated_at: Date;
};

type UserRow = MemberRow | InviteRow;

type StoreMembersDataTableProps = {
  sellerId: string;
};

const buildVendorInviteUrl = (token: string) => {
  const vendorBase = (__VENDOR_URL__ || "/seller").replace(/\/+$/, "");
  const url = new URL(
    `${vendorBase}/invite`,
    typeof window === "undefined" ? "http://localhost" : window.location.origin,
  );

  url.searchParams.set("token", token);

  return url.toString();
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
      (seller_members as (SellerMemberDTO & { is_owner?: boolean })[] | undefined) ?? []
    ).map((m) => ({
      kind: "member",
      id: m.id,
      email: m.member?.email ?? "-",
      role_id: m.role_id,
      is_owner: Boolean(m.is_owner),
      created_at: m.created_at,
      updated_at: m.updated_at,
      member: m,
    }));

    const hasOwnerMember = members.some((m) => m.is_owner);

    const pendingInvites = (
      (member_invites as MemberInviteDTO[] | undefined) ?? []
    ).filter((invite) => !invite.accepted);

    // If no accepted owner member exists yet and there's only one pending
    // invite, that invite is the future owner. With multiple pending invites
    // ownership is ambiguous (whoever accepts first wins) — skip the badge.
    const inviteIsFutureOwner =
      !hasOwnerMember && pendingInvites.length === 1;

    const invites: InviteRow[] = pendingInvites.map((invite) => ({
      kind: "invite",
      id: invite.id,
      email: invite.email,
      role_id: invite.role_id,
      token: invite.token,
      is_owner: inviteIsFutureOwner,
      created_at: invite.created_at,
      updated_at: invite.updated_at,
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
        title: t("stores.emptyStates.users.title", "No users yet"),
        message: t(
          "stores.emptyStates.users.message",
          "Invite the first user to manage this store.",
        ),
        icon: <User className="text-ui-fg-subtle" />,
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
          <div className="flex size-full items-center gap-x-2 overflow-hidden">
            <span className="truncate">{row.original.email}</span>
            {row.original.is_owner && (
              <Badge
                size="2xsmall"
                color="grey"
                className="flex-shrink-0"
              >
                {t("stores.members.mainAdmin", "Admin")}
              </Badge>
            )}
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
            <DataTableStatusCell color={isPending ? "orange" : "green"}>
              {isPending
                ? t("users.status.pending")
                : t("users.status.active")}
            </DataTableStatusCell>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
          if (row.original.kind === "member") {
            // Owner cannot be removed.
            if (row.original.is_owner) return null;
            return (
              <MemberActions
                member={row.original.member}
                sellerId={sellerId}
              />
            );
          }

          return (
            <InviteActions invite={row.original} sellerId={sellerId} />
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
}: {
  invite: InviteRow;
  sellerId: string;
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
      let token: string | null = invite.token;
      if (!token) {
        const response = (await resend({ invite_id: invite.id })) as {
          member_invite?: { token?: string | null };
        };
        token = response?.member_invite?.token ?? null;
      }

      if (!token) {
        toast.error(t("stores.members.invite.noVendorUrl"));
        return;
      }

      await navigator.clipboard.writeText(buildVendorInviteUrl(token));
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
    {
      actions: [
        {
          icon: <Trash />,
          label: t("actions.delete"),
          onClick: handleDelete,
        },
      ],
    },
  ];

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
