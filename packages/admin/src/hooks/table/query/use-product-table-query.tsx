import type { ProductStatus } from "@mercurjs/types";
import { useLinkQuery } from "@mercurjs/dashboard-shared";
import { useQueryParams } from "@hooks/use-query-params";

type UseProductTableQueryProps = {
  prefix?: string;
  pageSize?: number;
};

const DEFAULT_FIELDS =
  "id,title,handle,status,*collection,*categories,variants.id,thumbnail";

export const useProductTableQuery = ({
  prefix,
  pageSize = 20,
}: UseProductTableQueryProps) => {
  const linkQuery = useLinkQuery("product", DEFAULT_FIELDS);
  const queryObject = useQueryParams(
    [
      "offset",
      "order",
      "q",
      "created_at",
      "updated_at",
      "category_id",
      "collection_id",
      "tag_id",
      "type_id",
      "status",
      "id",
    ],
    prefix,
  );

  const {
    offset,
    created_at,
    updated_at,
    category_id,
    collection_id,
    tag_id,
    type_id,
    status,
    order,
    q,
  } = queryObject;

  const searchParams = {
    limit: pageSize,
    offset: offset ? Number(offset) : 0,
    created_at: created_at ? JSON.parse(created_at) : undefined,
    updated_at: updated_at ? JSON.parse(updated_at) : undefined,
    category_id: category_id?.split(","),
    collection_id: collection_id?.split(","),
    order: order ?? "-title",
    tag_id: tag_id ? tag_id.split(",") : undefined,
    type_id: type_id?.split(","),
    status: status?.split(",") as ProductStatus[],
    q,
    fields: linkQuery.fields,
  };

  return {
    searchParams,
    raw: queryObject,
  };
};
