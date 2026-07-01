'use server';

import { HttpTypes } from '@mercurjs/types';

import { SellerProps } from '@/types/seller';

import { sdk } from '../config';
import { getAuthHeaders } from './cookies';
import { retrieveCustomer } from './customer';
import { getRegion } from './regions';

export const searchProducts = async (params: {
  query?: string;
  page?: number;
  hitsPerPage?: number;
  filters?: string;
  facets?: string[];
  maxValuesPerFacet?: number;
  currency_code?: string;
  countryCode?: string;
  region_id?: string;
  customer_id?: string;
  customer_group_id?: string[];
}): Promise<{
  products: (HttpTypes.StoreProduct & { seller?: SellerProps })[];
  nbHits: number;
  page: number;
  nbPages: number;
  hitsPerPage: number;
  facets: Record<string, any>;
  processingTimeMS: number;
}> => {
  if (!params.countryCode && !params.region_id) {
    throw new Error('Country code or region ID is required');
  }

  let region_id = params.region_id;

  if (!region_id && params.countryCode) {
    const region = await getRegion(params.countryCode);
    if (!region) {
      throw new Error(`Region not found for country code: ${params.countryCode}`);
    }
    region_id = region.id;
  }

  const headers = {
    ...(await getAuthHeaders())
  };

  let customer_id = params.customer_id;

  if (!customer_id) {
    const customer = await retrieveCustomer();
    if (customer) {
      customer_id = customer.id;
    }
  }

  let facets = params.facets;

  if (!facets) {
    facets = ['variants.condition', 'variants.color', 'variants.size'];
  }

  const { countryCode, ...bodyParams } = params;

  return sdk.client
    .fetch<{
      products: (HttpTypes.StoreProduct & { seller?: SellerProps })[];
      nbHits: number;
      page: number;
      nbPages: number;
      hitsPerPage: number;
      facets: Record<string, any>;
      processingTimeMS: number;
    }>(`/store/products/search`, {
      method: 'POST',
      body: {
        ...bodyParams,
        region_id,
        customer_id,
        facets,
        maxValuesPerFacet: 100
      },
      headers,
      cache: 'no-cache'
    })
    .then(response => {
      return response;
    })
    .catch(() => {
      return {
        products: [],
        nbHits: 0,
        page: params.page || 0,
        nbPages: 0,
        hitsPerPage: params.hitsPerPage || 12,
        facets: {},
        processingTimeMS: 0
      };
    });
};
