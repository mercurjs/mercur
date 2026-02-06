import { zodResolver } from "@hookform/resolvers/zod"
import { HttpTypes } from "@medusajs/types"
import {
  Alert,
  Button,
  Container,
  Heading,
  Input,
  StatusBadge,
  Text,
  Tooltip,
} from "@medusajs/ui"
import { createColumnHelper } from "@tanstack/react-table"
// import copy from 'copy-to-clipboard';
import { format } from "date-fns"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import * as zod from "zod"

import { Form } from "@components/common/form"
import { RouteFocusModal } from "@components/modals/index.ts"
import { _DataTable } from "@components/table/data-table"
import { KeyboundForm } from "@components/utilities/keybound-form/keybound-form.tsx"
import { useCreateInvite, useInvites } from "@hooks/api/invites"
import { useUserInviteTableQuery } from "@hooks/table/query/use-user-invite-table-query"
import { useDataTable } from "@hooks/use-data-table"
import { isFetchError } from "@lib/is-fetch-error"

const InviteUserSchema = zod.object({
  email: zod.string().email(),
})

const PAGE_SIZE = 10
const PREFIX = "usr_invite"

export const InviteUserForm = () => {
  const { t } = useTranslation()

  const form = useForm<zod.infer<typeof InviteUserSchema>>({
    defaultValues: {
      email: "",
    },
    resolver: zodResolver(InviteUserSchema),
  })

  const { raw, searchParams } = useUserInviteTableQuery({
    prefix: PREFIX,
    pageSize: PAGE_SIZE,
  })

  const {
    invites,
    isPending: isLoading,
    isError,
    error,
  } = useInvites({
    limit: 9999,
    order: searchParams.order,
  })

  const processedInvites = useMemo(() => {
    if (searchParams?.q) {
      return invites?.filter((invite) =>
        invite.email
          .toLowerCase()
          .includes(searchParams?.q?.toLowerCase() ?? "")
      )
    }
    return invites
  }, [invites, searchParams])

  const offset = searchParams.offset ?? 0

  const columns = useColumns()

  const { table } = useDataTable({
    data: processedInvites?.slice(offset, offset + PAGE_SIZE) ?? [],
    columns,
    count: processedInvites?.length ?? 0,
    enablePagination: true,
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  })

  const { mutateAsync, isPending } = useCreateInvite()

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await mutateAsync({ email: values.email })
      form.reset()
    } catch (error) {
      if (isFetchError(error) && error.status === 400) {
        form.setError("root", {
          type: "manual",
          message: error.message,
        })
        return
      }
    }
  })

  if (isError) {
    throw error
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
                <Heading>{t("users.inviteUser")}</Heading>
                <Text size="small" className="text-ui-fg-subtle">
                  {t("users.inviteUserHint")}
                </Text>
              </div>

              {form.formState.errors.root && (
                <Alert
                  variant="error"
                  dismissible={false}
                  className="text-balance"
                >
                  {form.formState.errors.root.message}
                </Alert>
              )}

              <div className="flex flex-col gap-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Form.Field
                    control={form.control}
                    name="email"
                    render={({ field }) => {
                      return (
                        <Form.Item>
                          <Form.Label>{t("fields.email")}</Form.Label>
                          <Form.Control>
                            <Input {...field} />
                          </Form.Control>
                          <Form.ErrorMessage />
                        </Form.Item>
                      )
                    }}
                  />
                </div>
                <div className="flex items-center justify-end">
                  <Button
                    size="small"
                    variant="secondary"
                    type="submit"
                    isLoading={isPending}
                  >
                    {t("users.sendInvite")}
                  </Button>
                </div>
              </div>
              <div className="flex flex-col gap-y-4">
                <Heading level="h2">{t("users.pendingInvites")}</Heading>
                <Container className="overflow-hidden p-0">
                  <_DataTable
                    table={table}
                    columns={columns}
                    count={processedInvites?.length ?? 0}
                    pageSize={PAGE_SIZE}
                    pagination
                    search="autofocus"
                    isLoading={isLoading}
                    queryObject={raw}
                    prefix={PREFIX}
                    orderBy={[
                      {
                        key: "email",
                        label: t("fields.email"),
                      },
                      {
                        key: "created_at",
                        label: t("fields.createdAt"),
                      },
                      {
                        key: "updated_at",
                        label: t("fields.updatedAt"),
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
  )
}

const columnHelper = createColumnHelper<HttpTypes.AdminInvite>()

const useColumns = () => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      columnHelper.accessor("email", {
        header: t("fields.email"),
        cell: ({ getValue }) => {
          return getValue()
        },
      }),
      columnHelper.accessor("accepted", {
        header: t("fields.status"),
        cell: ({ getValue, row }) => {
          const accepted = getValue()

          const expired = new Date(row.original.expires_at) < new Date()
          if (accepted) {
            return (
              <Tooltip
                content={t("users.acceptedOnDate", {
                  date: format(
                    new Date(row.original.updated_at),
                    "dd MMM, yyyy"
                  ),
                })}
              >
                <StatusBadge color="green">
                  {t("users.inviteStatus.accepted")}
                </StatusBadge>
              </Tooltip>
            )
          }
          if (expired) {
            return (
              <Tooltip
                content={t("users.expiredOnDate", {
                  date: format(
                    new Date(row.original.expires_at),
                    "dd MMM, yyyy"
                  ),
                })}
              >
                <StatusBadge color="red">
                  {t("users.inviteStatus.expired")}
                </StatusBadge>
              </Tooltip>
            )
          }
          return (
            <StatusBadge color="orange">
              {t("users.inviteStatus.pending")}
            </StatusBadge>
          )
        },
      }),
    ],
    [t]
  )
}
