import { PencilSquare, Trash } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Button, Container, Heading, usePrompt } from "@medusajs/ui"
import { createColumnHelper } from "@tanstack/react-table"
import { Children, ReactNode, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Link, Outlet, useLoaderData, useNavigate } from "react-router-dom"

import { keepPreviousData } from "@tanstack/react-query"

import { ActionMenu } from "../../../../../components/common/action-menu"
import { _DataTable } from "../../../../../components/table/data-table"
import {
  useDeletePromotion,
  usePromotions,
} from "../../../../../hooks/api/promotions"
import { usePromotionTableColumns } from "../../../../../hooks/table/columns/use-promotion-table-columns"
import { usePromotionTableFilters } from "../../../../../hooks/table/filters/use-promotion-table-filters"
import { usePromotionTableQuery } from "../../../../../hooks/table/query/use-promotion-table-query"
import { useDataTable } from "../../../../../hooks/use-data-table"

const PAGE_SIZE = 20

export const PromotionListTitle = () => {
  const { t } = useTranslation()
  return (
    <Heading level="h2" data-testid="promotion-list-table-heading">
      {t("promotions.domain")}
    </Heading>
  )
}

export const PromotionListCreateButton = () => {
  const { t } = useTranslation()
  return (
    <Button size="small" variant="secondary" asChild data-testid="promotion-list-table-create-button">
      <Link to="create">{t("actions.create")}</Link>
    </Button>
  )
}

export const PromotionListActions = ({ children }: { children?: ReactNode }) => {
  return (
    <div className="flex items-center gap-x-2">
      {Children.count(children) > 0 ? children : <PromotionListCreateButton />}
    </div>
  )
}

export const PromotionListHeader = ({ children }: { children?: ReactNode }) => {
  return (
    <div
      className="flex items-center justify-between px-6 py-4"
      data-testid="promotion-list-table-header"
    >
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <PromotionListTitle />
          <PromotionListActions />
        </>
      )}
    </div>
  )
}

export const PromotionListDataTable = () => {
  const { t } = useTranslation()
  const initialData =
    useLoaderData() as HttpTypes.AdminPromotionListResponse | undefined

  const { searchParams, raw } = usePromotionTableQuery({ pageSize: PAGE_SIZE })
  const { promotions, count, isLoading, isError, error } = usePromotions(
    { ...searchParams },
    {
      initialData,
      placeholderData: keepPreviousData,
    }
  )

  const filters = usePromotionTableFilters()
  const columns = useColumns()

  const { table } = useDataTable({
    data: promotions ?? [],
    columns,
    count,
    enablePagination: true,
    pageSize: PAGE_SIZE,
    getRowId: (row) => row.id,
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
      filters={filters}
      search
      pagination
      isLoading={isLoading}
      queryObject={raw}
      navigateTo={(row) => `${row.original.id}`}
      orderBy={[
        { key: "created_at", label: t("fields.createdAt") },
        { key: "updated_at", label: t("fields.updatedAt") },
      ]}
      data-testid="promotion-list-table"
    />
  )
}

export const PromotionListTable = ({ children }: { children?: ReactNode }) => {
  return (
    <Container className="divide-y p-0" data-testid="promotion-list-table-container">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <PromotionListHeader />
          <PromotionListDataTable />
        </>
      )}
      <Outlet />
    </Container>
  )
}

const PromotionActions = ({ promotion }: { promotion: HttpTypes.AdminPromotion }) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const navigate = useNavigate()
  const { mutateAsync } = useDeletePromotion(promotion.id)

  const handleDelete = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("promotions.deleteWarning", { code: promotion.code! }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
      verificationInstruction: t("general.typeToConfirm"),
      verificationText: promotion.code,
    })

    if (!res) {
      return
    }

    try {
      await mutateAsync(undefined, {
        onSuccess: () => {
          navigate("/promotions", { replace: true })
        },
      })
    } catch {
      throw new Error(
        `Promotion with code ${promotion.code} could not be deleted`
      )
    }
  }

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              icon: <PencilSquare />,
              label: t("actions.edit"),
              to: `/promotions/${promotion.id}/edit`,
            },
            {
              icon: <Trash />,
              label: t("actions.delete"),
              onClick: handleDelete,
            },
          ],
        },
      ]}
      data-testid={`promotion-list-table-action-menu-${promotion.id}`}
    />
  )
}

const columnHelper = createColumnHelper<HttpTypes.AdminPromotion>()

const useColumns = () => {
  const base = usePromotionTableColumns()

  return useMemo(
    () => [
      ...base,
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
          return <PromotionActions promotion={row.original} />
        },
      }),
    ],
    [base]
  )
}
