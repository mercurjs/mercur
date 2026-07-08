import { useMutation } from "@tanstack/react-query"

import { UniqueIdentifier } from "@dnd-kit/core"
import { ClientError } from "@mercurjs/client"
import { Button, toast } from "@medusajs/ui"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { RouteFocusModal, useRouteModal } from "../../../../../components/modals"
import {
  categoriesQueryKeys,
  useProductCategories,
} from "../../../../../hooks/api/categories"
import { sdk } from "../../../../../lib/client"
import { queryClient } from "../../../../../lib/query-client"
import { CategoryTree } from "../../../common/components/category-tree"
import { CategoryTreeItem } from "../../../common/types"

const QUERY = {
  fields: "id,name,parent_category_id,rank,*category_children",
  parent_category_id: "null",
  include_descendants_tree: true,
  limit: 9999,
}

type RankChange = {
  id: string
  parent_category_id: string | null
  rank: number
}

export const OrganizeCategoryForm = () => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const {
    product_categories,
    isPending,
    isError,
    error: fetchError,
  } = useProductCategories(QUERY)

  const [items, setItems] = useState<CategoryTreeItem[] | null>(null)
  const [changes, setChanges] = useState<RankChange[]>([])

  const { mutateAsync, isPending: isSaving } = useMutation({
    mutationFn: async (pending: RankChange[]) => {
      for (const change of pending) {
        await sdk.admin.productCategories.$id.mutate({
          $id: change.id,
          rank: change.rank,
          parent_category_id: change.parent_category_id,
        })
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: categoriesQueryKeys.all })
      toast.success(t("categories.organize.successToast"))
      handleSuccess()
    },
    onError: (error: ClientError) => {
      toast.error(error.message)
    },
  })

  const handleRankChange = (
    value: {
      id: UniqueIdentifier
      parentId: UniqueIdentifier | null
      index: number
    },
    arr: CategoryTreeItem[]
  ) => {
    setItems(arr)
    setChanges((prev) => [
      ...prev,
      {
        id: value.id as string,
        parent_category_id: value.parentId as string | null,
        rank: value.index,
      },
    ])
  }

  const handleSave = async () => {
    if (!changes.length) {
      return
    }

    await mutateAsync(changes)
  }

  if (isError) {
    throw fetchError
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <RouteFocusModal.Header />
      <RouteFocusModal.Body className="bg-ui-bg-subtle flex flex-1 flex-col overflow-y-auto">
        <CategoryTree
          renderValue={(item) => item.name}
          value={items ?? product_categories ?? []}
          onChange={handleRankChange}
          isLoading={isPending}
        />
      </RouteFocusModal.Body>
      <RouteFocusModal.Footer>
        <div className="flex items-center justify-end gap-x-2">
          <RouteFocusModal.Close asChild>
            <Button
              size="small"
              variant="secondary"
              data-testid="category-organize-cancel-button"
            >
              {t("actions.cancel")}
            </Button>
          </RouteFocusModal.Close>
          <Button
            size="small"
            type="button"
            onClick={handleSave}
            isLoading={isSaving}
            disabled={!changes.length}
            data-testid="category-organize-save-button"
          >
            {t("actions.save")}
          </Button>
        </div>
      </RouteFocusModal.Footer>
    </div>
  )
}
