import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client";
import { UseMutationOptions, useMutation } from "@tanstack/react-query";
import {
  clearAuthToken,
  clearSellerId,
  sdk,
  setAuthToken,
} from "../../lib/client";

export const useSignInWithEmailPass = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.auth.$actorType.$authProvider.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.auth.$actorType.$authProvider.mutate>,
      "$actorType" | "$authProvider"
    >
  >,
) => {
  return useMutation({
    mutationFn: async (payload) => {
      const data = (await sdk.auth.$actorType.$authProvider.mutate({
        $actorType: "member",
        $authProvider: "emailpass",
        ...payload,
      })) as { token: string };

      clearSellerId();
      setAuthToken(data.token);

      return data;
    },
    onSuccess: async (data, variables, context) => {
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useSignUpWithEmailPass = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.auth.$actorType.$authProvider.register.mutate>,
    ClientError,
    Omit<
      InferClientInput<
        typeof sdk.auth.$actorType.$authProvider.register.mutate
      >,
      "$actorType" | "$authProvider"
    >
  >,
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.auth.$actorType.$authProvider.register.mutate({
        $actorType: "member",
        $authProvider: "emailpass",
        ...payload,
      }),
    onSuccess: async (data, variables, context) => {
      clearSellerId();
      setAuthToken((data as { token: string }).token);

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useSignUpForInvite = (
  options?: UseMutationOptions<
    { token: string },
    ClientError,
    Omit<
      InferClientInput<
        typeof sdk.auth.$actorType.$authProvider.register.mutate
      >,
      "$actorType" | "$authProvider"
    >
  >,
) => {
  return useMutation({
    mutationFn: async (payload) => {
      const result = await sdk.auth.$actorType.$authProvider.register.mutate({
        $actorType: "member",
        $authProvider: "emailpass",
        ...payload,
      });

      return result as { token: string };
    },
    ...options,
  });
};

export const useSignInForInvite = (
  options?: UseMutationOptions<
    { token: string },
    ClientError,
    Omit<
      InferClientInput<typeof sdk.auth.$actorType.$authProvider.mutate>,
      "$actorType" | "$authProvider"
    >
  >,
) => {
  return useMutation({
    mutationFn: async (payload) => {
      const result = await sdk.auth.$actorType.$authProvider.mutate({
        $actorType: "member",
        $authProvider: "emailpass",
        ...payload,
      });

      return result as { token: string };
    },
    ...options,
  });
};

export const useResetPasswordForEmailPass = (
  options?: UseMutationOptions<
    InferClientOutput<
      typeof sdk.auth.$actorType.$authProvider.resetPassword.mutate
    >,
    ClientError,
    { email: string }
  >,
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.auth.$actorType.$authProvider.resetPassword.mutate({
        $actorType: "member",
        $authProvider: "emailpass",
        identifier: payload.email,
        metadata: {},
      }),
    onSuccess: async (data, variables, context) => {
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useLogout = (
  options?: UseMutationOptions<
    void,
    ClientError
  >,
) => {
  return useMutation({
    mutationFn: async () => {
      clearAuthToken();
      clearSellerId();
    },
    ...options,
  });
};

export const useUpdateProviderForEmailPass = (
  token: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.auth.$actorType.$authProvider.update.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.auth.$actorType.$authProvider.update.mutate>,
      "$actorType" | "$authProvider"
    >
  >,
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.auth.$actorType.$authProvider.update.mutate({
        $actorType: "member",
        $authProvider: "emailpass",
        ...payload,
        fetchOptions: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }),
    onSuccess: async (data, variables, context) => {
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
