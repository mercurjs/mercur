/* eslint-disable @typescript-eslint/no-explicit-any */
export type TQueryKey<TKey, TListQuery = any, TDetailQuery = string> = {
  all: [TKey]
  lists: () => [...TQueryKey<TKey>['all'], 'list']
  list: (
    query?: TListQuery
  ) => [
    ...ReturnType<TQueryKey<TKey>['lists']>,
    { query: TListQuery | undefined }
  ]
  details: () => [...TQueryKey<TKey>['all'], 'detail']
  detail: (
    id: TDetailQuery
  ) => [...ReturnType<TQueryKey<TKey>['details']>, TDetailQuery]
}

/**
 * Factory function for better management of query cache
 * see https://tkdodo.eu/blog/effective-react-query-keys
 */
export const queryKeysFactory = <
  T,
  TListQueryType = any,
  TDetailQueryType = string
>(
  globalKey: T
) => {
  const queryKeyFactory: TQueryKey<T, TListQueryType, TDetailQueryType> = {
    all: [globalKey],
    lists: () => [...queryKeyFactory.all, 'list'],
    list: (query?: TListQueryType) => [...queryKeyFactory.lists(), { query }],
    details: () => [...queryKeyFactory.all, 'detail'],
    detail: (id: TDetailQueryType) => [...queryKeyFactory.details(), id]
  }
  return queryKeyFactory
}
