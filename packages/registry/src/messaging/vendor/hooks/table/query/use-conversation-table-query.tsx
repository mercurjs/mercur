import { useQueryParams } from "@mercurjs/dashboard-shared"

type UseConversationTableQueryProps = {
  prefix?: string
  pageSize?: number
}

export const useConversationTableQuery = ({
  prefix,
  pageSize = 20,
}: UseConversationTableQueryProps) => {
  const queryObject = useQueryParams(
    ["offset", "order"],
    prefix
  )

  const { offset, order } = queryObject

  const searchParams: Record<string, any> = {
    limit: pageSize,
    offset: offset ? Number(offset) : 0,
    order: order ? order : "-last_message_at",
  }

  return {
    searchParams,
    raw: queryObject,
  }
}
