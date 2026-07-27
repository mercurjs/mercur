"use client"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { CollapseIcon, TickThinIcon } from "@/icons"
import clsx from "clsx"

export const SelectField = ({
  options,
  className = "",
  selected,
  selectOption,
  placeholder = "",
}: {
  options: {
    value?: string
    label?: string
    hidden?: boolean
  }[]
  placeholder?: string
  className?: string
  selected?: string | number | readonly string[]
  selectOption?: (value: string) => void
}) => {
  const [selectedOption, setSelectedOption] = useState(
    options.find(({ value }) => value === selected)?.label || options[0].label
  )
  const [open, setOpen] = useState(false)

  const selectRef = useRef(null)

  useEffect(() => {
    window.addEventListener("click", (e) => {
      if (selectRef.current && selectRef.current !== e.target) setOpen(false)
    })

    return window.removeEventListener("click", () => null)
  }, [])

  const selectOptionHandler = (label?: string, value?: string) => {
    setSelectedOption(label)
    if (selectOption && value) selectOption(value)
    setOpen(false)
  }

  return (
    <div className="relative">
      <div
        ref={selectRef}
        className={cn(
          "relative rounded-sm border px-3 py-2 bg-component-secondary label-md cursor-pointer h-12 flex items-center",
          open && "border-primary",
          className
        )}
        onClick={() => setOpen(!open)}
      >
        {selectedOption || placeholder}
        <CollapseIcon
          className={clsx("absolute right-3 transition", {
            "rotate-180": open,
          })}
          size={20}
        />
      </div>
      {open && (
        <ul className="absolute border border-primary bg-component-secondary rounded-sm w-full top-[47px] z-10">
          {options.map(
            ({ label, value, hidden }, index) =>
              !hidden && (
                <li
                  key={value}
                  className={cn(
                    "relative label-md py-2 px-3 hover:bg-component-secondary-hover",
                    index === 0 && "rounded-t-sm",
                    index === options.length - 1 && "rounded-b-sm"
                  )}
                  onClick={() => selectOptionHandler(label, value)}
                >
                  {label}
                  {label === selectedOption && (
                    <TickThinIcon
                      className="absolute top-[10px] right-2"
                      size={20}
                    />
                  )}
                </li>
              )
          )}
        </ul>
      )}
    </div>
  )
}
