import { useQueryParams } from "../../use-query-params";

export const useSellerOrdersTableQuery = ({
  prefix = "so",
  pageSize = 20,
}: any) => {
  const queryObject = useQueryParams(
    [
      "offset",
      "q",
      "created_at",
      "updated_at",
      "status",
      "id",
      "order",
      "region_id",
      "sales_channel_id",
      "type_id",
      "tag_id",
    ],
    prefix
  );

  const {
    offset,
    created_at,
    updated_at,
    status,
    q,
    order,
    region_id,
    sales_channel_id,
    type_id,
    tag_id,
  } = queryObject;

  const searchParams: any = {
    limit: pageSize,
    offset: offset ? Number(offset) : 0,
    created_at: created_at ? JSON.parse(created_at) : undefined,
    updated_at: updated_at ? JSON.parse(updated_at) : undefined,
    status: status?.split(","),
    q,
    fields: "id,email,name,created_at,status",
    order: order ? order : undefined,
    region_id: region_id ? region_id.split(",") : undefined,
    sales_channel_id: sales_channel_id
      ? sales_channel_id.split(",")
      : undefined,
    type_id: type_id ? type_id.split(",") : undefined,
    tag_id: tag_id ? tag_id.split(",") : undefined,
  };

  return {
    searchParams,
    raw: queryObject,
  };
};
