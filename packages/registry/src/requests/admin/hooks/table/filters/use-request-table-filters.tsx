import { useTranslation } from "react-i18next";
import { useMemo } from "react";

import type { Filter } from "@mercurjs/dashboard-shared";

export const useRequestTableFilters = (): Filter[] => {
  const { t } = useTranslation();

  return useMemo(() => {
    const filters: Filter[] = [
      {
        key: "request_status",
        label: "Status",
        type: "select",
        multiple: true,
        options: [
          { label: "Draft", value: "draft" },
          { label: "Pending", value: "pending" },
          { label: "Accepted", value: "accepted" },
          { label: "Rejected", value: "rejected" },
        ],
      },
    ];

    const dateFilters: Filter[] = [
      { label: t("fields.createdAt"), key: "created_at" },
      { label: t("fields.updatedAt"), key: "updated_at" },
    ].map((f) => ({
      key: f.key,
      label: f.label,
      type: "date" as const,
    }));

    filters.push(...dateFilters);

    return filters;
  }, [t]);
};
