import { defineMiddlewares, MiddlewaresConfig } from '@medusajs/medusa'
import multer from 'multer'

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
})

export default defineMiddlewares({
  routes: [
    {
      matcher: '/vendor/products/import',
      method: 'POST',
      middlewares: [upload.single('file')]
    }
  ]
} as MiddlewaresConfig)

