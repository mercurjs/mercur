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
    ["offset", "q", "status", "rating", "customer_id", "created_at", "order"],
    prefix,
  );

  const { offset, status, rating, customer_id, created_at, q, order } =
    queryObject;

  const searchParams: Record<string, unknown> = {
    limit: pageSize,
    offset: offset ? Number(offset) : 0,
    status: status ? status.split(",") : undefined,
    rating: rating ? rating.split(",").map(Number) : undefined,
    customer_id: customer_id ? customer_id.split(",") : undefined,
    created_at: created_at ? JSON.parse(created_at) : undefined,
    order: order ? order : "-display_id",
    q,
  };

  return {
    searchParams,
    raw: queryObject,
  };
};
