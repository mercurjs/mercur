import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button, Input, Text } from '@medusajs/ui'
import { Plus, XMark, EllipsisHorizontal } from '@medusajs/icons'
import { useFieldArray, useFormContext } from 'react-hook-form'

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
  const { register, formState: { errors } } = useFormContext<FormValues>()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const fieldError = errors.possible_values?.[index]?.value

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 bg-ui-bg-subtle rounded-md mb-2"
    >
      <button
        className="cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <EllipsisHorizontal className="text-ui-fg-subtle" />
      </button>
      <Input
        className={"flex-1"}
        aria-invalid={!!fieldError}
        placeholder="Enter value"
        {...register(`possible_values.${index}.value`)}
      />
      <button
        onClick={onRemove}
        className="text-ui-fg-subtle hover:text-ui-fg-base"
      >
        <XMark />
      </button>
    </div>
  )
}

const PossibleValuesList = () => {
  const { control, getValues } = useFormContext<FormValues>()
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'possible_values',
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
      
      // Get current form values
      const currentValues = getValues('possible_values') as AttributeValueType[]
      
      // Create new array with reordered items
      const reorderedValues = arrayMove(currentValues, oldIndex, newIndex)
      
      // Update all fields with their new positions and ranks
      reorderedValues.forEach((value, index) => {
        update(index, {
          value: value.value,
          rank: index,
          metadata: value.metadata || {},
        })
      })
    }
  }

  const handleAddValue = () => {
    append({
      value: '',
      rank: fields.length,
      metadata: {},
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Text className="text-ui-fg-subtle">Possible Values</Text>
        <Button
          type="button"
          variant="secondary"
          size="small"
          onClick={handleAddValue}
        >
          <Plus className="mr-2" />
          Add Value
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
    </div>
  )
}

export default PossibleValuesList 