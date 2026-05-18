import { XMarkMini } from "@medusajs/icons"
import { Button, Hint, IconButton, Input, Label } from "@medusajs/ui"
import { useFieldArray, useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { SortableList } from "../../../../components/common/sortable-list"

type FormValues = any

export const PossibleValuesList = () => {
  const { t } = useTranslation()
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<FormValues>()
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "values",
  })

  const handleAddValue = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    append({
      name: "",
      rank: fields.length,
      metadata: {},
    })
  }

  const handleRankChange = (
    items: { id: string; name: string; rank: number }[]
  ) => {
    const oldOrder = fields.map((f) => f.id)
    items.forEach((item, newIndex) => {
      const oldIndex = oldOrder.indexOf(item.id)
      if (oldIndex !== newIndex) {
        move(oldIndex, newIndex)
        oldOrder.splice(oldIndex, 1)
        oldOrder.splice(newIndex, 0, item.id)
      }
    })
  }

  const valuesError = errors.values
  const shouldShowListError = valuesError && !Array.isArray(valuesError)

  return (
    <div
      className="flex flex-col gap-y-4"
      data-testid="attribute-form-values-list"
    >
      <div
        className="flex items-start justify-between gap-x-4"
        data-testid="attribute-form-values-header"
      >
        <div className="flex flex-col">
          <Label weight="plus" data-testid="attribute-form-values-label">
            {t("attributes.fields.values")}
          </Label>
          <Hint>
            {t(
              "attributes.fields.valuesHint",
              "Add the possible values for this attribute."
            )}
          </Hint>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="small"
          onClick={handleAddValue}
          data-testid="attribute-form-values-add-button"
        >
          {t("actions.add")}
        </Button>
      </div>

      {fields.length > 0 && (
        <SortableList
          items={fields as any[]}
          onChange={handleRankChange}
          renderItem={(item, index) => {
            const fieldError = Array.isArray(valuesError)
              ? (
                  valuesError[index] as
                    | { name?: { message?: string } }
                    | undefined
                )?.name
              : undefined

            return (
              <SortableList.Item
                id={item.id}
                className="bg-ui-bg-component shadow-elevation-card-rest mb-2 flex items-center gap-1.5 rounded-xl p-1.5 last:mb-0"
              >
                <SortableList.DragHandle />
                <div className="flex-1">
                  <Input
                    className="bg-ui-bg-field-component hover:bg-ui-bg-field-component-hover"
                    aria-invalid={!!fieldError}
                    placeholder={t(
                      "attributes.createPossibleValues.enterValue"
                    )}
                    {...register(`values.${index}.name`)}
                    data-testid={`attribute-form-value-input-${index}`}
                  />
                  {fieldError && (
                    <Hint
                      variant="error"
                      className="mt-1"
                      data-testid={`attribute-form-value-error-${index}`}
                    >
                      {fieldError.message as string}
                    </Hint>
                  )}
                </div>
                <IconButton
                  variant="transparent"
                  size="small"
                  type="button"
                  className="text-ui-fg-muted"
                  onClick={() => remove(index)}
                  data-testid={`attribute-form-value-remove-button-${index}`}
                >
                  <XMarkMini />
                </IconButton>
              </SortableList.Item>
            )
          }}
        />
      )}

      {shouldShowListError && (
        <Hint
          variant="error"
          data-testid="attribute-form-values-list-error"
        >
          {(valuesError as { message?: string }).message as string}
        </Hint>
      )}
    </div>
  )
}
