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
import { ProductSummaryDetail } from "@pages/requests/request-product-list/components/product-summary";

const PAGE_SIZE = 20;

export const RequestProductList = () => {
  const [currentFilter, setCurrentFilter] = useState<FilterState>("");
  const [currentPage, setCurrentPage] = useState<number>(0);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRequest, setDetailRequest] = useState<AdminRequest | undefined>(
    undefined,
  );

  const handleDetail = (request: AdminRequest) => {
    setDetailRequest(request);
    setDetailOpen(true);
  };

  const { requests, isLoading, count = 0 } = useVendorRequests({
    limit: PAGE_SIZE,
    offset: currentPage * PAGE_SIZE,
    type: "product",
    status: currentFilter !== "" ? currentFilter : undefined,
  });

  return (
    <Container data-testid="request-product-list-container">
      <div className="flex items-center justify-between px-6 py-4" data-testid="request-product-list-header">
        <div>
          <Heading data-testid="request-product-list-heading">Product requests</Heading>
          <ProductSummaryDetail
            request={detailRequest}
            open={detailOpen}
            close={() => {
              setDetailOpen(false);
            }}
          />
          <FilterRequests
            onChange={(val) => {
              setCurrentFilter(val);
            }}
          />
        </div>
      </div>
      <div className="flex size-full flex-col overflow-hidden" data-testid="request-product-list-content">
        {isLoading && <Text data-testid="request-product-list-loading">Loading...</Text>}
        <Table data-testid="request-product-list-table">
          <Table.Header data-testid="request-product-list-table-header">
            <Table.Row>
              <Table.HeaderCell data-testid="request-product-list-table-header-product">Product</Table.HeaderCell>
              <Table.HeaderCell data-testid="request-product-list-table-header-submitted-by">Submitted By</Table.HeaderCell>
              <Table.HeaderCell data-testid="request-product-list-table-header-variants">Variants</Table.HeaderCell>
              <Table.HeaderCell data-testid="request-product-list-table-header-date">Date</Table.HeaderCell>
              <Table.HeaderCell data-testid="request-product-list-table-header-status">Status</Table.HeaderCell>
              <Table.HeaderCell data-testid="request-product-list-table-header-actions">Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body data-testid="request-product-list-table-body">
            {requests?.map((request, index) => {
              return (
                <ProductRequestsRow
                  request={request}
                  handleDetail={handleDetail}
                  key={request.id}
                  index={index}
                />
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
          data-testid="request-product-list-pagination"
        />
      </div>
    </Container>
  );
};

const ProductRequestsRow = ({
  request,
  handleDetail,
  index,
}: {
  request: AdminRequest;
  handleDetail: (request: AdminRequest) => void;
  index: number;
}) => {
  const navigate = useNavigate();
  const requestData = request.data as ProductDTO;

  return (
    <Table.Row key={request.id} data-testid={`request-product-list-table-row-${index}`}>
      <Table.Cell data-testid={`request-product-list-table-row-${index}-product`}>{requestData.title}</Table.Cell>
      <Table.Cell data-testid={`request-product-list-table-row-${index}-submitted-by`}>{request.seller?.name}</Table.Cell>
      <Table.Cell data-testid={`request-product-list-table-row-${index}-variants`}>
        {requestData.variants?.length || 0}
        {" variant(s)"}
      </Table.Cell>
      <Table.Cell data-testid={`request-product-list-table-row-${index}-date`}>
        <div className="flex items-center gap-2">
          <History />
          {formatDate(request.created_at!)}
        </div>
      </Table.Cell>
      <Table.Cell data-testid={`request-product-list-table-row-${index}-status`}>{getRequestStatusBadge(request.status!)}</Table.Cell>
      <Table.Cell data-testid={`request-product-list-table-row-${index}-actions`}>
        {request.status === "pending" ? (
          <RequestMenu
            handleDetail={() => {
              navigate(`/requests/product/${request.id}`);
            }}
            request={request}
          />
        ) : (
          <RequestMenu handleDetail={handleDetail} request={request} />
        )}
      </Table.Cell>
    </Table.Row>
  );
};
