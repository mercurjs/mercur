import { defineRouteConfig } from "@medusajs/admin-sdk";
import {
  Container,
  Heading,
  Button,
  DataTable,
  useDataTable,
  DataTablePaginationState,
} from "@medusajs/ui";
import { ListBullet } from "@medusajs/icons";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SingleColumnLayout } from "../../layouts/single-column";
import { useAttributeTableColumns } from "../../hooks/table/columns/use-attribute-table-columns";

import { AttributeDTO } from "../../../modules/attribute/types";
import { useAttributes } from "../../hooks/api/attributes";

const AttributesPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { attributes, count, isLoading } = useAttributes({
    limit: pageSize,
    offset: (page - 1) * pageSize,
  })

  const columns = useAttributeTableColumns()

  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageIndex: page - 1,
    pageSize,
  });

  const [search, setSearch] = useState("");

  const table = useDataTable({
    columns,
    data: attributes || [],
    getRowId: (attribute: AttributeDTO) => attribute.id,
    rowCount: count || 0,
    isLoading,
    pagination: {
      state: pagination,
      onPaginationChange: (newPagination) => {
        setPagination(newPagination);
        setPage(newPagination.pageIndex + 1);
      },
    },
    search: {
      state: search,
      onSearchChange: setSearch,
    },
    onRowClick: (_event, row: AttributeDTO) => {
      navigate(`/attributes/${row.id}`);
    },
  });

  return (
    <SingleColumnLayout>
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">Product Attributes</Heading>
          <Button
            variant="secondary"
            size="small"
            onClick={() => navigate("/attributes/create")}
          >
            Create
          </Button>
        </div>

        <div>
          <DataTable instance={table}>
            <DataTable.Toolbar className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
              <DataTable.Search placeholder="Search attributes..." />
            </DataTable.Toolbar>
            <DataTable.Table />
            <DataTable.Pagination />
          </DataTable>
        </div>
      </Container>
    </SingleColumnLayout>
  );
};

export const config = defineRouteConfig({
  label: "Attributes",
  icon: ListBullet,
});

export default AttributesPage;
