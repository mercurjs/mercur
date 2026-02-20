import { keepPreviousData } from "@tanstack/react-query"
import { Container, Heading, Button } from "@medusajs/ui"
import { Link } from "react-router-dom"
import { PlusMini } from "@medusajs/icons"

import { _DataTable, SingleColumnPage } from "@mercurjs/dashboard-shared"
import { useDataTable } from "@mercurjs/dashboard-shared"
import { useMembers } from "../../hooks/api/members"
import { useMemberTableColumns } from "../../hooks/table/columns/use-member-table-columns"
import { useMemberTableQuery } from "../../hooks/table/query/use-member-table-query"

const PAGE_SIZE = 20

const UserListPage = () => {
  const { raw, searchParams } = useMemberTableQuery({
    pageSize: PAGE_SIZE,
  })

  const { members, count, isError, error, isLoading } = useMembers(
    searchParams,
    {
      placeholderData: keepPreviousData,
    }
  )

  const columns = useMemberTableColumns()

  const { table } = useDataTable({
    data: members ?? [],
    columns,
    enablePagination: true,
    count: count,
    pageSize: PAGE_SIZE,
  })

  if (isError) {
    throw error
  }

  return (
    <SingleColumnPage>
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading>Team Members</Heading>
          <Link to="/users/invite">
            <Button variant="secondary" size="small">
              <PlusMini />
              Invite
            </Button>
          </Link>
        </div>
        <_DataTable
          columns={columns}
          table={table}
          pagination
          navigateTo={(row) => `/users/${row.original.id}`}
          count={count}
          isLoading={isLoading}
          pageSize={PAGE_SIZE}
          orderBy={[
            {
              key: "name",
              label: "Name",
            },
            {
              key: "email",
              label: "Email",
            },
          ]}
          queryObject={raw}
          noRecords={{
            message: "No team members found",
          }}
        />
      </Container>
    </SingleColumnPage>
  )
}

export default UserListPage
