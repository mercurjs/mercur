import { useQueryParams } from "../../../../../hooks/use-query-params";

type UseCommissionRulesQueryProps = {
  prefix?: string;
  pageSize?: number;
};

/**
 * Reads the table's URL query params (search `q`, pagination `offset`, sort
 * `order`) and maps them to the commission-rates list endpoint params.
 * Without this, the Search box / Sort / pagination update the URL but the
 * query never consumes them.
 */
export const useCommissionRulesQuery = ({
  prefix,
  pageSize = 20,
}: UseCommissionRulesQueryProps = {}) => {
  const queryObject = useQueryParams(["offset", "q", "order"], prefix);
  const { offset, q, order } = queryObject;

  const searchParams = {
    limit: pageSize,
    offset: offset ? Number(offset) : 0,
    order: order || undefined,
    q: q || undefined,
  };

  return { searchParams, raw: queryObject };
};
