import { defineRouteConfig } from "@medusajs/admin-sdk";
import {
  Container,
  Heading,
  Button,
  DataTable,
  useDataTable,
  DataTablePaginationState,
  Badge,
  DropdownMenu,
  IconButton,
} from "@medusajs/ui";
import { ListBullet, XMark, DescendingSorting } from "@medusajs/icons";
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SingleColumnLayout } from "../../layouts/single-column";
import { useAttributeTableColumns } from "../../hooks/table/columns/use-attribute-table-columns";

import { AttributeDTO } from "@mercurjs/framework";
import { useAttributes } from "../../hooks/api/attributes";

const AttributesPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Filter state
  const [filters, setFilters] = useState<{
    filterable?: boolean;
    global?: boolean;
  }>({});

  // Sorting state
  const [sorting, setSorting] = useState<{
    field: 'name' | 'created_at' | 'updated_at' | null;
    order: 'asc' | 'desc';
  }>({
    field: null,
    order: 'asc'
  });

  // Fetch all attributes for client-side filtering and sorting
  const { attributes: allAttributes, isLoading } = useAttributes({
    limit: 1000, // Get all records
    offset: 0,
    fields: "id,name,description,handle,ui_component,is_filterable,is_required,product_categories.id,product_categories.name,possible_values.*,created_at,updated_at",
  })

  const { columns, modal } = useAttributeTableColumns()

  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageIndex: page - 1,
    pageSize,
  });

  const [search, setSearch] = useState("");

  useEffect(() => {
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, [search]);

  const addFilter = (key: 'filterable' | 'global', value: boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  };

  const removeFilter = (key: 'filterable' | 'global') => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  };

  const clearAllFilters = () => {
    setFilters({});
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  };

  const handleSortFieldChange = (field: 'name' | 'created_at' | 'updated_at') => {
    setSorting(prev => ({
      ...prev,
      field: prev.field === field ? null : field
    }));
  };

  const handleSortOrderChange = (order: 'asc' | 'desc') => {
    setSorting(prev => ({ ...prev, order }));
  };

  // Client-side filtering and sorting logic
  const processedAttributes = useMemo(() => {
    if (!allAttributes) return [];

    let filtered = [...allAttributes];

    if (filters.filterable !== undefined) {
      filtered = filtered.filter(attr => attr.is_filterable === filters.filterable);
    }

    if (filters.global !== undefined) {
      filtered = filtered.filter(attr => {
        const isGlobal = !attr.product_categories?.length;
        return isGlobal === filters.global;
      });
    }

    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(attr =>
        attr.name?.toLowerCase().includes(searchLower) ||
        attr.description?.toLowerCase().includes(searchLower)
      );
    }

    if (sorting.field) {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sorting.field) {
          case 'name':
            aValue = (a.name || '').toLowerCase().trim();
            bValue = (b.name || '').toLowerCase().trim();
            break;
          case 'created_at':
            aValue = (a.created_at || '').trim();
            bValue = (b.created_at || '').trim();
            break;
          case 'updated_at':
            aValue = (a.updated_at || '').trim();
            bValue = (b.updated_at || '').trim();
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sorting.order === 'asc' ? -1 : 1;
        if (aValue > bValue) return sorting.order === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [allAttributes, filters, search, sorting]);

  // Pagination logic
  const paginatedAttributes = useMemo(() => {
    const startIndex = pagination.pageIndex * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return processedAttributes.slice(startIndex, endIndex);
  }, [processedAttributes, pagination]);

  const table = useDataTable({
    columns,
    data: paginatedAttributes || [],
    getRowId: (attribute: AttributeDTO) => attribute.id,
    rowCount: processedAttributes.length,
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
            variant="primary"
            size="small"
            onClick={() => navigate("/attributes/create")}
          >
            Create
          </Button>
        </div>

        <div>
          <DataTable instance={table}>
            <DataTable.Toolbar className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
              <div className="flex flex-wrap items-center gap-2">
                {/* Active Filters */}
                {filters.filterable !== undefined && (
                  <Badge size="small" className="flex items-center gap-1 bg-ui-bg-subtle text-ui-fg-subtle">
                    Filterable
                    <DropdownMenu>
                      <DropdownMenu.Trigger asChild>
                        <button className="hover:bg-ui-bg-subtle-hover px-2 h-7 border border-ui-border-base">
                          {filters.filterable ? "Yes" : "No"}
                        </button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Content align="start">
                        <DropdownMenu.Item onClick={() => addFilter('filterable', true)}>
                          {filters.filterable === true ? <span className="mr-2">•</span> : <span className="ml-4" />}
                          Yes
                        </DropdownMenu.Item>
                        <DropdownMenu.Item onClick={() => addFilter('filterable', false)}>
                          {filters.filterable === false ? <span className="mr-2">•</span> : <span className="ml-4" />}
                          No
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu>
                    <button
                      onClick={() => removeFilter('filterable')}
                      className="hover:bg-ui-bg-subtle-hover px-2 h-7 border border-ui-border-base bg-ui-bg-subtle flex items-center justify-center rounded-e-md border-x-0 -ml-1 -mr-2"
                    >
                      <XMark />
                    </button>
                  </Badge>
                )}
                {filters.global !== undefined && (
                  <Badge size="small" className="flex items-center gap-1 bg-ui-bg-subtle text-ui-fg-subtle">
                    Global
                    <DropdownMenu>
                      <DropdownMenu.Trigger asChild>
                        <button className="hover:bg-ui-bg-subtle-hover px-2 h-7 border border-ui-border-base">
                          {filters.global ? "Yes" : "No"}
                        </button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Content align="start">
                        <DropdownMenu.Item onClick={() => addFilter('global', true)}>
                          {filters.global === true ? <span className="mr-2">•</span> : <span className="ml-4" />}
                          Yes
                        </DropdownMenu.Item>
                        <DropdownMenu.Item onClick={() => addFilter('global', false)}>
                          {filters.global === false ? <span className="mr-2">•</span> : <span className="ml-4" />}
                          No
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu>
                    <button
                      onClick={() => removeFilter('global')}
                      className="hover:bg-ui-bg-subtle-hover px-2 h-7 border border-ui-border-base bg-ui-bg-subtle flex items-center justify-center rounded-e-md border-x-0 -ml-1 -mr-2"
                    >
                      <XMark />
                    </button>
                  </Badge>
                )}

                {/* Add Filter Button */}
                <DropdownMenu>
                  <DropdownMenu.Trigger asChild disabled={filters.filterable !== undefined && filters.global !== undefined}>
                    <Button
                      variant="secondary"
                      size="small"
                      disabled={filters.filterable !== undefined && filters.global !== undefined}
                    >
                      Add filter
                    </Button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content align="start">
                    {filters.filterable === undefined && (
                      <DropdownMenu.Item onClick={() => addFilter('filterable', true)}>
                        Filterable
                      </DropdownMenu.Item>
                    )}
                    {filters.global === undefined && (
                      <DropdownMenu.Item onClick={() => addFilter('global', true)}>
                        Global
                      </DropdownMenu.Item>
                    )}
                  </DropdownMenu.Content>
                </DropdownMenu>

                {/* Clear All Button */}
                {Object.keys(filters).length > 0 && (
                  <Button
                    className="text-ui-fg-muted hover:text-ui-fg-subtle"
                    variant="transparent"
                    size="small"
                    onClick={clearAllFilters}
                  >
                    Clear all
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <DataTable.Search placeholder="Search table" />

                {/* Sorting Dropdown */}
                <DropdownMenu>
                  <DropdownMenu.Trigger asChild>
                    <IconButton size="small">
                      <DescendingSorting />
                    </IconButton>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content align="end">
                    <div className="px-2 py-1">
                      <DropdownMenu.Item onClick={() => handleSortFieldChange('name')}>
                        {sorting.field === 'name' ? <span className="mr-2">•</span> : <span className="ml-4" />}
                        Name
                      </DropdownMenu.Item>
                      <DropdownMenu.Item onClick={() => handleSortFieldChange('created_at')}>
                        {sorting.field === 'created_at' ? <span className="mr-2">•</span> : <span className="ml-4" />}
                        Created At
                      </DropdownMenu.Item>
                      <DropdownMenu.Item onClick={() => handleSortFieldChange('updated_at')}>
                        {sorting.field === 'updated_at' ? <span className="mr-2">•</span> : <span className="ml-4" />}
                        Updated At
                      </DropdownMenu.Item>
                    </div>
                    <DropdownMenu.Separator />
                    <div className="px-2 py-1">
                      <DropdownMenu.Item onClick={() => handleSortOrderChange('asc')}>
                        {sorting.order === 'asc' ? <span className="mr-2">•</span> : <span className="ml-4" />}
                        Ascending (1 → 30)
                      </DropdownMenu.Item>
                      <DropdownMenu.Item onClick={() => handleSortOrderChange('desc')}>
                        {sorting.order === 'desc' ? <span className="mr-2">•</span> : <span className="ml-4" />}
                        Descending (30 → 1)
                      </DropdownMenu.Item>
                    </div>
                  </DropdownMenu.Content>
                </DropdownMenu>
              </div>
            </DataTable.Toolbar>
            <DataTable.Table />
            <DataTable.Pagination />
          </DataTable>
        </div>
      </Container>
      {modal}
    </SingleColumnLayout>
  );
};

export const config = defineRouteConfig({
  label: "Attributes",
  icon: ListBullet,
});

export default AttributesPage;
