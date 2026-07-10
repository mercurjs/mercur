"use client"
import { cn } from "@/lib/utils"
import { MinusHeavyIcon, TickThinIcon } from "@/icons"

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  indeterminate?: boolean
  error?: boolean
  label?: string
  "data-testid"?: string
}

export function Checkbox({
  label,
  indeterminate,
  error,
  className,
  checked,
  "data-testid": dataTestId,
  ...props
}: CheckboxProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <span
        className={cn(
          "checkbox-wrapper",
          checked && "!bg-action",
          error && "!border-negative",
          indeterminate && "!bg-action",
          props.disabled && "!bg-disabled !border-disabled !cursor-default",
          className
        )}
      >
        {indeterminate && !checked && !props.disabled && (
          <MinusHeavyIcon size={20} />
        )}
        {checked && !props.disabled && <TickThinIcon size={20} />}

        <input
          type="checkbox"
          className={cn(
            "w-[20px] h-[20px] opacity-0 cursor-pointer",
            props.disabled && "cursor-default"
          )}
          data-testid={dataTestId ?? 'checkbox'}
          {...props}
        />
      </span>
      {label}
    </label>
  )
}
