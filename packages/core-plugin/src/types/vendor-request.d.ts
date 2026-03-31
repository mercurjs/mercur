import "@medusajs/framework/http"

declare module "@medusajs/framework/http" {
  interface MedusaRequest {
    seller_context?: {
      seller_id: string
      seller_member?: {
        id: string
        seller_id: string
        member_id: string
      }
    }
  }
}
