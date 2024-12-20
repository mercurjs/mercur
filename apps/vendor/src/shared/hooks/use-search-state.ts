import { useEffect, useState } from 'react'
import { useSearch } from 'wouter'

type UseSearchStateProps<Value = string> = {
  name: string
  serialize?: (value: Value) => string
  deserialize?: (value: string | null) => Value
  withPageParam?: boolean
}

export const useSearchState = <Value = string>({
  name,
  serialize = String,
  deserialize = (value) => value as Value,
  withPageParam = false
}: UseSearchStateProps<Value>) => {
  const searchString = useSearch()

  const [value, setValue] = useState(() => {
    const searchParams = new URLSearchParams(searchString)
    return deserialize(searchParams.get(name))
  })

  const updateValue = (value: Value) => {
    setValue(value)
    const searchParams = new URLSearchParams(searchString)

    if (!value) {
      searchParams.delete(name)
    } else {
      searchParams.set(name, serialize(value))
    }
    if (!withPageParam) {
      searchParams.delete('page')
    }

    const search = searchParams.toString()
    history.pushState(
      null,
      '',
      search ? `?${search}` : window.location.pathname
    )
  }

  useEffect(() => {
    const searchParams = new URLSearchParams(searchString)
    const newValue = deserialize(searchParams.get(name))

    setValue(newValue)
  }, [deserialize, name, searchString])

  return [value, updateValue] as const
}
