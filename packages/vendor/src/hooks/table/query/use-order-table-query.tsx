import { HttpTypes } from "@medusajs/types";

import type { Filter } from "../../../components/table/data-table";
import { useQueryParams } from "../../use-query-params";

type UseOrderTableQueryProps = {
  prefix?: string;
  pageSize?: number;
  extraFilters?: Filter[];
};

type VendorOrderFilters = HttpTypes.AdminOrderFilters & {
  status?: string[];
  customer_id?: string[];
  request?: string[];
  [key: string]: unknown;
};

const BASE_KEYS = [
  "offset",
  "q",
  "created_at",
  "updated_at",
  "region_id",
  "sales_channel_id",
  "customer_id",
  "status",
  "request",
  "order",
];

export const useOrderTableQuery = ({
  prefix,
  pageSize = 20,
  extraFilters = [],
}: UseOrderTableQueryProps) => {
  const extraKeys = extraFilters
    .map((f) => f.key)
    .filter((key) => !BASE_KEYS.includes(key));

  const queryObject = useQueryParams([...BASE_KEYS, ...extraKeys], prefix);

  const {
    offset,
    created_at,
    updated_at,
    region_id,
    sales_channel_id,
    customer_id,
    status,
    request,
    q,
    order,
  } = queryObject;

  const searchParams: VendorOrderFilters = {
    limit: pageSize,
    offset: offset ? Number(offset) : 0,
    region_id: region_id?.split(","),
    sales_channel_id: sales_channel_id?.split(","),
    customer_id: customer_id?.split(","),
    status: status?.split(","),
    request: request?.split(","),
    created_at: created_at ? JSON.parse(created_at) : undefined,
    updated_at: updated_at ? JSON.parse(updated_at) : undefined,
    order: order ? order : "-display_id",
    q,
  };

  for (const filter of extraFilters) {
    const value = queryObject[filter.key];
    if (!value || BASE_KEYS.includes(filter.key)) {
      continue;
    }
    searchParams[filter.key] =
      filter.type === "date" || filter.type === "number"
        ? JSON.parse(value)
        : filter.type === "select" && filter.multiple
          ? value.split(",")
          : value;
  }

  return {
    searchParams,
    raw: queryObject,
  };
};
