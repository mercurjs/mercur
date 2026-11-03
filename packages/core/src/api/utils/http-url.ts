import { z } from "zod"

const HTTP_URL_PATTERN = /^https?:\/\/[^\s/?#]+[^\s]*$/i

export const httpUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => HTTP_URL_PATTERN.test(value), {
    message: "Must be an http(s) URL",
  })
