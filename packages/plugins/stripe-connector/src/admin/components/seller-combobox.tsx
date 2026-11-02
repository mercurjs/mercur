import { Combobox } from "@mercurjs/dashboard-shared"
import { keepPreviousData } from "@tanstack/react-query"
import { forwardRef, useEffect, useMemo, useRef, useState } from "react"

import { useSellers } from "../hooks/api/stripe"

type SellerComboboxProps = {
  value?: string
  onChange: (value?: string) => void
  "data-testid"?: string
}

export const SellerCombobox = forwardRef<HTMLInputElement, SellerComboboxProps>(
  ({ value, onChange, ...props }, ref) => {
    const [search, setSearch] = useState("")
    const [q, setQ] = useState("")
    const seen = useRef(new Map<string, string>())

    useEffect(() => {
      const timeout = setTimeout(() => setQ(search), 300)
      return () => clearTimeout(timeout)
    }, [search])

    const { sellers } = useSellers({ limit: 20, ...(q ? { q } : {}) }, { placeholderData: keepPreviousData })

    const options = useMemo(() => {
      for (const seller of sellers ?? []) {
        seen.current.set(seller.id, seller.name)
      }

      const list = (sellers ?? []).map((seller) => ({ label: seller.name, value: seller.id }))
      const selected = value ? seen.current.get(value) : undefined

      if (value && selected && !list.some((option) => option.value === value)) {
        list.unshift({ label: selected, value })
      }

      return list
    }, [sellers, value])

    return (
      <Combobox
        ref={ref}
        value={value}
        onChange={onChange}
        onSearchValueChange={setSearch}
        options={options}
        {...props}
      />
    )
  }
)

SellerCombobox.displayName = "SellerCombobox"
