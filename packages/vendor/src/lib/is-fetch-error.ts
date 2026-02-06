import { ClientError } from "@mercurjs/client"

export const isClientError = (error: any): error is ClientError => {
  return error instanceof ClientError
}
