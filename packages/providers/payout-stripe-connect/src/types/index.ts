export interface StripeConnectAccountValidationOptions {
    /**
     * Require Stripe to mark onboarding details as submitted
     */
    detailsSubmitted?: boolean
    /**
     * Require the account to be enabled for charges
     */
    chargesEnabled?: boolean
    /**
     * Require the account to be enabled for payouts
     */
    payoutsEnabled?: boolean
    /**
     * Treat pending Stripe requirements as a restricted account
     */
    noOutstandingRequirements?: boolean
    /**
     * Require specific Stripe capabilities to be active
     */
    requiredCapabilities?: string[]
}

export interface StripeConnectOptions {
    /**
     * The API key for the Stripe Connect account
     */
    apiKey: string
    /**
     * The webhook secret used to verify webhooks
     */
    webhookSecret: string
    /**
     * Controls how connected accounts are validated from Stripe webhook data
     */
    accountValidation?: StripeConnectAccountValidationOptions
}
