import { HttpTypes } from "@mercurjs/types";
import { UIMatch } from "react-router-dom";

import { useOrder } from "@hooks/api/orders";

import { DEFAULT_FIELDS } from "./constants";

type OrderDetailBreadcrumbProps = UIMatch<HttpTypes.VendorOrderResponse>;

export const Breadcrumb = (props: OrderDetailBreadcrumbProps) => {
  const { id } = props.params || {};

  const { order } = useOrder(
    id!,
    {
      fields: DEFAULT_FIELDS,
    },
    {
      initialData: props.data,
      enabled: Boolean(id),
    },
  );

  if (!order) {
    return null;
  }

  return <span>#{order.display_id}</span>;
};
