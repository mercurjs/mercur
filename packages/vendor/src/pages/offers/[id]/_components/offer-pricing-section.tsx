import { CurrencyDollar } from "@medusajs/icons"
import { Button, Container, Heading } from "@medusajs/ui"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { ActionMenu } from "../../../../components/common/action-menu"
import { NoRecords } from "../../../../components/common/empty-table-content"
import { getLocaleAmount } from "../../../../lib/money-amount-helpers"
import { OfferDetail, OfferPrice } from "../../common/types"

type Props = { offer: OfferDetail }

const PAGE_STEP = 3

const hasRules = (price: OfferPrice) => (price.rules_count ?? 0) > 0

export const OfferPricingSection = ({ offer }: Props) => {
  const { t } = useTranslation()

  const prices = (offer.price_set?.prices ?? [])
    .filter((p) => !hasRules(p))
    .sort((a, b) => (a.currency_code ?? "").localeCompare(b.currency_code ?? ""))

  const hasPrices = prices.length > 0
  const [pageSize, setPageSize] = useState(PAGE_STEP)
  const displayPrices = prices.slice(0, pageSize)

  return (
    <Container
      className="flex flex-col divide-y p-0"
      data-testid="offer-detail-prices-section"
    >
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("labels.prices")}</Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  label: t("actions.edit"),
                  icon: <CurrencyDollar />,
                  to: "pricing",
                },
              ],
            },
          ]}
        />
      </div>

      {!hasPrices && <NoRecords className="h-60" />}
      {displayPrices.map((price) => (
        <div
          key={price.id ?? `${price.currency_code}-${price.amount}`}
          className="txt-small text-ui-fg-subtle flex justify-between px-6 py-4"
        >
          <span className="font-medium">
            {price.currency_code.toUpperCase()}
          </span>
          <span>{getLocaleAmount(price.amount, price.currency_code)}</span>
        </div>
      ))}
      {hasPrices && prices.length > PAGE_STEP && (
        <div className="txt-small text-ui-fg-subtle flex items-center justify-end px-6 py-4">
          <Button
            onClick={() => setPageSize((p) => p + PAGE_STEP)}
            disabled={pageSize >= prices.length}
            className="-mr-3 text-blue-500"
            variant="transparent"
          >
            {t("actions.showMore")}
          </Button>
        </div>
      )}
    </Container>
  )
}
