import { useQuery } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";

import { sdk } from "../../lib/client";
import { queryKeysFactory } from "../../lib/query-key-factory";
import type { ClientError } from "@mercurjs/client";

const MEMBERS_QUERY_KEY = "members" as const;
export const membersQueryKeys = queryKeysFactory(MEMBERS_QUERY_KEY);

export const useMembers = (
  query?: { q?: string; limit?: number; offset?: number; email?: string },
  options?: Omit<UseQueryOptions<any, ClientError>, "queryKey" | "queryFn">,
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.members.query(query as any),
    queryKey: membersQueryKeys.list(query ?? {}),
    ...options,
  });

  return { ...data, ...rest };
};
