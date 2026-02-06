import { HttpTypes } from '@medusajs/types';

export interface ExtendedPriceListPrice extends HttpTypes.AdminPriceListPrice {
  price_set: {
    id: string;
    variant: {
      id: string;
    };
  };
  price_rules: Array<{
    attribute: string;
    value: string | number;
  }>;
}

export interface ExtendedPriceList extends Omit<HttpTypes.AdminPriceList, 'prices'> {
  prices?: ExtendedPriceListPrice[];
  price_list_rules?: Array<{
    value: string[];
    attribute: string;
  }>;
}

export interface PriceListData {
  price_list_id: string;
  price_list: ExtendedPriceList;
}

export interface PriceListListResponse {
  price_lists: ExtendedPriceList[];
  count: number;
  offset: number;
  limit: number;
}
