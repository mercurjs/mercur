import { HttpTypes } from "@medusajs/types"

export function findParentCategoryForGrandchild(
  categoryHandle: string,
  categories: HttpTypes.StoreProductCategory[],
  parentCategories: HttpTypes.StoreProductCategory[]
): HttpTypes.StoreProductCategory | null {
  for (const mainCategory of categories) {
    const isGrandchild = mainCategory.category_children?.some(
      (child) => child.handle === categoryHandle
    )

    if (isGrandchild && mainCategory.parent_category_id) {
      const parentCategory = parentCategories.find(
        (p) => p.id === mainCategory.parent_category_id
      )
      if (parentCategory) {
        return parentCategory
      }
    }
  }

  return null
}

export function getActiveParentHandle(
  category: string | string[] | undefined,
  categories: HttpTypes.StoreProductCategory[],
  parentCategories: HttpTypes.StoreProductCategory[]
): string | null {
  if (!category || !parentCategories) return null

  const categoryHandle = Array.isArray(category) ? category[0] : category

  const isParentCategory = parentCategories.some((p) => p.handle === categoryHandle)
  if (isParentCategory) return categoryHandle

  const mainCategory = categories.find((c) => c.handle === categoryHandle)
  if (mainCategory?.parent_category_id) {
    const parentCategory = parentCategories.find(
      (p) => p.id === mainCategory.parent_category_id
    )
    return parentCategory?.handle ?? null
  }

  const parentOfMainCategory = findParentCategoryForGrandchild(
    categoryHandle,
    categories,
    parentCategories
  )

  return parentOfMainCategory?.handle ?? null
}

export function isGrandchildCategory(
  category: string | string[] | undefined,
  categories: HttpTypes.StoreProductCategory[]
): boolean {
  if (!category) return false
  
  const categoryHandle = Array.isArray(category) ? category[0] : category
  
  return categories.some((cat) =>
    cat.category_children?.some((child) => child.handle === categoryHandle)
  )
}

export function findParentCategoryHandle(
  category: string | string[] | undefined,
  categories: HttpTypes.StoreProductCategory[]
): string | null {
  if (!category) return null
  
  const categoryHandle = Array.isArray(category) ? category[0] : category
  const isGrandchild = isGrandchildCategory(categoryHandle, categories)
  
  if (!isGrandchild) return null
  
  for (const cat of categories) {
    if (cat.category_children?.some((child) => child.handle === categoryHandle)) {
      return cat.handle
    }
  }
  
  return null
}

export function filterCategoriesByParent(
  activeParentHandle: string | null,
  categories: HttpTypes.StoreProductCategory[],
  parentCategories: HttpTypes.StoreProductCategory[]
): HttpTypes.StoreProductCategory[] {
  if (!activeParentHandle || !parentCategories) {
    return categories
  }

  const activeParent = parentCategories.find((p) => p.handle === activeParentHandle)
  if (!activeParent) {
    return categories
  }

  return categories.filter((cat) => cat.parent_category_id === activeParent.id)
}