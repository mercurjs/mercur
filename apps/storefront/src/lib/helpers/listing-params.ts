import type { SortOptions } from '@/types/product';

export const LISTING_SORT_OPTIONS: { label: string; value: SortOptions }[] = [
  { label: 'Newest', value: 'created_at' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
];

// URL params that drive the listing itself; any other key is an attribute
// handle whose comma-separated value lists the selected attribute values.
export const RESERVED_LISTING_PARAMS = new Set([
  'query',
  'page',
  'sortBy',
  'min_price',
  'max_price',
  'seller',
]);

export type ListingParams = {
  query?: string;
  page: number;
  sortBy: SortOptions;
  minPrice?: number;
  maxPrice?: number;
  sellers: string[];
  attributes: Record<string, string[]>;
};

type RawParams =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

const readAll = (raw: RawParams): [string, string][] => {
  if (raw instanceof URLSearchParams) {
    return Array.from(raw.entries());
  }
  return Object.entries(raw).flatMap(([key, value]) =>
    value === undefined
      ? []
      : (Array.isArray(value) ? value : [value]).map(
          (entry): [string, string] => [key, entry]
        )
  );
};

const splitValues = (value: string) =>
  value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

const parsePrice = (value: string | undefined) => {
  if (!value) return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
};

const isSortOption = (value: string | undefined): value is SortOptions =>
  LISTING_SORT_OPTIONS.some((option) => option.value === value);

export const parseListingParams = (raw: RawParams): ListingParams => {
  const entries = readAll(raw);
  const first = (key: string) => entries.find(([k]) => k === key)?.[1];

  const attributes: Record<string, string[]> = {};
  for (const [key, value] of entries) {
    if (RESERVED_LISTING_PARAMS.has(key)) continue;
    const values = splitValues(value);
    if (!values.length) continue;
    attributes[key] = Array.from(new Set([...(attributes[key] ?? []), ...values]));
  }

  const sortBy = first('sortBy');

  return {
    query: first('query')?.trim() || undefined,
    page: Math.max(Number.parseInt(first('page') ?? '1', 10) || 1, 1),
    sortBy: isSortOption(sortBy) ? sortBy : 'created_at',
    minPrice: parsePrice(first('min_price')),
    maxPrice: parsePrice(first('max_price')),
    sellers: splitValues(first('seller') ?? ''),
    attributes,
  };
};

// The unfiltered first page in its default sort is the only view worth
// caching: every other combination would be a rarely reused cache entry.
export const isDefaultListing = (params: ListingParams) =>
  !params.query &&
  params.page <= 1 &&
  params.sortBy === 'created_at' &&
  params.minPrice === undefined &&
  params.maxPrice === undefined &&
  !params.sellers.length &&
  !Object.keys(params.attributes).length;

const toSearch = (params: URLSearchParams) => {
  params.delete('page');
  const query = params.toString();
  return query ? `?${query}` : '?';
};

export const toggleValueHref = (
  current: URLSearchParams,
  key: string,
  value: string
) => {
  const params = new URLSearchParams(current.toString());
  const values = splitValues(params.get(key) ?? '');
  const next = values.includes(value)
    ? values.filter((entry) => entry !== value)
    : [...values, value];
  if (next.length) {
    params.set(key, next.join(','));
  } else {
    params.delete(key);
  }
  return toSearch(params);
};

export const removeValueHref = (
  current: URLSearchParams,
  key: string,
  value?: string
) => {
  const params = new URLSearchParams(current.toString());
  if (value === undefined) {
    params.delete(key);
    return toSearch(params);
  }
  const next = splitValues(params.get(key) ?? '').filter((entry) => entry !== value);
  if (next.length) {
    params.set(key, next.join(','));
  } else {
    params.delete(key);
  }
  return toSearch(params);
};

export const withPriceHref = (
  current: URLSearchParams,
  min: number | null,
  max: number | null
) => {
  const params = new URLSearchParams(current.toString());
  if (min === null) params.delete('min_price');
  else params.set('min_price', String(min));
  if (max === null) params.delete('max_price');
  else params.set('max_price', String(max));
  return toSearch(params);
};

export const withSortHref = (current: URLSearchParams, sortBy: SortOptions) => {
  const params = new URLSearchParams(current.toString());
  if (sortBy === 'created_at') params.delete('sortBy');
  else params.set('sortBy', sortBy);
  return toSearch(params);
};

export const clearFiltersHref = (current: URLSearchParams) => {
  const params = new URLSearchParams();
  const query = current.get('query');
  if (query) params.set('query', query);
  return toSearch(params);
};

export const isValueActive = (
  current: URLSearchParams,
  key: string,
  value: string
) => splitValues(current.get(key) ?? '').includes(value);
