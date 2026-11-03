"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { type FormEvent, useState } from "react"

import { Button } from "@/components/atoms/Button/Button"
import { Input } from "@/components/atoms/Input/Input"
import { Accordion } from "@/components/molecules/Accordion/Accordion"
import { withPriceHref } from "@/lib/helpers/listing-params"

const parsePrice = (value: string) => {
  if (!value) return null
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

// The range applies on submit rather than per keystroke, so typing "12" does
// not briefly filter to products under 1.
export const PriceFilter = ({
  bounds,
  defaultOpen,
}: {
  bounds: { min: number; max: number; currency_code: string }
  defaultOpen: boolean
}) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const appliedMin = searchParams.get("min_price") ?? ""
  const appliedMax = searchParams.get("max_price") ?? ""
  const appliedKey = `${appliedMin}:${appliedMax}`
  const [inputs, setInputs] = useState({ key: appliedKey, min: appliedMin, max: appliedMax })
  // The applied range changed under us (back/forward, badge removal), so the
  // unsubmitted input is discarded.
  if (inputs.key !== appliedKey) {
    setInputs({ key: appliedKey, min: appliedMin, max: appliedMax })
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const href = withPriceHref(searchParams, parsePrice(inputs.min), parsePrice(inputs.max))
    router.push(`${pathname}${href}`, { scroll: false })
  }

  const currency = bounds.currency_code.toUpperCase()

  return (
    <Accordion heading="Price" defaultOpen={defaultOpen}>
      <form
        onSubmit={submit}
        className="flex items-end gap-2 mb-4 px-2"
        data-testid="filter-price"
      >
        <label className="flex flex-col gap-1 w-full label-sm">
          <span>Min ({currency})</span>
          <Input
            placeholder={String(bounds.min)}
            value={inputs.min}
            onChange={(event) => setInputs((prev) => ({ ...prev, min: event.target.value }))}
            type="number"
            min="0"
            step="0.01"
            className="no-arrows-number-input"
            data-testid="filter-price-min"
          />
        </label>
        <label className="flex flex-col gap-1 w-full label-sm">
          <span>Max ({currency})</span>
          <Input
            placeholder={String(bounds.max)}
            value={inputs.max}
            onChange={(event) => setInputs((prev) => ({ ...prev, max: event.target.value }))}
            type="number"
            min="0"
            step="0.01"
            className="no-arrows-number-input"
            data-testid="filter-price-max"
          />
        </label>
        <Button type="submit" variant="tonal" aria-label="Apply price" data-testid="filter-price-apply">
          Go
        </Button>
      </form>
    </Accordion>
  )
}
