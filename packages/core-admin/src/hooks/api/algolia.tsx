import { sdk } from "@lib/client";
import { queryKeysFactory } from "@lib/query-key-factory";
import { useMutation, useQuery } from "@tanstack/react-query";

import type { AlgoliaStatus } from "@custom-types/algolia";

export const algoliaQueryKeys = queryKeysFactory("algolia");

export const useSyncAlgolia = () => {
  return useMutation({
    mutationFn: () =>
      sdk.client.fetch("/admin/algolia", {
        method: "POST",
      }),
  });
};

export const useAlgolia = () => {
  return useQuery<AlgoliaStatus>({
    queryKey: ["algolia"],
    queryFn: () => sdk.client.fetch("/admin/algolia", { method: "GET" }),
  });
};
