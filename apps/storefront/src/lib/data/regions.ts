import { HttpTypes } from '@medusajs/types';
import { cacheLife, cacheTag } from 'next/cache';

import medusaError from '@/lib/helpers/medusa-error';

import { sdk } from '../client';
import { CACHE_TAGS, cacheFailedRead } from './cache-tags';

export const listRegions = async (): Promise<HttpTypes.StoreRegion[]> => {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.regions);

  return sdk.store.regions
    .query({ fetchOptions: { cache: 'no-store' } })
    .then(({ regions }) => regions)
    .catch(() => {
      cacheFailedRead();
      return [] as HttpTypes.StoreRegion[];
    });
};

export const retrieveRegion = async (id: string) => {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.regions);

  return sdk.store.regions.$id
    .query({ $id: id, fetchOptions: { cache: 'no-store' } })
    .then(({ region }) => region)
    .catch(medusaError);
};

export const getRegion = async (countryCode: string) => {
  try {
    const regions = await listRegions();

    const regionMap = new Map<string, HttpTypes.StoreRegion>();
    regions.forEach(region => {
      region.countries?.forEach(c => {
        regionMap.set(c?.iso_2 ?? '', region);
      });
    });

    return regionMap.get(countryCode) ?? regionMap.get('us');
  } catch (e) {
    return null;
  }
};

export const listCountryCodes = async (): Promise<string[]> => {
  const regions = await listRegions().catch(() => [] as HttpTypes.StoreRegion[]);
  return regions.flatMap(region =>
    (region.countries ?? []).map(country => country.iso_2).filter((code): code is string => !!code)
  );
};
