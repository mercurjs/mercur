import { useQueryParams } from '@hooks/use-query-params';
import type { HttpTypes } from '@medusajs/types';

type UseUserTableQueryProps = {
  prefix?: string;
  pageSize?: number;
};

export const useUserTableQuery = (options?: UseUserTableQueryProps) => {
  const { prefix, pageSize = 20 } = options ?? {};
  const queryObject = useQueryParams(['offset', 'q', 'created_at', 'updated_at', 'order'], prefix);

  const { offset, created_at, updated_at, q, order } = queryObject;

  const searchParams: HttpTypes.AdminUserListParams = {
    limit: pageSize,
    offset: offset ? Number(offset) : 0,
    created_at: created_at ? JSON.parse(created_at) : undefined,
    updated_at: updated_at ? JSON.parse(updated_at) : undefined,
    order: order ? order : '-created_at',
    q
  };

  return {
    searchParams,
    raw: queryObject
  };
};
