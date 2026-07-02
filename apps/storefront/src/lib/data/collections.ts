"use server"

import { HttpTypes } from "@medusajs/types"
import { getCacheOptions } from "./cookies"
import { mercur } from "../mercur"

export const retrieveCollection = async (id: string) => {
  const next = {
    ...(await getCacheOptions("collections")),
  }

  return mercur.store.collections.$id
    .query({ $id: id, fetchOptions: { next, cache: "force-cache" } })
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
  queryParams.fields =
    queryParams.fields ||
    "+media_images.url,+media_images.is_thumbnail"

  return mercur.store.collections
    .query({ ...queryParams, fetchOptions: { next, cache: "force-cache" } })
    .then(({ collections }) => ({ collections, count: collections.length }))
}

export const getCollectionByHandle = async (
  handle: string
): Promise<HttpTypes.StoreCollection> => {
  const next = {
    ...(await getCacheOptions("collections")),
  }

  return mercur.store.collections
    .query({
      handle,
      fields: "*products",
      fetchOptions: { next, cache: "force-cache" },
    })
    .then(({ collections }) => collections[0])
}
