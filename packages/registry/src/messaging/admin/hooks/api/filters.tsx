import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query"
import { client } from "../../lib/client"
import { ClientError } from "@mercurjs/client"

const FILTERS_KEY = "admin_messaging_filters" as const
const BLOCKED_KEY = "admin_messaging_blocked" as const

export type FilterRuleDTO = {
  id: string
  match_type: "exact" | "contains" | "regex"
  pattern: string
  is_builtin: boolean
  is_enabled: boolean
  description: string | null
  created_at: string
  updated_at: string
}

export type BlockedMessageDTO = {
  id: string
  sender_id: string
  sender_type: "customer" | "seller"
  conversation_id: string
  matched_rule_id: string
  message_body: string
  created_at: string
}

type FilterListResponse = {
  filter_rules: FilterRuleDTO[]
  count: number
}

type BlockedListResponse = {
  blocked_messages: BlockedMessageDTO[]
  count: number
}

export const useAdminFilters = (
  options?: Omit<UseQueryOptions<FilterListResponse, ClientError>, "queryKey" | "queryFn">
) => {
  const { data, ...rest } = useQuery({
    queryKey: [FILTERS_KEY],
    queryFn: async () =>
      (client as any).admin.messages.filters.query() as Promise<FilterListResponse>,
    ...options,
  })

  return { ...data, ...rest }
}

export const useCreateFilter = (
  options?: UseMutationOptions<
    { filter_rule: FilterRuleDTO },
    ClientError,
    { match_type: string; pattern: string; description?: string; is_enabled?: boolean }
  >
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) =>
      (client as any).admin.messages.filters.mutate(payload) as Promise<{ filter_rule: FilterRuleDTO }>,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: [FILTERS_KEY] })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateFilter = (
  id: string,
  options?: UseMutationOptions<
    { filter_rule: FilterRuleDTO },
    ClientError,
    Record<string, any>
  >
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) =>
      (client as any).admin.messages.filters.$id.mutate({ $id: id, ...payload }) as Promise<{ filter_rule: FilterRuleDTO }>,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: [FILTERS_KEY] })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteFilter = (
  options?: UseMutationOptions<{ id: string; deleted: boolean }, ClientError, string>
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      (client as any).admin.messages.filters.$id.delete({ $id: id }) as Promise<{ id: string; deleted: boolean }>,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: [FILTERS_KEY] })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useAdminBlockedMessages = (
  query?: { sender_type?: string; date_from?: string; date_to?: string },
  options?: Omit<UseQueryOptions<BlockedListResponse, ClientError>, "queryKey" | "queryFn">
) => {
  const { data, ...rest } = useQuery({
    queryKey: [BLOCKED_KEY, query],
    queryFn: async () =>
      (client as any).admin.messages.blocked.query(query ?? {}) as Promise<BlockedListResponse>,
    ...options,
  })

  return { ...data, ...rest }
}
