import { TFunction } from "i18next";

import {
  CommissionRate,
  CommissionRuleDTO,
  ScopeType,
  SCOPE_TYPE_DIMENSIONS,
} from "./types";

type ScopeSelections = {
  stores: string[];
  productTypes: string[];
  categories: string[];
};

type RulePayload = { reference: string; reference_id: string };

/**
 * Expand a scope-combo selection into the flat `{ reference, reference_id }`
 * rule rows the API stores (one row per chosen dimension value).
 */
export const buildRulesFromScope = (
  scopeType: ScopeType,
  { stores, productTypes, categories }: ScopeSelections
): RulePayload[] => {
  const dimensions = SCOPE_TYPE_DIMENSIONS[scopeType];
  const rules: RulePayload[] = [];

  if (dimensions.includes("seller")) {
    stores.forEach((id) => rules.push({ reference: "seller", reference_id: id }));
  }
  if (dimensions.includes("product_type")) {
    productTypes.forEach((id) =>
      rules.push({ reference: "product_type", reference_id: id })
    );
  }
  if (dimensions.includes("product_category")) {
    categories.forEach((id) =>
      rules.push({ reference: "product_category", reference_id: id })
    );
  }

  return rules;
};

/**
 * Diff the rate's existing rules against the desired set and produce the
 * `{ create, delete }` payload for the batch-rules endpoint. Rules are
 * matched by `reference` + `reference_id`.
 */
export const diffScopeRules = (
  existing: CommissionRuleDTO[] = [],
  desired: RulePayload[] = []
): { create: RulePayload[]; delete: string[] } => {
  const key = (r: { reference: string; reference_id: string }) =>
    `${r.reference}:${r.reference_id}`;

  const existingByKey = new Map(existing.map((r) => [key(r), r]));
  const desiredKeys = new Set(desired.map(key));

  const create = desired.filter((r) => !existingByKey.has(key(r)));
  const remove = existing
    .filter((r) => !desiredKeys.has(key(r)))
    .map((r) => r.id);

  return { create, delete: remove };
};

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

/**
 * "ACME, EMCA +3" style summary of the chosen references. When a `names`
 * map (`reference_id -> name`) is provided, ids are rendered as their
 * resolved names; ids missing from the map fall back to the raw id.
 */
export const getScopeSummary = (
  rules: CommissionRuleDTO[] = [],
  names?: Record<string, string>
): string => {
  if (!rules.length) return "-";
  const labels = rules.map((r) => names?.[r.reference_id] ?? r.reference_id);
  const head = labels.slice(0, 2).join(", ");
  const extra = labels.length - 2;
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
        label: t("commissions.status.enabled"),
      }
    : {
        color: "red" as const,
        label: t("commissions.status.disabled"),
      };

/** Form `fixed_values` map → the API `values[]` payload (one per currency). */
export const buildValuesPayload = (
  currencies: string[],
  fixedValues: Record<string, number> = {}
): { currency_code: string; amount: number }[] =>
  currencies.map((code) => ({
    currency_code: code,
    amount: Number(fixedValues[code] ?? 0),
  }));

/** A rate's `values[]` → the form `fixed_values` map (for edit defaults). */
export const fixedValuesFromRate = (
  rate: CommissionRate
): Record<string, number> =>
  Object.fromEntries(
    (rate.values ?? []).map((v) => [v.currency_code, v.amount])
  );
