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
    ["offset", "q", "status", "rating", "created_at", "updated_at", "order"],
    prefix,
  );

  const { offset, status, rating, created_at, updated_at, q, order } =
    queryObject;

  const searchParams: Record<string, unknown> = {
    limit: pageSize,
    offset: offset ? Number(offset) : 0,
    status: status ? status.split(",") : undefined,
    rating: rating ? rating.split(",").map(Number) : undefined,
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
