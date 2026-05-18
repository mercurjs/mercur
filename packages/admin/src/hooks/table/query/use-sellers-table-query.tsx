import { useQueryParams } from "@hooks/use-query-params";
import { SellerStatus } from "@mercurjs/types";

type UseSellersTableQueryProps = {
  prefix?: string;
  pageSize?: number;
};

const ACTIVE_STATUSES = [
  SellerStatus.OPEN,
  SellerStatus.PENDING_APPROVAL,
  SellerStatus.SUSPENDED,
];

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
    status: status?.split(",") ?? ACTIVE_STATUSES,
    is_premium: is_premium ? is_premium === "true" : undefined,
    q,
    order: order ? order : "-created_at",
  };

  return {
    searchParams,
    raw: queryObject,
  };
};
