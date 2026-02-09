// Override: /sellers
// Custom sellers list page - adds marketplace branding

import { Container, Heading, Text, Badge } from "@medusajs/ui"
import { SellersListTable } from "@mercurjs/core-admin/pages/sellers"

export const Component = () => {
  return (
    <div>
      {/* Custom header banner */}
      <Container className="mb-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10" data-testid="sellers-custom-header">
        <div className="flex items-center justify-between py-2">
          <div>
            <Heading level="h1">Marketplace Vendors</Heading>
            <Text className="text-ui-fg-subtle">
              Manage your marketplace sellers and their stores
            </Text>
          </div>
          <Badge color="purple" size="large">
            Mercur Marketplace
          </Badge>
        </div>
      </Container>

      {/* Original table component from core */}
      <SellersListTable />
    </div>
  )
}
