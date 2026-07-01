"use cache"

import { HttpTypes } from "@mercurjs/types"
import { cacheLife, cacheTag } from "next/cache"

import { CACHE_TAGS, collectionTag } from "../cache/cache-tags"
import { EXPIRE, REVALIDATE } from "../cache/constants"
import { sdk } from "../config"

export const retrieveCollection = async (id: string) => {
  cacheTag(CACHE_TAGS.collections)
  cacheLife({ revalidate: REVALIDATE, expire: EXPIRE })

  return sdk.client
    .fetch<{ collection: HttpTypes.StoreCollection }>(
      `/store/collections/${id}`
    )
    .then(({ collection }) => collection)
}

export const listCollections = async (
  queryParams: Record<string, string> = {}
): Promise<{ collections: HttpTypes.StoreCollection[]; count: number }> => {
  cacheTag(CACHE_TAGS.collections)
  cacheLife({ revalidate: REVALIDATE, expire: EXPIRE })

  queryParams.limit = queryParams.limit || "100"
  queryParams.offset = queryParams.offset || "0"

  return sdk.client
    .fetch<{ collections: HttpTypes.StoreCollection[]; count: number }>(
      "/store/collections",
      {
        query: queryParams,
      }
    )
    .then(({ collections }) => ({ collections, count: collections.length }))
}

export const getCollectionByHandle = async (
  handle: string
): Promise<HttpTypes.StoreCollection> => {
  cacheTag(CACHE_TAGS.collections, collectionTag(handle))
  cacheLife({ revalidate: REVALIDATE, expire: EXPIRE })

  return sdk.client
    .fetch<HttpTypes.StoreCollectionListResponse>(`/store/collections`, {
      query: { handle, fields: "*products" },
    })
    .then(({ collections }) => collections[0])
}
