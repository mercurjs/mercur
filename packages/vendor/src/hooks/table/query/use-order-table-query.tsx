import { HttpTypes } from "@medusajs/types";
import { useQueryParams } from "../../use-query-params";

type UseOrderTableQueryProps = {
  prefix?: string;
  pageSize?: number;
};

export const useOrderTableQuery = ({
  prefix,
  pageSize = 20,
}: UseOrderTableQueryProps) => {
  const queryObject = useQueryParams(
    [
      "offset",
      "q",
      "created_at",
      "updated_at",
      "request",
      "order",
      "status",
    ],
    prefix,
  );

  const {
    offset,
    created_at,
    updated_at,
    request,
    q,
    order,
    status,
  } = queryObject;

  const searchParams: HttpTypes.AdminOrderFilters & {
    request?: string[];
    status?: string[];
  } = {
    limit: pageSize,
    offset: offset ? Number(offset) : 0,
    request: request?.split(","),
    status: status?.split(","),
    created_at: created_at ? JSON.parse(created_at) : undefined,
    updated_at: updated_at ? JSON.parse(updated_at) : undefined,
    order: order ? order : "-display_id",
    q,
  };

  return {
    searchParams,
    raw: queryObject,
  };
};
