import { LoaderFunctionArgs } from "react-router-dom";

import { getLinkQuery } from "@mercurjs/dashboard-shared";
import { sdk } from "@lib/client";
import { queryClient } from "@lib/query-client";

import { customerGroupsQueryKeys } from "@hooks/api/customer-groups";
import { CUSTOMER_GROUP_DETAIL_FIELDS } from "./constants";

const customerGroupDetailQuery = (id: string) => {
  const query = getLinkQuery("customer_group", CUSTOMER_GROUP_DETAIL_FIELDS);
  return {
    queryKey: customerGroupsQueryKeys.detail(id, query),
    queryFn: async () =>
      sdk.vendor.customerGroups.$id.query({
        $id: id,
        ...query,
      }),
  };
};

export const customerGroupLoader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id;
  const query = customerGroupDetailQuery(id!);

  return queryClient.ensureQueryData(query);
};
