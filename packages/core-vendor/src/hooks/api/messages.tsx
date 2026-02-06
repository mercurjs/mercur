import { useQuery } from "@tanstack/react-query"
import { fetchQuery } from "../../lib/client"

export const useConversationIds = (sellerId: string) => {
  const { data, ...rest } = useQuery({
    queryKey: ["conversations", sellerId],
    queryFn: async () => await fetchQuery(`/vendor/talkjs`, { method: "GET" }),
  })

  return { ...data, ...rest }
}
