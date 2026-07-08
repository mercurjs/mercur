import { PencilSquare, Trash } from "@medusajs/icons"
import { AdminProductCategoryResponse } from "@medusajs/types"
import { useExtendableTable, useLinkQuery } from "@mercurjs/dashboard-shared"
import { keepPreviousData } from "@tanstack/react-query"
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { ActionMenu } from "../../../../../components/common/action-menu"
import { _DataTable } from "../../../../../components/table/data-table"
import { useProductCategories } from "../../../../../hooks/api/categories"
import { useDataTable } from "../../../../../hooks/use-data-table"
import { useDeleteProductCategoryAction } from "../../../common/hooks/use-delete-product-category-action"
import { useCategoryTableColumns } from "./use-category-table-columns"
import { useCategoryTableQuery } from "./use-category-table-query"

const PAGE_SIZE = 20

export const CategoryListDataTable = () => {
  const { raw, searchParams } = useCategoryTableQuery({ pageSize: PAGE_SIZE })

  const imageFields =
    "media_images.id,media_images.url,media_images.type,media_images.is_thumbnail,media_images.is_banner"

  const ancestorsLinkQuery = useLinkQuery(
    "category",
    `id,name,handle,is_active,is_internal,parent_category,${imageFields}`
  )
  const descendantsLinkQuery = useLinkQuery(
    "category",
    `id,name,category_children,handle,is_internal,is_active,${imageFields}`
  )

  const query = raw.q
    ? {
        include_ancestors_tree: true,
        ...ancestorsLinkQuery,
        ...searchParams,
      }
    : {
        include_descendants_tree: true,
        parent_category_id: "null",
        ...descendantsLinkQuery,
        ...searchParams,
      }

  const { product_categories, count, isLoading, isError, error } =
    useProductCategories(
      {
        ...query,
      },
      {
        placeholderData: keepPreviousData,
      }
    )

  const columns = useColumns()

  const { table } = useDataTable({
    data: product_categories || [],
    columns,
    count,
    getRowId: (original) => original.id,
    getSubRows: (original) => original.category_children,
    enableExpandableRows: true,
    pageSize: PAGE_SIZE,
  })

  if (isError) {
    throw error
  }

  return (
    <_DataTable
      table={table}
      columns={columns}
      count={count}
      pageSize={PAGE_SIZE}
      isLoading={isLoading}
      navigateTo={(row) => row.id}
      queryObject={raw}
      search
      pagination
    />
  )
}

const CategoryRowActions = ({
  category,
}: {
  category: AdminProductCategoryResponse["product_category"]
}) => {
  const { t } = useTranslation()
  const handleDelete = useDeleteProductCategoryAction(category)

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              label: t("actions.edit"),
              icon: <PencilSquare />,
              to: `${category.id}/edit`,
            },
          ],
        },
        {
          actions: [
            {
              label: t("actions.delete"),
              icon: <Trash />,
              onClick: handleDelete,
            },
          ],
        },
      ]}
    />
  )
}

const columnHelper =
  createColumnHelper<AdminProductCategoryResponse["product_category"]>()

type CategoryRow = AdminProductCategoryResponse["product_category"]

const useColumns = () => {
  const base = useCategoryTableColumns()
  const { columns: extended } = useExtendableTable<CategoryRow>({
    model: "category",
    columns: base as unknown as ColumnDef<CategoryRow, unknown>[],
  })

  return useMemo(
    () => [
      ...extended,
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
          return <CategoryRowActions category={row.original} />
        },
      }),
    ],
    [extended]
  )
}
