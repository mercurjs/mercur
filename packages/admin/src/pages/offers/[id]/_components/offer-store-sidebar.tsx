import { TriangleRightMini } from "@medusajs/icons"
import { Avatar, Container, Heading } from "@medusajs/ui"
import { DisplayExtensionZone } from "@mercurjs/dashboard-shared"
import { SellerDTO } from "@mercurjs/types"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

type Props = {
  seller?: Partial<Pick<SellerDTO, "id" | "name" | "handle">> | null
}

export const OfferStoreSidebar = ({ seller }: Props) => {
  const { t } = useTranslation()

  if (!seller?.id) {
    return null
  }

  const name = seller.name ?? seller.id
  const handle = seller.handle ?? ""
  const link = `/stores/${seller.id}`

  const Inner = (
    <div
      className="shadow-elevation-card-rest bg-ui-bg-component rounded-md px-4 py-2 transition-colors"
      data-testid="offer-detail-store-sidebar"
    >
      <div className="flex items-center gap-3">
        <Avatar
          size="small"
          fallback={(name?.[0] ?? "?").toUpperCase()}
          data-testid="offer-detail-store-avatar"
        />
        <div className="flex flex-1 flex-col">
          <span
            className="text-ui-fg-base font-medium"
            data-testid="offer-detail-store-name"
          >
            {name}
          </span>
          {handle && (
            <span
              className="text-ui-fg-subtle"
              data-testid="offer-detail-store-handle"
            >
              {handle}
            </span>
          )}
        </div>
        <div className="size-7 flex items-center justify-center">
          <TriangleRightMini className="text-ui-fg-muted rtl:rotate-180" />
        </div>
      </div>
    </div>
  )

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("offers.detail.store")}</Heading>
      </div>
      <div className="txt-small flex flex-col gap-2 px-2 pb-2">
        <Link
          to={link}
          className="outline-none focus-within:shadow-borders-interactive-with-focus rounded-md [&:hover>div]:bg-ui-bg-component-hover"
          data-testid="offer-detail-store-link"
        >
          {Inner}
        </Link>
      </div>
      <DisplayExtensionZone model="offer" zone="store" data={seller} />
    </Container>
  )
}
