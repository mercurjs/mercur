import React, { useEffect, useRef, useState } from "react";

import {
  ArrowUturnLeft,
  TriangleRightMiniHover,
  TrianglesMini,
  XMarkMini,
} from "@medusajs/icons";
import { AdminProductCategory } from "@medusajs/types";
import { Badge, Text } from "@medusajs/ui";

type MultiSelectCategoryProps = {
  categories: AdminProductCategory[];
  value: string[];
  onChange: (value: string[]) => void;
};

const MultiSelectCategory: React.FC<MultiSelectCategoryProps> = ({
  categories,
  value,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);
  const [pathHistory, setPathHistory] = useState<(string | null)[]>([]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const hasChildren = (categoryId: string) => {
    return categories.some((cat) => cat.parent_category_id === categoryId);
  };

  const handleDrillDown = (
    category: AdminProductCategory,
    event: React.MouseEvent,
  ) => {
    event.stopPropagation(); // Prevent selection when drilling down
    setPathHistory([...pathHistory, currentParentId]);
    setCurrentParentId(category.id);
  };

  const handleGoBack = () => {
    const newPathHistory = [...pathHistory];
    const previousParentId = newPathHistory.pop();
    setPathHistory(newPathHistory);
    setCurrentParentId(previousParentId || null);
  };

  const handleItemClick = (categoryId: string) => {
    const isSelected = value.includes(categoryId);
    if (isSelected) {
      onChange(value.filter((id) => id !== categoryId));
    } else {
      onChange([...value, categoryId]);
    }
  };

  const currentCategories = categories.filter(
    (cat) => cat.parent_category_id === currentParentId,
  );

  const getBackButtonText = (): string => {
    const parentCategory = categories.find((cat) => cat.id === currentParentId);
    return parentCategory?.name || "";
  };

  return (
    <div className="relative" data-testid="attribute-form-category-multiselect">
      <div
        ref={triggerRef}
        className="focus-within:ring-ui-ring-interactive relative flex h-10 w-full cursor-pointer items-center justify-between overflow-hidden rounded-md border border-ui-border-base bg-ui-bg-field text-ui-fg-base shadow-sm transition-colors duration-150 ease-in-out focus-within:border-ui-border-interactive focus-within:ring-1 hover:bg-ui-bg-field-hover"
        onClick={handleToggle}
        data-testid="attribute-form-category-multiselect-trigger"
      >
        <div className="flex items-center gap-2 px-3 py-2" data-testid="attribute-form-category-multiselect-trigger-content">
          {value.length > 0 ? (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange([]);
                }}
                data-testid="attribute-form-category-multiselect-clear-button"
              >
                <Badge size="small" className="w-fit" data-testid="attribute-form-category-multiselect-badge">
                  {value.length}
                  <XMarkMini></XMarkMini>
                </Badge>
              </button>
            </>
          ) : (
            <Text className="text-ui-fg-subtle" data-testid="attribute-form-category-multiselect-placeholder">Select categories</Text>
          )}
        </div>
        <span className="flex h-full w-10 items-center justify-center border-l border-ui-border-base" data-testid="attribute-form-category-multiselect-icon">
          <TrianglesMini></TrianglesMini>
        </span>
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-ui-border-base bg-ui-bg-base shadow-lg"
          data-testid="attribute-form-category-multiselect-dropdown"
        >
          {currentParentId !== null && (
            <div
              className="flex cursor-pointer items-center gap-3 border-b border-ui-border-base px-3 py-2 text-ui-fg-subtle hover:bg-ui-bg-base-hover"
              onClick={handleGoBack}
              data-testid="attribute-form-category-multiselect-back-button"
            >
              <ArrowUturnLeft />
              <Text data-testid="attribute-form-category-multiselect-back-text">{getBackButtonText()}</Text>
            </div>
          )}
          {currentCategories.length === 0 ? (
            <div className="p-3 text-ui-fg-subtle" data-testid="attribute-form-category-multiselect-empty">No categories found.</div>
          ) : (
            currentCategories.map((category) => {
              const isSelected = value.includes(category.id);
              const hasChildrenNode = hasChildren(category.id);
              return (
                <div
                  key={category.id}
                  className={`flex cursor-pointer items-center justify-between px-1 py-1`}
                  onClick={() => handleItemClick(category.id)}
                  data-testid={`attribute-form-category-multiselect-item-${category.id}`}
                >
                  <div className="relative mr-2 flex flex-1 items-center rounded-md px-2 py-1.5 hover:bg-ui-bg-base-hover" data-testid={`attribute-form-category-multiselect-item-${category.id}-content`}>
                    {isSelected && (
                      <span className="absolute left-3 top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-ui-fg-base" data-testid={`attribute-form-category-multiselect-item-${category.id}-selected-indicator`} />
                    )}
                    <Text className="ml-6" data-testid={`attribute-form-category-multiselect-item-${category.id}-name`}>{category.name}</Text>
                  </div>
                  {hasChildrenNode && (
                    <div
                      onClick={(e) => handleDrillDown(category, e)}
                      className="rounded-md p-2 hover:bg-ui-bg-base-hover"
                      data-testid={`attribute-form-category-multiselect-item-${category.id}-drill-down`}
                    >
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
};

export default MultiSelectCategory;
