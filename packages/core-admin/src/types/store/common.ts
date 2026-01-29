export interface AdminStore {
  id: string;
  name: string;
  supported_currencies: { currency_code: string }[];
  default_sales_channel_id: string;
  default_region_id: string;
  default_location_id: string;
  metadata: object;
  created_at: string;
  updated_at: string;
}

export interface AdminStoreListResponse {
  stores: AdminStore[];
}
