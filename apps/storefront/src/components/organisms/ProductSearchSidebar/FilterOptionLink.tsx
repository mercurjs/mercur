"use client"

import Link, { useLinkStatus } from "next/link"
import { usePathname, useRouter } from "next/navigation"
import type { KeyboardEvent, MouseEvent, ReactNode } from "react"

import Spinner from "@/icons/spinner"
import { cn } from "@/lib/utils"

// Filter options are real links so they work without JavaScript, and toggle
// in place with `scroll: false` when it is available. The pending spinner
// shows only on the option that triggered the navigation.
export const FilterOptionLink = ({
  href,
  selected,
  disabled = false,
  className,
  children,
  "data-testid": dataTestId,
  "aria-label": ariaLabel,
}: {
  href: string
  selected: boolean
  disabled?: boolean
  className?: string
  children: ReactNode
  "data-testid"?: string
  "aria-label"?: string
}) => {
  const router = useRouter()
  const pathname = usePathname()

  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className={cn("cursor-not-allowed text-disabled", className)}
        data-testid={dataTestId}
      >
        {children}
      </span>
    )
  }

  const navigate = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    router.push(`${pathname}${href}`, { scroll: false })
  }

  const pressOnSpace = (event: KeyboardEvent<HTMLAnchorElement>) => {
    if (event.key !== " ") return
    event.preventDefault()
    event.currentTarget.click()
  }

  return (
    <Link
      href={`${pathname}${href}`}
      role="button"
      aria-pressed={selected}
      aria-label={ariaLabel}
      scroll={false}
      onClick={navigate}
      onKeyDown={pressOnSpace}
      className={cn("flex items-center gap-2", className)}
      data-selected={selected}
      data-testid={dataTestId}
    >
      {children}
      <PendingIndicator />
    </Link>
  )
}

const PendingIndicator = () => {
  const { pending } = useLinkStatus()
  return pending ? <Spinner size={14} className="shrink-0" /> : null
}
