import { CustomerGroupData } from "../routes/orders/common/customerGroupFiltering"

export interface CustomerGroupListResponse {
  customer_groups: CustomerGroupData[]
  count: number
  offset: number
  limit: number
}
