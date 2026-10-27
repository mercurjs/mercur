import { HttpTypes } from "@medusajs/types"
import { cacheLife, cacheTag } from "next/cache"

import { sdk } from "../client"
import { CACHE_TAGS, cacheFailedRead } from "./cache-tags"

export const retrieveCollection = async (id: string) => {
  "use cache"
  cacheLife("hours")
  cacheTag(CACHE_TAGS.collections, CACHE_TAGS.collection(id))

  return (sdk.store.collections.$id
    .query({
      $id: id,
      fetchOptions: { cache: "no-store" },
    } as never) as unknown as Promise<{ collection: HttpTypes.StoreCollection }>)
    .then(({ collection }) => collection)
    .catch(() => {
      cacheFailedRead()
      return null
    })
}

export const listCollections = async (
  queryParams: Record<string, string> = {}
): Promise<{ collections: HttpTypes.StoreCollection[]; count: number }> => {
  "use cache"
  cacheLife("hours")
  cacheTag(CACHE_TAGS.collections)

  return (sdk.store.collections
    .query({
      limit: "100",
      offset: "0",
      ...queryParams,
      fetchOptions: { cache: "no-store" },
    } as never) as unknown as Promise<{ collections: HttpTypes.StoreCollection[]; count: number }>)
    .then(({ collections }) => ({ collections, count: collections.length }))
    .catch(() => {
      cacheFailedRead()
      return { collections: [], count: 0 }
    })
}

export const getCollectionByHandle = async (
  handle: string
): Promise<HttpTypes.StoreCollection | null> => {
  "use cache"
  cacheLife("hours")
  cacheTag(CACHE_TAGS.collections, CACHE_TAGS.collection(handle))

  return (sdk.store.collections
    .query({
      handle,
      fields: "*products",
      fetchOptions: { cache: "no-store" },
    } as never) as unknown as Promise<HttpTypes.StoreCollectionListResponse>)
    .then(({ collections }) => collections[0] ?? null)
    .catch(() => {
      cacheFailedRead()
      return null
    })
}
