import { useState } from "react";

import { History } from "@medusajs/icons";
import { Container, Heading, Table, Text } from "@medusajs/ui";

import { formatDate } from "@lib/date";

import type { AdminRequest } from "@custom-types/requests";

import { useVendorRequests } from "@hooks/api/requests";

import {
  FilterRequests,
  type FilterState,
} from "@pages/requests/common/components/filter-requests";
import { RequestMenu } from "@pages/requests/common/components/request-menu";
import { getRequestStatusBadge } from "@pages/requests/common/utils/get-status-badge";
import { RequestSellerDetail } from "@pages/requests/request-seller-list/components/request-seller-detail";

const PAGE_SIZE = 20;

export const RequestSellerList = () => {
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRequest, setDetailRequest] = useState<AdminRequest | undefined>(
    undefined,
  );

  const handleDetail = (request: AdminRequest) => {
    setDetailRequest(request);
    setDetailOpen(true);
  };

  const [currentFilter, setCurrentFilter] = useState<FilterState>("");

  const { requests, isLoading, refetch, count = 0 } = useVendorRequests({
    offset: currentPage * PAGE_SIZE,
    limit: PAGE_SIZE,
    type: "seller",
    status: currentFilter !== "" ? currentFilter : undefined,
  });

  return (
    <Container data-testid="request-seller-list-container">
      <div className="flex items-center justify-between px-6 py-4" data-testid="request-seller-list-header">
        <div>
          <Heading data-testid="request-seller-list-heading">Seller creation requests</Heading>

          <RequestSellerDetail
            request={detailRequest}
            open={detailOpen}
            close={() => {
              setDetailOpen(false);
              refetch();
            }}
          />
          <FilterRequests
            onChange={(val) => {
              setCurrentFilter(val);
            }}
          />
        </div>
      </div>
      <div className="flex size-full flex-col overflow-hidden" data-testid="request-seller-list-content">
        {isLoading && <Text data-testid="request-seller-list-loading">Loading...</Text>}
        <Table data-testid="request-seller-list-table">
          <Table.Header data-testid="request-seller-list-table-header">
            <Table.Row>
              <Table.HeaderCell data-testid="request-seller-list-table-header-name">Name</Table.HeaderCell>
              <Table.HeaderCell data-testid="request-seller-list-table-header-email">Email</Table.HeaderCell>
              <Table.HeaderCell data-testid="request-seller-list-table-header-date">Date</Table.HeaderCell>
              <Table.HeaderCell data-testid="request-seller-list-table-header-status">Status</Table.HeaderCell>
              <Table.HeaderCell data-testid="request-seller-list-table-header-actions">Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body data-testid="request-seller-list-table-body">
            {requests?.map((request, index) => {
              const requestData = request.data as Record<string, unknown>;

              return (
                <Table.Row key={request.id} data-testid={`request-seller-list-table-row-${index}`}>
                  <Table.Cell data-testid={`request-seller-list-table-row-${index}-name`}>
                    {
                      (requestData.seller as Record<string, unknown>)
                        ?.name as string
                    }
                  </Table.Cell>
                  <Table.Cell data-testid={`request-seller-list-table-row-${index}-email`}>
                    {(requestData.provider_identity_id as string) ?? "N/A"}
                  </Table.Cell>
                  <Table.Cell data-testid={`request-seller-list-table-row-${index}-date`}>
                    <div className="flex items-center gap-2">
                      <History />
                      {formatDate(request.created_at!)}
                    </div>
                  </Table.Cell>
                  <Table.Cell data-testid={`request-seller-list-table-row-${index}-status`}>
                    {getRequestStatusBadge(request.status!)}
                  </Table.Cell>
                  <Table.Cell data-testid={`request-seller-list-table-row-${index}-actions`}>
                    <RequestMenu
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
          className="w-full"
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
          data-testid="request-seller-list-pagination"
        />
      </div>
    </Container>
  );
};
