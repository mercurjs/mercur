"use client"
import { cn } from "@/lib/utils"

import { CloseIcon } from "@/icons"
import { useEffect, useState } from "react"
import { EyeMini, EyeSlashMini } from "@medusajs/icons"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  icon?: React.ReactNode
  clearable?: boolean
  error?: boolean
  changeValue?: (value: string) => void
  onIconClick?: () => void
  iconAriaLabel?: string
  "data-testid"?: string
}

export function Input({
  label,
  icon,
  clearable,
  className,
  error,
  changeValue,
  onIconClick,
  iconAriaLabel,
  "data-testid": dataTestId,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [inputType, setInputType] = useState(props.type)
  let paddingY = ""
  if (icon) paddingY += "pl-[46px] "
  if (clearable) paddingY += "pr-[38px]"

  useEffect(() => {
    if (props.type === "password" && showPassword) {
      setInputType("text")
    }

    if (props.type === "password" && !showPassword) {
      setInputType("password")
    }
  }, [props.type, showPassword])

  const changeHandler = (value: string) => {
    if (changeValue) changeValue(value)
  }

  const clearHandler = () => {
    if (changeValue) changeValue("")
  }

  return (
    <div className="flex flex-col">
      <label className="label-md">{label}</label>
      <div className="relative mt-2">
        {icon && onIconClick && (
          <button
            onClick={onIconClick}
            className="flex items-center justify-center rounded-sm transition-all duration-300 ease-out button-transparent h-[32px] w-[32px] absolute top-[8px] left-[8px]"
            aria-label={iconAriaLabel}
            data-testid={dataTestId ? `${dataTestId}-icon-button` : 'input-icon-button'}
          >
            {icon}
          </button>
        )}

        {icon && !onIconClick && (
          <span className="absolute top-0 left-[16px] h-full flex items-center" data-testid={dataTestId ? `${dataTestId}-icon` : 'input-icon'}>
            {icon}
          </span>
        )}

        <input
          className={cn(
            "w-full px-[16px] py-[12px] border rounded-sm bg-component-secondary focus:border-primary focus:outline-none focus:ring-0",
            error && "border-negative focus:border-negative",
            props.disabled && "bg-disabled cursor-not-allowed",
            paddingY,
            className
          )}
          value={props.value}
          onChange={(e) => changeHandler(e.target.value)}
          {...props}
          type={props.type === "password" ? inputType : props.type}
          data-testid={dataTestId}
        />
        {clearable && props.value && (
          <span
            className="absolute h-full flex items-center top-0 right-[16px] cursor-pointer"
            onClick={clearHandler}
            data-testid={dataTestId ? `${dataTestId}-clear-button` : 'input-clear-button'}
          >
            <CloseIcon />
          </span>
        )}
        {props.type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-ui-fg-subtle px-4 focus:outline-none transition-all duration-150 outline-none focus:text-ui-fg-base absolute right-0 top-4"
            data-testid={dataTestId ? `${dataTestId}-password-button` : 'input-password-button'}
          >
            {showPassword ? <EyeMini /> : <EyeSlashMini />}
          </button>
        )}
      </div>
    </div>
  )
}
