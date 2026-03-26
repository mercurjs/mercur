import { clx, Select } from "@medusajs/ui"
import { Controller, ControllerRenderProps } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { useCombinedRefs } from "../../../hooks/use-combined-refs"
import { useDataGridCell, useDataGridCellError } from "../hooks"
import { DataGridCellProps, InputProps } from "../types"
import { DataGridCellContainer } from "./data-grid-cell-container"

export const DataGridStatusCell = <TData, TValue = any>({
  context,
}: DataGridCellProps<TData, TValue>) => {
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
              isAnchor={container.isAnchor}
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
  isAnchor,
}: {
  field: ControllerRenderProps<any, string>
  inputProps: InputProps
  isAnchor: boolean
}) => {
  const { t } = useTranslation()
  const { ref, value, onChange, onBlur } = field
  const {
    ref: inputRef,
    onBlur: onInputBlur,
    onFocus,
    onChange: _onChange,
    ...attributes
  } = inputProps

  const combinedRefs = useCombinedRefs(ref, inputRef)

  const options = [
    {
      label: t("products.productStatus.draft"),
      value: "draft",
    },
    {
      label: t("products.productStatus.published"),
      value: "published",
    },
  ]

  return (
    <Select
      value={value}
      onValueChange={(newValue) => {
        onChange(newValue)
      }}
    >
      <Select.Trigger
        ref={combinedRefs}
        className={clx(
          "txt-compact-small h-full w-full rounded-none border-none bg-transparent px-0 py-2.5 shadow-none outline-none",
          "hover:bg-transparent focus:shadow-none data-[state=open]:!shadow-none"
        )}
        onPointerDown={
          !isAnchor ? (e) => e.preventDefault() : undefined
        }
        onFocus={onFocus}
        onBlur={() => {
          onBlur()
          onInputBlur()
        }}
        {...attributes}
      >
        <Select.Value />
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
