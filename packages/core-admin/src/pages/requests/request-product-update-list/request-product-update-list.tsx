import { useState } from "react";

import { History } from "@medusajs/icons";
import type { ProductDTO } from "@medusajs/types";
import { Container, Heading, Table, Text } from "@medusajs/ui";

import { formatDate } from "@lib/date";
import { useNavigate } from "react-router-dom";

import type { AdminRequest } from "@custom-types/requests";

import { useVendorRequests } from "@hooks/api/requests";

import {
  FilterRequests,
  type FilterState,
} from "@pages/requests/common/components/filter-requests";
import { RequestMenu } from "@pages/requests/common/components/request-menu";
import { getRequestStatusBadge } from "@pages/requests/common/utils/get-status-badge";

const PAGE_SIZE = 20;

export const RequestProductUpdateList = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState<number>(0);

  const handleDetail = (request: AdminRequest) => {
    const product_id =
      (request.data as Record<string, unknown>).product_id || "";
    navigate(`/products/${product_id}`);
  };

  const [currentFilter, setCurrentFilter] = useState<FilterState>("");

  const { requests, isLoading, count = 0 } = useVendorRequests({
    offset: currentPage * PAGE_SIZE,
    limit: PAGE_SIZE,
    type: "product_update",
    status: currentFilter !== "" ? currentFilter : undefined,
  });

  return (
    <Container data-testid="request-product-update-list-container">
      <div className="flex items-center justify-between px-6 py-4" data-testid="request-product-update-list-header">
        <div>
          <Heading data-testid="request-product-update-list-heading">Product update requests</Heading>
          <FilterRequests
            onChange={(val) => {
              setCurrentFilter(val);
            }}
          />
        </div>
      </div>
      <div className="flex size-full flex-col overflow-hidden" data-testid="request-product-update-list-content">
        {isLoading && <Text data-testid="request-product-update-list-loading">Loading...</Text>}
        <Table data-testid="request-product-update-list-table">
          <Table.Header data-testid="request-product-update-list-table-header">
            <Table.Row>
              <Table.HeaderCell data-testid="request-product-update-list-table-header-title">Title</Table.HeaderCell>
              <Table.HeaderCell data-testid="request-product-update-list-table-header-submitted-by">Submitted By</Table.HeaderCell>
              <Table.HeaderCell data-testid="request-product-update-list-table-header-date">Date</Table.HeaderCell>
              <Table.HeaderCell data-testid="request-product-update-list-table-header-status">Status</Table.HeaderCell>
              <Table.HeaderCell data-testid="request-product-update-list-table-header-actions">Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body data-testid="request-product-update-list-table-body">
            {requests?.map((request, index) => {
              const requestData = request.data as ProductDTO;

              return (
                <Table.Row key={request.id} data-testid={`request-product-update-list-table-row-${index}`}>
                  <Table.Cell data-testid={`request-product-update-list-table-row-${index}-title`}>{requestData.title}</Table.Cell>
                  <Table.Cell data-testid={`request-product-update-list-table-row-${index}-submitted-by`}>{request.seller?.name}</Table.Cell>
                  <Table.Cell data-testid={`request-product-update-list-table-row-${index}-date`}>
                    <div className="flex items-center gap-2">
                      <History />
                      {formatDate(request.created_at!)}
                    </div>
                  </Table.Cell>
                  <Table.Cell data-testid={`request-product-update-list-table-row-${index}-status`}>
                    {getRequestStatusBadge(request.status!)}
                  </Table.Cell>
                  <Table.Cell data-testid={`request-product-update-list-table-row-${index}-actions`}>
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
          data-testid="request-product-update-list-pagination"
        />
      </div>
    </Container>
  );
};
