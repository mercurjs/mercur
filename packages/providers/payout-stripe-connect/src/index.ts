import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import StripeConnectProviderService from "./services/stripe-connect"

export * from './types'

export default ModuleProvider(Modules.PAYMENT, {
    services: [StripeConnectProviderService],
})