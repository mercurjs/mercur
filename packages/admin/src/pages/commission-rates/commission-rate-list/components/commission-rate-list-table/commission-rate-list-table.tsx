import { PencilSquare, Trash } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Heading,
  StatusBadge,
  Text,
  toast,
  usePrompt,
} from "@medusajs/ui"
import { keepPreviousData } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { ActionMenu } from "../../../../../components/common/action-menu"
import {
  TextCell,
  TextHeader,
} from "../../../../../components/table/table-cells/common/text-cell"
import { _DataTable } from "../../../../../components/table/data-table"
import {
  useCommissionRates,
  useDeleteCommissionRate,
} from "../../../../../hooks/api/commission-rates"
import { useDataTable } from "../../../../../hooks/use-data-table"
import { CommissionRateDTO } from "@mercurjs/types"

const PAGE_SIZE = 20

export const CommissionRateListTable = () => {
  const { t } = useTranslation()

  const { commission_rates, count, isPending: isLoading, isError, error } =
    useCommissionRates(
      {
        limit: PAGE_SIZE,
        offset: 0,
        fields: "*rules",
      },
      {
        placeholderData: keepPreviousData,
      }
    )

  const columns = useColumns()

  const { table } = useDataTable({
    data: (commission_rates ?? []) as CommissionRateDTO[],
    columns,
    count: count ?? 0,
    enablePagination: true,
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
  })

  if (isError) {
    throw error
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>{t("commissionRates.domain")}</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            {t("commissionRates.description")}
          </Text>
        </div>
        <Link to="/settings/commission-rates/create">
          <Button size="small" variant="secondary">
            {t("actions.create")}
          </Button>
        </Link>
      </div>
      <_DataTable
        table={table}
        columns={columns}
        count={count ?? 0}
        pageSize={PAGE_SIZE}
        isLoading={isLoading}
        navigateTo={(row) => `${row.original.id}`}
        pagination
        search
        orderBy={[
          { key: "name", label: t("commissionRates.fields.name") },
          { key: "created_at", label: t("fields.createdAt") },
          { key: "updated_at", label: t("fields.updatedAt") },
        ]}
      />
    </Container>
  )
}

const CommissionRateActions = ({
  commissionRate,
}: {
  commissionRate: CommissionRateDTO
}) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const { mutateAsync } = useDeleteCommissionRate(commissionRate.id)

  const handleDelete = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("commissionRates.delete.description", {
        name: commissionRate.name,
      }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    await mutateAsync(undefined, {
      onSuccess: () => {
        toast.success(t("commissionRates.delete.successToast"))
      },
      onError: (e) => {
        toast.error(e.message)
      },
    })
  }

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              label: t("actions.edit"),
              to: `/settings/commission-rates/${commissionRate.id}/edit`,
              icon: <PencilSquare />,
            },
          ],
        },
        {
          actions: [
            {
              label: t("actions.delete"),
              onClick: handleDelete,
              icon: <Trash />,
            },
          ],
        },
      ]}
    />
  )
}

const columnHelper = createColumnHelper<CommissionRateDTO>()

const useColumns = () => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      columnHelper.accessor("code", {
        header: t("commissionRates.fields.code"),
        cell: ({ getValue }) => (
          <Badge size="2xsmall" className="uppercase">
            {getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor("type", {
        header: () => <TextHeader text={t("commissionRates.fields.type.label")} />,
        cell: ({ getValue }) => {
          const type = getValue()
          return (
            <TextCell
              text={
                type === "percentage"
                  ? t("commissionRates.fields.type.percentage")
                  : t("commissionRates.fields.type.fixed")
              }
            />
          )
        },
      }),
      columnHelper.accessor("is_enabled", {
        header: t("fields.status"),
        cell: ({ getValue }) => {
          const enabled = getValue()
          return (
            <StatusBadge color={enabled ? "green" : "grey"}>
              {enabled
                ? t("commissionRates.status.enabled")
                : t("commissionRates.status.disabled")}
            </StatusBadge>
          )
        },
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => (
          <CommissionRateActions commissionRate={row.original} />
        ),
      }),
    ],
    [t]
  )
}
