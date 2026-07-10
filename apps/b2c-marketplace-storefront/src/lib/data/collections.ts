"use server"

import { HttpTypes } from "@medusajs/types"
import { getCacheOptions } from "./cookies"
import { sdk } from "../client"

export const retrieveCollection = async (id: string) => {
  const next = {
    ...(await getCacheOptions("collections")),
  }

  return (sdk.store.collections.$id
    .query({
      $id: id,
      fetchOptions: { next, cache: "force-cache" },
    } as never) as unknown as Promise<{ collection: HttpTypes.StoreCollection }>)
    .then(({ collection }) => collection)
}

export const listCollections = async (
  queryParams: Record<string, string> = {}
): Promise<{ collections: HttpTypes.StoreCollection[]; count: number }> => {
  const next = {
    ...(await getCacheOptions("collections")),
  }

  queryParams.limit = queryParams.limit || "100"
  queryParams.offset = queryParams.offset || "0"

  return (sdk.store.collections
    .query({
      ...queryParams,
      fetchOptions: { next, cache: "force-cache" },
    } as never) as unknown as Promise<{ collections: HttpTypes.StoreCollection[]; count: number }>)
    .then(({ collections }) => ({ collections, count: collections.length }))
}

export const getCollectionByHandle = async (
  handle: string
): Promise<HttpTypes.StoreCollection> => {
  const next = {
    ...(await getCacheOptions("collections")),
  }

  return (sdk.store.collections
    .query({
      handle,
      fields: "*products",
      fetchOptions: { next, cache: "force-cache" },
    } as never) as unknown as Promise<HttpTypes.StoreCollectionListResponse>)
    .then(({ collections }) => collections[0])
}
