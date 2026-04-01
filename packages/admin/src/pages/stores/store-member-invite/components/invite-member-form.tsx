import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Container,
  Heading,
  Input,
  Select,
  StatusBadge,
  Text,
  toast,
  Tooltip,
} from "@medusajs/ui";
import { createColumnHelper } from "@tanstack/react-table";
import { format } from "date-fns";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import * as zod from "zod";

import { Form } from "../../../../components/common/form";
import { RouteFocusModal } from "../../../../components/modals";
import { _DataTable } from "../../../../components/table/data-table";
import { KeyboundForm } from "../../../../components/utilities/keybound-form";
import {
  useInviteSellerMember,
  useSellerInvites,
} from "../../../../hooks/api/sellers";
import { useUserInviteTableQuery } from "../../../../hooks/table/query";
import { useDataTable } from "../../../../hooks/use-data-table";
import { MemberInviteDTO, SellerRole } from "@mercurjs/types";

const ROLE_OPTIONS = [
  {
    value: SellerRole.SELLER_ADMINISTRATION,
    labelKey: "users.roles.administration",
  },
  {
    value: SellerRole.INVENTORY_MANAGEMENT,
    labelKey: "users.roles.inventoryManagement",
  },
  {
    value: SellerRole.ORDER_MANAGEMENT,
    labelKey: "users.roles.orderManagement",
  },
  { value: SellerRole.ACCOUNTING, labelKey: "users.roles.accounting" },
  { value: SellerRole.SUPPORT, labelKey: "users.roles.support" },
];

const ROLE_LABEL_MAP: Record<string, string> = Object.fromEntries(
  ROLE_OPTIONS.map((r) => [r.value, r.labelKey]),
);

const InviteMemberSchema = zod.object({
  email: zod.string().email(),
  role_id: zod.string().min(1),
});

const PAGE_SIZE = 10;
const PREFIX = "inv";

export const InviteMemberForm = () => {
  const { t } = useTranslation();
  const { id } = useParams();

  const form = useForm<zod.infer<typeof InviteMemberSchema>>({
    defaultValues: {
      email: "",
      role_id: "",
    },
    resolver: zodResolver(InviteMemberSchema),
  });

  const { raw, searchParams } = useUserInviteTableQuery({
    prefix: PREFIX,
    pageSize: PAGE_SIZE,
  });

  const {
    member_invites,
    count,
    isPending: isLoading,
    isError,
    error,
  } = useSellerInvites(id!, searchParams);

  const columns = useColumns();

  const { table } = useDataTable({
    data: (member_invites as MemberInviteDTO[]) ?? [],
    columns,
    count,
    enablePagination: true,
    getRowId: (row: MemberInviteDTO) => row.id,
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  });

  const { mutateAsync, isPending } = useInviteSellerMember(id!);

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await mutateAsync({
        email: values.email,
        role_id: values.role_id as SellerRole,
      });
      toast.success(t("users.inviteSuccess", "Invite sent successfully"));
      form.reset();
    } catch (error) {
      toast.error((error as Error).message);
    }
  });

  if (isError) {
    throw error;
  }

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex h-full flex-col overflow-hidden"
      >
        <RouteFocusModal.Header />
        <RouteFocusModal.Body className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 flex-col items-center overflow-y-auto">
            <div className="flex w-full max-w-[720px] flex-col gap-y-8 px-2 py-16">
              <div>
                <Heading>{t("users.inviteUser", "Invite User")}</Heading>
                <Text size="small" className="text-ui-fg-subtle">
                  {t(
                    "users.inviteUserHint",
                    "Invite a new user to this store.",
                  )}
                </Text>
              </div>

              <div className="flex flex-col gap-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Form.Field
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <Form.Item>
                        <Form.Label>{t("fields.email")}</Form.Label>
                        <Form.Control>
                          <Input {...field} />
                        </Form.Control>
                        <Form.ErrorMessage />
                      </Form.Item>
                    )}
                  />
                  <Form.Field
                    control={form.control}
                    name="role_id"
                    render={({ field: { onChange, ref, ...field } }) => (
                      <Form.Item>
                        <Form.Label>{t("fields.role")}</Form.Label>
                        <Form.Control>
                          <Select {...field} onValueChange={onChange}>
                            <Select.Trigger ref={ref}>
                              <Select.Value
                                placeholder={t(
                                  "users.selectRole",
                                  "Select a role",
                                )}
                              />
                            </Select.Trigger>
                            <Select.Content>
                              {ROLE_OPTIONS.map((role) => (
                                <Select.Item
                                  key={role.value}
                                  value={role.value}
                                >
                                  {t(role.labelKey)}
                                </Select.Item>
                              ))}
                            </Select.Content>
                          </Select>
                        </Form.Control>
                        <Form.ErrorMessage />
                      </Form.Item>
                    )}
                  />
                </div>
                <div className="flex items-center justify-end">
                  <Button
                    size="small"
                    variant="secondary"
                    type="submit"
                    isLoading={isPending}
                  >
                    {t("users.sendInvite", "Send invite")}
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-y-4">
                <Heading level="h2">
                  {t("users.pendingInvites", "Pending Invites")}
                </Heading>
                <Container className="overflow-hidden p-0">
                  <_DataTable
                    table={table}
                    columns={columns}
                    count={count}
                    pageSize={PAGE_SIZE}
                    pagination
                    isLoading={isLoading}
                    queryObject={raw}
                    prefix={PREFIX}
                    orderBy={[
                      { key: "email", label: t("fields.email") },
                      {
                        key: "created_at",
                        label: t("fields.createdAt"),
                      },
                    ]}
                  />
                </Container>
              </div>
            </div>
          </div>
        </RouteFocusModal.Body>
      </KeyboundForm>
    </RouteFocusModal.Form>
  );
};

