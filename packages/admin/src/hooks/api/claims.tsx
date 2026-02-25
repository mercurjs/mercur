import { ClientError } from "@mercurjs/client"
import { HttpTypes } from "@medusajs/types"
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query"

import { sdk } from "../../lib/client"
import { queryClient } from "../../lib/query-client"
import { queryKeysFactory } from "../../lib/query-key-factory"
import { ordersQueryKeys } from "./orders"
import { returnsQueryKeys } from "./returns"

const CLAIMS_QUERY_KEY = "claims" as const
export const claimsQueryKeys = queryKeysFactory(CLAIMS_QUERY_KEY)

export const useClaim = (
  id: string,
  query?: HttpTypes.AdminClaimListParams,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminClaimResponse,
      ClientError,
      HttpTypes.AdminClaimResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () => sdk.admin.claims.$id.query({ $id: id, ...query }),
    queryKey: claimsQueryKeys.detail(id, query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useClaims = (
  query?: HttpTypes.AdminClaimListParams,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminClaimListParams,
      ClientError,
      HttpTypes.AdminClaimListResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () => sdk.admin.claims.query({ ...query }),
    queryKey: claimsQueryKeys.list(query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useCreateClaim = (
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminClaimResponse,
    ClientError,
    HttpTypes.AdminCreateClaim
  >
) => {
  return useMutation({
    mutationFn: (payload: HttpTypes.AdminCreateClaim) =>
      sdk.admin.claims.mutate(payload),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      queryClient.invalidateQueries({
        queryKey: claimsQueryKeys.lists(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useCancelClaim = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<HttpTypes.AdminClaimResponse, ClientError>
) => {
  return useMutation({
    mutationFn: () => sdk.admin.claims.$id.cancel.mutate({ $id: id }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      queryClient.invalidateQueries({
        queryKey: claimsQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: claimsQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useAddClaimItems = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminClaimResponse,
    ClientError,
    HttpTypes.AdminAddClaimItems
  >
) => {
  return useMutation({
    mutationFn: (payload: HttpTypes.AdminAddClaimItems) =>
      sdk.admin.claims.$id.claimItems.mutate({ $id: id, ...payload }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateClaimItems = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminClaimResponse,
    ClientError,
    HttpTypes.AdminUpdateClaimItem & { actionId: string }
  >
) => {
  return useMutation({
    mutationFn: ({
      actionId,
      ...payload
    }: HttpTypes.AdminUpdateClaimItem & { actionId: string }) => {
      return sdk.admin.claims.$id.claimItems.$actionId.mutate({
        $id: id,
        $actionId: actionId,
        ...payload,
      })
    },
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useRemoveClaimItem = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminReturnResponse,
    ClientError,
    string
  >
) => {
  return useMutation({
    mutationFn: (actionId: string) =>
      sdk.admin.returns.$id.requestItems.$actionId.delete({
        $id: id,
        $actionId: actionId,
      }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useAddClaimInboundItems = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminClaimReturnPreviewResponse,
    ClientError,
    HttpTypes.AdminAddClaimInboundItems
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.claims.$id.inbound.items.mutate({ $id: id, ...payload }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateClaimInboundItem = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminClaimResponse,
    ClientError,
    HttpTypes.AdminUpdateClaimInboundItem & { actionId: string }
  >
) => {
  return useMutation({
    mutationFn: ({
      actionId,
      ...payload
    }: HttpTypes.AdminUpdateClaimInboundItem & { actionId: string }) => {
      return sdk.admin.claims.$id.inbound.items.$actionId.mutate({
        $id: id,
        $actionId: actionId,
        ...payload,
      })
    },
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useRemoveClaimInboundItem = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<HttpTypes.AdminClaimResponse, ClientError, string>
) => {
  return useMutation({
    mutationFn: (actionId: string) =>
      sdk.admin.claims.$id.inbound.items.$actionId.delete({
        $id: id,
        $actionId: actionId,
      }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      queryClient.invalidateQueries({
        queryKey: returnsQueryKeys.details(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useAddClaimInboundShipping = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminClaimResponse,
    ClientError,
    HttpTypes.AdminClaimAddInboundShipping
  >
) => {
  return useMutation({
    mutationFn: (payload: HttpTypes.AdminClaimAddInboundShipping) =>
      sdk.admin.claims.$id.inbound.shippingMethod.mutate({
        $id: id,
        ...payload,
      }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateClaimInboundShipping = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminClaimResponse,
    ClientError,
    HttpTypes.AdminClaimUpdateInboundShipping
  >
) => {
  return useMutation({
    mutationFn: ({
      actionId,
      ...payload
    }: HttpTypes.AdminClaimUpdateInboundShipping & { actionId: string }) =>
      sdk.admin.claims.$id.inbound.shippingMethod.$actionId.mutate({
        $id: id,
        $actionId: actionId,
        ...payload,
      }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteClaimInboundShipping = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<HttpTypes.AdminClaimResponse, ClientError, string>
) => {
  return useMutation({
    mutationFn: (actionId: string) =>
      sdk.admin.claims.$id.inbound.shippingMethod.$actionId.delete({
        $id: id,
        $actionId: actionId,
      }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useAddClaimOutboundItems = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminClaimResponse,
    ClientError,
    HttpTypes.AdminAddClaimOutboundItems
  >
) => {
  return useMutation({
    mutationFn: (payload: HttpTypes.AdminAddClaimOutboundItems) =>
      sdk.admin.claims.$id.outbound.items.mutate({ $id: id, ...payload }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateClaimOutboundItems = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminClaimResponse,
    ClientError,
    HttpTypes.AdminUpdateClaimOutboundItem & { actionId: string }
  >
) => {
  return useMutation({
    mutationFn: ({
      actionId,
      ...payload
    }: HttpTypes.AdminUpdateClaimOutboundItem & { actionId: string }) => {
      return sdk.admin.claims.$id.outbound.items.$actionId.mutate({
        $id: id,
        $actionId: actionId,
        ...payload,
      })
    },
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useRemoveClaimOutboundItem = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<HttpTypes.AdminClaimResponse, ClientError, string>
) => {
  return useMutation({
    mutationFn: (actionId: string) =>
      sdk.admin.claims.$id.outbound.items.$actionId.delete({
        $id: id,
        $actionId: actionId,
      }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useAddClaimOutboundShipping = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminClaimResponse,
    ClientError,
    HttpTypes.AdminClaimAddOutboundShipping
  >
) => {
  return useMutation({
    mutationFn: (payload: HttpTypes.AdminClaimAddOutboundShipping) =>
      sdk.admin.claims.$id.outbound.shippingMethod.mutate({
        $id: id,
        ...payload,
      }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateClaimOutboundShipping = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminClaimResponse,
    ClientError,
    HttpTypes.AdminClaimUpdateOutboundShipping
  >
) => {
  return useMutation({
    mutationFn: ({
      actionId,
      ...payload
    }: HttpTypes.AdminClaimUpdateOutboundShipping & { actionId: string }) =>
      sdk.admin.claims.$id.outbound.shippingMethod.$actionId.mutate({
        $id: id,
        $actionId: actionId,
        ...payload,
      }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteClaimOutboundShipping = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<HttpTypes.AdminClaimResponse, ClientError, string>
) => {
  return useMutation({
    mutationFn: (actionId: string) =>
      sdk.admin.claims.$id.outbound.shippingMethod.$actionId.delete({
        $id: id,
        $actionId: actionId,
      }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useClaimConfirmRequest = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminClaimResponse,
    ClientError,
    HttpTypes.AdminRequestClaim
  >
) => {
  return useMutation({
    mutationFn: (payload: HttpTypes.AdminRequestClaim) =>
      sdk.admin.claims.$id.request.mutate({ $id: id, ...payload }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: returnsQueryKeys.all,
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      queryClient.invalidateQueries({
        queryKey: claimsQueryKeys.lists(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useCancelClaimRequest = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<HttpTypes.AdminClaimResponse, ClientError>
) => {
  return useMutation({
    mutationFn: () => sdk.admin.claims.$id.request.delete({ $id: id }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      queryClient.invalidateQueries({
        queryKey: claimsQueryKeys.details(),
      })
      queryClient.invalidateQueries({
        queryKey: claimsQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
