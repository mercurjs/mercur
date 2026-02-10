import { Container, createDataTableColumnHelper } from "@medusajs/ui"
import { keepPreviousData } from "@tanstack/react-query"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { PencilSquare } from "@medusajs/icons"
import { DataTable } from "@components/data-table"
// import { useDataTableDateFilters } from "@components/data-table/helpers/general/use-data-table-date-filters"
import { useUsers } from "@hooks/api/users"
import { useQueryParams } from "@hooks/use-query-params"
import { TeamMemberProps } from "@custom-types/user"

const PAGE_SIZE = 20

export const UserListTable = () => {
  const { q, order, offset } = useQueryParams(["q", "order", "offset"])
  const { members, isPending, isError, error } = useUsers(
    {
      limit: 9999,
      order,
    },
    {
      placeholderData: keepPreviousData,
    }
  )

  const processedMembers = useMemo(() => {
    if (q) {
      return members?.filter((member) =>
        member.email.toLowerCase().includes(q.toLowerCase())
      )
    }
    return members
  }, [members, q])

  const count = processedMembers?.length ?? 0
  const membersOffset = offset ? parseInt(offset) : 0

  const columns = useColumns()
  // const filters = useFilters()

  const { t } = useTranslation()

  if (isError) {
    throw error
  }

  return (
    <Container className="divide-y p-0">
      <DataTable
        data={
          processedMembers?.slice(membersOffset, membersOffset + PAGE_SIZE) ??
          []
        }
        columns={columns}
        // filters={filters}
        getRowId={(row) => row.id}
        rowCount={count}
        pageSize={PAGE_SIZE}
        heading={t("users.domain")}
        rowHref={(row) => `${row.id}`}
        isLoading={isPending}
        action={{
          label: t("users.invite"),
          to: "invite",
        }}
        emptyState={{
          empty: {
            heading: t("users.list.empty.heading"),
            description: t("users.list.empty.description"),
          },
          filtered: {
            heading: t("users.list.filtered.heading"),
            description: t("users.list.filtered.description"),
          },
        }}
      />
    </Container>
  )
}

const columnHelper = createDataTableColumnHelper<TeamMemberProps>()

const useColumns = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return useMemo(
    () => [
      columnHelper.accessor("email", {
        header: "Email",
        cell: ({ row }) => {
          return row.original.email
        },
        enableSorting: true,
        sortAscLabel: t("filters.sorting.alphabeticallyAsc"),
        sortDescLabel: t("filters.sorting.alphabeticallyDesc"),
      }),
      columnHelper.accessor("name", {
        header: "Name",
        cell: ({ row }) => {
          return row.original.name || "-"
        },
        enableSorting: true,
        sortAscLabel: t("filters.sorting.alphabeticallyAsc"),
        sortDescLabel: t("filters.sorting.alphabeticallyDesc"),
      }),
      columnHelper.action({
        actions: [
          {
            label: t("actions.edit"),
            icon: <PencilSquare />,
            onClick: (ctx) => {
              navigate(`${ctx.row.original.id}/edit`)
            },
          },
        ],
      }),
    ],
    [t, navigate]
  )
}

// const useFilters = () => {
//   const dateFilters = useDataTableDateFilters()

//   return useMemo(() => {
//     return dateFilters
//   }, [dateFilters])
// }
