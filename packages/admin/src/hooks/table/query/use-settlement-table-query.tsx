import { useQueryParams } from "../../use-query-params"

type UseSettlementTableQueryProps = {
  prefix?: string
  pageSize?: number
}

export const useSettlementTableQuery = ({
  prefix,
  pageSize = 20,
}: UseSettlementTableQueryProps) => {
  const queryObject = useQueryParams(
    ["offset", "status", "account_id", "currency_code", "period_start", "period_end"],
    prefix,
  )

  const { offset, status, account_id, currency_code, period_start, period_end } =
    queryObject

  const searchParams = {
    limit: pageSize,
    offset: offset ? Number(offset) : 0,
    status: status?.split(","),
    account_id: account_id?.split(","),
    currency_code: currency_code?.split(","),
    period_start: period_start ? JSON.parse(period_start) : undefined,
    period_end: period_end ? JSON.parse(period_end) : undefined,
  }

  return {
    searchParams,
    raw: queryObject,
  }
}
