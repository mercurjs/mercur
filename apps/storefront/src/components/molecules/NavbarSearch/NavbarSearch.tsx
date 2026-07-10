"use client"

import { Input } from "@/components/atoms"
import { SearchIcon } from "@/icons"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import { redirect } from "next/navigation"
import clsx from "clsx"

interface Props {
  className?: string
}

export const NavbarSearch = ({ className }: Props) => {
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get("query") || "")

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
