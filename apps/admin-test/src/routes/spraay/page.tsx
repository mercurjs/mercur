import { Children, ReactNode, useMemo } from "react"

import { CurrencyDollar, XCircle } from "@medusajs/icons"
import {
  Container,
  createDataTableColumnHelper,
  createDataTableFilterHelper,
  toast,
  StatusBadge,
} from "@medusajs/ui"
import type { RouteConfig, RouteHandle } from "@mercurjs/dashboard-sdk"
import { DataTable, SingleColumnPage, useDate, useQueryParams } from "@mercurjs/dashboard-shared"
import { keepPreviousData } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

import { SpraayPreflightSection } from "../../components/spraay/preflight-section"
import { useSpraayBatches, useTriggerSpraayAggregation, type SpraayBatch } from "../../lib/spraay/api"
import { formatUsdc, shortHex } from "../../lib/spraay/format"
import { SPRAAY_BATCH_STATUSES, getBatchStatusProps, isCancelable, type SpraayBatchStatus } from "../../lib/spraay/status"
import { useCancelBatchAction } from "../../lib/spraay/use-cancel-batch-action"

const PAGE_SIZE = 20

export const config: RouteConfig = {
  label: "spraay.domain",
  translationNs: "translation",
  icon: CurrencyDollar,
  permissions: ["payouts:view"],
}

export const handle: RouteHandle = {
  permissions: "payouts:view",
  breadcrumb: () => <SpraayBreadcrumb />,
}

function SpraayBreadcrumb() {
  const { t } = useTranslation()
  return <span>{t("spraay.domain")}</span>
}

const parseStatusFilter = (raw?: string): SpraayBatchStatus[] | undefined => {
  if (!raw) {
    return undefined
  }
  try {
    const parsed: unknown = JSON.parse(raw)
    const values = Array.isArray(parsed) ? parsed : [parsed]
    const statuses = values.filter((value): value is SpraayBatchStatus =>
      (SPRAAY_BATCH_STATUSES as readonly unknown[]).includes(value)
    )
    return statuses.length ? statuses : undefined
  } catch {
    return undefined
  }
}

const useSpraayBatchTableQuery = () => {
  const { offset, status } = useQueryParams(["offset", "status"])

  return {
    limit: PAGE_SIZE,
    offset: offset ? Number(offset) : 0,
    status: parseStatusFilter(status),
  }
}

const columnHelper = createDataTableColumnHelper<SpraayBatch>()
const filterHelper = createDataTableFilterHelper<SpraayBatch>()

const useColumns = () => {
  const { t } = useTranslation()
  const { getFullDate } = useDate()
  const { cancel } = useCancelBatchAction()

  return useMemo(
    () => [
      columnHelper.accessor("id", {
        header: t("spraay.fields.batch"),
        cell: ({ getValue }) => <span className="font-mono">{shortHex(getValue(), 8)}</span>,
      }),
      columnHelper.accessor("status", {
        header: t("fields.status"),
        cell: ({ getValue }) => {
          const { color, label } = getBatchStatusProps(getValue(), t)
          return <StatusBadge color={color}>{label}</StatusBadge>
        },
      }),
      columnHelper.accessor("recipient_count", {
        header: t("spraay.fields.recipients"),
      }),
      columnHelper.accessor("total_amount", {
        header: t("spraay.fields.total"),
        cell: ({ getValue }) => formatUsdc(getValue()),
      }),
      columnHelper.accessor("tx_hash", {
        header: t("spraay.fields.txHash"),
        cell: ({ getValue }) => <span className="font-mono">{shortHex(getValue())}</span>,
      }),
      columnHelper.accessor("created_at", {
        header: t("fields.createdAt"),
        cell: ({ getValue }) => getFullDate({ date: getValue(), includeTime: true }),
      }),
      columnHelper.action({
        actions: (ctx) => [
          [
            {
              icon: <XCircle />,
              label: t("spraay.actions.cancel"),
              disabled: !isCancelable(ctx.row.original),
              onClick: () => cancel(ctx.row.original),
            },
          ],
        ],
      }),
    ],
    [t, getFullDate, cancel]
  )
}

const useFilters = () => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      filterHelper.accessor("status", {
        label: t("fields.status"),
        type: "multiselect",
        options: SPRAAY_BATCH_STATUSES.map((status) => ({
          label: t(`spraay.status.${status}`),
          value: status,
        })),
      }),
    ],
    [t]
  )
}

export const SpraayBatchListDataTable = () => {
  const { t } = useTranslation()
  const query = useSpraayBatchTableQuery()
  const columns = useColumns()
  const filters = useFilters()

  const { batches, count, isLoading, isError, error } = useSpraayBatches(query, {
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  })

  const { mutate: trigger, isPending: isTriggering } = useTriggerSpraayAggregation({
    onSuccess: ({ message }) => toast.success(message),
    onError: (e) => toast.error(e.message),
  })

  if (isError) {
    throw error
  }

  return (
    <Container className="divide-y px-0 py-0" data-testid="spraay-batch-list">
      <DataTable
        data={batches}
        columns={columns}
        filters={filters}
        rowCount={count}
        pageSize={PAGE_SIZE}
        getRowId={(row) => row.id}
        rowHref={(row) => `/spraay/${row.id}`}
        heading={t("spraay.domain")}
        subHeading={t("spraay.subtitle")}
        isLoading={isLoading}
        emptyState={{
          empty: {
            heading: t("spraay.list.emptyHeading"),
            description: t("spraay.list.emptyDescription"),
          },
          filtered: {
            heading: t("general.noRecordsMessage"),
            description: t("general.noRecordsMessageFiltered"),
          },
        }}
        action={{
          label: isTriggering ? t("spraay.actions.triggering") : t("spraay.actions.trigger"),
          disabled: isTriggering,
          permission: "payouts:edit",
          onClick: () => trigger(),
        }}
      />
    </Container>
  )
}

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <SpraayPreflightSection />
          <SpraayBatchListDataTable />
        </>
      )}
    </SingleColumnPage>
  )
}

const SpraayBatchListPage = Object.assign(Root, {
  Preflight: SpraayPreflightSection,
  DataTable: SpraayBatchListDataTable,
})

export default SpraayBatchListPage
