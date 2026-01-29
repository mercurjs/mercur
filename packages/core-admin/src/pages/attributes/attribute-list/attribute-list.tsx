import { useEffect, useMemo, useState } from 'react';

import { DataTableTableWithTestIds } from '@components/data-table/components/data-table-table-with-test-ids';
import { SingleColumnLayout } from '@components/layout/single-column';
import { useAttributes } from '@hooks/api/attributes.tsx';
import { useAttributeTableColumns } from '@hooks/table/columns/use-attribute-table-columns.tsx';
import { DescendingSorting, XMark } from '@medusajs/icons';
import {
  Badge,
  Button,
  Container,
  DataTable,
  DropdownMenu,
  Heading,
  IconButton,
  useDataTable,
  type DataTablePaginationState
} from '@medusajs/ui';
import { useNavigate } from 'react-router-dom';

import type { AttributeDTO } from '@/types';

export const AttributeList = () => {
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
    fields:
      'id,name,description,handle,ui_component,is_filterable,is_required,product_categories.id,product_categories.name,possible_values.*,created_at,updated_at'
  });

  const { columns, modal } = useAttributeTableColumns();

  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageIndex: page - 1,
    pageSize
  });

  const [search, setSearch] = useState('');

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
      filtered = filtered.filter(
        attr =>
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
      onPaginationChange: newPagination => {
        setPagination(newPagination);
        setPage(newPagination.pageIndex + 1);
      }
    },
    search: {
      state: search,
      onSearchChange: setSearch
    },
    onRowClick: (_event, row: AttributeDTO) => {
      navigate(`/settings/attributes/${row.id}`);
    }
  });

  return (
    <SingleColumnLayout>
      <Container
        className="divide-y p-0"
        data-testid="attribute-list-container"
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          data-testid="attribute-list-header"
        >
          <Heading
            level="h2"
            data-testid="attribute-list-heading"
          >
            Product Attributes
          </Heading>
          <Button
            variant="secondary"
            size="small"
            onClick={() => navigate('/settings/attributes/create')}
            data-testid="attribute-list-create-button"
          >
            Create
          </Button>
        </div>

        <div data-testid="attribute-list-table-wrapper">
          <DataTable
            instance={table}
            data-testid="attribute-list-table"
          >
            <DataTable.Toolbar
              className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center"
              data-testid="attribute-list-table-toolbar"
            >
              <div className="flex flex-wrap items-center gap-2">
                {/* Active Filters */}
                {filters.filterable !== undefined && (
                  <Badge
                    size="small"
                    className="flex items-center gap-1 bg-ui-bg-subtle text-ui-fg-subtle"
                    data-testid="attribute-list-filterable-badge"
                  >
                    Filterable
                    <DropdownMenu>
                      <DropdownMenu.Trigger asChild>
                        <button
                          className="h-7 border border-ui-border-base px-2 hover:bg-ui-bg-subtle-hover"
                          data-testid="attribute-list-filterable-dropdown-trigger"
                        >
                          {filters.filterable ? 'Yes' : 'No'}
                        </button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Content
                        align="start"
                        data-testid="attribute-list-filterable-dropdown-content"
                      >
                        <DropdownMenu.Item
                          onClick={() => addFilter('filterable', true)}
                          data-testid="attribute-list-filterable-dropdown-yes"
                        >
                          {filters.filterable === true ? (
                            <span className="mr-2">•</span>
                          ) : (
                            <span className="ml-4" />
                          )}
                          Yes
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          onClick={() => addFilter('filterable', false)}
                          data-testid="attribute-list-filterable-dropdown-no"
                        >
                          {filters.filterable === false ? (
                            <span className="mr-2">•</span>
                          ) : (
                            <span className="ml-4" />
                          )}
                          No
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu>
                    <button
                      onClick={() => removeFilter('filterable')}
                      className="-ml-1 -mr-2 flex h-7 items-center justify-center rounded-e-md border border-x-0 border-ui-border-base bg-ui-bg-subtle px-2 hover:bg-ui-bg-subtle-hover"
                      data-testid="attribute-list-filterable-remove-button"
                    >
                      <XMark />
                    </button>
                  </Badge>
                )}
                {filters.global !== undefined && (
                  <Badge
                    size="small"
                    className="flex items-center gap-1 bg-ui-bg-subtle text-ui-fg-subtle"
                    data-testid="attribute-list-global-badge"
                  >
                    Global
                    <DropdownMenu>
                      <DropdownMenu.Trigger asChild>
                        <button
                          className="h-7 border border-ui-border-base px-2 hover:bg-ui-bg-subtle-hover"
                          data-testid="attribute-list-global-dropdown-trigger"
                        >
                          {filters.global ? 'Yes' : 'No'}
                        </button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Content
                        align="start"
                        data-testid="attribute-list-global-dropdown-content"
                      >
                        <DropdownMenu.Item
                          onClick={() => addFilter('global', true)}
                          data-testid="attribute-list-global-dropdown-yes"
                        >
                          {filters.global === true ? (
                            <span className="mr-2">•</span>
                          ) : (
                            <span className="ml-4" />
                          )}
                          Yes
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          onClick={() => addFilter('global', false)}
                          data-testid="attribute-list-global-dropdown-no"
                        >
                          {filters.global === false ? (
                            <span className="mr-2">•</span>
                          ) : (
                            <span className="ml-4" />
                          )}
                          No
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu>
                    <button
                      onClick={() => removeFilter('global')}
                      className="-ml-1 -mr-2 flex h-7 items-center justify-center rounded-e-md border border-x-0 border-ui-border-base bg-ui-bg-subtle px-2 hover:bg-ui-bg-subtle-hover"
                      data-testid="attribute-list-global-remove-button"
                    >
                      <XMark />
                    </button>
                  </Badge>
                )}

                {/* Add Filter Button */}
                <DropdownMenu>
                  <DropdownMenu.Trigger
                    asChild
                    disabled={filters.filterable !== undefined && filters.global !== undefined}
                  >
                    <Button
                      variant="secondary"
                      size="small"
                      disabled={filters.filterable !== undefined && filters.global !== undefined}
                      data-testid="attribute-list-add-filter-button"
                    >
                      Add filter
                    </Button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content
                    align="start"
                    data-testid="attribute-list-add-filter-dropdown-content"
                  >
                    {filters.filterable === undefined && (
                      <DropdownMenu.Item
                        onClick={() => addFilter('filterable', true)}
                        data-testid="attribute-list-add-filter-filterable"
                      >
                        Filterable
                      </DropdownMenu.Item>
                    )}
                    {filters.global === undefined && (
                      <DropdownMenu.Item
                        onClick={() => addFilter('global', true)}
                        data-testid="attribute-list-add-filter-global"
                      >
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
                    data-testid="attribute-list-clear-all-filters-button"
                  >
                    Clear all
                  </Button>
                )}
              </div>

              <div
                className="flex items-center gap-2"
                data-testid="attribute-list-table-toolbar-actions"
              >
                <DataTable.Search
                  placeholder="Search table"
                  data-testid="attribute-list-table-search"
                />

                {/* Sorting Dropdown */}
                <DropdownMenu>
                  <DropdownMenu.Trigger asChild>
                    <IconButton
                      size="small"
                      data-testid="attribute-list-sort-button"
                    >
                      <DescendingSorting />
                    </IconButton>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content
                    align="end"
                    data-testid="attribute-list-sort-dropdown-content"
                  >
                    <div className="px-2 py-1">
                      <DropdownMenu.Item
                        onClick={() => handleSortFieldChange('name')}
                        data-testid="attribute-list-sort-field-name"
                      >
                        {sorting.field === 'name' ? (
                          <span className="mr-2">•</span>
                        ) : (
                          <span className="ml-4" />
                        )}
                        Name
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        onClick={() => handleSortFieldChange('created_at')}
                        data-testid="attribute-list-sort-field-created-at"
                      >
                        {sorting.field === 'created_at' ? (
                          <span className="mr-2">•</span>
                        ) : (
                          <span className="ml-4" />
                        )}
                        Created At
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        onClick={() => handleSortFieldChange('updated_at')}
                        data-testid="attribute-list-sort-field-updated-at"
                      >
                        {sorting.field === 'updated_at' ? (
                          <span className="mr-2">•</span>
                        ) : (
                          <span className="ml-4" />
                        )}
                        Updated At
                      </DropdownMenu.Item>
                    </div>
                    <DropdownMenu.Separator data-testid="attribute-list-sort-dropdown-separator" />
                    <div className="px-2 py-1">
                      <DropdownMenu.Item
                        onClick={() => handleSortOrderChange('asc')}
                        data-testid="attribute-list-sort-order-asc"
                      >
                        {sorting.order === 'asc' ? (
                          <span className="mr-2">•</span>
                        ) : (
                          <span className="ml-4" />
                        )}
                        Ascending (1 → 30)
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        onClick={() => handleSortOrderChange('desc')}
                        data-testid="attribute-list-sort-order-desc"
                      >
                        {sorting.order === 'desc' ? (
                          <span className="mr-2">•</span>
                        ) : (
                          <span className="ml-4" />
                        )}
                        Descending (30 → 1)
                      </DropdownMenu.Item>
                    </div>
                  </DropdownMenu.Content>
                </DropdownMenu>
              </div>
            </DataTable.Toolbar>
            <DataTableTableWithTestIds instance={table} />
            <DataTable.Pagination data-testid="attribute-list-table-pagination" />
          </DataTable>
        </div>
      </Container>
      {modal}
    </SingleColumnLayout>
  );
};
