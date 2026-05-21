import { CurrencyDollar, Plus } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { ActionMenu } from "../../../../components/common/action-menu"
import { getLocaleAmount } from "../../../../lib/money-amount-helpers"
import { OfferDetail, OfferPrice } from "../../common/types"

type Props = { offer: OfferDetail }

const findRuleValue = (price: OfferPrice, attribute: string) =>
  price.price_rules?.find((r) => r.attribute === attribute)?.value ?? null

export const OfferPricingSection = ({ offer }: Props) => {
  const { t } = useTranslation()
  const prices = offer.price_set?.prices ?? []

  return (
    <Container
      className="divide-y p-0"
      data-testid="offer-detail-pricing-section"
    >
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>{t("fields.price")}</Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  icon: <CurrencyDollar />,
                  label: t("offers.actions.manage_prices"),
                  to: "pricing",
                },
              ],
            },
          ]}
        />
      </div>

      {prices.length === 0 ? (
        <div className="flex flex-col items-start gap-y-2 px-6 py-8">
          <Text size="small" className="text-ui-fg-subtle">
            {t("offers.pricing.empty")}
          </Text>
          <Button size="small" variant="secondary" asChild>
            <Link to="pricing">
              <Plus />
              {t("offers.create.addPrice")}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-ui-fg-subtle">
              <tr>
                <th className="px-6 py-3 font-medium">{t("fields.price")}</th>
                <th className="px-6 py-3 font-medium">
                  {t("offers.fields.region")}
                </th>
                <th className="px-6 py-3 font-medium">
                  {t("offers.fields.customerGroup")}
                </th>
                <th className="px-6 py-3 font-medium">
                  {t("offers.fields.minQuantity")}
                </th>
                <th className="px-6 py-3 font-medium">
                  {t("offers.fields.maxQuantity")}
                </th>
                <th className="px-6 py-3 font-medium">
                  {t("offers.fields.priceList")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {prices.map((price) => {
                const regionId = findRuleValue(price, "region_id")
                const customerGroupId = findRuleValue(
                  price,
                  "customer_group_id",
                )
                return (
                  <tr key={price.id ?? `${price.currency_code}-${price.amount}`}>
                    <td className="px-6 py-3">
                      {getLocaleAmount(price.amount, price.currency_code)}
                    </td>
                    <td className="px-6 py-3">{regionId ?? "—"}</td>
                    <td className="px-6 py-3">{customerGroupId ?? "—"}</td>
                    <td className="px-6 py-3">{price.min_quantity ?? "—"}</td>
                    <td className="px-6 py-3">{price.max_quantity ?? "—"}</td>
                    <td className="px-6 py-3">
                      <Badge size="2xsmall" color="grey">
                        {t("offers.fields.base")}
                      </Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Container>
  )
}
