import { useMemo } from 'react';

import { PencilSquare } from '@medusajs/icons';
import { HttpTypes } from '@medusajs/types';
import { Button, Container, Heading } from '@medusajs/ui';
import { keepPreviousData } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import { ActionMenu } from '../../../../../components/common/action-menu';
import { _DataTable } from '../../../../../components/table/data-table/data-table';
import { DateCell } from '../../../../../components/table/table-cells/common/date-cell';
import { useUsers } from '../../../../../hooks/api/users';
import { useUserTableQuery } from '../../../../../hooks/table/query/use-user-table-query';
import { useDataTable } from '../../../../../hooks/use-data-table';
import { useUserTableFilters } from './use-user-table-filters';

const PAGE_SIZE = 20;

export const UserListTable = () => {
  const { t } = useTranslation();

  const { searchParams, raw } = useUserTableQuery({ pageSize: PAGE_SIZE } as { pageSize: number });
  const { users, count, isPending, isError, error } = useUsers(
    {
      ...searchParams
    },
    {
      placeholderData: keepPreviousData
    }
  );

  const filters = useUserTableFilters();
  const columns = useColumns();

  const { table } = useDataTable({
    data: users ?? [],
    columns,
    enablePagination: true,
    count,
    pageSize: PAGE_SIZE,
    getRowId: row => row.id
  });

  if (isError) {
    throw error;
  }

  return (
    <Container
      className="divide-y p-0"
      data-testid="users-list-table"
    >
      <div
        className="flex items-center justify-between px-6 py-4"
        data-testid="users-list-header"
      >
        <Heading
          level="h2"
          data-testid="users-list-title"
        >
          {t('users.domain')}
        </Heading>
        <Link
          to="invite"
          data-testid="users-invite-link"
        >
          <Button
            size="small"
            variant="secondary"
            data-testid="users-invite-button"
          >
            {t('users.invite')}
          </Button>
        </Link>
      </div>
      <div data-testid="users-data-table">
        <_DataTable
          table={table}
          columns={columns}
          count={count}
          pageSize={PAGE_SIZE}
          filters={filters}
          search
          pagination
          isLoading={isPending}
          queryObject={raw}
          navigateTo={row => `${row.original.id}`}
          orderBy={[
            { key: 'email', label: t('fields.email') },
            { key: 'first_name', label: t('fields.firstName') },
            { key: 'last_name', label: t('fields.lastName') },
            { key: 'created_at', label: t('fields.createdAt') },
            { key: 'updated_at', label: t('fields.updatedAt') }
          ]}
          noRecords={{
            message: t('users.list.empty.description')
          }}
        />
      </div>
    </Container>
  );
};

const columnHelper = createColumnHelper<HttpTypes.AdminUser>();

const useColumns = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return useMemo(
    () => [
      columnHelper.accessor('email', {
        header: () => (
          <div
            className="flex h-full w-full items-center"
            data-testid="users-table-header-email"
          >
            <span data-testid="users-table-header-email-text">{t('fields.email')}</span>
          </div>
        ),
        cell: ({ row }) => {
          return (
            <div className="flex size-full items-center overflow-hidden">
              <span
                className="truncate"
                data-testid={`users-table-cell-${row.index}-email-value`}
              >
                {row.original.email}
              </span>
            </div>
          );
        }
      }),
      columnHelper.accessor('first_name', {
        header: () => (
          <div
            className="flex h-full w-full items-center"
            data-testid="users-table-header-first_name"
          >
            <span data-testid="users-table-header-first_name-text">{t('fields.firstName')}</span>
          </div>
        ),
        cell: ({ row }) => {
          return (
            <div className="flex size-full items-center overflow-hidden">
              <span
                className="truncate"
                data-testid={`users-table-cell-${row.index}-first_name-value`}
              >
                {row.original.first_name || '-'}
              </span>
            </div>
          );
        }
      }),
      columnHelper.accessor('last_name', {
        header: () => (
          <div
            className="flex h-full w-full items-center"
            data-testid="users-table-header-last_name"
          >
            <span data-testid="users-table-header-last_name-text">{t('fields.lastName')}</span>
          </div>
        ),
        cell: ({ row }) => {
          return (
            <div className="flex size-full items-center overflow-hidden">
              <span
                className="truncate"
                data-testid={`users-table-cell-${row.index}-last_name-value`}
              >
                {row.original.last_name || '-'}
              </span>
            </div>
          );
        }
      }),
      columnHelper.accessor('created_at', {
        header: () => (
          <div
            className="flex h-full w-full items-center"
            data-testid="users-table-header-created_at"
          >
            <span data-testid="users-table-header-created_at-text">{t('fields.createdAt')}</span>
          </div>
        ),
        cell: ({ getValue, row }) => {
          const date = getValue();
          return (
            <DateCell
              date={date ? new Date(date) : null}
              data-testid={`users-table-cell-${row.index}-created_at-value`}
            />
          );
        }
      }),
      columnHelper.accessor('updated_at', {
        header: () => (
          <div
            className="flex h-full w-full items-center"
            data-testid="users-table-header-updated_at"
          >
            <span data-testid="users-table-header-updated_at-text">{t('fields.updatedAt')}</span>
          </div>
        ),
        cell: ({ getValue, row }) => {
          const date = getValue();
          return (
            <DateCell
              date={date ? new Date(date) : null}
              data-testid={`users-table-cell-${row.index}-updated_at-value`}
            />
          );
        }
      }),
      columnHelper.display({
        id: 'actions',
        header: () => (
          <div
            className="flex h-full w-full items-center"
            data-testid="users-table-header-actions"
          >
            <span data-testid="users-table-header-actions-text"></span>
          </div>
        ),
        cell: ({ row }) => {
          return (
            <UserActions
              user={row.original}
              index={row.index}
            />
          );
        }
      })
    ],
    [t, navigate]
  );
};

const UserActions = ({ user, index }: { user: HttpTypes.AdminUser; index: number }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              icon: <PencilSquare />,
              label: t('actions.edit'),
              onClick: () => {
                navigate(`${user.id}/edit`);
              }
            }
          ]
        }
      ]}
      data-testid={`user-actions-${index}`}
    />
  );
};
