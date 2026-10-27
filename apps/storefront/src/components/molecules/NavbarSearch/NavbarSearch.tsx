"use client"

import { Input } from '@/components/atoms/Input/Input';
import { SearchIcon } from "@/icons"
import { useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"
import { redirect } from "next/navigation"
import clsx from "clsx"

interface Props {
  className?: string
}

export const NavbarSearch = ({ className }: Props) => (
  <Suspense fallback={<NavbarSearchForm className={className} initialQuery="" />}>
    <NavbarSearchWithQuery className={className} />
  </Suspense>
)

const NavbarSearchWithQuery = ({ className }: Props) => {
  const searchParams = useSearchParams()
  return <NavbarSearchForm className={className} initialQuery={searchParams.get("query") || ""} />
}

const NavbarSearchForm = ({ className, initialQuery }: Props & { initialQuery: string }) => {
  const [search, setSearch] = useState(initialQuery)

  const handleSearch = () => {
    if (search) {
      redirect(`/categories?query=${search}`)
    } else {
      redirect(`/categories`)
    }
  }

  const submitHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    handleSearch()
  }

  return (
    <form className={clsx("w-full", className)} method="POST" onSubmit={submitHandler}>
      <Input
        icon={<SearchIcon />}
        onIconClick={handleSearch}
        iconAriaLabel="Search"
        placeholder="Search product"
        value={search}
        changeValue={setSearch}
        type="search"
      />
      <input type="submit" className="hidden" />
    </form>
  )
}
