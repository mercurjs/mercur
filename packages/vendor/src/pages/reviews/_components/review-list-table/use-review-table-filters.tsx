import { useTranslation } from "react-i18next";
import { useMemo } from "react";

import type { Filter } from "@mercurjs/dashboard-shared";

export const useReviewTableFilters = (): Filter[] => {
  const { t } = useTranslation();

  return useMemo(() => {
    const ratingFilter: Filter = {
      key: "rating",
      label: t("reviews.list.columns.rating"),
      type: "select",
      multiple: true,
      options: [5, 4, 3, 2, 1].map((value) => ({
        label: `${value}`,
        value: `${value}`,
      })),
    };

    const statusFilter: Filter = {
      key: "status",
      label: t("reviews.list.columns.status"),
      type: "select",
      multiple: true,
      options: [
        { label: t("reviews.status.published"), value: "published" },
        { label: t("reviews.status.pending"), value: "pending" },
        { label: t("reviews.status.rejected"), value: "rejected" },
      ],
    };

    const dateFilters: Filter[] = [
      { label: t("fields.createdAt"), key: "created_at" },
      { label: t("fields.updatedAt"), key: "updated_at" },
    ].map((f) => ({
      key: f.key,
      label: f.label,
      type: "date",
    }));

    return [ratingFilter, statusFilter, ...dateFilters];
  }, [t]);
};
