import { ClientError, InferClientOutput } from "@mercurjs/client";
import { UseQueryOptions, useQuery } from "@tanstack/react-query";
import { sdk } from "../../lib/client";
import { queryKeysFactory } from "../../lib/query-key-factory";

const MEMBERS_QUERY_KEY = "members" as const;
export const membersQueryKeys = {
  ...queryKeysFactory(MEMBERS_QUERY_KEY),
  me: () => [MEMBERS_QUERY_KEY, "me"],
};

export const useMe = (
  options?: UseQueryOptions<
    any,
    ClientError,
    InferClientOutput<typeof sdk.vendor.members.me.query>
  >,
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.vendor.members.me.query(),
    queryKey: membersQueryKeys.me(),
    ...options,
  });

  return {
    ...data,
    ...rest,
  };
};
