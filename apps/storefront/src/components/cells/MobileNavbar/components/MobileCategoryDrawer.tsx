"use client"

import { HttpTypes } from "@medusajs/types"
import { useEffect } from "react"
import { cn } from "@/lib/utils"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { ArrowLeftIcon, CloseIcon } from "@/icons"
import { IconButton } from "@/components/atoms"

interface MobileCategoryDrawerProps {
  category: HttpTypes.StoreProductCategory
  isOpen: boolean
  onClose: () => void
  onLinkClick?: () => void
}

export const MobileCategoryDrawer = ({
  category,
  isOpen,
  onClose,
  onLinkClick,
}: MobileCategoryDrawerProps) => {
  const childCategories = category.category_children || []

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  const handleLinkClick = () => {
    onLinkClick?.()
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-primary/80 z-50 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-primary transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center p-4 border-b gap-4">
            <IconButton
              icon={<ArrowLeftIcon size={20} />}
              onClick={onClose}
              aria-label="Close drawer"
              variant="icon"
            />
            <h3 className="heading-md uppercase text-primary">
              {category.name}
            </h3>
            <IconButton
              icon={<CloseIcon size={20} />}
              onClick={onClose}
              className="ml-auto"
              aria-label="Close drawer"
              variant="icon"
            />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <nav className="flex flex-col gap-2">
                <LocalizedClientLink
                  key={category.id}
                  href={`/categories/${category.handle}`}
                  onClick={handleLinkClick}
                  className="heading-sm uppercase px-4 py-3 text-primary hover:bg-secondary/10 transition-colors"
                >
                  {category.name}
                </LocalizedClientLink>
              {childCategories.map((child) => (
                <LocalizedClientLink
                  key={child.id}
                  href={`/categories/${child.handle}`}
                  onClick={handleLinkClick}
                  className="label-md uppercase px-4 py-3 text-primary hover:bg-secondary/10 transition-colors"
                >
                  {child.name}
                </LocalizedClientLink>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </>
  )
}
