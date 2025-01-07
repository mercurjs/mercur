import { MiddlewareRoute } from '@medusajs/medusa'

export const sellerMiddlewares: MiddlewareRoute[] = [
  {
    method: ['ALL'],
    matcher: '/admin/vendor/seller/:id/approve',
    middlewares: []
  },
  {
    method: ['POST'],
    matcher: '/admin/vendor/seller/:id/reject',
    middlewares: []
  }
]
