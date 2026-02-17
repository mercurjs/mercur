import { HttpTypes } from "@medusajs/types";
import { UIMatch } from "react-router-dom";

import { usePriceList } from "@hooks/api/price-lists";

type PriceListDetailBreadcrumbProps = UIMatch<HttpTypes.AdminPriceListResponse>;

export const Breadcrumb = (props: PriceListDetailBreadcrumbProps) => {
  const { id } = props.params || {};

  const { price_list } = usePriceList(id!, undefined, {
    initialData: props.data,
    enabled: Boolean(id),
  });

  if (!price_list) {
    return null;
  }

  return <span>{price_list.title}</span>;
};
