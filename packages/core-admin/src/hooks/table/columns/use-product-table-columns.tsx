import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"

import {
  CollectionCell,
  CollectionHeader,
} from "../../../components/table/table-cells/product/collection-cell/collection-cell"
import {
  ProductCell,
  ProductHeader,
} from "../../../components/table/table-cells/product/product-cell"
import {
  ProductStatusCell,
  ProductStatusHeader,
} from "../../../components/table/table-cells/product/product-status-cell"
import {
  SalesChannelHeader,
  SalesChannelsCell,
} from "../../../components/table/table-cells/product/sales-channels-cell"
import {
  VariantCell,
  VariantHeader,
} from "../../../components/table/table-cells/product/variant-cell"
import { HttpTypes } from "@medusajs/types"

const columnHelper = createColumnHelper<HttpTypes.AdminProduct>()

export const useProductTableColumns = () => {
  return useMemo(
    () => [
      columnHelper.display({
        id: "product",
        header: () => <ProductHeader />,
        cell: ({ row }) => (
          <ProductCell
            product={row.original}
            data-testid={`products-table-cell-${row.id}-product-value`}
          />
        ),
      }),
      columnHelper.accessor("collection", {
        header: () => <CollectionHeader />,
        cell: ({ row }) => (
          <CollectionCell
            collection={row.original.collection}
            data-testid={`products-table-cell-${row.id}-collection-value`}
          />
        ),
      }),
      columnHelper.accessor("sales_channels", {
        header: () => <SalesChannelHeader />,
        cell: ({ row }) => (
          <SalesChannelsCell
            salesChannels={row.original.sales_channels}
            data-testid={`products-table-cell-${row.id}-sales_channels-value`}
          />
        ),
      }),
      columnHelper.accessor("variants", {
        header: () => <VariantHeader />,
        cell: ({ row }) => (
          <VariantCell
            variants={row.original.variants}
            data-testid={`products-table-cell-${row.id}-variants-value`}
          />
        ),
      }),
      columnHelper.accessor("status", {
        header: () => <ProductStatusHeader />,
        cell: ({ row }) => (
          <ProductStatusCell
            status={row.original.status}
            data-testid={`products-table-cell-${row.id}-status-value`}
          />
        ),
      }),
    ],
    []
  )
}
