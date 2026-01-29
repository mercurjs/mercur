import { useState } from 'react';

import type { CommissionLine } from '@custom-types/commission';
import { useListCommissionLines } from '@hooks/api';
import { History } from '@medusajs/icons';
import { Container, Heading, Table, Text } from '@medusajs/ui';
import { ActionMenu } from '@pages/commission-lines/components/action-menu';
import { CommissionLineDetail } from '@pages/commission-lines/components/commission-detail';

import { formatDate } from '@/lib/date';

const PAGE_SIZE = 20;

export const CommissionLines = () => {
  const [currentPage, setCurrentPage] = useState<number>(0);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailCommission, setDetailCommission] = useState<CommissionLine | undefined>(undefined);

  const handleDetail = (commission: CommissionLine) => {
    setDetailCommission(commission);
    setDetailOpen(true);
  };

  const { data, isLoading } = useListCommissionLines({
    offset: currentPage * PAGE_SIZE,
    limit: PAGE_SIZE
  });

  return (
    <Container data-testid="commission-lines-container">
      <div
        className="flex items-center justify-between px-6 py-4"
        data-testid="commission-lines-header"
      >
        <div>
          <Heading data-testid="commission-lines-heading">Commission Lines</Heading>

          <CommissionLineDetail
            line={detailCommission}
            open={detailOpen}
            close={() => {
              setDetailOpen(false);
            }}
          />
        </div>
      </div>
      <div
        className="flex size-full flex-col overflow-hidden"
        data-testid="commission-lines-content"
      >
        {isLoading && <Text data-testid="commission-lines-loading">Loading...</Text>}
        <Table data-testid="commission-lines-table">
          <Table.Header data-testid="commission-lines-table-header">
            <Table.Row data-testid="commission-lines-table-header-row">
              <Table.HeaderCell data-testid="commission-lines-table-header-seller">
                Seller
              </Table.HeaderCell>
              <Table.HeaderCell data-testid="commission-lines-table-header-order">
                Order
              </Table.HeaderCell>
              <Table.HeaderCell data-testid="commission-lines-table-header-value">
                Value
              </Table.HeaderCell>
              <Table.HeaderCell data-testid="commission-lines-table-header-date">
                Date
              </Table.HeaderCell>
              <Table.HeaderCell data-testid="commission-lines-table-header-actions">
                Actions
              </Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body data-testid="commission-lines-table-body">
            {data?.commission_lines?.map((line: CommissionLine) => {
              return (
                <Table.Row
                  key={line.id}
                  data-testid={`commission-lines-table-row-${line.id}`}
                >
                  <Table.Cell data-testid={`commission-lines-table-row-${line.id}-seller`}>
                    {line.order?.seller?.name || '-'}
                  </Table.Cell>
                  <Table.Cell data-testid={`commission-lines-table-row-${line.id}-order`}>
                    {line.order?.display_id ? `#${line.order?.display_id}` : '-'}
                  </Table.Cell>
                  <Table.Cell
                    data-testid={`commission-lines-table-row-${line.id}-value`}
                  >{`${line.value.toFixed(2)} ${line.currency_code.toUpperCase()}`}</Table.Cell>
                  <Table.Cell data-testid={`commission-lines-table-row-${line.id}-date`}>
                    <div className="flex items-center gap-2">
                      <History />
                      {formatDate(line.created_at!)}
                    </div>
                  </Table.Cell>
                  <Table.Cell data-testid={`commission-lines-table-row-${line.id}-actions`}>
                    <ActionMenu
                      handleDetail={handleDetail}
                      line={line}
                    />
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table>
        <Table.Pagination
          className="w-full"
          canNextPage={PAGE_SIZE * (currentPage + 1) < (data?.count || 0)}
          canPreviousPage={currentPage > 0}
          previousPage={() => {
            setCurrentPage(currentPage - 1);
          }}
          nextPage={() => {
            setCurrentPage(currentPage + 1);
          }}
          count={data?.count || 0}
          pageCount={Math.ceil((data?.count || 0) / PAGE_SIZE)}
          pageIndex={currentPage}
          pageSize={PAGE_SIZE}
          data-testid="commission-lines-table-pagination"
        />
      </div>
    </Container>
  );
};
