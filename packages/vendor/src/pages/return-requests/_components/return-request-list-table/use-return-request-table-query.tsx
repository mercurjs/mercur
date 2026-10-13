import { useQueryParams } from "@mercurjs/dashboard-shared";

type UseReturnRequestTableQueryProps = {
  prefix?: string;
  pageSize?: number;
};

export const useReturnRequestTableQuery = ({
  prefix,
  pageSize = 20,
}: UseReturnRequestTableQueryProps) => {
  const queryObject = useQueryParams(
    ["offset", "status", "order_id", "created_at", "order"],
    prefix,
  );

  const { offset, status, order_id, created_at, order } = queryObject;

  const searchParams = {
    limit: pageSize,
    offset: offset ? Number(offset) : 0,
    status: status ? status.split(",") : undefined,
    order_id: order_id ? order_id.split(",") : undefined,
    created_at: created_at ? JSON.parse(created_at) : undefined,
    order: order ? order : "-created_at",
  };

  return {
    searchParams,
    raw: queryObject,
  };
};
