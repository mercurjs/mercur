import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { Filter } from "@mercurjs/dashboard-shared";

import { RETURN_REQUEST_STATUSES } from "../../common/utils";

export const useReturnRequestTableFilters = (): Filter[] => {
  const { t } = useTranslation();

  return useMemo(
    () => [
      {
        key: "status",
        label: t("returnRequests.list.columns.status"),
        type: "select",
        multiple: true,
        options: RETURN_REQUEST_STATUSES.map((status) => ({
          label: t(`returnRequests.status.${status}`),
          value: status,
        })),
      },
      {
        key: "created_at",
        label: t("fields.createdAt"),
        type: "date",
      },
    ],
    [t],
  );
};
