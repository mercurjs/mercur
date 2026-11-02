import { BuildingStorefront } from "@medusajs/icons"
import { Container, Heading, Text } from "@medusajs/ui"
import { SidebarLink } from "@mercurjs/dashboard-shared"

import type { SettlementDetail } from "../../../../../../lib/client"

export const SettlementStoreSection = ({ settlement }: { settlement: SettlementDetail }) => {
  const seller = settlement.payout_account?.seller

  return (
    <Container className="p-0" data-testid="stripe-settlement-store-section">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2" data-testid="stripe-settlement-store-heading">
          Store
        </Heading>
      </div>
      {seller ? (
        <SidebarLink
          to={`/stores/${seller.id}`}
          labelKey={seller.name}
          descriptionKey={seller.handle}
          icon={<BuildingStorefront />}
          dataTestid="stripe-settlement-store-link"
        />
      ) : (
        <div className="border-t px-6 py-4">
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            The store was removed
          </Text>
        </div>
      )}
    </Container>
  )
}
