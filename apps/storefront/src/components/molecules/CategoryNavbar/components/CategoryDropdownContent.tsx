'use client'

import { type ReactNode, useRef, useEffect } from 'react'

interface CategoryDropdownContentProps {
  children: ReactNode
  maxHeight?: string
}

export const CategoryDropdownContent = ({
  children,
  maxHeight = '25rem',
}: CategoryDropdownContentProps) => {
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = contentRef.current
    if (!element) return

    const handleScroll = (e: Event) => {
      e.stopPropagation()
    }

    element.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      element.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <div
      ref={contentRef}
      className="py-6"
      style={{ maxHeight }}
    >
      {children}
    </div>
  )
}
