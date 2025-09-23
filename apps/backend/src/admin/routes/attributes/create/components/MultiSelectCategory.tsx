import { Text, Badge } from "@medusajs/ui"
import { AdminProductCategory } from "@medusajs/types"
import React, { useState, useRef, useEffect } from "react"
import { TrianglesMini, XMarkMini, ArrowUturnLeft, TriangleRightMiniHover } from "@medusajs/icons"

type MultiSelectCategoryProps = {
  categories: AdminProductCategory[]
  value: string[]
  onChange: (value: string[]) => void
  "aria-invalid"?: boolean
}

const MultiSelectCategory: React.FC<MultiSelectCategoryProps> = ({
  categories,
  value,
  onChange,
  "aria-invalid": ariaInvalid = false,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const badgesContainerRef = useRef<HTMLDivElement>(null)
  const [currentParentId, setCurrentParentId] = useState<string | null>(null)
  const [pathHistory, setPathHistory] = useState<(string | null)[]>([])
  const [visibleBadgesCount, setVisibleBadgesCount] = useState(0)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Calculate how many badges can fit
  const calculateVisibleBadges = () => {
    if (value.length === 0 || !badgesContainerRef.current) {
      setVisibleBadgesCount(0)
      return
    }

    const container = badgesContainerRef.current
    const containerWidth = container.offsetWidth
    const padding = 24 // px-3 on both sides
    const gap = 8 // gap-2
    const availableWidth = containerWidth - padding

    // Estimate badge width based on category name length
    const estimateBadgeWidth = (categoryName: string) => {
      // Base width for badge structure + text width estimation
      const baseWidth = 32 // Base badge width (padding, icon, etc.)
      const charWidth = 8 // Approximate character width
      return baseWidth + (categoryName.length * charWidth)
    }

    let totalWidth = 0
    let count = 0

    for (let i = 0; i < value.length; i++) {
      const category = categories.find(cat => cat.id === value[i])
      const categoryName = category?.name || 'Unknown'
      const badgeWidth = estimateBadgeWidth(categoryName) > 200 ? 235 : estimateBadgeWidth(categoryName)

      if (totalWidth + badgeWidth + (count > 0 ? gap : 0) <= availableWidth) {
        totalWidth += badgeWidth + (count > 0 ? gap : 0)
        count++
      } else {
        break
      }
    }

    setVisibleBadgesCount(count)
  }

  useEffect(() => {
    calculateVisibleBadges()
  }, [value, categories])

  // Handle resize events
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      calculateVisibleBadges()
    })

    if (badgesContainerRef.current) {
      resizeObserver.observe(badgesContainerRef.current)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [value, categories])

  const handleToggle = () => {
    setIsOpen((prev) => !prev)
  }

  const hasChildren = (categoryId: string) => {
    return categories.some(cat => cat.parent_category_id === categoryId)
  }

  const handleDrillDown = (category: AdminProductCategory, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent selection when drilling down
    setPathHistory([...pathHistory, currentParentId])
    setCurrentParentId(category.id)
  }

  const handleGoBack = () => {
    const newPathHistory = [...pathHistory]
    const previousParentId = newPathHistory.pop()
    setPathHistory(newPathHistory)
    setCurrentParentId(previousParentId || null)
  }

  const handleItemClick = (categoryId: string) => {
    const isSelected = value.includes(categoryId)
    if (isSelected) {
      onChange(value.filter((id) => id !== categoryId))
    } else {
      onChange([...value, categoryId])
    }
  }

  const currentCategories = categories.filter(cat => cat.parent_category_id === currentParentId)

  const getBackButtonText = (): string => {
    const parentCategory = categories.find(cat => cat.id === currentParentId);
    return parentCategory?.name || "";
  }

  return (
    <div className="relative">
      <div
        ref={triggerRef}
        className={`relative flex h-10 w-full cursor-pointer items-center justify-between overflow-hidden rounded-md border bg-ui-bg-field text-ui-fg-base shadow-sm transition-colors duration-150 ease-in-out hover:bg-ui-bg-field-hover focus-within:ring-1 ${ariaInvalid
          ? '!shadow-borders-error'
          : 'border-ui-border-base focus-within:border-ui-border-interactive focus-within:ring-ui-ring-interactive'
          }`}
        onClick={handleToggle}
      >
        <div ref={badgesContainerRef} className="flex items-center gap-2 px-3 py-2 flex-1 min-w-0">
          {value.length > 0 ? (
            <>
              {value.slice(0, visibleBadgesCount).map((categoryId) => {
                const category = categories.find(cat => cat.id === categoryId)
                return (
                  <button
                    key={categoryId}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onChange(value.filter(id => id !== categoryId)) }}
                    className="flex-shrink-0"
                  >
                    <Badge size="small" className="w-fit">
                      <span className="text-ellipsis truncate max-w-[200px]">{category?.name || 'Unknown'}</span>
                      <XMarkMini />
                    </Badge>
                  </button>
                )
              })}
              {value.length > visibleBadgesCount && (
                <Badge size="small" className="w-fit flex-shrink-0 bg-transparent border-none text-ui-fg-subtle px-0 txt-compact-small-plus">
                  +{value.length - visibleBadgesCount}
                </Badge>
              )}
            </>
          ) : (
            <Text className="text-ui-fg-subtle">Select categories</Text>
          )}
        </div>
        <div className="flex h-full items-center justify-center">
          {value.length > 0 && (
            <button type="button" className="flex h-full w-8 items-center justify-center" onClick={(e) => { e.stopPropagation(); onChange([]) }}>
              <XMarkMini className="text-ui-fg-muted" />
            </button>
          )}
          <span className="flex h-full w-8 items-center justify-center">
            <TrianglesMini className="text-ui-fg-muted" />
          </span>
        </div>
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-10 mt-1 w-full max-h-60 overflow-y-auto rounded-md border border-ui-border-base bg-ui-bg-base shadow-lg"
        >
          {currentParentId !== null && (
            <div
              className="flex cursor-pointer items-center gap-3 px-3 py-2 text-ui-fg-subtle hover:bg-ui-bg-base-hover border-b border-ui-border-base"
              onClick={handleGoBack}
            >
              <ArrowUturnLeft />
              <Text>{getBackButtonText()}</Text>
            </div>
          )}
          {currentCategories.length === 0 ? (
            <div className="p-3 text-ui-fg-subtle">No categories found.</div>
          ) : (
            currentCategories.map((category) => {
              const isSelected = value.includes(category.id);
              const hasChildrenNode = hasChildren(category.id)
              return (
                <div
                  key={category.id}
                  className={`flex cursor-pointer items-center justify-between px-1 py-1`}
                  onClick={() => handleItemClick(category.id)}
                >
                  <div className="flex items-center hover:bg-ui-bg-base-hover flex-1 px-2 mr-2 py-1.5 rounded-md relative">
                    {isSelected && <span className="absolute left-3 top-1/2 -translate-y-1/2 w-1 h-1 bg-ui-fg-base rounded-full" />}
                    <Text className="ml-6">{category.name}</Text>
                  </div>
                  {hasChildrenNode && (
                    <div onClick={(e) => handleDrillDown(category, e)} className="p-2 rounded-md hover:bg-ui-bg-base-hover">
                      <TriangleRightMiniHover className="mr-1" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default MultiSelectCategory 