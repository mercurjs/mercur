import { useMemo } from "react"

import { Container, StatusBadge, createDataTableColumnHelper } from "@medusajs/ui"
import { DataTable, useQueryParams } from "@mercurjs/dashboard-shared"
import { useTranslation } from "react-i18next"

import type { SpraayBatch, SpraayBatchItem } from "../../../../lib/spraay/api"
import { formatUsdc, shortHex } from "../../../../lib/spraay/format"

const PAGE_SIZE = 20
const PREFIX = "items"

const columnHelper = createDataTableColumnHelper<SpraayBatchItem>()

const useColumns = () => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      columnHelper.accessor("payout_id", {
        header: t("spraay.fields.payout"),
        cell: ({ getValue }) => <span className="font-mono">{shortHex(getValue(), 8)}</span>,
      }),
      columnHelper.accessor("wallet_address", {
        header: t("spraay.fields.wallet"),
        cell: ({ getValue }) => <span className="font-mono">{shortHex(getValue())}</span>,
      }),
      columnHelper.accessor("amount", {
        header: t("spraay.fields.amount"),
        cell: ({ getValue }) => formatUsdc(getValue()),
      }),
      columnHelper.accessor("released_at", {
        header: t("fields.status"),
        cell: ({ getValue }) =>
          getValue() ? (
            <StatusBadge color="grey">{t("spraay.items.released")}</StatusBadge>
          ) : (
            <StatusBadge color="blue">{t("spraay.items.inBatch")}</StatusBadge>
          ),
      }),
    ],
    [t]
  )
}

export const BatchItemsSection = ({ batch }: { batch: SpraayBatch }) => {
  const { t } = useTranslation()
  const columns = useColumns()
  const { offset } = useQueryParams(["offset"], PREFIX)

  const items = useMemo(
    () => [...batch.items].sort((a, b) => (a.payout_id < b.payout_id ? -1 : 1)),
    [batch.items]
  )
  const start = offset ? Number(offset) : 0
  const page = items.slice(start, start + PAGE_SIZE)

  return (
    <Container className="divide-y px-0 py-0" data-testid="spraay-batch-items-section">
      <DataTable
        data={page}
        columns={columns}
        rowCount={items.length}
        pageSize={PAGE_SIZE}
        prefix={PREFIX}
        getRowId={(row) => row.id}
        rowHref={(row) => `/payouts/${row.payout_id}`}
        heading={t("spraay.items.title")}
        subHeading={t("spraay.items.subtitle")}
        emptyState={{
          empty: { heading: t("spraay.items.empty") },
        }}
      />
    </Container>
  )
}
