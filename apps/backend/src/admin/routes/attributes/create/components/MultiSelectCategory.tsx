import { Text, Badge } from "@medusajs/ui"
import { AdminProductCategory } from "@medusajs/types"
import React, { useState, useRef, useEffect } from "react"
import { TrianglesMini, XMarkMini, ArrowUturnLeft, TriangleRightMiniHover } from "@medusajs/icons"

type MultiSelectCategoryProps = {
  categories: AdminProductCategory[]
  value: string[]
  onChange: (value: string[]) => void
}

const MultiSelectCategory: React.FC<MultiSelectCategoryProps> = ({
  categories,
  value,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const [currentParentId, setCurrentParentId] = useState<string | null>(null)
  const [pathHistory, setPathHistory] = useState<(string | null)[]>([])

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
        className="relative flex h-10 w-full cursor-pointer items-center justify-between overflow-hidden rounded-md border border-ui-border-base bg-ui-bg-field text-ui-fg-base shadow-sm transition-colors duration-150 ease-in-out hover:bg-ui-bg-field-hover focus-within:border-ui-border-interactive focus-within:ring-1 focus-within:ring-ui-ring-interactive"
        onClick={handleToggle}
      >
        <div className="flex items-center gap-2 px-3 py-2">
          {value.length > 0 ? (
            <>
              <button type="button" onClick={(e) => { e.stopPropagation(); onChange([]) }}>
                <Badge size="small" className="w-fit">
                  {value.length}
                  <XMarkMini></XMarkMini>
                </Badge>
              </button>
            </>
          ) : (
            <Text className="text-ui-fg-subtle">Select categories</Text>
          )}
        </div>
        <span className="flex h-full w-10 items-center justify-center border-l border-ui-border-base">
          <TrianglesMini></TrianglesMini>
        </span>
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
                    {isSelected && <span className="absolute left-3 top-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full" />}
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