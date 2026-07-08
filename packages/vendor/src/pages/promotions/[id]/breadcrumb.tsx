import { HttpTypes } from "@medusajs/types";
import { useLinkQuery } from "@mercurjs/dashboard-shared";
import { UIMatch } from "react-router-dom";

import { usePromotion } from "@hooks/api/promotions";

type PromotionDetailBreadcrumbProps = UIMatch<HttpTypes.AdminPromotionResponse>;

export const Breadcrumb = (props: PromotionDetailBreadcrumbProps) => {
  const { id } = props.params || {};
  const linkQuery = useLinkQuery("promotion", "+status");
  const { promotion } = usePromotion(id!, linkQuery, {
    initialData: props.data,
    enabled: Boolean(id),
  });
  if (!promotion) return null;
  return <span>{promotion.code}</span>;
};
