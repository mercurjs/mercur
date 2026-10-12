import { InferClientInput } from "@mercurjs/client"

import { sdk } from "../../../lib/client"
import { useQueryParams } from "../../use-query-params"

type UseOfferConditionTableQueryProps = {
  prefix?: string
  pageSize?: number
}

export const useOfferConditionTableQuery = ({
  prefix,
  pageSize = 20,
}: UseOfferConditionTableQueryProps) => {
  const queryObject = useQueryParams(["offset", "q", "order"], prefix)

  const { offset, q, order } = queryObject
  const searchParams: InferClientInput<typeof sdk.admin.offerConditions.query> =
    {
      limit: pageSize,
      offset: offset ? Number(offset) : 0,
      ...(order ? { order } : {}),
      ...(q ? { q } : {}),
    }

  return {
    searchParams,
    raw: queryObject,
  }
}
