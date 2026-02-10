import { Check, TrianglesMini } from "@medusajs/icons"
import { AdminProductCategoryResponse } from "@medusajs/types"
import { Text, clx } from "@medusajs/ui"
import { Select } from "radix-ui"
import {
  CSSProperties,
  ComponentPropsWithoutRef,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react"

import { useProductCategories } from "@hooks/api/categories"
import { useDebouncedSearch } from "@hooks/use-debounced-search"

interface CategoryComboboxProps
  extends Omit<
    ComponentPropsWithoutRef<"input">,
    "value" | "defaultValue" | "onChange"
  > {
  value: string[]
  onChange: (value: string[]) => void
}

type Level = {
  id: string
  label: string
}

const TABLUAR_NUM_WIDTH = 8
const TAG_BASE_WIDTH = 28

export const CategorySelect = forwardRef<
  HTMLInputElement,
  CategoryComboboxProps
>(({ value, onChange, className }, ref) => {
  const innerRef = useRef<HTMLInputElement>(null)

  useImperativeHandle<HTMLInputElement | null, HTMLInputElement | null>(
    ref,
    () => innerRef.current,
    []
  )

  const [open] = useState(false)

  const [level, setLevel] = useState<Level[]>([])
  const { searchValue } = useDebouncedSearch()

  const { product_categories, isPending, isError, error } =
    useProductCategories()

  const [showLoading, setShowLoading] = useState(false)

  /**
   * We add a small artificial delay to the end of the loading state,
   * this is done to prevent the popover from flickering too much when
   * navigating between levels or searching.
   */
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    if (isPending) {
      setShowLoading(true)
    } else {
      timeoutId = setTimeout(() => {
        setShowLoading(false)
      }, 150)
    }

    return () => {
      clearTimeout(timeoutId)
    }
  }, [isPending])

  useEffect(() => {
    if (searchValue) {
      setLevel([])
    }
  }, [searchValue])

  const handleSelect = (option: string) => {
    if (value.includes(option)) {
      onChange([])
    } else {
      onChange([option])
    }

    innerRef.current?.focus()
  }

  const options = getOptions(product_categories || [])

  const tagWidth = useMemo(() => {
    const count = value.length
    const digits = count.toString().length

    return TAG_BASE_WIDTH + digits * TABLUAR_NUM_WIDTH
  }, [value])

  const showLevelUp = !searchValue && level.length > 0

  const [focusedIndex, setFocusedIndex] = useState<number>(-1)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) {
        return
      }

      const optionsLength = showLevelUp ? options.length + 1 : options.length

      if (e.key === "ArrowDown") {
        e.preventDefault()
        setFocusedIndex((prev) => {
          const nextIndex = prev < optionsLength - 1 ? prev + 1 : prev
          return nextIndex
        })
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setFocusedIndex((prev) => {
          return prev > 0 ? prev - 1 : prev
        })
      } else if (e.key === "ArrowRight") {
        const index = showLevelUp ? focusedIndex - 1 : focusedIndex
        const hasChildren = options[index]?.has_children

        if (!hasChildren || !!searchValue) {
          return
        }

        e.preventDefault()
        setLevel([
          ...level,
          {
            id: options[index].value,
            label: options[index].label,
          },
        ])
        setFocusedIndex(0)
      } else if (e.key === "Enter" && focusedIndex !== -1) {
        e.preventDefault()

        if (showLevelUp && focusedIndex === 0) {
          setLevel(level.slice(0, level.length - 1))
          setFocusedIndex(0)
          return
        }

        const index = showLevelUp ? focusedIndex - 1 : focusedIndex

        handleSelect(options[index].value)
      }
    },
    [open, focusedIndex, options, level, handleSelect, searchValue, showLevelUp]
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleKeyDown])

  if (isError) {
    throw error
  }

  return (
    <Select.Root onValueChange={handleSelect}>
      <Select.Trigger
        className={clx(
          "relative flex cursor-pointer items-center gap-x-2 overflow-hidden px-2",
          "h-8 w-full rounded-md",
          "bg-ui-bg-field transition-fg shadow-borders-base",
          "has-[input:focus]:shadow-borders-interactive-with-active",
          "has-[:invalid]:shadow-borders-error has-[[aria-invalid=true]]:shadow-borders-error",
          "has-[:disabled]:bg-ui-bg-disabled has-[:disabled]:text-ui-fg-disabled has-[:disabled]:cursor-not-allowed",
          {
            "shadow-borders-interactive-with-active": open,
          },
          className
        )}
        style={
          {
            "--tag-width": `${tagWidth}px`,
          } as CSSProperties
        }
      >
        <Select.Value aria-label={value[0]} />
        <Select.Icon className="ml-auto">
          <TrianglesMini className="text-ui-fg-muted" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content className="bg-white border shadow-lg rounded-md">
          <Select.Viewport className="p-2">
            {options.length > 0 &&
              !showLoading &&
              options.map((option, index) => (
                <SelectItem value={option.value} key={option.value}>
                  <button
                    data-active={
                      showLevelUp
                        ? focusedIndex === index + 1
                        : focusedIndex === index
                    }
                    type="button"
                    role="option"
                    className={clx(
                      "flex h-full w-full appearance-none items-center gap-2 overflow-hidden rounded-md px-2 py-1.5 text-left outline-none"
                    )}
                    onMouseEnter={() =>
                      setFocusedIndex(showLevelUp ? index + 1 : index)
                    }
                    onMouseLeave={() => setFocusedIndex(-1)}
                    tabIndex={-1}
                  >
                    <Text
                      as="span"
                      size="small"
                      leading="compact"
                      className="flex w-full truncate"
                    >
                      {option.label}
                    </Text>
                  </button>
                </SelectItem>
              ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
})

CategorySelect.displayName = "CategorySelect"

type ProductCategoryOption = {
  value: string
  label: string
  has_children: boolean
}

const SelectItem = ({
  value,
  children,
}: {
  value: string
  children: React.ReactNode
}) => {
  return (
    <Select.Item
      value={value}
      className={clx(
        "transition-fg bg-ui-bg-base flex cursor-pointer  items-center gap-2 overflow-hidden hover:bg-ui-bg-field-hover"
      )}
    >
      <Select.ItemText>{children}</Select.ItemText>
      <Select.ItemIndicator className="ml-auto">
        <Check />
      </Select.ItemIndicator>
    </Select.Item>
  )
}

function getOptions(
  categories: AdminProductCategoryResponse["product_category"][]
): ProductCategoryOption[] {
  return categories.map((cat) => {
    return {
      value: cat.id,
      label: cat.name,
      has_children: cat.category_children?.length > 0,
    }
  })
}
