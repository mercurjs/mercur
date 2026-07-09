/**
 * The index engine (enabled by default via `withMercur`) syncs asynchronously
 * after writes, so a list issued immediately after a create can miss the newest
 * rows. Poll until the response satisfies `predicate`, mirroring Medusa's own
 * `waitForIndexedEntities` test helper.
 */
export const waitFor = async <T>(
  fetcher: () => Promise<T>,
  predicate: (result: T) => boolean,
  { retries = 20, delay = 150 }: { retries?: number; delay?: number } = {}
): Promise<T> => {
  let result = await fetcher()
  let attempt = 0
  while (!predicate(result) && attempt < retries) {
    await new Promise((resolve) => setTimeout(resolve, delay))
    result = await fetcher()
    attempt++
  }
  return result
}
