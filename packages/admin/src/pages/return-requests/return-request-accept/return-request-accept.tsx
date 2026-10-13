import { Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Navigate, useParams } from "react-router-dom"

import { RouteDrawer } from "../../../components/modals"
import { useReturnRequest } from "../../../hooks/api/return-requests"
import { AcceptReturnRequestForm } from "./components/accept-return-request-form"

export const ReturnRequestAccept = () => {
  const { t } = useTranslation()
  const { id } = useParams()
  const {
    return_request: returnRequest,
    isLoading,
    isError,
    error,
  } = useReturnRequest(id!)

  if (isError) {
    throw error
  }

  if (!isLoading && returnRequest && returnRequest.status !== "pending") {
    return <Navigate to={`/return-requests/${id}`} replace />
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>{t("returnRequests.accept.header")}</Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description asChild>
          <Text size="small" className="text-ui-fg-subtle">
            {t("returnRequests.accept.description")}
          </Text>
        </RouteDrawer.Description>
      </RouteDrawer.Header>

      {!isLoading && returnRequest && (
        <AcceptReturnRequestForm returnRequest={returnRequest} />
      )}
    </RouteDrawer>
  )
}
