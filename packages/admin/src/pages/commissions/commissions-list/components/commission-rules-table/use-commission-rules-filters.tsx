import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Filter } from "../../../../../components/table/data-table";

/**
 * Filters for the Commission Rules list (Figma "Add filter"): Status
 * (`is_enabled`) and rule scope Type (`scope_type`). `scope_type` is a
 * virtual filter resolved server-side from each rate's rules.
 */
export const useCommissionRulesFilters = (): Filter[] => {
  const { t } = useTranslation();

  return useMemo(
    () => [
      {
        key: "scope_type",
        label: t("commissions.fields.scopeType.label"),
        type: "select",
        multiple: true,
        options: [
          {
            label: t("commissions.fields.scopeType.store"),
            value: "store",
          },
          {
            label: t("commissions.fields.scopeType.productType"),
            value: "product_type",
          },
          {
            label: t("commissions.fields.scopeType.category"),
            value: "category",
          },
          {
            label: t("commissions.fields.scopeType.storeProductType"),
            value: "store_product_type",
          },
          {
            label: t("commissions.fields.scopeType.storeCategory"),
            value: "store_category",
          },
        ],
      },
      {
        key: "is_enabled",
        label: t("commissions.fields.status"),
        type: "select",
        options: [
          { label: t("commissions.status.enabled"), value: "true" },
          {
            label: t("commissions.status.disabled"),
            value: "false",
          },
        ],
      },
    ],
    [t]
  );
};
