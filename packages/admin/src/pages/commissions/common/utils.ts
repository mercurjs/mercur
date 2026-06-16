import { TFunction } from "i18next";

import {
  CommissionRate,
  CommissionRuleDTO,
  ScopeType,
} from "./types";

/**
 * Derive the scope-combo Type from the set of `reference`s present on a
 * rate's rules. (Type is not stored — SPEC-011.)
 */
export const deriveScopeType = (
  rules: CommissionRuleDTO[] = []
): ScopeType | null => {
  const refs = new Set(rules.map((r) => r.reference));
  const hasSeller = refs.has("seller");
  const hasType = refs.has("product_type");
  const hasCategory = refs.has("product_category");

  if (hasSeller && hasType) return "store_product_type";
  if (hasSeller && hasCategory) return "store_category";
  if (hasSeller) return "store";
  if (hasType) return "product_type";
  if (hasCategory) return "category";
  return null;
};

export const SCOPE_TYPE_LABEL_KEY: Record<ScopeType, string> = {
  store: "commissions.fields.scopeType.store",
  product_type: "commissions.fields.scopeType.productType",
  category: "commissions.fields.scopeType.category",
  store_product_type: "commissions.fields.scopeType.storeProductType",
  store_category: "commissions.fields.scopeType.storeCategory",
};

const SCOPE_TYPE_FALLBACK: Record<ScopeType, string> = {
  store: "Store",
  product_type: "Product Type",
  category: "Category",
  store_product_type: "Store + Product Type",
  store_category: "Store + Category",
};

export const getScopeTypeLabel = (
  rules: CommissionRuleDTO[] = [],
  t: TFunction
): string => {
  const scopeType = deriveScopeType(rules);
  if (!scopeType) return "-";
  return t(SCOPE_TYPE_LABEL_KEY[scopeType], SCOPE_TYPE_FALLBACK[scopeType]);
};

export const referenceIds = (
  rules: CommissionRuleDTO[] = [],
  reference: string
): string[] =>
  rules.filter((r) => r.reference === reference).map((r) => r.reference_id);

/** "ACME, EMCA +3" style summary of the chosen references. */
export const getScopeSummary = (
  rules: CommissionRuleDTO[] = []
): string => {
  if (!rules.length) return "-";
  const ids = rules.map((r) => r.reference_id);
  const head = ids.slice(0, 2).join(", ");
  const extra = ids.length - 2;
  return extra > 0 ? `${head} +${extra}` : head;
};

/** "10%" for percentage; "10,00 EUR / 12,00 USD / +1" for fixed. */
export const formatCommissionValue = (rate: CommissionRate): string => {
  if (rate.type === "percentage") {
    return `${rate.value}%`;
  }

  const values = rate.values ?? [];
  if (!values.length) {
    return rate.currency_code
      ? `${rate.value} ${rate.currency_code.toUpperCase()}`
      : `${rate.value}`;
  }

  const head = values
    .slice(0, 2)
    .map((v) => `${v.amount} ${v.currency_code.toUpperCase()}`)
    .join(" / ");
  const extra = values.length - 2;
  return extra > 0 ? `${head} / +${extra}` : head;
};

export const getIsActiveProps = (isEnabled: boolean, t: TFunction) =>
  isEnabled
    ? {
        color: "green" as const,
        label: t("commissions.status.enabled", "Active"),
      }
    : {
        color: "grey" as const,
        label: t("commissions.status.disabled", "Inactive"),
      };
