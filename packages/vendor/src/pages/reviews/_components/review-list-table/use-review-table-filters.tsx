import { useTranslation } from "react-i18next";
import { useMemo } from "react";

import type { Filter } from "@mercurjs/dashboard-shared";

import { useCustomers } from "@hooks/api/customers";

const customerLabel = (customer: {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}) => {
  const name = [customer.first_name, customer.last_name]
    .filter(Boolean)
    .join(" ");
  return name || customer.email || "-";
};

export const useReviewTableFilters = (): Filter[] => {
  const { t } = useTranslation();
  const { customers } = useCustomers({ limit: 100 });

  return useMemo(() => {
    const ratingFilter: Filter = {
      key: "rating",
      label: t("reviews.list.columns.rating"),
      type: "select",
      multiple: true,
      options: [5, 4, 3, 2, 1].map((value) => ({
        label: t("reviews.filters.stars", { count: value }),
        value: `${value}`,
      })),
    };

    const customerFilter: Filter = {
      key: "customer_id",
      label: t("reviews.list.columns.customer"),
      type: "select",
      multiple: true,
      options: (customers ?? []).map((customer) => ({
        label: customerLabel(customer),
        value: customer.id,
      })),
    };

    const createdFilter: Filter = {
      key: "created_at",
      label: t("fields.createdAt"),
      type: "date",
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

    return [ratingFilter, customerFilter, createdFilter, statusFilter];
  }, [t, customers]);
};
