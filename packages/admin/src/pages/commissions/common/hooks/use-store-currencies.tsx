import { useStore } from "../../../../hooks/api/store";

/**
 * The store's supported currency codes (lowercase), default first.
 */
export const useStoreCurrencies = () => {
  const { store, isPending } = useStore();

  const currencies = (store?.supported_currencies ?? [])
    .slice()
    .sort((a, b) => (a.is_default === b.is_default ? 0 : a.is_default ? -1 : 1))
    .map((c) => c.currency_code.toLowerCase());

  return { currencies, isPending };
};
