import { useQueryParams } from "@hooks/use-query-params"

import type { HttpTypes } from "@medusajs/types"

export const useWorkflowExecutionTableQuery = ({
  pageSize = 20,
  prefix,
}: {
  pageSize?: number
  prefix?: string
}) => {
  const raw = useQueryParams(["q", "offset"], prefix)

  const { offset, ...rest } = raw

  const searchParams: HttpTypes.AdminGetWorkflowExecutionsParams = {
    limit: pageSize,
    offset: offset ? parseInt(offset) : 0,
    ...rest,
  }

  return {
    searchParams,
    raw,
  }
}
