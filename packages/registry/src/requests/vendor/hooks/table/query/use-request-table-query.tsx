import { useQueryParams } from "@mercurjs/dashboard-shared";

type UseRequestTableQueryProps = {
  prefix?: string;
  pageSize?: number;
};

export const useRequestTableQuery = ({
  prefix,
  pageSize = 20,
}: UseRequestTableQueryProps) => {
  const queryObject = useQueryParams(
    ["offset", "q", "created_at", "updated_at", "order", "request_status"],
    prefix,
  );

  const { offset, created_at, updated_at, q, order, request_status } = queryObject;

  const searchParams: Record<string, any> = {
    limit: pageSize,
    offset: offset ? Number(offset) : 0,
    created_at: created_at ? JSON.parse(created_at) : undefined,
    updated_at: updated_at ? JSON.parse(updated_at) : undefined,
    order: order ? order : "-created_at",
    request_status: request_status || undefined,
    q,
  };

  return {
    searchParams,
    raw: queryObject,
  };
};
