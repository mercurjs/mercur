import { useTranslation } from "react-i18next";
import { useMemo } from "react";

import type { Filter } from "../../../components/table/data-table";

/**
 * @Deprecated This should only be used for the deprecated DataTable component
 */
export const useOrderTableFilters = (): Filter[] => {
  const { t } = useTranslation();

  return useMemo(() => {
    const filters: Filter[] = [
      {
        key: "status",
        label: t("fields.status"),
        type: "select",
        multiple: true,
        options: [
          { label: t("orders.status.pending"), value: "pending" },
          { label: t("orders.status.completed"), value: "completed" },
          { label: t("orders.status.requires_action"), value: "requires_action" },
          { label: t("orders.status.canceled"), value: "canceled" },
        ],
      },
    ];

    const dateFilters: Filter[] = [
      { label: t("fields.createdAt"), key: "created_at" },
      { label: t("fields.updatedAt"), key: "updated_at" },
    ].map((f) => ({
      key: f.key,
      label: f.label,
      type: "date",
    }));

    filters.push(...dateFilters);

    return filters;
  }, [t]);
};
