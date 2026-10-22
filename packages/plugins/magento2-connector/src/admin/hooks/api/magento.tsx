import { queryKeysFactory } from "@mercurjs/dashboard-shared"
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query"

import {
  client,
  type MagentoStatus,
  type MagentoWebhook,
  type MagentoWebhookDelivery,
  type MagentoWebhookDeliveryStatus,
} from "../../lib/client"

export const magentoStatusQueryKeys = queryKeysFactory("admin_magento_status")
export const magentoWebhookQueryKeys = queryKeysFactory("admin_magento_webhooks")
export const magentoDeliveryQueryKeys = queryKeysFactory("admin_magento_deliveries")

type QueryOptions<T> = Omit<UseQueryOptions<T, Error, T>, "queryKey" | "queryFn">

export const useMagentoStatus = (options?: QueryOptions<MagentoStatus>) => {
  const { data, ...rest } = useQuery({
    queryKey: magentoStatusQueryKeys.all,
    queryFn: () => client.admin.magento.status.query({}),
    ...options,
  })

  return { connection: data, ...rest }
}

export const useMagentoWebhooks = (
  query: { limit?: number; offset?: number } = {},
  options?: QueryOptions<{ webhooks: MagentoWebhook[]; count: number }>
) => {
  const { data, ...rest } = useQuery({
    queryKey: magentoWebhookQueryKeys.list(query),
    queryFn: () => client.admin.magento.webhooks.query(query),
    ...options,
  })

  return { webhooks: data?.webhooks, count: data?.count, ...rest }
}

export const useMagentoWebhook = (
  id: string,
  options?: QueryOptions<{ webhook: MagentoWebhook }>
) => {
  const { data, ...rest } = useQuery({
    queryKey: magentoWebhookQueryKeys.detail(id),
    queryFn: () => client.admin.magento.webhooks.$id.query({ $id: id }),
    ...options,
  })

  return { webhook: data?.webhook, ...rest }
}

export const useMagentoWebhookDeliveries = (
  id: string,
  query: {
    limit?: number
    offset?: number
    status?: MagentoWebhookDeliveryStatus | MagentoWebhookDeliveryStatus[]
  } = {},
  options?: QueryOptions<{ deliveries: MagentoWebhookDelivery[]; count: number }>
) => {
  const { data, ...rest } = useQuery({
    queryKey: magentoDeliveryQueryKeys.list({ id, ...query }),
    queryFn: () => client.admin.magento.webhooks.$id.deliveries.query({ $id: id, ...query }),
    ...options,
  })

  return { deliveries: data?.deliveries, count: data?.count, ...rest }
}

const useInvalidateMagento = () => {
  const queryClient = useQueryClient()

  return (id?: string) => {
    queryClient.invalidateQueries({ queryKey: magentoStatusQueryKeys.all })
    queryClient.invalidateQueries({ queryKey: magentoWebhookQueryKeys.lists() })
    queryClient.invalidateQueries({ queryKey: magentoDeliveryQueryKeys.lists() })
    if (id) {
      queryClient.invalidateQueries({ queryKey: magentoWebhookQueryKeys.detail(id) })
    }
  }
}

type CreateInput = { url: string; events: string[]; description?: string | null }

export const useCreateMagentoWebhook = (
  options?: UseMutationOptions<{ webhook: MagentoWebhook & { secret: string } }, Error, CreateInput>
) => {
  const invalidate = useInvalidateMagento()

  return useMutation({
    mutationFn: (payload: CreateInput) => client.admin.magento.webhooks.mutate(payload),
    ...options,
    onSuccess: (data, variables, context) => {
      invalidate()
      options?.onSuccess?.(data, variables, context)
    },
  })
}

type UpdateInput = {
  url?: string
  events?: string[]
  is_active?: boolean
  description?: string | null
}

export const useUpdateMagentoWebhook = (
  id: string,
  options?: UseMutationOptions<{ webhook: MagentoWebhook }, Error, UpdateInput>
) => {
  const invalidate = useInvalidateMagento()

  return useMutation({
    mutationFn: (payload: UpdateInput) =>
      client.admin.magento.webhooks.$id.mutate({ $id: id, ...payload }),
    ...options,
    onSuccess: (data, variables, context) => {
      invalidate(id)
      options?.onSuccess?.(data, variables, context)
    },
  })
}

export const useDeleteMagentoWebhook = (
  id: string,
  options?: UseMutationOptions<{ id: string; deleted: boolean }, Error, void>
) => {
  const invalidate = useInvalidateMagento()

  return useMutation({
    mutationFn: () => client.admin.magento.webhooks.$id.delete({ $id: id }),
    ...options,
    onSuccess: (data, variables, context) => {
      invalidate(id)
      options?.onSuccess?.(data, variables, context)
    },
  })
}

export const useRedeliverMagentoWebhook = (
  id: string,
  options?: UseMutationOptions<{ delivery: MagentoWebhookDelivery }, Error, string>
) => {
  const invalidate = useInvalidateMagento()

  return useMutation({
    mutationFn: (deliveryId: string) =>
      client.admin.magento.webhooks.$id.deliveries.$delivery_id.redeliver.mutate({
        $id: id,
        $delivery_id: deliveryId,
      }),
    ...options,
    onSuccess: (data, variables, context) => {
      invalidate(id)
      options?.onSuccess?.(data, variables, context)
    },
  })
}
