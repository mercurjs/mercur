/**
 * Builds the attribute-list query for the "Add existing attributes" picker on
 * an existing product. The server scopes non-global attributes by category, so
 * without `category_id` the picker offers attributes linked only to other
 * categories — the same filter the product creation form already applies.
 */
export const buildAddExistingAttributesQuery = <T extends object>(
  searchParams: T,
  categoryId: string | null | undefined
) => ({
  ...searchParams,
  category_id: categoryId ?? undefined,
  scope: "product" as const,
})
