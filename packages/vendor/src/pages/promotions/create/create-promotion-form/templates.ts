const commonHiddenFields = ["type", "application_method.type"]

export const templates = [
  {
    id: "amount_off_offers",
    type: "standard",
    titleKey: "promotions.templates.amountOffOffers.title",
    descriptionKey: "promotions.templates.amountOffOffers.description",
    hiddenFields: [...commonHiddenFields],
    defaults: {
      is_automatic: "false",
      type: "standard",
      application_method: {
        allocation: "each",
        target_type: "items",
        type: "fixed",
      },
    },
  },
  {
    id: "percentage_off_product",
    type: "standard",
    titleKey: "promotions.templates.percentageOffProduct.title",
    descriptionKey: "promotions.templates.percentageOffProduct.description",
    hiddenFields: [...commonHiddenFields, "is_tax_inclusive"],
    defaults: {
      is_automatic: "false",
      type: "standard",
      application_method: {
        allocation: "each",
        target_type: "items",
        type: "percentage",
      },
    },
  },
  {
    id: "buy_get",
    type: "buyget",
    titleKey: "promotions.templates.buyGet.title",
    descriptionKey: "promotions.templates.buyGet.description",
    hiddenFields: [
      ...commonHiddenFields,
      "application_method.value",
      "application_method.allocation",
      "is_tax_inclusive",
    ],
    defaults: {
      is_automatic: "false",
      type: "buyget",
      application_method: {
        type: "percentage",
        value: 100,
        max_quantity: 1,
      },
    },
  },
]
