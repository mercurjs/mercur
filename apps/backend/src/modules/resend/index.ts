import { Module } from '@medusajs/framework/utils'

import ResendService from './service'

export const RESEND_MODULE = 'resend'

export default Module(RESEND_MODULE, { service: ResendService })
