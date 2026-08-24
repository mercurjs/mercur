import { useQuery } from "@tanstack/react-query"

import { fetchQuery } from "../../lib/client"

export type FeatureFlags = {
  view_configurations?: boolean
  translation?: boolean
  rbac?: boolean
  [key: string]: boolean | undefined
}

export const useFeatureFlags = () => {
  return useQuery<FeatureFlags>({
    queryKey: ["admin", "feature-flags"],
    queryFn: async () => {
      const response = (await fetchQuery("/admin/feature-flags", {
        method: "GET",
      })) as { feature_flags: FeatureFlags }

      return response.feature_flags
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}
