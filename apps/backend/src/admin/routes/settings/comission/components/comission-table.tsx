import { DataTable } from "../../../../admin/components";
import { useDataTable } from "../../../../admin/hooks";
import { useQuotes } from "../../../../admin/hooks/api";
import { useQuotesTableColumns } from "./table/columns";
import { useQuotesTableFilters } from "./table/filters";
import { useQuotesTableQuery } from "./table/query";

const PAGE_SIZE = 50;
const PREFIX = "quo";

export const ComissionTable = () => {
  const { searchParams, raw } = useQuotesTableQuery({
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  });

  const {
    quotes = [],
    count,
    isPending,
  } = useQuotes({
    ...searchParams,
    fields:
      "+draft_order.total,+draft_order.customer.email,*draft_order.customer.employee.company",
    order: "-created_at",
  });

  const columns = useQuotesTableColumns();
  const filters = useQuotesTableFilters();

  const { table } = useDataTable({
    data: quotes,
    columns,
    enablePagination: true,
    count,
    pageSize: PAGE_SIZE,
  });

  return (
    <div className="flex size-full flex-col overflow-hidden">
      <DataTable
        columns={columns}
        table={table}
        pagination
        navigateTo={(row) => `/quotes/${row.original.id}`}
        filters={filters}
        count={count}
        search
        isLoading={isPending}
        pageSize={PAGE_SIZE}
        orderBy={["id", "created_at"]}
        queryObject={raw}
        noRecords={{
          title: "No quotes found",
          message:
            "There are currently no quotes. Create one from the storefront.",
        }}
      />
    </div>
  );
};
