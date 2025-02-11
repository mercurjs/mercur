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
import { useProductCategory } from "../../../hooks/api/product_category";
import { RequestMenu } from "../components/request-menu";
import { useNavigate } from "react-router-dom";

const ProductRequestsPage = () => {
  const [currentFilter, setCurrentFilter] = useState<FilterState>("");

  const { requests, isLoading } = useVendorRequests({
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
              <Table.HeaderCell>Category</Table.HeaderCell>
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
        </Table>
      </div>
    </Container>
  );
};

const ProductRequestsRow = ({ request }: { request: AdminRequest }) => {
  const navigate = useNavigate();
  const requestData = request.data as ProductDTO;
  let category_name = "";
  if (requestData.categories && requestData.categories[0]) {
    const id = requestData.categories[0].id;
    const { product_category } = useProductCategory(id);
    category_name = product_category?.name || "";
  }
  return (
    <Table.Row key={request.id}>
      <Table.Cell>{requestData.title}</Table.Cell>
      <Table.Cell>{category_name}</Table.Cell>
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
