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
import { DotsSix, XMark, Tag } from "@medusajs/icons"
import {
  Button,
  Heading,
  IconButton,
  Input,
  ProgressTabs,
  Text,
  toast,
} from "@medusajs/ui"
import { useFieldArray, useForm, useFormContext, FormProvider } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { RouteFocusModal, useRouteModal } from "../../../components/modals"
import {
  useAttribute,
  useCreateAttributePossibleValue,
  attributesQueryKeys,
} from "../../../hooks/api/attributes"
import { sdk } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"
import { ATTRIBUTE_DETAIL_FIELDS } from "../attribute-detail/constants"

type NewValueItem = {
  id: string
  value: string
}

type RankingItem = {
  id: string
  value: string
  isNew: boolean
}

type CreatePossibleValuesFormValues = {
  new_values: NewValueItem[]
}

// --- Sortable Item for Tab 1 (Values) ---

interface SortableValueInputProps {
  id: string
  index: number
  onRemove: () => void
}

const SortableValueInput = ({
  id,
  index,
  onRemove,
}: SortableValueInputProps) => {
  const { t } = useTranslation()
  const { register } = useFormContext<CreatePossibleValuesFormValues>()
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 bg-ui-bg-component border border-ui-border-base rounded-xl mb-2"
      data-testid={`create-possible-value-input-item-${index}`}
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
        data-testid={`create-possible-value-drag-handle-${index}`}
      >
        <DotsSix className="text-ui-fg-subtle" />
      </button>
      <div className="flex-1">
        <Input
          className="flex-1"
          placeholder={t("attributes.createPossibleValues.enterValue")}
          {...register(`new_values.${index}.value`)}
          data-testid={`create-possible-value-input-${index}`}
        />
      </div>
      <IconButton
        variant="transparent"
        size="small"
        type="button"
        onClick={onRemove}
        data-testid={`create-possible-value-remove-button-${index}`}
      >
        <XMark />
      </IconButton>
    </div>
  )
}

// --- Sortable Item for Tab 2 (Organize Ranking) ---

interface SortableRankingItemProps {
  id: string
  value: string
  index: number
}

const SortableRankingItem = ({
  id,
  value,
  index,
}: SortableRankingItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-ui-bg-component border border-ui-border-base rounded-xl mb-2"
      data-testid={`ranking-item-${index}`}
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
        data-testid={`ranking-item-drag-handle-${index}`}
      >
        <DotsSix className="text-ui-fg-subtle" />
      </button>
      <Tag className="text-ui-fg-subtle" />
      <Text size="small" weight="plus">
        {value}
      </Text>
    </div>
  )
}

// --- Inner Form Component ---

