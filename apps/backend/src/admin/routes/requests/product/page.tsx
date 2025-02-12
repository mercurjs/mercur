import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Table, Text } from "@medusajs/ui";
import { History } from "@medusajs/icons";
import { useVendorRequests } from "../../../hooks/api/requests";
import { ProductDTO } from "@medusajs/framework/types";
import { formatDate } from "../../../lib/date";
import { useState } from "react";
import { getRequestStatusBadge } from "../utils/get-status-badge";
import { FilterRequests, FilterState } from "../components/filter-requests";
import { AdminRequest } from "@mercurjs/http-client";
import { RequestMenu } from "../components/request-menu";
import { useNavigate } from "react-router-dom";

const PAGE_SIZE = 20;

const ProductRequestsPage = () => {
  const [currentFilter, setCurrentFilter] = useState<FilterState>("");
  const [currentPage, setCurrentPage] = useState<number>(0);

  const { requests, isLoading, count } = useVendorRequests({
    limit: PAGE_SIZE,
    offset: currentPage * PAGE_SIZE,
    type: "product",
    status: currentFilter !== "" ? currentFilter : undefined,
  });

  return (
    <Container>
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>Product requests</Heading>

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
              <Table.HeaderCell>Product</Table.HeaderCell>
              <Table.HeaderCell>Submitted By</Table.HeaderCell>
              <Table.HeaderCell>Variants</Table.HeaderCell>
              <Table.HeaderCell>Date</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {requests?.map((request) => {
              return <ProductRequestsRow request={request} />;
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

const ProductRequestsRow = ({ request }: { request: AdminRequest }) => {
  const navigate = useNavigate();
  const requestData = request.data as ProductDTO;
  return (
    <Table.Row key={request.id}>
      <Table.Cell>{requestData.title}</Table.Cell>
      <Table.Cell>{request.seller?.name}</Table.Cell>
      <Table.Cell>
        {requestData.variants?.length || 0}
        {" variant(s)"}
      </Table.Cell>
      <Table.Cell>
        <div className="flex items-center gap-2">
          <History />
          {formatDate(request.created_at!)}
        </div>
      </Table.Cell>
      <Table.Cell>{getRequestStatusBadge(request.status!)}</Table.Cell>
      <Table.Cell>
        {request.status === "pending" ? (
          <RequestMenu
            handleDetail={() => {
              navigate(`/requests/product/${request.id}`);
            }}
            request={request}
          />
        ) : (
          <></>
        )}
      </Table.Cell>
    </Table.Row>
  );
};

export const config = defineRouteConfig({
  label: "Product",
});

export default ProductRequestsPage;
