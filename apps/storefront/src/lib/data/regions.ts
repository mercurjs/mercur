'use cache';

import { HttpTypes } from '@mercurjs/types';
import { cacheLife, cacheTag } from 'next/cache';

import { CACHE_TAGS, regionTag } from '../cache/cache-tags';
import { EXPIRE, REVALIDATE } from '../cache/constants';
import { sdk } from '../config';

export const listRegions = async () => {
  cacheTag(CACHE_TAGS.regions);
  cacheLife({ revalidate: REVALIDATE, expire: EXPIRE });

  return sdk.client
    .fetch<{ regions: HttpTypes.StoreRegion[] }>(`/store/regions`, {
      method: 'GET'
    })
    .then(({ regions }) => regions)
    .catch(() => [] as HttpTypes.StoreRegion[]);
};

export const retrieveRegion = async (id: string) => {
  cacheTag(CACHE_TAGS.regions, regionTag(id));
  cacheLife({ revalidate: REVALIDATE, expire: EXPIRE });

  return sdk.client
    .fetch<{ region: HttpTypes.StoreRegion }>(`/store/regions/${id}`, {
      method: 'GET'
    })
    .then(({ region }) => region)
    .catch(() => null);
};

export const getRegion = async (countryCode: string) => {
  cacheTag(CACHE_TAGS.regions);
  cacheLife({ revalidate: REVALIDATE, expire: EXPIRE });

  const regions = await listRegions();

  if (!regions.length) {
    return null;
  }

  const regionMap = new Map<string, HttpTypes.StoreRegion>();

  regions.forEach(region => {
    region.countries?.forEach(c => {
      if (c?.iso_2) {
        regionMap.set(c.iso_2, region);
      }
    });
  });

  return (countryCode ? regionMap.get(countryCode) : regionMap.get('us')) ?? null;
};
