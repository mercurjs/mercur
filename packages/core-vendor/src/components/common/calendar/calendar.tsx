"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"

import { ChevronLeft, ChevronRight } from "@medusajs/icons"
import { clx, IconButton } from "@medusajs/ui"

import "react-day-picker/src/style.css"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={clx("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4 flex flex-col items-center",
        caption: "flex justify-center pt-1 relative items-center ",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: clx(
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: clx(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-end)]:rounded-r-md",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md"
        ),
        day: clx(
          "h-8 w-8 p-0 font-normal aria-selected:opacity-100 text-center"
        ),
        button_next: "absolute right-0",
        button_previous: "absolute left-0",
        day_range_start: "day-range-start",
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        PreviousMonthButton: ({ className, ...props }) => {
          return (
            <IconButton
              className={clx("absolute left-0 top-2.5", className)}
              variant="transparent"
              {...props}
            >
              <ChevronLeft />
            </IconButton>
          )
        },
        NextMonthButton: ({ className, ...props }) => {
          return (
            <IconButton
              className={clx("absolute right-0 top-2.5", className)}
              variant="transparent"
              {...props}
            >
              <ChevronRight />
            </IconButton>
          )
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
