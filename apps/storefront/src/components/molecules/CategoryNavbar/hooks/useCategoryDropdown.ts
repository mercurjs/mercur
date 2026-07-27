import { useState, useCallback, useEffect } from 'react'

export const useCategoryDropdown = () => {
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null)
  const [isDropdownVisible, setIsDropdownVisible] = useState(false)
  const [shouldRenderDropdown, setShouldRenderDropdown] = useState(false)

  const openDropdown = useCallback((categoryId: string) => {
    setHoveredCategoryId(categoryId)
    setShouldRenderDropdown(true)
    const timer = setTimeout(() => setIsDropdownVisible(true), 20)
    return () => clearTimeout(timer)
  }, [])

  const closeDropdown = useCallback(() => {
    setIsDropdownVisible(false)
    const timer = setTimeout(() => {
      setShouldRenderDropdown(false)
      setHoveredCategoryId(null)
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!hoveredCategoryId) {
      closeDropdown()
    }
  }, [hoveredCategoryId, closeDropdown])

  useEffect(() => {
    if (!shouldRenderDropdown) return

    const handlePageScroll = () => {
      closeDropdown()
    }

    window.addEventListener('scroll', handlePageScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handlePageScroll)
    }
  }, [shouldRenderDropdown, closeDropdown])

  return {
    hoveredCategoryId,
    isDropdownVisible,
    shouldRenderDropdown,
    openDropdown,
    closeDropdown,
    setHoveredCategoryId,
  }
}
