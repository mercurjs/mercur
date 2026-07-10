'use client'

import { type ReactNode, useRef } from 'react'
import { cn } from '@/lib/utils'

interface CategoryDropdownContainerProps {
  children: ReactNode
  isVisible: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export const CategoryDropdownContainer = ({
  children,
  isVisible,
  onMouseEnter,
  onMouseLeave,
}: CategoryDropdownContainerProps) => {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <>
      {/* Invisible 'bridge' to prevent dropdown from closing */}
      <div
        className="fixed left-0 right-0 z-40 pointer-events-auto"
        style={{
          top: 'var(--navbar-height, 120px)',
          // Gap height
          height: '10rem',
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />

      <div
        ref={containerRef}
        className={cn(
          'fixed left-0 right-0 z-50 mx-auto w-full bg-primary transition-all duration-300 ease-in-out max-h-[25rem] h-full',

        )}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{
          top: 'var(--navbar-height, 160px)',
        }}
      >
        <div className="max-w-[1440px] max-h-[25rem] h-full bg-primary px-5">
          {children}
        </div>
      </div>
    </>
  )
}
