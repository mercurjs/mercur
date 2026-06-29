import { useTranslation } from "react-i18next";
import { useMemo } from "react";

import type { Filter } from "../../../components/table/data-table";

/**
 * @Deprecated This should only be used for the deprecated DataTable component
 */
export const useOrderTableFilters = (): Filter[] => {
  const { t } = useTranslation();

  return useMemo(() => {
    const filters: Filter[] = [];

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
