import { Select, clx } from "@medusajs/ui"
import { Controller, ControllerRenderProps } from "react-hook-form"

import { useCombinedRefs } from "../../../hooks/use-combined-refs"
import { useDataGridCell, useDataGridCellError } from "../hooks"
import { DataGridCellProps, InputProps } from "../types"
import { DataGridCellContainer } from "./data-grid-cell-container"

type Option = {
  label: string
  value: string
}

type DataGridSelectCellProps<TData, TValue = any> = DataGridCellProps<
  TData,
  TValue
> & {
  options: Option[]
  placeholder?: string
}

export const DataGridSelectCell = <TData, TValue = any>({
  context,
  options,
  placeholder,
}: DataGridSelectCellProps<TData, TValue>) => {
  const { field, control, renderProps } = useDataGridCell({ context })
  const errorProps = useDataGridCellError({ context })

  const { container, input } = renderProps

  return (
    <Controller
      control={control}
      name={field}
      render={({ field }) => (
        <DataGridCellContainer {...container} {...errorProps}>
          <Inner
            field={field}
            inputProps={input}
            options={options}
            placeholder={placeholder}
          />
        </DataGridCellContainer>
      )}
    />
  )
}

const Inner = ({
  field,
  inputProps,
  options,
  placeholder,
}: {
  field: ControllerRenderProps<any, string>
  inputProps: InputProps
  options: Option[]
  placeholder?: string
}) => {
  const { ref, value, onChange, onBlur, ...fieldProps } = field
  const {
    ref: inputRef,
    onChange: _onInputChange,
    onBlur: onInputBlur,
    onFocus,
    ...attributes
  } = inputProps

  const combinedRefs = useCombinedRefs(inputRef, ref)

  const selectedOption = options.find((option) => option.value === value)

  return (
    <Select
      value={value ?? ""}
      onValueChange={(next) => {
        onChange(next)
        onBlur()
        onInputBlur()
      }}
      {...fieldProps}
    >
      <Select.Trigger
        ref={combinedRefs as React.Ref<HTMLButtonElement>}
        onFocus={onFocus}
        onBlur={() => {
          onBlur()
          onInputBlur()
        }}
        className={clx(
          "size-full rounded-none border-0 bg-transparent px-0 text-left shadow-none",
          "focus:shadow-none data-[state=open]:!shadow-none hover:bg-transparent"
        )}
        tabIndex={-1}
        {...attributes}
      >
        <Select.Value placeholder={placeholder}>
          {selectedOption?.label ?? placeholder}
        </Select.Value>
      </Select.Trigger>
      <Select.Content>
        {options.map((option) => (
          <Select.Item key={option.value} value={option.value}>
            {option.label}
          </Select.Item>
        ))}
      </Select.Content>
    </Select>
  )
}
