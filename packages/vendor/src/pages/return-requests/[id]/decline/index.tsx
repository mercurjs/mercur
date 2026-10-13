// Route: /return-requests/:id/decline
import { Heading, Text } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { Navigate, useParams } from "react-router-dom";

import { RouteDrawer } from "@components/modals";
import { useReturnRequest } from "@hooks/api/return-requests";

import { DeclineReturnRequestForm } from "./decline-return-request-form";

const DECLINABLE = ["pending", "awaiting_return", "returned"];

export const Component = () => {
  const { t } = useTranslation();
  const { id } = useParams();

  const {
    return_request: returnRequest,
    isLoading,
    isError,
    error,
  } = useReturnRequest(id!);

  if (isError) {
    throw error;
  }

  if (
    !isLoading &&
    returnRequest &&
    !DECLINABLE.includes(returnRequest.status)
  ) {
    return <Navigate to={`/return-requests/${id}`} replace />;
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>{t("returnRequests.decline.header")}</Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description asChild>
          <Text size="small" className="text-ui-fg-subtle">
            {t("returnRequests.decline.description")}
          </Text>
        </RouteDrawer.Description>
      </RouteDrawer.Header>

      {!isLoading && returnRequest && (
        <DeclineReturnRequestForm returnRequest={returnRequest} />
      )}
    </RouteDrawer>
  );
};
