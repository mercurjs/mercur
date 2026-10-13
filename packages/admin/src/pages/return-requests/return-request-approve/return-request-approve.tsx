import { Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Navigate, useParams } from "react-router-dom"

import { RouteDrawer } from "../../../components/modals"
import { useReturnRequest } from "../../../hooks/api/return-requests"
import { isApprovable } from "../common/utils"
import { ApproveReturnRequestForm } from "./components/approve-return-request-form"

export const ReturnRequestApprove = () => {
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

  if (!isLoading && returnRequest && !isApprovable(returnRequest.status)) {
    return <Navigate to={`/return-requests/${id}`} replace />
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>{t("returnRequests.approve.header")}</Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description asChild>
          <Text size="small" className="text-ui-fg-subtle">
            {t("returnRequests.approve.description")}
          </Text>
        </RouteDrawer.Description>
      </RouteDrawer.Header>

      {!isLoading && returnRequest && (
        <ApproveReturnRequestForm returnRequest={returnRequest} />
      )}
    </RouteDrawer>
  )
}
