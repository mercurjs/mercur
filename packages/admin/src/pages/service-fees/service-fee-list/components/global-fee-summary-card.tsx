import { useState } from "react"
import { Container, Heading, Text, Badge, IconButton } from "@medusajs/ui"
import { PencilSquare } from "@medusajs/icons"
import { useServiceFees } from "../../../../hooks/api/service-fees"
import { EditGlobalFeeDrawer } from "./edit-global-fee-drawer"

export const GlobalFeeSummaryCard = () => {
  const [drawerOpen, setDrawerOpen] = useState(false)

  const { service_fees, isLoading } = useServiceFees({
    charging_level: "global",
    status: "active",
    limit: 1,
  })

  const globalFee = service_fees?.[0]

  if (isLoading) {
    return (
      <Container className="mb-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-ui-bg-switch-off rounded w-1/4" />
          <div className="h-6 bg-ui-bg-switch-off rounded w-1/2" />
        </div>
      </Container>
    )
  }

  if (!globalFee) {
    return (
      <Container className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Heading level="h2">Global Service Fee</Heading>
              <Badge color="grey" size="xsmall">
                Global Fee
              </Badge>
            </div>
            <Text className="text-ui-fg-subtle">
              No active global fee configured
            </Text>
          </div>
        </div>
      </Container>
    )
  }

  return (
    <>
      <Container className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Heading level="h2">Global Service Fee</Heading>
              <Badge color="green" size="xsmall">
                Global Fee
              </Badge>
            </div>
            <div className="grid grid-cols-4 gap-6">
              <div>
                <Text className="text-ui-fg-subtle text-xs">Rule ID</Text>
                <Text className="font-medium">
                  #{globalFee.id?.split("_").pop()}
                </Text>
              </div>
              <div>
                <Text className="text-ui-fg-subtle text-xs">
                  Service Fee Rate
                </Text>
                <Text className="font-medium">{globalFee.value}%</Text>
              </div>
              <div>
                <Text className="text-ui-fg-subtle text-xs">
                  Display Name to Seller
                </Text>
                <Text className="font-medium">{globalFee.display_name}</Text>
              </div>
              <div>
                <Text className="text-ui-fg-subtle text-xs">
                  Effective Date
                </Text>
                <Text className="font-medium">
                  {globalFee.effective_date
                    ? new Date(globalFee.effective_date).toLocaleDateString()
                    : "-"}
                </Text>
              </div>
            </div>
          </div>
          <IconButton
            variant="transparent"
            onClick={() => setDrawerOpen(true)}
          >
            <PencilSquare />
          </IconButton>
        </div>
      </Container>

      {drawerOpen && (
        <EditGlobalFeeDrawer
          fee={globalFee}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </>
  )
}
