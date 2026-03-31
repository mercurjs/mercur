import {
  retrieveActiveStore,
  storeQueryKeys,
} from "../../hooks/api/store";
import { queryClient } from "../../lib/query-client";

const storeDetailQuery = () => ({
  queryKey: storeQueryKeys.details(),
  queryFn: async () => retrieveActiveStore(),
});

export const onboardingLoader = async () => {
  const query = storeDetailQuery();

  return queryClient.ensureQueryData(query);
};
