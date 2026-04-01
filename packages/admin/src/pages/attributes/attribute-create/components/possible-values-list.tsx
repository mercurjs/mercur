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
import { DotsSix, XMark } from "@medusajs/icons"
import { Button, Hint, IconButton, Input, Label } from "@medusajs/ui"
import { useFieldArray, useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"

type AttributeValueType = {
  value: string
  rank: number
  metadata: Record<string, unknown>
}

type FormValues = any

interface SortableItemProps {
  id: string
  index: number
  onRemove: () => void
}

const SortableItem = ({ id, index, onRemove }: SortableItemProps) => {
  const {
    register,
    formState: { errors },
  } = useFormContext<FormValues>()
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const possibleValuesErrors = errors?.possible_values
  const fieldError =
    Array.isArray(possibleValuesErrors)
      ? (possibleValuesErrors[index] as { value?: { message?: string } } | undefined)?.value
      : undefined

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center gap-2 p-2 bg-ui-bg-component border border-ui-border-base rounded-xl mb-2"
        data-testid={`attribute-form-possible-value-item-${index}`}
      >
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
          data-testid={`attribute-form-possible-value-drag-handle-${index}`}
        >
          <DotsSix className="text-ui-fg-subtle" />
        </button>
        <div className="flex-1">
          <Input
            className="flex-1"
            aria-invalid={!!fieldError}
            placeholder="Enter value"
            {...register(`possible_values.${index}.value`)}
            data-testid={`attribute-form-possible-value-input-${index}`}
          />
        </div>
        <IconButton
          variant="transparent"
          size="small"
          type="button"
          onClick={onRemove}
          data-testid={`attribute-form-possible-value-remove-button-${index}`}
        >
          <XMark />
        </IconButton>
      </div>
      {fieldError && (
        <Hint
          variant="error"
          className="mb-2"
          data-testid={`attribute-form-possible-value-error-${index}`}
        >
          {fieldError.message as string}
        </Hint>
      )}
    </>
  )
}

export const PossibleValuesList = () => {
  const { t } = useTranslation()
  const { control, getValues, formState } = useFormContext<FormValues>()
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "possible_values",
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((field) => field.id === active.id)
      const newIndex = fields.findIndex((field) => field.id === over.id)

      const currentValues = getValues("possible_values") as AttributeValueType[]
      const reorderedValues = arrayMove(currentValues, oldIndex, newIndex)

      reorderedValues.forEach((value, index) => {
        update(index, {
          value: value.value,
          rank: index,
          metadata: value.metadata || {},
        })
      })
    }
  }

  const handleAddValue = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    append({
      value: "",
      rank: fields.length,
      metadata: {},
    })
  }

  const possibleValuesError = formState.errors.possible_values
  const shouldShowListError =
    possibleValuesError && !Array.isArray(possibleValuesError)

  return (
    <div className="space-y-2" data-testid="attribute-form-possible-values-list">
      <div
        className="flex items-center justify-between pb-1"
        data-testid="attribute-form-possible-values-header"
      >
        <Label data-testid="attribute-form-possible-values-label">
          {t("attributes.fields.possibleValues", "Possible Values")}
        </Label>
        <Button
          type="button"
          variant="secondary"
          size="small"
          onClick={handleAddValue}
          data-testid="attribute-form-possible-values-add-button"
        >
          {t("actions.add", "Add")}
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={fields.map((field) => field.id)}
          strategy={verticalListSortingStrategy}
        >
          {fields.map((field, index) => (
            <SortableItem
              key={field.id}
              id={field.id}
              index={index}
              onRemove={() => remove(index)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {shouldShowListError && (
        <Hint
          variant="error"
          data-testid="attribute-form-possible-values-list-error"
        >
          {(possibleValuesError as { message?: string }).message as string}
        </Hint>
      )}
    </div>
  )
}
