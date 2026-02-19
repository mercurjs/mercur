import { createClient, InferClient } from "@mercurjs/client"
import { Routes } from "@mercurjs/core-plugin/_generated"
import config from "virtual:mercur/config"

export const backendUrl = config.backendUrl ?? "http://localhost:9000"

export const client: InferClient<Routes> = createClient<Routes>({
  baseUrl: backendUrl,
  fetchOptions: {
    credentials: "include",
  },
})
