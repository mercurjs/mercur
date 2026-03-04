import { keepPreviousData } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { useLocation } from "react-router-dom"

import { _DataTable } from "../../../../../components/table/data-table"
import { useApiKeys } from "../../../../../hooks/api/api-keys"
import { useDataTable } from "../../../../../hooks/use-data-table"
import { getApiKeyTypeFromPathname } from "../../../common/utils"
import { useApiKeyManagementTableColumns } from "../api-key-management-list-table/use-api-key-management-table-columns"
import { useApiKeyManagementTableFilters } from "../api-key-management-list-table/use-api-key-management-table-filters"
import { useApiKeyManagementTableQuery } from "../api-key-management-list-table/use-api-key-management-table-query"

const PAGE_SIZE = 20

export const ApiKeyManagementListDataTable = () => {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const keyType = getApiKeyTypeFromPathname(pathname)

  const { searchParams, raw } = useApiKeyManagementTableQuery({
    pageSize: PAGE_SIZE,
  })

  const query = {
    ...searchParams,
    type: keyType,
    fields:
      "id,title,redacted,token,type,created_at,updated_at,revoked_at,last_used_at,created_by,revoked_by",
  }

  const { api_keys, count, isLoading, isError, error } = useApiKeys(
    query as Parameters<typeof useApiKeys>[0],
    {
      placeholderData: keepPreviousData,
    }
  )

  const filters = useApiKeyManagementTableFilters()
  const columns = useApiKeyManagementTableColumns()

  const { table } = useDataTable({
    data: api_keys || [],
    columns,
    count,
    enablePagination: true,
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
  })

  if (isError) {
    throw error
  }

  return (
    <_DataTable
      table={table}
      filters={filters}
      columns={columns}
      count={count}
      pageSize={PAGE_SIZE}
      orderBy={[
        { key: "title", label: t("fields.title") },
        { key: "created_at", label: t("fields.createdAt") },
        { key: "updated_at", label: t("fields.updatedAt") },
        { key: "revoked_at", label: t("fields.revokedAt") },
      ]}
      navigateTo={(row) => row.id}
      pagination
      search
      queryObject={raw}
      isLoading={isLoading}
    />
  )
}
