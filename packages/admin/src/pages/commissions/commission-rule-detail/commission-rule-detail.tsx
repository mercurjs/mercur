import { PencilSquare, Trash } from "@medusajs/icons";
import { Container, Heading, StatusBadge } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import { ActionMenu } from "../../../components/common/action-menu";
import { SectionRow } from "../../../components/common/section";
import { SingleColumnPage } from "../../../components/layout/pages";
import { useCommissionRule } from "../../../hooks/api/commissions";
import { useDeleteCommissionRuleAction } from "../common/hooks/use-delete-commission-rule-action";
import { useScopeReferenceNames } from "../common/hooks/use-scope-reference-names";
import { CommissionRate } from "../common/types";
import {
  formatCommissionValue,
  getIsActiveProps,
  getScopeSummary,
  getScopeTypeLabel,
  referenceIds,
} from "../common/utils";

const ScopeSection = ({ rule }: { rule: CommissionRate }) => {
  const { t } = useTranslation();
  const handleDelete = useDeleteCommissionRuleAction(rule);
  const statusProps = getIsActiveProps(rule.is_enabled, t);

  const { names } = useScopeReferenceNames(rule.rules);

  const stores = referenceIds(rule.rules, "seller");
  const productTypes = referenceIds(rule.rules, "product_type");
  const categories = referenceIds(rule.rules, "product_category");

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>{rule.name}</Heading>
        <div className="flex items-center gap-x-2">
          <StatusBadge color={statusProps.color}>
            {statusProps.label}
          </StatusBadge>
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    label: t("actions.edit"),
                    icon: <PencilSquare />,
                    to: "edit",
                  },
                ],
              },
              {
                actions: [
                  {
                    label: t("actions.delete"),
                    icon: <Trash />,
                    onClick: handleDelete,
                  },
                ],
              },
            ]}
          />
        </div>
      </div>
      <SectionRow
        title={t("commissions.fields.code", "Code")}
        value={rule.code}
      />
      <SectionRow
        title={t("commissions.rules.columns.type", "Type")}
        value={getScopeTypeLabel(rule.rules, t)}
      />
      {stores.length > 0 && (
        <SectionRow
          title={t("commissions.fields.stores", "Stores")}
          value={getScopeSummary(
            (rule.rules ?? []).filter((r) => r.reference === "seller"),
            names
          )}
        />
      )}
      {productTypes.length > 0 && (
        <SectionRow
          title={t("commissions.fields.productTypes", "Product Types")}
          value={getScopeSummary(
            (rule.rules ?? []).filter((r) => r.reference === "product_type"),
            names
          )}
        />
      )}
      {categories.length > 0 && (
        <SectionRow
          title={t("commissions.fields.categories", "Categories")}
          value={getScopeSummary(
            (rule.rules ?? []).filter(
              (r) => r.reference === "product_category"
            ),
            names
          )}
        />
      )}
    </Container>
  );
};

const CommissionSection = ({ rule }: { rule: CommissionRate }) => {
  const { t } = useTranslation();

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>{t("commissions.create.commission", "Commission")}</Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  label: t("actions.edit"),
                  icon: <PencilSquare />,
                  to: "edit-commission",
                },
              ],
            },
          ]}
        />
      </div>
      <SectionRow
        title={t("commissions.fields.type.label", "Type")}
        value={
          rule.type === "percentage"
            ? t("commissions.fields.type.percentage", "Percentage")
            : t("commissions.fields.type.fixed", "Fixed")
        }
      />
      <SectionRow
        title={t("commissions.global.value", "Value")}
        value={formatCommissionValue(rule)}
      />
      <SectionRow
        title={t("commissions.global.tax", "Tax")}
        value={
          rule.include_tax
            ? t("commissions.global.included", "Included in commission")
            : t("commissions.global.notIncluded", "Not included")
        }
      />
      <SectionRow
        title={t("commissions.global.shipping", "Shipping")}
        value={
          rule.include_shipping
            ? t("commissions.global.included", "Included in commission")
            : t("commissions.global.notIncluded", "Not included")
        }
      />
    </Container>
  );
};

export const CommissionRuleDetail = () => {
  const { id } = useParams();
  const { commission_rate, isLoading, isError, error } = useCommissionRule(
    id!,
    { fields: "*rules,*values" }
  ) as unknown as {
    commission_rate?: CommissionRate;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
  };

  if (isError) {
    throw error;
  }

  if (isLoading || !commission_rate) {
    return null;
  }

  return (
    <SingleColumnPage hasOutlet data={commission_rate}>
      <ScopeSection rule={commission_rate} />
      <CommissionSection rule={commission_rate} />
    </SingleColumnPage>
  );
};
