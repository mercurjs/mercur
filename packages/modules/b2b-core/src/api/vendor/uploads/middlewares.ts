import multer from 'multer'

import { MiddlewareRoute } from '@medusajs/framework/http'

const upload = multer({ storage: multer.memoryStorage() })

export const vendorUploadMiddlewares: MiddlewareRoute[] = [
  {
    method: ['POST'],
    matcher: '/vendor/uploads',
    middlewares: [upload.array('files')]
  }
]
