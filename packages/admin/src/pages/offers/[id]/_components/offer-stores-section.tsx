import { TriangleRightMini } from "@medusajs/icons"
import { Container, Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { OfferProduct } from "../../common/types"

/**
 * Sidebar "Stores" card for the product-shaped admin offer detail
 * (SPEC-010). Admin is platform-wide, so a product can be offered by
 * several stores; this lists the distinct stores (each linking to its
 * store page). The admin-only counterpart to the vendor detail's single
 * Associated-product card.
 */
export const OfferStoresSection = ({ product }: { product: OfferProduct }) => {
  const { t } = useTranslation()

  const stores = (() => {
    const seen = new Map<string, { id: string; name: string; handle?: string | null }>()
    for (const variant of product.variants ?? []) {
      for (const offer of variant.offers ?? []) {
        const seller = offer.seller
        if (seller?.id && !seen.has(seller.id)) {
          seen.set(seller.id, {
            id: seller.id,
            name: seller.name ?? seller.id,
            handle: seller.handle,
          })
        }
      }
    }
    return Array.from(seen.values())
  })()

  if (stores.length === 0) {
    return null
  }

  return (
    <Container className="p-0" data-testid="offer-stores-section">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("offers.detail.stores")}</Heading>
      </div>
      <div className="txt-small flex flex-col gap-2 px-2 pb-2">
        {stores.map((store) => (
          <Link
            key={store.id}
            to={`/stores/${store.id}`}
            className="outline-none focus-within:shadow-borders-interactive-with-focus rounded-md [&:hover>div]:bg-ui-bg-component-hover"
          >
            <div className="shadow-elevation-card-rest bg-ui-bg-component rounded-md px-4 py-2 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex flex-1 flex-col overflow-hidden">
                  <span className="text-ui-fg-base truncate font-medium">
                    {store.name}
                  </span>
                  {store.handle && (
                    <span className="text-ui-fg-subtle truncate">
                      /{store.handle}
                    </span>
                  )}
                </div>
                <div className="size-7 flex items-center justify-center">
                  <TriangleRightMini className="text-ui-fg-muted rtl:rotate-180" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Container>
  )
}
