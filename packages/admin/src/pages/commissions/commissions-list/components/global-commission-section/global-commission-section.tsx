import { PencilSquare } from "@medusajs/icons";
import { Container, Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { ActionMenu } from "../../../../../components/common/action-menu";
import { SectionRow } from "../../../../../components/common/section";
import { Skeleton } from "../../../../../components/common/skeleton";
import { useDefaultCommission } from "../../../../../hooks/api/commissions";
import { CommissionRate } from "../../../common/types";
import { formatCommissionValue } from "../../../common/utils";

const GLOBAL_COMMISSION_ROWS = [
  { key: "type", fallback: "Type" },
  { key: "value", fallback: "Value" },
  { key: "tax", fallback: "Tax" },
  { key: "shipping", fallback: "Shipping" },
] as const;

export const GlobalCommissionSection = () => {
  const { t } = useTranslation();
  const { default_commission, isLoading, isError, error } =
    useDefaultCommission();

  if (isError) {
    throw error;
  }

  const rate = default_commission as CommissionRate | undefined;

  return (
    <Container className="divide-y p-0" data-testid="global-commission-section">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>{t("commissions.global.title")}</Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  label: t("actions.edit"),
                  icon: <PencilSquare />,
                  to: "edit-global",
                },
              ],
            },
          ]}
        />
      </div>
      {isLoading || !rate
        ? GLOBAL_COMMISSION_ROWS.map(({ key, fallback }) => (
            <SectionRow
              key={key}
              title={t(`commissions.global.${key}`, fallback)}
              value={<Skeleton className="h-5 w-24" />}
            />
          ))
        : (
          <>
            <SectionRow
              title={t("commissions.global.type")}
              value={
                rate.type === "percentage"
                  ? t("commissions.fields.type.percentage")
                  : t("commissions.fields.type.fixed")
              }
            />
            <SectionRow
              title={t("commissions.global.value")}
              value={formatCommissionValue(rate)}
            />
            <SectionRow
              title={t("commissions.global.tax")}
              value={
                rate.include_tax
                  ? t("commissions.global.included")
                  : t("commissions.global.notIncluded")
              }
            />
            <SectionRow
              title={t("commissions.global.shipping")}
              value={
                rate.include_shipping
                  ? t("commissions.global.included")
                  : t("commissions.global.notIncluded")
              }
            />
          </>
        )}
    </Container>
  );
};
