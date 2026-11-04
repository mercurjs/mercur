import { Text } from "@medusajs/ui"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { HttpTypes } from "@mercurjs/types"

import {
  DateCell,
  DateHeader,
} from "../../../../../components/table/table-cells/common/date-cell"
import { StatusCell } from "../../../../../components/table/table-cells/common/status-cell"
import {
  ProductCell,
  ProductHeader,
} from "../../../../../components/table/table-cells/product/product-cell"
import {
  ProductStatusCell,
  ProductStatusHeader,
} from "../../../../../components/table/table-cells/product/product-status-cell"
import { INBOX_TYPE_COLORS } from "../../../common/inbox"

const columnHelper = createColumnHelper<HttpTypes.AdminProductChangeInboxItem>()

export const useProductInboxTableColumns = () => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      columnHelper.display({
        id: "product",
        header: () => <ProductHeader />,
        cell: ({ row }) => (
          <ProductCell
            product={{
              title: row.original.product_title,
              thumbnail: row.original.product_thumbnail,
            }}
          />
        ),
      }),
      columnHelper.accessor("seller_name", {
        header: t("products.inbox.fields.store"),
        cell: ({ getValue }) => (
          <Text size="small" leading="compact" className="truncate">
            {getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor("type", {
        header: t("products.inbox.fields.type"),
        cell: ({ getValue }) => (
          <StatusCell color={INBOX_TYPE_COLORS[getValue()]}>
            {t(`products.inbox.types.${getValue()}`)}
          </StatusCell>
        ),
      }),
      columnHelper.accessor("product_status", {
        header: () => <ProductStatusHeader />,
        cell: ({ getValue }) => <ProductStatusCell status={getValue()} />,
      }),
      columnHelper.accessor("action_count", {
        header: t("products.inbox.fields.changes"),
        cell: ({ getValue }) => (
          <Text size="small" leading="compact">
            {t("products.inbox.changeCount", { count: getValue() })}
          </Text>
        ),
      }),
      columnHelper.accessor("created_at", {
        header: t("products.inbox.fields.submitted"),
        cell: ({ getValue }) => <DateCell date={getValue()} />,
      }),
      columnHelper.accessor("updated_at", {
        header: () => <DateHeader />,
        cell: ({ getValue }) => <DateCell date={getValue()} />,
      }),
    ],
    [t],
  )
}
