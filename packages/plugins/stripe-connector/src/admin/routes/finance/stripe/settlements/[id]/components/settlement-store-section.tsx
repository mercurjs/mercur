import { BuildingStorefront } from "@medusajs/icons"
import { Avatar, Container, Heading, Text } from "@medusajs/ui"
import { Link } from "react-router-dom"

import type { SettlementDetail } from "../../../../../../lib/client"

export const SettlementStoreSection = ({ settlement }: { settlement: SettlementDetail }) => {
  const seller = settlement.seller

  return (
    <Container className="divide-y p-0" data-testid="stripe-settlement-store-section">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Store</Heading>
      </div>
      <div className="px-6 py-4">
        {seller ? (
          <Link
            to={`/stores/${seller.id}`}
            className="outline-none focus-visible:shadow-borders-focus rounded-md"
            data-testid="stripe-settlement-store-link"
          >
            <div className="flex items-center gap-x-3">
              <Avatar size="small" variant="squared" fallback={<BuildingStorefront />} />
              <div className="flex flex-col">
                <Text size="small" leading="compact" weight="plus">
                  {seller.name}
                </Text>
                <Text size="small" leading="compact" className="text-ui-fg-subtle">
                  {seller.handle}
                </Text>
              </div>
            </div>
          </Link>
        ) : (
          <Text size="small" className="text-ui-fg-muted">
            The store was removed
          </Text>
        )}
      </div>
    </Container>
  )
}
