import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowPath, Link, Trash } from "@medusajs/icons";
import { HttpTypes } from "@medusajs/types";
import {
  Alert,
  Button,
  Container,
  Heading,
  Input,
  StatusBadge,
  Text,
  Tooltip,
  usePrompt,
} from "@medusajs/ui";
import { createColumnHelper } from "@tanstack/react-table";
import copy from "copy-to-clipboard";
import { format } from "date-fns";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";
import * as zod from "zod";
import { ActionMenu } from "../../../../../components/common/action-menu/index.ts";
import { Form } from "../../../../../components/common/form/index.ts";
import { ListSummary } from "../../../../../components/common/list-summary/index.ts";
import { Combobox } from "../../../../../components/inputs/combobox/index.ts";
import { RouteFocusModal } from "../../../../../components/modals/index.ts";
import { _DataTable } from "../../../../../components/table/data-table/index.ts";
import { KeyboundForm } from "../../../../../components/utilities/keybound-form/keybound-form.tsx";
import {
  useCreateInvite,
  useDeleteInvite,
  useInvites,
  useResendInvite,
} from "../../../../../hooks/api/invites.tsx";
import { useRbacAssignableRoles } from "../../../../../hooks/api/rbac-roles.tsx";
import { useUserInviteTableQuery } from "../../../../../hooks/table/query/use-user-invite-table-query.tsx";
import { useDataTable } from "../../../../../hooks/use-data-table.tsx";
import { isFetchError } from "../../../../../lib/is-fetch-error.ts";
import { useFeatureFlag } from "../../../../../providers/feature-flag-provider/index.tsx";
import { usePermissions } from "@mercurjs/dashboard-shared";

const InviteUserSchema = zod.object({
  email: zod.string().email(),
  roles: zod.array(zod.string()).optional(),
});

const PAGE_SIZE = 10;
const PREFIX = "usr_invite";
const getBaseUrl = () => {
  try {
    const base = typeof __BASE__ !== "undefined" ? __BASE__ : "/"
    return base === "/" ? "" : base
  } catch {
    return ""
  }
}

const INVITE_URL = `${window.location.origin}${getBaseUrl()}/invite?token=`;

