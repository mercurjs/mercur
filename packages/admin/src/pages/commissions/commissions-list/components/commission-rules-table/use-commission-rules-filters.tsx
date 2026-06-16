import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Filter } from "../../../../../components/table/data-table";

/**
 * Filters for the Commission Rules list (Figma "Add filter"): Status
 * (`is_enabled`) and commission Type (`type`). Both map straight to the
 * `/admin/commission-rates` list params.
 */
export const useCommissionRulesFilters = (): Filter[] => {
  const { t } = useTranslation();

  return useMemo(
    () => [
      {
        key: "type",
        label: t("commissions.fields.type.label", "Type"),
        type: "select",
        multiple: true,
        options: [
          {
            label: t("commissions.fields.type.percentage", "Percentage"),
            value: "percentage",
          },
          {
            label: t("commissions.fields.type.fixed", "Fixed"),
            value: "fixed",
          },
        ],
      },
      {
        key: "is_enabled",
        label: t("commissions.fields.status", "Status"),
        type: "select",
        options: [
          { label: t("commissions.status.enabled", "Active"), value: "true" },
          {
            label: t("commissions.status.disabled", "Inactive"),
            value: "false",
          },
        ],
      },
    ],
    [t]
  );
};
