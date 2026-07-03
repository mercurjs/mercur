import { useQueryParams } from "../../../../../hooks/use-query-params";

type UseCommissionRulesQueryProps = {
  prefix?: string;
  pageSize?: number;
};

/**
 * Reads the table's URL query params (search `q`, pagination `offset`, sort
 * `order`, and the Status / Type filters) and maps them to the
 * commission-rates list endpoint params. Without this, the Search box /
 * Sort / Filter controls update the URL but the query never consumes them.
 */
export const useCommissionRulesQuery = ({
  prefix,
  pageSize = 20,
}: UseCommissionRulesQueryProps = {}) => {
  const queryObject = useQueryParams(
    ["offset", "q", "order", "is_enabled", "scope_type"],
    prefix
  );
  const { offset, q, order, is_enabled, scope_type } = queryObject;

  const searchParams = {
    limit: pageSize,
    offset: offset ? Number(offset) : 0,
    order: order || undefined,
    q: q || undefined,
    is_enabled: is_enabled ? is_enabled === "true" : undefined,
    scope_type: scope_type ? scope_type.split(",") : undefined,
  };

  return { searchParams, raw: queryObject };
};
