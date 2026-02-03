import multer from 'multer'
import { MiddlewareRoute } from '@medusajs/framework/http'
import { authenticate } from '@medusajs/medusa/utils'
import { MedusaError } from '@medusajs/framework/utils'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(
        new MedusaError(
          MedusaError.Types.INVALID_DATA,
          'Only image files are allowed'
        ) as any
      )
      return
    }
    cb(null, true)
  }
})

export const storeCustomerAvatarMiddlewares: MiddlewareRoute[] = [
  {
    method: ['POST'],
    matcher: '/store/custom/customers/me/avatar',
    middlewares: [
      authenticate('customer', ['session', 'bearer']),
      upload.single('file')
    ]
  },
  {
    method: ['DELETE'],
    matcher: '/store/custom/customers/me/avatar',
    middlewares: [authenticate('customer', ['session', 'bearer'])]
  }
]
