import { ReadonlyURLSearchParams } from "next/navigation"

const getOption = (label: string) => {
  switch (label) {
    case "size":
      return "variants.size"
    case "color":
      return "variants.color"
    case "condition":
      return "variants.condition"
    case "rating":
      return "average_rating"
    default:
      return ""
  }
}

export const getFacedFilters = (filters: ReadonlyURLSearchParams): string => {
  let facet = ""

  let minPrice = null
  let maxPrice = null

  let query = ""
  let rating = ""

  for (const [key, value] of filters.entries()) {
    if (
      key !== "min_price" &&
      key !== "max_price" &&
      key !== "sale" &&
      key !== "query" &&
      key !== "page" &&
      key !== "products[page]" &&
      key !== "sortBy" &&
      key !== "rating"
    ) {
      let values = ""
      const splittedSize = value.split(",")
      if (splittedSize.length > 1) {
        splittedSize.map(
          (value, index) =>
            (values += `${getOption(key)}:"${value}" ${
              index + 1 < splittedSize.length ? "OR " : ""
            }`)
        )
      } else {
        values += `${getOption(key)}:"${splittedSize[0]}"`
      }
      facet += ` AND ${values}`
    } else {
      if (key === "min_price") minPrice = value
      if (key === "max_price") maxPrice = value

      if (key === "query") query = ` AND products.title:"${value}"`

      if (key === "rating") {
        let values = ""
        const splited = value.split(",")
        if (splited.length > 1) {
          splited.map(
            (value, index) =>
              (values += `${getOption(key)} >= ${value} ${
                index + 1 < splited.length ? "OR " : ""
              }`)
          )
        } else {
          values += `${getOption(key)} >=${splited[0]}`
        }
        rating += ` AND ${values}`
      }
    }
  }

  const priceFilter =
    minPrice && maxPrice
      ? ` AND variants.prices.amount:${minPrice} TO ${maxPrice}`
      : minPrice
      ? ` AND variants.prices.amount >= ${minPrice}`
      : maxPrice
      ? ` AND variants.prices.amount <= ${maxPrice}`
      : ""

  return facet + priceFilter + rating
}
