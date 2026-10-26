import { useQueryParams } from "../../use-query-params"

type UsePayoutCaptureTableQueryProps = {
  prefix?: string
  pageSize?: number
}

export const usePayoutCaptureTableQuery = ({
  prefix,
  pageSize = 20,
}: UsePayoutCaptureTableQueryProps) => {
  const queryObject = useQueryParams(["offset"], prefix)

  const { offset } = queryObject

  const searchParams = {
    limit: pageSize,
    offset: offset ? Number(offset) : 0,
  }

  return {
    searchParams,
    raw: queryObject,
  }
}
