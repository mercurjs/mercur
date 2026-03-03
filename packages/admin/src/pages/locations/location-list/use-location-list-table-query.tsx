import { useQueryParams } from "../../../hooks/use-query-params";
import { InferClientInput } from "@mercurjs/client";
import { sdk } from "@/lib/client";

export const useLocationListTableQuery = ({
  pageSize = 20,
  prefix,
}: {
  pageSize?: number;
  prefix?: string;
}) => {
  const queryObject = useQueryParams(["order", "offset", "q"], prefix);

  const { offset, ...rest } = queryObject;

  const searchParams: InferClientInput<typeof sdk.admin.stockLocations.query> =
    {
      limit: pageSize,
      offset: offset ? Number(offset) : 0,
      ...rest,
    };

  return searchParams;
};
