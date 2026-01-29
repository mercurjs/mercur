import { useQueryParams } from "@hooks/use-query-params";

export const useLocationLevelTableQuery = ({
  pageSize = 20,
  prefix,
}: {
  pageSize?: number;
  prefix?: string;
}) => {
  const raw = useQueryParams(
    [
      "order",
      "offset",
      "location_id",
      "stocked_quantity",
      "reserved_quantity",
      "incoming_quantity",
    ],
    prefix,
  );

  const { offset, stocked_quantity, reserved_quantity, ...rest } = raw;

  const searchParams = {
    limit: pageSize,
    offset: offset ? Number(offset) : 0,
    stocked_quantity: stocked_quantity
      ? JSON.parse(stocked_quantity)
      : undefined,
    reserved_quantity: reserved_quantity
      ? JSON.parse(reserved_quantity)
      : undefined,
    ...rest,
  };

  return { searchParams, raw };
};