export const InviteUserForm = () => {
  const { t } = useTranslation();
  const isRbacEnabled = useFeatureFlag("rbac");
  const { hasPermission } = usePermissions();
  const canReadRbacRoles = hasPermission("rbac_role:read");
  const showRbacRolesField = isRbacEnabled && canReadRbacRoles;

  const form = useForm<zod.infer<typeof InviteUserSchema>>({
    defaultValues: {
      email: "",
      roles: [],
    },
    resolver: zodResolver(InviteUserSchema),
  });

  const { data: assignableData, isPending: isRolesLoading } =
    useRbacAssignableRoles(
      { limit: 200, order: "name" },
      { enabled: showRbacRolesField },
    );

  const roleOptions = useMemo(() => {
    return (assignableData?.roles ?? []).map((role) => ({
      label: role.name,
      value: role.id,
    }));
  }, [assignableData?.roles]);

  const inviteFields = useMemo(() => {
    if (!showRbacRolesField) {
      return undefined;
    }

    return [
      "id",
      "email",
      "accepted",
      "token",
      "expires_at",
      "created_at",
      "updated_at",
      "rbac_roles.id",
      "rbac_roles.name",
    ].join(",");
  }, [showRbacRolesField]);

  const { raw, searchParams } = useUserInviteTableQuery({
    prefix: PREFIX,
    pageSize: PAGE_SIZE,
    fields: inviteFields,
  });

  const {
    invites,
    count,
    isPending: isLoading,
    isError,
    error,
  } = useInvites(searchParams);

  const columns = useColumns({ isRbacEnabled: showRbacRolesField });

  const { table } = useDataTable({
    data: invites ?? [],
    columns,
    count,
    enablePagination: true,
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  });

  const { mutateAsync, isPending } = useCreateInvite();

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      const payload: HttpTypes.AdminCreateInvite = {
        email: values.email,
      };

      if (showRbacRolesField && values.roles?.length) {
        payload.roles = values.roles;
      }

      await mutateAsync(payload);
      form.reset();
    } catch (error) {
      if (isFetchError(error) && error.status === 400) {
        form.setError("root", {
          type: "manual",
          message: error.message,
        });
        return;
      }
    }
  });

  if (isError) {
    throw error;
  }

  return (
    <RouteFocusModal.Form form={form} data-testid="user-invite-form">
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex h-full flex-col overflow-hidden"
      >
        <RouteFocusModal.Header data-testid="user-invite-form-header" />
        <RouteFocusModal.Body
          className="flex flex-1 flex-col overflow-hidden"
          data-testid="user-invite-form-body"
        >
          <div className="flex flex-1 flex-col items-center overflow-y-auto">
            <div className="flex w-full max-w-[720px] flex-col gap-y-8 px-2 py-16">
              <div data-testid="user-invite-form-header-section">
                <Heading data-testid="user-invite-form-heading">
                  {t("users.inviteUser")}
                </Heading>
                <Text
                  size="small"
                  className="text-ui-fg-subtle"
                  data-testid="user-invite-form-hint"
                >
                  {t("users.inviteUserHint")}
                </Text>
              </div>

              {form.formState.errors.root && (
                <Alert
                  variant="error"
                  dismissible={false}
                  className="text-balance"
                  data-testid="user-invite-form-error-alert"
                >
                  {form.formState.errors.root.message}
                </Alert>
              )}

              <div
                className="flex flex-col gap-y-4"
                data-testid="user-invite-form-email-section"
              >
                <div className="grid grid-cols-2 gap-4">
                  <Form.Field
                    control={form.control}
                    name="email"
                    render={({ field }) => {
                      return (
                        <Form.Item data-testid="user-invite-form-email-item">
                          <Form.Label data-testid="user-invite-form-email-label">
                            {t("fields.email")}
                          </Form.Label>
                          <Form.Control data-testid="user-invite-form-email-control">
                            <Input
                              {...field}
                              data-testid="user-invite-form-email-input"
                            />
                          </Form.Control>
                          <Form.ErrorMessage data-testid="user-invite-form-email-error" />
                        </Form.Item>
                      );
                    }}
                  />
                  {showRbacRolesField && (
                    <Form.Field
                      control={form.control}
                      name="roles"
                      render={({ field }) => {
                        return (
                          <Form.Item data-testid="user-invite-form-roles-item">
                            <Form.Label
                              optional
                              tooltip={t("users.inviteRolesTooltip")}
                              data-testid="user-invite-form-roles-label"
                            >
                              {t("roles.domain")}
                            </Form.Label>
                            <Form.Control data-testid="user-invite-form-roles-control">
                              <Combobox
                                {...field}
                                value={field.value ?? []}
                                onChange={(value) => {
                                  field.onChange(value ?? []);
                                }}
                                options={roleOptions}
                                placeholder={t("labels.selectValues")}
                                disabled={isRolesLoading}
                                data-testid="user-invite-form-roles-input"
                              />
                            </Form.Control>
                            <Form.ErrorMessage data-testid="user-invite-form-roles-error" />
                          </Form.Item>
                        );
                      }}
                    />
                  )}
                </div>
                <div className="flex items-center justify-end">
                  <Button
                    size="small"
                    variant="secondary"
                    type="submit"
                    isLoading={isPending}
                    data-testid="user-invite-form-send-invite-button"
                  >
                    {t("users.sendInvite")}
                  </Button>
                </div>
              </div>
              <div
                className="flex flex-col gap-y-4"
                data-testid="user-invite-form-pending-invites-section"
              >
                <Heading
                  level="h2"
                  data-testid="user-invite-form-pending-invites-heading"
                >
                  {t("users.pendingInvites")}
                </Heading>
                <Container className="overflow-hidden p-0">
                  <_DataTable
                    table={table}
                    columns={columns}
                    count={count}
                    pageSize={PAGE_SIZE}
                    pagination
                    search="autofocus"
                    isLoading={isLoading}
                    queryObject={raw}
                    prefix={PREFIX}
                    orderBy={[
                      { key: "email", label: t("fields.email") },
                      { key: "created_at", label: t("fields.createdAt") },
                      { key: "updated_at", label: t("fields.updatedAt") },
                    ]}
                    data-testid="user-invite-form-pending-invites-table"
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

const InviteActions = ({ invite }: { invite: HttpTypes.AdminInvite }) => {
  const { mutateAsync: revokeAsync } = useDeleteInvite(invite.id);
  const { mutateAsync: resendAsync } = useResendInvite(invite.id);

  const prompt = usePrompt();
  const { t } = useTranslation();

  const handleDelete = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("users.deleteInviteWarning", {
        email: invite.email,
      }),
      cancelText: t("actions.cancel"),
      confirmText: t("actions.delete"),
    });

    if (!res) {
      return;
    }

    await revokeAsync();
  };

  const handleResend = async () => {
    await resendAsync();
  };

  const handleCopyInviteLink = () => {
    const inviteUrl = `${INVITE_URL}${invite.token}`;
    copy(inviteUrl);
  };

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              icon: <ArrowPath />,
              label: t("users.resendInvite"),
              onClick: handleResend,
            },
          ],
        },
        {
          actions: [
            {
              icon: <Link />,
              label: t("users.copyInviteLink"),
              onClick: handleCopyInviteLink,
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
      ]}
      data-testid={`user-invite-form-invite-action-menu-${invite.id}`}
    />
  );
};

const columnHelper = createColumnHelper<HttpTypes.AdminInvite>();

const useColumns = ({ isRbacEnabled }: { isRbacEnabled: boolean }) => {
  const { t } = useTranslation();

  return useMemo(
    () => [
      columnHelper.accessor("email", {
        header: t("fields.email"),
        cell: ({ getValue }) => {
          return getValue();
        },
      }),
      ...(isRbacEnabled
        ? [
            columnHelper.display({
              id: "roles",
              header: t("roles.domain"),
              cell: ({ row }) => {
                const roleNames =
                  row.original.rbac_roles?.map((role) => role.name) ?? [];

                if (!roleNames.length) {
                  return (
                    <Text size="small" className="text-ui-fg-subtle">
                      -
                    </Text>
                  );
                }

                return (
                  <div className="flex items-center">
                    <ListSummary inline n={1} list={roleNames} />
                  </div>
                );
              },
            }),
          ]
        : []),
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
                    <span key="untill" className="font-medium" />,
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
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => <InviteActions invite={row.original} />,
      }),
    ],
    [t, isRbacEnabled],
  );
};
