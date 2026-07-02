'use server';

import type { SearchDoc, SearchFacets } from '@mercurjs/types';

import { sdk } from '../config';
import { getAuthHeaders } from './cookies';
import { getRegion } from './regions';

export type SearchCatalogFilters = {
  type?: 'product' | 'offer';
  collection_ids?: string[];
  category_ids?: string[];
  seller_handle?: string;
  attributes?: Record<string, string[]>;
};

export type SearchCatalogResult = {
  hits: SearchDoc[];
  count: number;
  limit: number;
  offset: number;
  facets?: SearchFacets;
};

export const searchCatalog = async (params: {
  query?: string;
  page?: number;
  hitsPerPage?: number;
  filters?: SearchCatalogFilters;
  countryCode?: string;
  region_id?: string;
}): Promise<SearchCatalogResult> => {
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

  const limit = params.hitsPerPage ?? 12;
  const offset = Math.max(params.page ?? 0, 0) * limit;

  const headers = {
    ...(await getAuthHeaders())
  };

  return sdk.client
    .fetch<SearchCatalogResult>(`/store/search`, {
      method: 'POST',
      body: {
        q: params.query,
        limit,
        offset,
        region_id,
        country_code: params.countryCode,
        filters: params.filters
      },
      headers,
      cache: 'no-cache'
    })
    .then((response) => response)
    .catch(() => ({
      hits: [],
      count: 0,
      limit,
      offset,
      facets: undefined
    }));
};
