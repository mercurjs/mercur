import { useCallback, useMemo } from "react"

import { PencilSquare, Trash } from "@medusajs/icons"
import {
  Container,
  createDataTableColumnHelper,
  toast,
  usePrompt,
} from "@medusajs/ui"
import { DataTable, usePermissions } from "@mercurjs/dashboard-shared"
import { HttpTypes } from "@mercurjs/types"
import { keepPreviousData } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import {
  useDeleteOfferConditionLazy,
  useOfferConditions,
} from "../../../../../hooks/api"
import { useOfferConditionTableColumns } from "../../../../../hooks/table/columns"
import { useOfferConditionTableQuery } from "../../../../../hooks/table/query"

type OfferCondition = HttpTypes.AdminOfferConditionResponse["offer_condition"]

const PAGE_SIZE = 20

export const OfferConditionListDataTable = () => {
  const { t } = useTranslation()
  const { searchParams } = useOfferConditionTableQuery({
    pageSize: PAGE_SIZE,
  })

  const { offer_conditions, count, isLoading, isError, error } =
    useOfferConditions(searchParams, {
      placeholderData: keepPreviousData,
    })

  const columns = useColumns()

  if (isError) {
    throw error
  }

  return (
    <Container className="divide-y px-0 py-0">
      <DataTable
        data={offer_conditions}
        columns={columns}
        rowCount={count}
        pageSize={PAGE_SIZE}
        getRowId={(row) => row.id}
        heading={t("offerConditions.domain")}
        subHeading={t("offerConditions.subtitle")}
        emptyState={{
          empty: {
            heading: t("general.noRecordsMessage"),
          },
          filtered: {
            heading: t("general.noRecordsMessage"),
            description: t("general.noRecordsMessageFiltered"),
          },
        }}
        actions={[
          {
            permission: "offers:manage",
            label: t("actions.create"),
            to: "create",
          },
        ]}
        isLoading={isLoading}
        enableSearch={true}
      />
    </Container>
  )
}

const columnHelper = createDataTableColumnHelper<OfferCondition>()

const useColumns = () => {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const prompt = usePrompt()
  const navigate = useNavigate()
  const base = useOfferConditionTableColumns()

  const { mutateAsync } = useDeleteOfferConditionLazy()

  const handleDelete = useCallback(
    async (offerCondition: OfferCondition) => {
      const confirm = await prompt({
        title: t("general.areYouSure"),
        description: t("offerConditions.delete.confirmation", {
          label: offerCondition.label,
        }),
        confirmText: t("actions.delete"),
        cancelText: t("actions.cancel"),
      })

      if (!confirm) {
        return
      }

      await mutateAsync(offerCondition.id, {
        onSuccess: () => {
          toast.success(t("offerConditions.delete.successToast"))
        },
        onError: (e) => {
          toast.error(e.message)
        },
      })
    },
    [t, prompt, mutateAsync]
  )

  return useMemo(
    () => [
      ...base,
      columnHelper.action({
        actions: (ctx) =>
          !can("offers", "manage")
            ? []
            : [
                [
                  {
                    icon: <PencilSquare />,
                    label: t("actions.edit"),
                    onClick: () =>
                      navigate(
                        `/settings/offer-conditions/${ctx.row.original.id}/edit`
                      ),
                  },
                ],
                [
                  {
                    icon: <Trash />,
                    label: t("actions.delete"),
                    onClick: () => handleDelete(ctx.row.original),
                  },
                ],
              ],
      }),
    ],
    [base, handleDelete, navigate, t, can]
  )
}
