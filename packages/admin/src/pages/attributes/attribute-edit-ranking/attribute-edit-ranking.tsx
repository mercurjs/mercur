import { useState } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { DotsSix, Tag } from "@medusajs/icons"
import { Button, Text, toast } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import {
  RouteFocusModal,
  useRouteModal,
} from "../../../components/modals"
import { useProductAttribute, productAttributesQueryKeys } from "../../../hooks/api/product-attributes"
import { sdk } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"
import { ATTRIBUTE_DETAIL_FIELDS } from "../attribute-detail/constants"

type RankingItem = {
  id: string
  value: string
  rank: number
}

const SortableRankingItem = ({ item }: { item: RankingItem }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-x-3 border-b px-6 py-3 last:border-b-0"
    >
      <button
        type="button"
        className="cursor-grab text-ui-fg-muted"
        {...attributes}
        {...listeners}
      >
        <DotsSix />
      </button>
      <Tag className="text-ui-fg-interactive" />
      <Text size="small">{item.value}</Text>
    </div>
  )
}

const EditRankingInner = () => {
  const { id } = useParams()
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const { product_attribute: attribute, isPending: isLoading } = useProductAttribute(id!, {
    fields: ATTRIBUTE_DETAIL_FIELDS,
  })

  const existingValues: RankingItem[] = (attribute?.possible_values ?? [])
    .sort((a: any, b: any) => (a.rank ?? 0) - (b.rank ?? 0))
    .map((v: any) => ({
      id: v.id,
      value: v.value,
      rank: v.rank,
    }))

  const [items, setItems] = useState<RankingItem[]>([])
  const [initialized, setInitialized] = useState(false)

  if (!initialized && existingValues.length > 0) {
    setItems(existingValues)
    setInitialized(true)
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setItems((prev) => {
      const oldIndex = prev.findIndex((item) => item.id === active.id)
      const newIndex = prev.findIndex((item) => item.id === over.id)
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const updates = items
        .map((item, index) => ({
          id: item.id,
          newRank: index + 1,
          oldRank: existingValues.find((v) => v.id === item.id)?.rank,
        }))
        .filter((u) => u.newRank !== u.oldRank)

      for (const update of updates) {
        await sdk.admin.productAttributes.$id.values.$valueId.mutate({
          $id: id!,
          $valueId: update.id,
          rank: update.newRank,
        })
      }

      queryClient.invalidateQueries({
        queryKey: productAttributesQueryKeys.detail(id!),
      })

      toast.success(t("attributes.editRanking.successToast", "Ranking updated successfully."))
      handleSuccess()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || !attribute) {
    return null
  }

  return (
    <>
      <RouteFocusModal.Header />
      <RouteFocusModal.Body className="flex flex-1 flex-col overflow-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            {items.map((item) => (
              <SortableRankingItem key={item.id} item={item} />
            ))}
          </SortableContext>
        </DndContext>
      </RouteFocusModal.Body>
      <RouteFocusModal.Footer>
        <div className="flex items-center justify-end gap-x-2">
          <RouteFocusModal.Close asChild>
            <Button variant="secondary" size="small">
              {t("actions.cancel")}
            </Button>
          </RouteFocusModal.Close>
          <Button
            size="small"
            onClick={handleSave}
            isLoading={isSaving}
          >
            {t("actions.save")}
          </Button>
        </div>
      </RouteFocusModal.Footer>
    </>
  )
}

export const AttributeEditRanking = () => {
  return (
    <RouteFocusModal>
      <EditRankingInner />
    </RouteFocusModal>
  )
}
