import { Switch } from "@medusajs/ui"
import { Controller, ControllerRenderProps } from "react-hook-form"

import { useCombinedRefs } from "../../../hooks/use-combined-refs"
import { useDataGridCell, useDataGridCellError } from "../hooks"
import { DataGridCellProps, InputProps } from "../types"
import { DataGridCellContainer } from "./data-grid-cell-container"

export const DataGridBooleanWithTextCell = <TData, TValue = any>({
  context,
  trueLabel = "True",
  falseLabel = "False",
}: DataGridCellProps<TData, TValue> & {
  trueLabel?: string
  falseLabel?: string
}) => {
  const { field, control, renderProps } = useDataGridCell({
    context,
  })
  const errorProps = useDataGridCellError({ context })

  const { container, input } = renderProps

  return (
    <Controller
      control={control}
      name={field}
      render={({ field }) => {
        return (
          <DataGridCellContainer {...container} {...errorProps}>
            <Inner
              field={field}
              inputProps={input}
              trueLabel={trueLabel}
              falseLabel={falseLabel}
            />
          </DataGridCellContainer>
        )
      }}
    />
  )
}

const Inner = ({
  field,
  inputProps,
  trueLabel,
  falseLabel,
}: {
  field: ControllerRenderProps<any, string>
  inputProps: InputProps
  trueLabel: string
  falseLabel: string
}) => {
  const { ref, value, onBlur } = field
  const {
    ref: inputRef,
    onBlur: onInputBlur,
    onChange,
    onFocus,
    ...attributes
  } = inputProps

  const combinedRefs = useCombinedRefs(ref, inputRef)

  return (
    <div className="flex size-full items-center justify-between py-2.5">
      <Switch
        ref={combinedRefs}
        size="small"
        checked={value}
        onCheckedChange={(newValue) => {
          onChange(newValue === true, value)
        }}
        onFocus={onFocus}
        onBlur={() => {
          onBlur()
          onInputBlur()
        }}
        tabIndex={-1}
        {...attributes}
      />
      <span className="txt-compact-small text-ui-fg-subtle">
        {value ? trueLabel : falseLabel}
      </span>
    </div>
  )
}
