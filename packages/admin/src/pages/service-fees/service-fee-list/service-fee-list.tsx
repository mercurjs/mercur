import { useNavigate } from "react-router-dom"
import { Button, Container, Heading, Text } from "@medusajs/ui"
import { Plus } from "@medusajs/icons"
import { SingleColumnPage } from "../../../components/layout/pages"
import { GlobalFeeSummaryCard } from "./components/global-fee-summary-card"
import { ServiceFeeListTable } from "./components/service-fee-list-table"

export const ServiceFeeListPage = () => {
  const navigate = useNavigate()

  return (
    <SingleColumnPage>
      <div className="flex items-center justify-between mb-4">
        <div>
          <Heading level="h1">Service Fees</Heading>
          <Text className="text-ui-fg-subtle">
            Manage service fee rules for your marketplace
          </Text>
        </div>
        <Button onClick={() => navigate("/service-fees/create")}>
          <Plus />
          Create New Fee
        </Button>
      </div>

      <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle p-3 mb-4">
        <Text className="text-ui-fg-subtle text-sm">
          Note: Service fees are stackable. Multiple active fees can apply to an
          order.
        </Text>
      </div>

      <GlobalFeeSummaryCard />
      <ServiceFeeListTable />
    </SingleColumnPage>
  )
}
