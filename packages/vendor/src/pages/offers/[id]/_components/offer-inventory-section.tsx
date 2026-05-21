import { Buildings, Plus } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { ActionMenu } from "../../../../components/common/action-menu"
import { OfferDetail } from "../../common/types"

type Props = { offer: OfferDetail }

export const OfferInventorySection = ({ offer }: Props) => {
  const { t } = useTranslation()
  const links = offer.inventory_item_link ?? []

  return (
    <Container
      className="divide-y p-0"
      data-testid="offer-detail-inventory-section"
    >
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>{t("offers.inventory.header")}</Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  icon: <Buildings />,
                  label: t("offers.actions.manage_inventory"),
                  to: "inventory",
                },
              ],
            },
          ]}
        />
      </div>

      {links.length === 0 ? (
        <div className="flex flex-col items-start gap-y-2 px-6 py-8">
          <Text size="small" className="text-ui-fg-subtle">
            {t("offers.inventory.empty")}
          </Text>
          <Button size="small" variant="secondary" asChild>
            <Link to="inventory">
              <Plus />
              {t("offers.create.addInventoryItem")}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="divide-y">
          {links.map((link) => {
            const item = link.inventory_item
            const levels = item?.location_levels ?? []
            const stocked = levels.reduce(
              (s, l) => s + (l.stocked_quantity ?? 0),
              0,
            )
            const reserved = levels.reduce(
              (s, l) => s + (l.reserved_quantity ?? 0),
              0,
            )
            return (
              <div
                key={link.id ?? link.inventory_item_id}
                className="flex items-center justify-between gap-x-3 px-6 py-4"
              >
                <div className="flex flex-col overflow-hidden">
                  {item?.id ? (
                    <Link
                      to={`/inventory/${item.id}`}
                      className="text-ui-fg-interactive truncate text-sm font-medium hover:underline"
                    >
                      {item.title ?? item.sku ?? item.id}
                    </Link>
                  ) : (
                    <Text size="small" weight="plus" className="truncate">
                      {link.inventory_item_id}
                    </Text>
                  )}
                  {item?.sku && (
                    <Text
                      size="xsmall"
                      className="text-ui-fg-subtle truncate font-mono"
                    >
                      {item.sku}
                    </Text>
                  )}
                </div>
                <div className="flex items-center gap-x-3">
                  <Badge size="2xsmall">
                    {t("offers.fields.requiredQuantity")}:{" "}
                    {link.required_quantity ?? 1}
                  </Badge>
                  <Text size="small" className="text-ui-fg-subtle">
                    {stocked - reserved} / {stocked}
                  </Text>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Container>
  )
}
