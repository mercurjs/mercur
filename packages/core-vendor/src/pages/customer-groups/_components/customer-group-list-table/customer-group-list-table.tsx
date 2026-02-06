import { useCallback, useMemo } from 'react';

import { PencilSquare, Trash } from '@medusajs/icons';
import {
  Button,
  Container,
  createDataTableColumnHelper,
  DataTableRow,
  Heading,
  Text,
  toast,
  usePrompt
} from '@medusajs/ui';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import { ActionMenu } from "@components/common/action-menu"
import { SingleColumnPage } from "@components/layout/pages"
import { _DataTable } from "@components/table/data-table"
import { DataTableQuery } from "@components/table/data-table/data-table-query"
import { TextCell } from "@components/table/table-cells/common/text-cell"
import { useDashboardExtension } from "@/extensions"
import { useCustomerGroups, useDeleteCustomerGroupLazy } from "@hooks/api"
import { useDataTable } from "@hooks/use-data-table"
import { useDate } from "@hooks/use-date"
import { CustomerGroupData } from '@pages/orders/common/customerGroupFiltering';
import { customerGroupFilter } from '../../common/customer-group-filter';
import { useCustomerGroupsTableQuery } from '../../common/use-customer-groups-table-query';

const PAGE_SIZE = 10;

export const CustomerGroupListTable = () => {
  const { t } = useTranslation();
  const { getWidgets } = useDashboardExtension();

  const columns = useColumns();

  const { searchParams } = useCustomerGroupsTableQuery({
    pageSize: PAGE_SIZE
  });

  const { customer_groups, isPending, isError, error } = useCustomerGroups();

  if (isError) {
    throw error;
  }

  const filteredList = customerGroupFilter(
    customer_groups ?? [],
    searchParams.order,
    searchParams.q ?? ''
  );

  const count = filteredList?.length || 0;

  const { table } = useDataTable({
    data: filteredList ?? [],
    columns,
    count: count,
    enablePagination: true,
    getRowId: row => row.customer_group_id,
    pageSize: PAGE_SIZE
  });

  return (
    <SingleColumnPage
      widgets={{
        before: getWidgets('customer_group.list.before'),
        after: getWidgets('customer_group.list.after')
      }}
    >
      <Container className="overflow-hidden p-0">
        <div className="flex flex-col items-start justify-between gap-2 p-6 md:flex-row md:items-center">
          <div className="items-center justify-between gap-2">
            <Heading>{t('customerGroups.domain')}</Heading>
            <Text
              size="small"
              className="text-ui-fg-subtle"
            >
              Organize customers into groups. Groups can have different promotions and prices.
            </Text>
          </div>
          <div className="flex items-center">
            <div className="-mx-4">
              <DataTableQuery
                search
                orderBy={[
                  { key: 'name', label: t('fields.name') },
                  {
                    key: 'customers',
                    label: t('customers.domain')
                  }
                ]}
              />
            </div>

            <Link to="/customer-groups/create">
              <Button
                size="small"
                variant="secondary"
              >
                {t('actions.create')}
              </Button>
            </Link>
          </div>
        </div>

        <div className="border-t">
          <_DataTable
            table={table}
            columns={columns}
            count={count}
            navigateTo={(row: DataTableRow<CustomerGroupData>) =>
              `/customer-groups/${row.original.customer_group_id}`
            }
            noRecords={{
              title: t('customerGroups.list.empty.heading'),
              message: t('customerGroups.list.empty.description')
            }}
            pageSize={PAGE_SIZE}
            isLoading={isPending}
          />
        </div>
      </Container>
    </SingleColumnPage>
  );
};

const columnHelper = createDataTableColumnHelper<CustomerGroupData>();

const useColumns = () => {
  const { t } = useTranslation();
  const { getFullDate } = useDate();
  const navigate = useNavigate();
  const prompt = usePrompt();

  const { mutateAsync: deleteCustomerGroup } = useDeleteCustomerGroupLazy();

  const handleDeleteCustomerGroup = useCallback(
    async ({ id, name }: { id: string; name: string }) => {
      const res = await prompt({
        title: t('customerGroups.delete.title'),
        description: t('customerGroups.delete.description', {
          name
        }),
        verificationText: name,
        verificationInstruction: t('general.typeToConfirm'),
        confirmText: t('actions.delete'),
        cancelText: t('actions.cancel')
      });

      if (!res) {
        return;
      }

      await deleteCustomerGroup(
        { id },
        {
          onSuccess: () => {
            toast.success(
              t('customerGroups.delete.successToast', {
                name
              })
            );
          },
          onError: e => {
            toast.error(e.message);
          }
        }
      );
    },
    [t, prompt, deleteCustomerGroup]
  );

  return useMemo(() => {
    return [
      columnHelper.accessor('customer_group.name', {
        header: t('fields.name'),
        cell: ({ row }) => {
          return <TextCell text={row?.original?.customer_group?.name || '-'} />;
        }
      }),
      columnHelper.accessor('customer_group.customers', {
        header: t('customers.domain'),
        cell: ({ row }) => {
          return <span>{row?.original?.customer_group?.customers?.length ?? 0}</span>;
        }
      }),
      columnHelper.display({
        id: 'actions',
        cell: ({ row }) => {
          return (
            <ActionMenu
              groups={[
                {
                  actions: [
                    {
                      icon: <PencilSquare />,
                      label: t('actions.edit'),
                      to: `/customer-groups/${row.original.customer_group_id}/edit`
                    },
                    {
                      icon: <Trash />,
                      label: t('actions.delete'),
                      onClick: () => {
                        handleDeleteCustomerGroup({
                          id: row.original.customer_group_id,
                          name: row.original.customer_group.name ?? ''
                        });
                      }
                    }
                  ]
                }
              ]}
            />
          );
        }
      })
    ];
  }, [t, navigate, getFullDate, handleDeleteCustomerGroup]);
};
