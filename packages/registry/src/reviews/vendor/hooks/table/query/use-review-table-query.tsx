import { useQueryParams } from "@mercurjs/dashboard-shared";

type UseReviewTableQueryProps = {
  prefix?: string;
  pageSize?: number;
};

export const useReviewTableQuery = ({
  prefix,
  pageSize = 20,
}: UseReviewTableQueryProps) => {
  const queryObject = useQueryParams(
    ["offset", "q", "created_at", "updated_at", "order"],
    prefix,
  );

  const { offset, created_at, updated_at, q, order } = queryObject;

  const searchParams: Record<string, any> = {
    limit: pageSize,
    offset: offset ? Number(offset) : 0,
    created_at: created_at ? JSON.parse(created_at) : undefined,
    updated_at: updated_at ? JSON.parse(updated_at) : undefined,
    order: order ? order : "-created_at",
    q,
  };

  return {
    searchParams,
    raw: queryObject,
  };
};
