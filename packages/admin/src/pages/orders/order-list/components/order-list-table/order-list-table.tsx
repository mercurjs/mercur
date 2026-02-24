import { _DataTable } from '@components/table/data-table';
import { useOrders } from '@hooks/api';
import { useOrderTableColumns } from '@hooks/table/columns';
import { useOrderTableQuery } from '@hooks/table/query';
import { useDataTable } from '@hooks/use-data-table';
import { Container, Heading } from '@medusajs/ui';
import { useFeatureFlag } from '@providers/feature-flag-provider';
import { DEFAULT_FIELDS } from '@routes/orders/order-detail/constants';
import { keepPreviousData } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { ConfigurableOrderListTable } from './configurable-order-list-table';
import { useOrderLegacyTableFilters } from './use-order-legacy-table-filters';

const PAGE_SIZE = 20;

export const OrderListTable = () => {
  const { t } = useTranslation();
  const isViewConfigEnabled = useFeatureFlag('view_configurations');

  if (isViewConfigEnabled) {
    return <ConfigurableOrderListTable />;
  }

  const { searchParams, raw } = useOrderTableQuery({
    pageSize: PAGE_SIZE
  });

  const { orders, count, isError, error, isLoading } = useOrders(
    {
      fields: DEFAULT_FIELDS,
      ...searchParams
    },
    {
      placeholderData: keepPreviousData
    }
  );

  const filters = useOrderLegacyTableFilters();
  const columns = useOrderTableColumns({});

  const { table } = useDataTable({
    data: orders ?? [],
    columns,
    enablePagination: true,
    count,
    pageSize: PAGE_SIZE
  });

  if (isError) {
    throw error;
  }

  return (
    <Container
      className="divide-y p-0"
      data-testid="orders-container"
    >
      <div
        className="flex items-center justify-between px-6 py-4"
        data-testid="orders-header"
      >
        <Heading data-testid="orders-heading">{t('orders.domain')}</Heading>
      </div>
      <div data-testid="orders-table-wrapper">
        <_DataTable
          columns={columns}
          table={table}
          pagination
          navigateTo={row => `/orders/${row.original.id}`}
          filters={filters}
          count={count}
          search
          isLoading={isLoading}
          pageSize={PAGE_SIZE}
          orderBy={[
            { key: 'display_id', label: t('orders.fields.displayId') },
            { key: 'created_at', label: t('fields.createdAt') },
            { key: 'updated_at', label: t('fields.updatedAt') }
          ]}
          queryObject={raw}
          noRecords={{
            message: t('orders.list.noRecordsMessage')
          }}
        />
      </div>
    </Container>
  );
};
