import { useQueryParams } from "@mercurjs/dashboard-shared"

type UseMemberTableQueryProps = {
  prefix?: string
  pageSize?: number
}

export const useMemberTableQuery = ({
  prefix,
  pageSize = 20,
}: UseMemberTableQueryProps) => {
  const queryObject = useQueryParams(
    ["offset", "q", "order"],
    prefix
  )

  const { offset, q, order } = queryObject

  const searchParams: Record<string, any> = {
    limit: pageSize,
    offset: offset ? Number(offset) : 0,
    order: order ? order : "-created_at",
    q,
  }

  return {
    searchParams,
    raw: queryObject,
  }
}
