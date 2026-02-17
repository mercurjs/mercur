import { HttpTypes } from "@medusajs/types";
import { UIMatch } from "react-router-dom";

import { useCollection } from "@hooks/api/collections";

type CollectionDetailBreadcrumbProps =
  UIMatch<HttpTypes.AdminCollectionResponse>;

export const Breadcrumb = (props: CollectionDetailBreadcrumbProps) => {
  const { id } = props.params || {};
  const { collection } = useCollection(id!, {
    initialData: { collection: props.data?.collection },
  });

  if (!collection) return null;
  return <span>{collection.title}</span>;
};