const columnHelper = createColumnHelper<MemberInviteDTO>();

const useColumns = () => {
  const { t } = useTranslation();

  return useMemo(
    () => [
      columnHelper.accessor("email", {
        header: t("fields.email"),
        cell: ({ getValue }) => getValue(),
      }),
      columnHelper.accessor("role_id", {
        header: t("fields.role"),
        cell: ({ getValue }) => {
          const roleId = getValue();
          const labelKey = ROLE_LABEL_MAP[roleId];
          return labelKey ? t(labelKey) : "-";
        },
      }),
      columnHelper.accessor("accepted", {
        header: t("fields.status"),
        cell: ({ getValue, row }) => {
          const accepted = getValue();
          const expired = new Date(row.original.expires_at) < new Date();

          if (accepted) {
            return (
              <Tooltip
                content={t("users.acceptedOnDate", {
                  date: format(
                    new Date(row.original.updated_at),
                    "dd MMM, yyyy",
                  ),
                })}
              >
                <StatusBadge color="green">
                  {t("users.inviteStatus.accepted")}
                </StatusBadge>
              </Tooltip>
            );
          }

          if (expired) {
            return (
              <Tooltip
                content={t("users.expiredOnDate", {
                  date: format(
                    new Date(row.original.expires_at),
                    "dd MMM, yyyy",
                  ),
                })}
              >
                <StatusBadge color="red">
                  {t("users.inviteStatus.expired")}
                </StatusBadge>
              </Tooltip>
            );
          }

          return (
            <Tooltip
              content={
                <Trans
                  i18nKey={"users.validFromUntil"}
                  components={[
                    <span key="from" className="font-medium" />,
                    <span key="until" className="font-medium" />,
                  ]}
                  values={{
                    from: format(
                      new Date(row.original.created_at),
                      "dd MMM, yyyy",
                    ),
                    until: format(
                      new Date(row.original.expires_at),
                      "dd MMM, yyyy",
                    ),
                  }}
                />
              }
            >
              <StatusBadge color="orange">
                {t("users.inviteStatus.pending")}
              </StatusBadge>
            </Tooltip>
          );
        },
      }),
    ],
    [t],
  );
};
