import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Table, Text } from "@medusajs/ui";
import { History } from "@medusajs/icons";
import { useVendorRequests } from "../../../hooks/api/requests";
import {  ProductTypeDTO } from "@medusajs/framework/types";
import { formatDate } from "../../../lib/date";
import { useState } from "react";
import { getRequestStatusBadge } from "../utils/get-status-badge";
import { FilterRequests, FilterState } from "../components/filter-requests";
import { AdminRequest } from "@mercurjs/http-client";
import { RequestMenu } from "../components/request-menu";
import { ProductTypeRequestDetail } from "./product-type-detail";

const PAGE_SIZE = 20;

const ProductTypeRequestsPage = () => {
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

  const { requests, isLoading, refetch, count } = useVendorRequests({
    offset: currentPage * PAGE_SIZE,
    limit: PAGE_SIZE,
    type: "product_type",
    status: currentFilter !== "" ? currentFilter : undefined,
  });

  return (
    <Container>
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>Product type requests</Heading>
          <ProductTypeRequestDetail
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
      <div className="flex size-full flex-col overflow-hidden">
        {isLoading && <Text>Loading...</Text>}
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Value</Table.HeaderCell>
              <Table.HeaderCell>Submitted By</Table.HeaderCell>
              <Table.HeaderCell>Date</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {requests?.map((request) => {
              const requestData = request.data as ProductTypeDTO
              return (
                <Table.Row key={request.id}>
                  <Table.Cell>{requestData.value}</Table.Cell>
                  <Table.Cell>{request.seller?.name}</Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center gap-2">
                      <History />
                      {formatDate(request.created_at!)}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    {getRequestStatusBadge(request.status!)}
                  </Table.Cell>
                  <Table.Cell>
                    {request.status === "pending" && (
                      <RequestMenu
                        handleDetail={handleDetail}
                        request={request}
                      />
                    )}
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
          <Table.Pagination
            canNextPage={PAGE_SIZE * (currentPage + 1) < count!}
            canPreviousPage={currentPage > 0}
            previousPage={() => {
              setCurrentPage(currentPage - 1);
            }}
            nextPage={() => {
              setCurrentPage(currentPage + 1);
            }}
            count={count!}
            pageCount={Math.ceil(count! / PAGE_SIZE)}
            pageIndex={currentPage}
            pageSize={PAGE_SIZE}
          />
        </Table>
      </div>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Product type",
});

export default ProductTypeRequestsPage;
