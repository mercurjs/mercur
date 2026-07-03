import { useMemo } from "react";

import { useProductCategories } from "../../../../hooks/api/categories";
import { useProductTypes } from "../../../../hooks/api/product-types";
import { useSellers } from "../../../../hooks/api/sellers";
import { CommissionRuleDTO } from "../types";

const idsFor = (rules: CommissionRuleDTO[] = [], reference: string): string[] =>
  rules.filter((r) => r.reference === reference).map((r) => r.reference_id);

/**
 * Resolve the `reference_id`s on a rate's rules to human-readable names
 * (store / product type / category), so the scope sections render names
 * instead of raw ids. Returns an `id -> name` map per dimension and a
 * combined `isLoading` flag.
 */
export const useScopeReferenceNames = (rules: CommissionRuleDTO[] = []) => {
  const sellerIds = useMemo(() => idsFor(rules, "seller"), [rules]);
  const productTypeIds = useMemo(
    () => idsFor(rules, "product_type"),
    [rules]
  );
  const categoryIds = useMemo(
    () => idsFor(rules, "product_category"),
    [rules]
  );

  const { sellers, isLoading: sellersLoading } = useSellers(
    { id: sellerIds, fields: "id,name", limit: sellerIds.length || 1 },
    { enabled: sellerIds.length > 0 }
  );

  const { product_types: productTypes, isLoading: typesLoading } =
    useProductTypes(
      { id: productTypeIds, fields: "id,value", limit: productTypeIds.length || 1 },
      { enabled: productTypeIds.length > 0 }
    );

  const { product_categories: categories, isLoading: categoriesLoading } =
    useProductCategories(
      {
        id: categoryIds,
        fields: "id,name",
        limit: categoryIds.length || 1,
      },
      { enabled: categoryIds.length > 0 }
    );

  const names = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of (sellers ?? []) as { id: string; name: string }[]) {
      map[s.id] = s.name;
    }
    for (const pt of (productTypes ?? []) as { id: string; value: string }[]) {
      map[pt.id] = pt.value;
    }
    for (const c of (categories ?? []) as { id: string; name: string }[]) {
      map[c.id] = c.name;
    }
    return map;
  }, [sellers, productTypes, categories]);

  return {
    names,
    isLoading:
      (sellerIds.length > 0 && sellersLoading) ||
      (productTypeIds.length > 0 && typesLoading) ||
      (categoryIds.length > 0 && categoriesLoading),
  };
};
