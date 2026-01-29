import { useState } from "react";

import { History } from "@medusajs/icons";
import { Container, Heading, Table, Text } from "@medusajs/ui";

import { formatDate } from "@lib/date";

import type { AdminOrderReturnRequest } from "@custom-types/requests";

import { useReturnRequests } from "@hooks/api/return-requests";

import {
  FilterReturnRequests,
  type FilterState,
} from "@pages/requests/common/components/filter-return-requests";
import { ReturnRequestMenu } from "@pages/requests/common/components/return-request-menu";
import { getRequestStatusBadge } from "@pages/requests/common/utils/get-status-badge";
import { ReturnRequestDetail } from "@pages/requests/request-return-list/components/request-return-list";

const PAGE_SIZE = 20;

export const OrderReturnRequestsPage = () => {
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRequest, setDetailRequest] = useState<
    AdminOrderReturnRequest | undefined
  >(undefined);

  const handleDetail = (request: AdminOrderReturnRequest) => {
    setDetailRequest(request);
    setDetailOpen(true);
  };

  const [currentFilter, setCurrentFilter] = useState<FilterState>("escalated");

  const {
    order_return_request: requests,
    isLoading,
    refetch,
    count = 0,
  } = useReturnRequests({
    offset: currentPage * PAGE_SIZE,
    limit: PAGE_SIZE,
    status: currentFilter !== "" ? currentFilter : undefined,
  });
  
  return (
    <Container data-testid="request-return-list-container">
      <div className="flex items-center justify-between px-6 py-4" data-testid="request-return-list-header">
        <div>
          <Heading data-testid="request-return-list-heading">Order return requests</Heading>
          <ReturnRequestDetail
            request={detailRequest}
            open={detailOpen}
            close={() => {
              setDetailOpen(false);
              refetch();
            }}
          />

          <FilterReturnRequests
            defaultState="escalated"
            onChange={(val) => {
              setCurrentFilter(val);
            }}
          />
        </div>
      </div>
      <div className="flex size-full flex-col overflow-hidden" data-testid="request-return-list-content">
        {isLoading && <Text data-testid="request-return-list-loading">Loading...</Text>}
        <Table data-testid="request-return-list-table">
          <Table.Header data-testid="request-return-list-table-header">
            <Table.Row>
              <Table.HeaderCell data-testid="request-return-list-table-header-order-id">Order ID</Table.HeaderCell>
              <Table.HeaderCell data-testid="request-return-list-table-header-customer">Customer</Table.HeaderCell>
              <Table.HeaderCell data-testid="request-return-list-table-header-seller">Seller</Table.HeaderCell>
              <Table.HeaderCell data-testid="request-return-list-table-header-reason">Reason</Table.HeaderCell>
              <Table.HeaderCell data-testid="request-return-list-table-header-escalated-date">Escalated Date</Table.HeaderCell>
              <Table.HeaderCell data-testid="request-return-list-table-header-status">Status</Table.HeaderCell>
              <Table.HeaderCell data-testid="request-return-list-table-header-actions">Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body data-testid="request-return-list-table-body">
            {requests?.map((request, index) => {
              return (
                <Table.Row key={request.id} data-testid={`request-return-list-table-row-${index}`}>
                  <Table.Cell data-testid={`request-return-list-table-row-${index}-order-id`}>{request.order?.id}</Table.Cell>
                  <Table.Cell data-testid={`request-return-list-table-row-${index}-customer`}>{`${request.order?.customer?.first_name} ${request.order?.customer?.last_name}`}</Table.Cell>
                  <Table.Cell data-testid={`request-return-list-table-row-${index}-seller`}>{request.seller?.name}</Table.Cell>
                  <Table.Cell data-testid={`request-return-list-table-row-${index}-reason`}>{request.customer_note}</Table.Cell>
                  <Table.Cell data-testid={`request-return-list-table-row-${index}-escalated-date`}>
                    <div className="flex items-center gap-2">
                      <History />
                      {formatDate(request.vendor_reviewer_date)}
                    </div>
                  </Table.Cell>
                  <Table.Cell data-testid={`request-return-list-table-row-${index}-status`}>
                    {getRequestStatusBadge(request.status!)}
                  </Table.Cell>
                  <Table.Cell data-testid={`request-return-list-table-row-${index}-actions`}>
                    <ReturnRequestMenu
                      handleDetail={handleDetail}
                      request={request}
                    />
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table>
        <Table.Pagination
          canNextPage={PAGE_SIZE * (currentPage + 1) < count}
          canPreviousPage={currentPage > 0}
          previousPage={() => {
            setCurrentPage(currentPage - 1);
          }}
          nextPage={() => {
            setCurrentPage(currentPage + 1);
          }}
          count={count ?? 0}
          pageCount={Math.ceil(count / PAGE_SIZE)}
          pageIndex={currentPage}
          pageSize={PAGE_SIZE}
          data-testid="request-return-list-pagination"
        />
      </div>
    </Container>
  );
};
