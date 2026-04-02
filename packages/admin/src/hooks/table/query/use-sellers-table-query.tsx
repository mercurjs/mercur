import { useQueryParams } from "@hooks/use-query-params";

type UseSellersTableQueryProps = {
  prefix?: string;
  pageSize?: number;
};

export const useSellersTableQuery = ({
  prefix,
  pageSize = 20,
}: UseSellersTableQueryProps) => {
  const queryObject = useQueryParams(
    ["offset", "q", "created_at", "updated_at", "status", "is_premium", "order"],
    prefix,
  );

  const { offset, created_at, updated_at, status, is_premium, q, order } = queryObject;

  const searchParams: Record<string, string | number | string[] | boolean | undefined> = {
    limit: pageSize,
    offset: offset ? Number(offset) : 0,
    created_at: created_at ? JSON.parse(created_at) : undefined,
    updated_at: updated_at ? JSON.parse(updated_at) : undefined,
    status: status?.split(","),
    is_premium: is_premium ? is_premium === "true" : undefined,
    q,
    order: order ? order : undefined,
  };

  return {
    searchParams,
    raw: queryObject,
  };
};
