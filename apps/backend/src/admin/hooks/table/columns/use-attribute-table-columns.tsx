
import { Badge, createDataTableColumnHelper } from "@medusajs/ui";
import { useMemo } from "react";
import { AttributeDTO } from "@mercurjs/framework";


const columnHelper = createDataTableColumnHelper<AttributeDTO>();

export const useAttributeTableColumns = () => {
  return useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Name",
      }),
      columnHelper.accessor("handle", {
        header: "Handle",
      }),
      columnHelper.accessor("is_filterable", {
        header: "Filterable",
        cell: (info) => {
          return <Badge size="xsmall" color={info.getValue() ? "green" : "grey"}>{info.getValue() ? "Yes" : "No"}</Badge>;
        },
      }),
      columnHelper.accessor("product_categories", {
        header: "Global",
        cell: (info) => {
          const isGlobal = !info.getValue()?.length;
          return (
            <Badge size="xsmall" color={isGlobal ? "green" : "grey"}>
              {isGlobal ? "Yes" : "No"}
            </Badge>
          );
        },
      }),
      columnHelper.accessor("is_required", {
        header: "Required",
        cell: (info) => {
          return <Badge size="xsmall" color={info.getValue() ? "green" : "grey"}>{info.getValue() ? "Yes" : "No"}</Badge>;
        },
      }),
      columnHelper.accessor("possible_values", {
        header: "Possible Values",
        cell: (info) => {
          const values = info.getValue();
          return (
            <div className="flex flex-wrap gap-2">
              {values?.map((value) => (
                <Badge size="xsmall" key={value.id}>
                  {value.value}
                </Badge>
              )) || "-"}
            </div>
          );
        },
      }),
    ],
    []
  );
};
