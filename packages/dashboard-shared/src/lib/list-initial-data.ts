// A route loader only prefetches the unfiltered first page. Seeding any other
// query key with it as `initialData` makes TanStack Query treat it as fresh
// (within staleTime) and skip the request, so search, filters, sorting and
// pagination would keep showing the loader's rows.
export const getListInitialData = <TData>(
  queryParams: Record<string, string | undefined>,
  loaderData: TData | undefined
): TData | undefined => {
  const hasParams = Object.values(queryParams).some(
    (value) => value !== undefined && value !== ""
  )

  return hasParams ? undefined : loaderData
}
