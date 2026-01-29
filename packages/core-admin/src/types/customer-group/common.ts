import type { PaginatedResponse } from "@medusajs/types";
import type { AdminCustomerGroup } from "@medusajs/types";

export type AdminCustomerGroupListResponse = PaginatedResponse<{
  customer_groups: AdminCustomerGroup[];
}>;
