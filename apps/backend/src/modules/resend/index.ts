import { ModuleProvider } from '@medusajs/framework/utils'

import ResendService from './service'

export const RESEND_MODULE = 'resend'

export default ModuleProvider(RESEND_MODULE, { services: [ResendService] })
