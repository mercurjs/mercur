import { UniqueIdentifier } from "@dnd-kit/core"
import { Badge } from "@medusajs/ui"
import { useMemo, useState } from "react"
import { useWatch } from "react-hook-form"

import { useTranslation } from "react-i18next"
import { useTabbedForm } from "../../../../../components/tabbed-form/tabbed-form"
import { defineTabMeta } from "../../../../../components/tabbed-form/types"
import { useProductCategories } from "../../../../../hooks/api/categories"
import { CategoryTree } from "../../../common/components/category-tree"
import { CategoryTreeItem } from "../../../common/types"
import { insertCategoryTreeItem } from "../../../common/utils"
import { CreateCategorySchema } from "./schema"

const ID = "new-item"

const Root = () => {
  const { t } = useTranslation()
  const form = useTabbedForm<CreateCategorySchema>()
  const [snapshot, setSnapshot] = useState<CategoryTreeItem[]>([])

  const shouldFreeze = form.formState.isSubmitting

  const { product_categories, isPending, isError, error } =
    useProductCategories({
      parent_category_id: "null",
      limit: 9999,
      fields: "id,name,parent_category_id,rank,category_children,rank",
      include_descendants_tree: true,
    })

  const parentCategoryId = useWatch({
    control: form.control,
    name: "parent_category_id",
  })

  const watchedRank = useWatch({
    control: form.control,
    name: "rank",
  })

  const watchedName = useWatch({
    control: form.control,
    name: "name",
  })

  const value = useMemo(() => {
    const temp = {
      id: ID,
      name: watchedName,
      parent_category_id: parentCategoryId,
      rank: watchedRank,
      category_children: null,
    }

    return insertCategoryTreeItem(product_categories ?? [], temp)
  }, [product_categories, watchedName, parentCategoryId, watchedRank])

  const handleChange = (
    {
      parentId,
      index,
    }: {
      id: UniqueIdentifier
      parentId: UniqueIdentifier | null
      index: number
    },
    list: CategoryTreeItem[]
  ) => {
    form.setValue("parent_category_id", parentId as string | null, {
      shouldDirty: true,
      shouldTouch: true,
    })

    form.setValue("rank", index, {
      shouldDirty: true,
      shouldTouch: true,
    })

    setSnapshot(list)
  }

  if (isError) {
    throw error
  }

  const ready = !isPending && !!product_categories

  return (
    <div className="bg-ui-bg-subtle flex-1" data-testid="category-create-form-nesting">
      <CategoryTree
        value={shouldFreeze ? snapshot : value}
        enableDrag={(item) => item.id === ID}
        onChange={handleChange}
        renderValue={(item) => {
          if (item.id === ID) {
            return (
              <div className="flex items-center gap-x-3" data-testid="category-create-form-nesting-new-item">
                <span>{item.name}</span>
                <Badge size="2xsmall" color="blue" data-testid="category-create-form-nesting-new-badge">
                  {t("categories.fields.new.label")}
                </Badge>
              </div>
            )
          }

          return item.name
        }}
        isLoading={!ready}
      />
    </div>
  )
}

Root._tabMeta = defineTabMeta<CreateCategorySchema>({
  id: "organize",
  labelKey: "categories.create.tabs.organize",
  validationFields: ["parent_category_id", "rank"],
})

export const CreateCategoryNesting = Root
