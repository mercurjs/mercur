import { Switch, Text } from "@medusajs/ui"
import { useEffect, useRef, useState } from "react"
import { Controller, ControllerRenderProps } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useDataGridCell, useDataGridCellError } from "../hooks"
import { DataGridCellProps, InputProps } from "../types"
import { DataGridCellContainer } from "./data-grid-cell-container"

export const DataGridToggleCell = <TData, TValue = any>({
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
            <Inner field={field} inputProps={input} isAnchor={container.isAnchor} />
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
  const { value, onChange: _ } = field
  const { onChange } = inputProps
  const switchRef = useRef<HTMLButtonElement>(null)

  const [localValue, setLocalValue] = useState(value)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleCheckedChange = (checked: boolean) => {
    const newValue = { ...localValue, checked }
    if (!checked) {
      newValue.quantity = ""
    }
    if (checked && (newValue.quantity === "" || newValue.quantity === null)) {
      newValue.quantity = 0
    }
    setLocalValue(newValue)
    onChange(newValue, value)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnchor && e.key.toLowerCase() === "x") {
        e.preventDefault()
        switchRef.current?.click()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isAnchor])

  return (
    <div className="flex size-full items-center gap-x-3 px-4">
      <Switch
        ref={switchRef}
        dir="ltr"
        size="small"
        className="shrink-0"
        checked={localValue?.checked ?? false}
        disabled={localValue?.disabledToggle}
        onCheckedChange={handleCheckedChange}
      />
      <Text size="small" className="text-ui-fg-subtle">
        {localValue?.checked ? t("general.enabled", "Enabled") : t("inventory.stock.notEnabled", "Not enabled")}
      </Text>
    </div>
  )
}
