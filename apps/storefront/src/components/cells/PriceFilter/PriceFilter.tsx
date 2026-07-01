"use client"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

import { Input } from "@/components/atoms"
import { Accordion, FilterCheckboxOption } from "@/components/molecules"
import useUpdateSearchParams from "@/hooks/useUpdateSearchParams"
import { DollarIcon } from "@/icons"
import useFilters from "@/hooks/useFilters"

export const PriceFilter = () => {
  const [min, setMin] = useState("")
  const [max, setMax] = useState("")

  const updateSearchParams = useUpdateSearchParams()
  const { updateFilters } = useFilters("sale")
  const searchParams = useSearchParams()

  const selected = searchParams.get("sale")

  useEffect(() => {
    setMin(searchParams.get("min_price") || "")
    setMax(searchParams.get("max_price") || "")
  }, [searchParams])

  const selectHandler = (option: string) => {
    updateFilters(option)
  }

  const updateMinPriceHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    updateSearchParams("min_price", min)
  }

  const updateMaxPriceHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    updateSearchParams("max_price", max)
  }

  return (
    <Accordion heading="Price" data-testid="filter-price">
      <div className="flex gap-2 mb-4" data-testid="filter-price-inputs">
        <form method="POST" onSubmit={updateMinPriceHandler}>
          <Input
            placeholder="Min"
            icon={<DollarIcon size={16} />}
            onChange={(e) => setMin(e.target.value)}
            value={min}
            type="number"
            className="no-arrows-number-input"
            data-testid="filter-price-min"
          />
          <input type="submit" className="hidden" />
        </form>
        <form method="POST" onSubmit={updateMaxPriceHandler}>
          <Input
            placeholder="Max"
            icon={<DollarIcon size={16} />}
            onChange={(e) => setMax(e.target.value)}
            type="number"
            className="no-arrows-number-input"
            value={max}
            data-testid="filter-price-max"
          />
          <input type="submit" className="hidden" />
        </form>
      </div>
      {/* <div className='px-4'>
        <FilterCheckboxOption
          checked={Boolean(selected)}
          onCheck={selectHandler}
          label={'On Sale'}
        />
      </div> */}
    </Accordion>
  )
}
