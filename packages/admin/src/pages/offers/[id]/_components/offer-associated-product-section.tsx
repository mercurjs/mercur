import { Container, Heading } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import { useTranslation } from "react-i18next"

import { DisplayExtensionZone } from "@mercurjs/dashboard-shared"

import { SidebarLink } from "../../../../components/common/sidebar-link/sidebar-link"
import { Thumbnail } from "../../../../components/common/thumbnail"

/**
 * Sidebar "Associated product" card (SPEC-010). Links to the full admin
 * product page; the offer detail is an offer-scoped view of the same
 * product.
 */
export const OfferAssociatedProductSection = ({
  product,
}: {
  product: Pick<HttpTypes.AdminProduct, "id" | "title" | "handle" | "thumbnail">
}) => {
  const { t } = useTranslation()

  return (
    <Container className="p-0" data-testid="offer-associated-product-section">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("offers.detail.associatedProduct")}</Heading>
      </div>
      <SidebarLink
        to={`/products/${product.id}`}
        labelKey={product.title}
        descriptionKey={product.handle ? `/${product.handle}` : ""}
        icon={<Thumbnail src={product.thumbnail ?? null} />}
        dataTestid="offer-associated-product-link"
      />
      <DisplayExtensionZone
        model="offer"
        zone="associated-product"
        data={product}
      />
    </Container>
  )
}
