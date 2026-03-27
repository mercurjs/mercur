import {
  useQuery,
  useInfiniteQuery,
  UseQueryOptions,
} from "@tanstack/react-query"
import { client } from "../../lib/client"
import { ClientError } from "@mercurjs/client"

const ADMIN_CONVERSATIONS_KEY = "admin_conversations" as const
const ADMIN_CONVERSATION_KEY = "admin_conversation" as const

export type AdminConversationDTO = {
  id: string
  buyer_id: string
  seller_id: string
  buyer_name?: string | null
  buyer_email?: string | null
  seller_name?: string | null
  last_message_preview: string | null
  last_message_sender_type: "customer" | "seller" | null
  last_message_at: string | null
  unread_count_customer: number
  unread_count_seller: number
  created_at: string
}

export type AdminMessageDTO = {
  id: string
  sender_id: string
  sender_type: "customer" | "seller"
  body: string
  context_type: "product" | "order" | null
  context_id: string | null
  context_label: string | null
  read_at: string | null
  created_at: string
}

type AdminConversationListResponse = {
  conversations: AdminConversationDTO[]
  next_cursor: string | null
}

type AdminConversationDetailResponse = {
  conversation: AdminConversationDTO
  messages: AdminMessageDTO[]
  next_cursor: string | null
}

type SearchParams = {
  cursor?: string
  limit?: number
  seller_name?: string
  buyer_name?: string
  date_from?: string
  date_to?: string
  context_type?: string
  context_id?: string
}

export const useAdminConversations = (
  query?: SearchParams,
  options?: Omit<UseQueryOptions<AdminConversationListResponse, ClientError>, "queryKey" | "queryFn">
) => {
  const { data, ...rest } = useQuery({
    queryKey: [ADMIN_CONVERSATIONS_KEY, query],
    queryFn: async () =>
      (client as any).admin.messages.query(query ?? {}) as Promise<AdminConversationListResponse>,
    ...options,
  })

  return { ...data, ...rest }
}

export const useAdminConversation = (
  id: string,
  query?: { limit?: number },
) => {
  const limit = query?.limit ?? 20

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, ...rest } =
    useInfiniteQuery<AdminConversationDetailResponse, ClientError>({
      queryKey: [ADMIN_CONVERSATION_KEY, id, { limit }],
      queryFn: async ({ pageParam }) =>
        (client as any).admin.messages.$id.query({
          $id: id,
          limit,
          ...(pageParam ? { cursor: pageParam } : {}),
        }) as Promise<AdminConversationDetailResponse>,
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    })

  const conversation = data?.pages[0]?.conversation
  const messages = data?.pages.flatMap((p) => p.messages) ?? []

  return {
    conversation,
    messages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    ...rest,
  }
}
