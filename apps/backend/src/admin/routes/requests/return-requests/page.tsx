import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Table, Text } from "@medusajs/ui";
import { History } from "@medusajs/icons";
import { formatDate } from "../../../lib/date";
import { useState } from "react";
import { getRequestStatusBadge } from "../utils/get-status-badge";
import { useReturnRequests } from "../../../hooks/api/return-requests";
import {
  FilterReturnRequests,
  FilterState,
} from "../components/filter-return-requests";
import { ReturnRequestDetail } from "./return-detail";
import { AdminOrderReturnRequest } from "../types";
import { ReturnRequestMenu } from "../components/return-request-menu";

const PAGE_SIZE = 20;

const OrderReturnRequestsPage = () => {
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
    count,
  } = useReturnRequests({
    offset: currentPage * PAGE_SIZE,
    limit: PAGE_SIZE,
    status: currentFilter !== "" ? currentFilter : undefined,
  });

  return (
    <Container>
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>Order return requests</Heading>
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
      <div className="flex size-full flex-col overflow-hidden">
        {isLoading && <Text>Loading...</Text>}
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Order ID</Table.HeaderCell>
              <Table.HeaderCell>Customer</Table.HeaderCell>
              <Table.HeaderCell>Seller</Table.HeaderCell>
              <Table.HeaderCell>Reason</Table.HeaderCell>
              <Table.HeaderCell>Escalated Date</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {requests?.map((request) => {
              return (
                <Table.Row key={request.id}>
                  <Table.Cell>{request.order?.id}</Table.Cell>
                  <Table.Cell>{`${request.order?.customer?.first_name} ${request.order?.customer?.last_name}`}</Table.Cell>
                  <Table.Cell>{request.seller?.name}</Table.Cell>
                  <Table.Cell>{request.customer_note}</Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center gap-2">
                      <History />
                      {formatDate(request.vendor_reviewer_date)}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    {getRequestStatusBadge(request.status!)}
                  </Table.Cell>
                  <Table.Cell>
                    <ReturnRequestMenu
                      handleDetail={handleDetail}
                      // @ts-expect-error - Date type
                      request={request}
                    />
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table>
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
      </div>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Order return",
});

export default OrderReturnRequestsPage;
