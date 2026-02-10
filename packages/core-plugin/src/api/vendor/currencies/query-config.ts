export const defaultVendorCurrencyFields = [
  "code",
  "name",
  "symbol",
  "symbol_native",
  "decimal_digits",
  "rounding",
]

export const vendorCurrencyQueryConfig = {
  list: {
    defaults: defaultVendorCurrencyFields,
    isList: true,
    defaultLimit: 200,
  },
  retrieve: {
    defaults: defaultVendorCurrencyFields,
    isList: false,
  },
}
