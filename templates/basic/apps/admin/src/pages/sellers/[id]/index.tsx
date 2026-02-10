// Override: /sellers/:id
// Custom seller detail page - demonstrates compound component customization

import { Container, Heading, Text, Badge, Button } from "@medusajs/ui"
import { Link } from "react-router-dom"
import { SellerDetailPage } from "@mercurjs/core-admin/pages/sellers/[id]"

// Custom section - shows marketplace-specific info
function MarketplaceStatsSection() {
  const { seller, orders, products } = SellerDetailPage.useContext()

  const totalOrders = orders?.count ?? 0
  const totalProducts = products?.count ?? 0

  return (
    <Container className="mt-2" data-testid="marketplace-stats-section">
      <div className="flex items-center justify-between mb-4">
        <Heading level="h2">Marketplace Stats</Heading>
        <Badge color="purple">Custom Section</Badge>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-ui-bg-subtle rounded-lg p-4">
          <Text className="text-ui-fg-subtle text-sm">Total Orders</Text>
          <Text className="text-2xl font-bold">{totalOrders}</Text>
        </div>
        <div className="bg-ui-bg-subtle rounded-lg p-4">
          <Text className="text-ui-fg-subtle text-sm">Total Products</Text>
          <Text className="text-2xl font-bold">{totalProducts}</Text>
        </div>
        <div className="bg-ui-bg-subtle rounded-lg p-4">
          <Text className="text-ui-fg-subtle text-sm">Status</Text>
          <Text className="text-2xl font-bold">{seller.store_status || "N/A"}</Text>
        </div>
      </div>
    </Container>
  )
}

export const Component = () => {
  return (
    <SellerDetailPage>
      {/* Core section */}
      <SellerDetailPage.GeneralSection />

      {/* Custom section added between core sections */}
      <MarketplaceStatsSection />

      {/* Test modal link - verifies isModal routing */}
      <Container className="mt-2">
        <div className="flex items-center justify-between">
          <Heading level="h2">Routing Test</Heading>
          <Link to="test-modal">
            <Button variant="secondary">Open Test Modal</Button>
          </Link>
        </div>
        <Text className="text-ui-fg-subtle mt-2">
          Click the button to test modal routing. The modal should render over this page
          and return here when closed.
        </Text>
      </Container>

      {/* Only show Orders and Products, skip CustomerGroups */}
      <SellerDetailPage.OrdersSection />
      <SellerDetailPage.ProductsSection />

      {/* CustomerGroupsSection removed from this view */}
    </SellerDetailPage>
  )
}
