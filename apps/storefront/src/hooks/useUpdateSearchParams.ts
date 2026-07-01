import { usePathname, useRouter, useSearchParams } from "next/navigation"

const useUpdateSearchParams = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const updateSearchParams = (field: string, value: string | null) => {
    const updatedSearchParams = new URLSearchParams(searchParams.toString())
    if (!value) {
      updatedSearchParams.delete(field)
    } else {
      updatedSearchParams.set(field, value)
    }

    router.push(`${pathname}?${updatedSearchParams}`, {
      scroll: false,
    })
  }

  return updateSearchParams
}

export default useUpdateSearchParams