const AttributeCreatePossibleValueInner = () => {
  const { t } = useTranslation()
  const { id } = useParams()
  const { handleSuccess } = useRouteModal()

  const { attribute, isPending: isAttributeLoading } = useAttribute(id!, {
    fields: ATTRIBUTE_DETAIL_FIELDS,
  })

  const { mutateAsync: createValue } = useCreateAttributePossibleValue(id!)

  const [activeTab, setActiveTab] = useState<"values" | "organize-ranking">(
    "values"
  )
  const [tabStatuses, setTabStatuses] = useState<{
    valuesStatus: "not-started" | "in-progress" | "completed"
    organizeStatus: "not-started" | "in-progress" | "completed"
  }>({
    valuesStatus: "not-started",
    organizeStatus: "not-started",
  })
  const [rankingItems, setRankingItems] = useState<RankingItem[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<CreatePossibleValuesFormValues>({
    defaultValues: {
      new_values: [{ id: crypto.randomUUID(), value: "" }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "new_values",
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleValuesDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((field) => field.id === active.id)
      const newIndex = fields.findIndex((field) => field.id === over.id)
      const currentValues = form.getValues("new_values")
      const reordered = arrayMove(currentValues, oldIndex, newIndex)
      reordered.forEach((item, idx) => {
        form.setValue(`new_values.${idx}.id`, item.id)
        form.setValue(`new_values.${idx}.value`, item.value)
      })
    }
  }

  const handleRankingDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setRankingItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const handleAddValue = () => {
    append({ id: crypto.randomUUID(), value: "" })
    setTabStatuses((prev) => ({
      ...prev,
      valuesStatus: "in-progress",
    }))
  }

  const handleContinue = () => {
    const newValues = form
      .getValues("new_values")
      .filter((v) => v.value.trim() !== "")

    if (newValues.length === 0) {
      toast.warning(t("attributes.createPossibleValues.enterValue"))
      return
    }

    // Build ranking items: existing values + new values
    const existingValues: RankingItem[] = (
      attribute?.possible_values ?? []
    )
      .slice()
      .sort((a: any, b: any) => (a.rank ?? 0) - (b.rank ?? 0))
      .map((pv: any) => ({
        id: pv.id,
        value: pv.value,
        isNew: false,
      }))

    const newRankingItems: RankingItem[] = newValues.map((nv) => ({
      id: nv.id,
      value: nv.value,
      isNew: true,
    }))

    setRankingItems([...existingValues, ...newRankingItems])

    setTabStatuses({
      valuesStatus: "completed",
      organizeStatus: "in-progress",
    })
    setActiveTab("organize-ranking")
  }

  const handleTabChange = (value: string) => {
    const newTab = value as "values" | "organize-ranking"

    if (
      newTab === "organize-ranking" &&
      tabStatuses.valuesStatus !== "completed"
    ) {
      return
    }

    setActiveTab(newTab)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Create new values with their rank based on position in the ranking list
      for (const [index, item] of rankingItems.entries()) {
        if (item.isNew) {
          await createValue({
            value: item.value,
            rank: index,
            metadata: {},
          })
        }
      }

      // Update existing values whose rank has changed
      for (const [index, item] of rankingItems.entries()) {
        if (!item.isNew) {
          const existingPV = (attribute?.possible_values ?? []).find(
            (pv: any) => pv.id === item.id
          )
          if (existingPV && existingPV.rank !== index) {
            await sdk.admin.attributes.$id.values.$valueId.mutate({
              $id: id!,
              $valueId: item.id,
              rank: index,
            } as any)
          }
        }
      }

      // Invalidate queries so the detail page refreshes
      queryClient.invalidateQueries({
        queryKey: attributesQueryKeys.detail(id!),
      })

      toast.success(t("attributes.createPossibleValues.successToast"))
      handleSuccess(`/settings/attributes/${id}`)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  if (isAttributeLoading || !attribute) {
    return null
  }

  return (
    <FormProvider {...form}>
      <ProgressTabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="flex size-full flex-col overflow-hidden"
        data-testid="attribute-create-possible-value-progress-tabs"
      >
        <RouteFocusModal.Header data-testid="attribute-create-possible-value-modal-header">
          <ProgressTabs.List
            className="justify-start flex w-full items-center"
            data-testid="attribute-create-possible-value-tabs-list"
          >
            <ProgressTabs.Trigger
              value="values"
              status={tabStatuses.valuesStatus}
              data-testid="attribute-create-possible-value-values-tab"
            >
              {t("attributes.createPossibleValues.tabs.values")}
            </ProgressTabs.Trigger>
            <ProgressTabs.Trigger
              value="organize-ranking"
              status={tabStatuses.organizeStatus}
              data-testid="attribute-create-possible-value-organize-tab"
            >
              {t("attributes.createPossibleValues.tabs.organizeRanking")}
            </ProgressTabs.Trigger>
          </ProgressTabs.List>
        </RouteFocusModal.Header>

        <RouteFocusModal.Body
          className="flex flex-1 justify-center overflow-auto px-6 py-16"
          data-testid="attribute-create-possible-value-modal-body"
        >
          <div className="flex w-full max-w-[720px] flex-col gap-y-8">
            <div className="flex flex-col gap-y-1">
              <RouteFocusModal.Title asChild>
                <Heading data-testid="attribute-create-possible-value-heading">
                  {t("attributes.createPossibleValues.header")}
                </Heading>
              </RouteFocusModal.Title>
              <RouteFocusModal.Description asChild>
                <Text
                  size="small"
                  className="text-ui-fg-subtle"
                  data-testid="attribute-create-possible-value-subtitle"
                >
                  {t("attributes.createPossibleValues.subtitle", {
                    name: attribute.name,
                  })}
                </Text>
              </RouteFocusModal.Description>
            </div>

            <ProgressTabs.Content value="values">
              <div className="flex flex-col gap-y-4">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleValuesDragEnd}
                >
                  <SortableContext
                    items={fields.map((field) => field.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {fields.map((field, index) => (
                      <SortableValueInput
                        key={field.id}
                        id={field.id}
                        index={index}
                        onRemove={() => remove(index)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>

                <Button
                  type="button"
                  variant="secondary"
                  size="small"
                  onClick={handleAddValue}
                  data-testid="attribute-create-possible-value-add-button"
                >
                  {t("attributes.createPossibleValues.addValue")}
                </Button>
              </div>
            </ProgressTabs.Content>

            <ProgressTabs.Content value="organize-ranking">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleRankingDragEnd}
              >
                <SortableContext
                  items={rankingItems.map((item) => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {rankingItems.map((item, index) => (
                    <SortableRankingItem
                      key={item.id}
                      id={item.id}
                      value={item.value}
                      index={index}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </ProgressTabs.Content>
          </div>
        </RouteFocusModal.Body>

        <RouteFocusModal.Footer data-testid="attribute-create-possible-value-modal-footer">
          <div className="flex items-center justify-end gap-2">
            <RouteFocusModal.Close asChild>
              <Button
                size="small"
                variant="secondary"
                type="button"
                data-testid="attribute-create-possible-value-cancel-button"
              >
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            {activeTab === "values" ? (
              <Button
                size="small"
                type="button"
                onClick={handleContinue}
                data-testid="attribute-create-possible-value-continue-button"
              >
                {t("actions.continue")}
              </Button>
            ) : (
              <Button
                size="small"
                type="button"
                onClick={handleSave}
                isLoading={isSaving}
                data-testid="attribute-create-possible-value-save-button"
              >
                {t("actions.save")}
              </Button>
            )}
          </div>
        </RouteFocusModal.Footer>
      </ProgressTabs>
    </FormProvider>
  )
}

export const AttributeCreatePossibleValue = () => {
  return (
    <RouteFocusModal data-testid="attribute-create-possible-value-modal">
      <AttributeCreatePossibleValueInner />
    </RouteFocusModal>
  )
}
