import { getLinkQuery } from "@mercurjs/dashboard-shared";

import { sdk } from "@lib/client";
import { DEFAULT_FIELDS } from "@hooks/table/query/use-product-table-query";
import { PAGE_SIZE } from "./_components/product-list-table/product-list-data-table";

/**
 * Prefetches the first page of products so the list renders with data (passed as
 * `initialData` to the table's query). Includes any custom-fields `link`
 * relations via the shared registry, so linked columns have their data on load.
 */
export const productListLoader = async () => {
  const { fields } = getLinkQuery("product", DEFAULT_FIELDS);

  return sdk.vendor.products.query({
    limit: PAGE_SIZE,
    offset: 0,
    fields,
  } as Parameters<typeof sdk.vendor.products.query>[0]);
};
