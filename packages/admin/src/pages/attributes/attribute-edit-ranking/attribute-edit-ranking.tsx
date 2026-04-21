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
import { DotsSix, TagIllustration } from "@medusajs/icons"
import { Button, clx, IconButton, toast } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import {
  RouteFocusModal,
  useRouteModal,
} from "../../../components/modals"
import {
  useProductAttribute,
  useUpsertProductAttributeValues,
} from "../../../hooks/api/product-attributes"

type RankingItem = {
  id: string
  value: string
  rank: number
}

interface SortableRankingItemProps {
  item: RankingItem
  isGhost?: boolean
}

const SortableRankingItem = ({ item, isGhost }: SortableRankingItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={clx("-mb-px list-none", {
        "[&:first-of-type>div]:border-t-0": true,
      })}
    >
      <div
        className={clx(
          "bg-ui-bg-base transition-fg relative flex items-center gap-x-3 border-y px-6 py-2.5",
          {
            "bg-ui-bg-base-hover z-[1] opacity-50": isGhost,
          }
        )}
      >
        <IconButton
          size="small"
          variant="transparent"
          type="button"
          className="cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <DotsSix />
        </IconButton>
        <div className="flex size-7 items-center justify-center">
          <TagIllustration />
        </div>
        <div className="txt-compact-small text-ui-fg-subtle flex-grow truncate">
          {item.value}
        </div>
      </div>
    </li>
  )
}

const EditRankingInner = () => {
  const { id } = useParams()
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const { product_attribute: attribute, isPending: isLoading } = useProductAttribute(id!)

  const existingValues: RankingItem[] = (attribute?.values ?? [])
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
    .map((v) => ({
      id: v.id,
      value: v.name,
      rank: v.rank,
    }))

  const [items, setItems] = useState<RankingItem[]>([])
  const [initialized, setInitialized] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

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
    setActiveId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    setItems((prev) => {
      const oldIndex = prev.findIndex((item) => item.id === active.id)
      const newIndex = prev.findIndex((item) => item.id === over.id)
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  const { mutateAsync: upsertValues, isPending: isSaving } =
    useUpsertProductAttributeValues(id!, {
      onSuccess: () => {
        toast.success(t("attributes.editRanking.successToast", "Ranking updated successfully."))
        handleSuccess()
      },
      onError: (err) => {
        toast.error(err.message)
      },
    })

  const handleSave = async () => {
    const values = items.map((item, index) => ({
      id: item.id,
      rank: index + 1,
    }))

    await upsertValues({ values })
  }

  if (isLoading || !attribute) {
    return null
  }

  return (
    <>
      <RouteFocusModal.Header />
      <RouteFocusModal.Body className="flex flex-1 flex-col overflow-y-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={({ active }) => setActiveId(active.id as string)}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="list-none p-0 m-0">
              {items.map((item) => (
                <SortableRankingItem
                  key={item.id}
                  item={item}
                  isGhost={activeId === item.id}
                />
              ))}
            </ul>
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
