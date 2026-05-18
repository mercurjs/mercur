import { isPresent, MedusaError } from "@medusajs/framework/utils"
import {
    CreateOnboardingInput,
    CreateOnboardingResponse,
    CreatePayoutAccountInput,
    CreatePayoutAccountResponse,
    CreatePayoutInput,
    CreatePayoutResponse,
    IPayoutProvider,
    PayoutAccountStatus,
    PayoutStatus,
    PayoutWebhookActionInput,
    PayoutWebhookResult,
} from "@mercurjs/types"
import { StripeConnectOptions } from "@types"
import { getSmallestUnit } from "@utils"
import Stripe from "stripe"

const DEFAULT_ACCOUNT_VALIDATION = {
    detailsSubmitted: true,
    chargesEnabled: true,
    payoutsEnabled: true,
    noOutstandingRequirements: true,
    requiredCapabilities: [],
}

class StripeConnectProviderService implements IPayoutProvider {
    static identifier = "stripe-connect"
    protected readonly stripe_: Stripe
    protected readonly config_: StripeConnectOptions

    constructor(
        _cradle: Record<string, unknown>,
        options: StripeConnectOptions
    ) {
        this.config_ = options
        this.stripe_ = new Stripe(options.apiKey)
    }

    protected normalizePayoutParameters(
        extra: Record<string, unknown>
    ): Partial<Stripe.TransferCreateParams> & { destination: string } {
        const res = {
        } as Partial<Stripe.TransferCreateParams>

        res.destination = extra!.id as string
        res.source_transaction = extra?.source_transaction as string | undefined
        res.transfer_group = extra?.order_id as string | undefined
        res.description = extra?.description as string | undefined
        res.metadata = { seller_id: extra.seller_id, ...(extra?.metadata ? extra.metadata : {}) } as Stripe.MetadataParam


        return res as Partial<Stripe.TransferCreateParams> & { destination: string }
    }

    private getWebhookResultFromAccount_(
        account: Stripe.Account
    ): PayoutWebhookResult {
        const accountId = account.metadata?.account_id
        const validation = {
            ...DEFAULT_ACCOUNT_VALIDATION,
            ...this.config_.accountValidation,
        }
        const requirements = account.requirements
        const disabledReason = requirements?.disabled_reason
        const hasOutstandingRequirements = Boolean(
            requirements?.currently_due?.length ||
            requirements?.past_due?.length ||
            requirements?.pending_verification?.length
        )
        const requiredCapabilities = validation.requiredCapabilities ?? []
        const hasInactiveCapabilities = requiredCapabilities.some((capability) => {
            return account.capabilities?.[capability as keyof Stripe.Account.Capabilities] !== "active"
        })

        if (disabledReason?.startsWith("rejected.")) {
            return {
                action: "account.rejected",
                data: {
                    id: accountId,
                },
            }
        }

        if (
            (!validation.detailsSubmitted || account.details_submitted) &&
            (!validation.chargesEnabled || account.charges_enabled) &&
            (!validation.payoutsEnabled || account.payouts_enabled) &&
            (!validation.noOutstandingRequirements || !hasOutstandingRequirements) &&
            !hasInactiveCapabilities
        ) {
            return {
                action: "account.activated",
                data: {
                    id: accountId,
                },
            }
        }

        if (disabledReason) {
            return {
                action: "account.restricted",
                data: {
                    id: accountId,
                },
            }
        }

        return {
            action: "account.restricted",
            data: {
                id: accountId,
            },
        }
    }

    async createPayoutAccount(
        input: CreatePayoutAccountInput
    ): Promise<CreatePayoutAccountResponse> {
        const { data } = input;
        const country = data?.country as string

        if (!isPresent(country)) {
            throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                `"country" is required`
            );
        }

        const response = await this.stripe_.accounts.create({
            type: 'express',
            country,
            metadata: {
                account_id: data?.account_id as string,
            },
        }, {
            idempotencyKey: input.context?.idempotency_key
        })

        return {
            id: response.id,
            status: PayoutAccountStatus.PENDING,
            data: response as unknown as Record<string, unknown>
        }
    }

    async createPayout(input: CreatePayoutInput): Promise<CreatePayoutResponse> {
        const normalizedInput = this.normalizePayoutParameters(input.data!)
        const transfer = await this.stripe_.transfers.create(
            {
                currency: input.currency_code,
                amount: getSmallestUnit(input.amount, input.currency_code),
                ...normalizedInput,
            },
            { idempotencyKey: input.context?.idempotency_key }
        );


        return {
            data: transfer as unknown as Record<string, unknown>,
            status: PayoutStatus.PAID
        }
    }

    async createOnboarding(
        input: CreateOnboardingInput
    ): Promise<CreateOnboardingResponse> {
        const id = input?.data?.id as string
        if (!isPresent(id)) {
            throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                `'id' is required`
            );
        }

        if (!isPresent(input.data?.refresh_url)) {
            throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                `'refresh_url' is required`
            );
        }

        if (!isPresent(input.data?.return_url)) {
            throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                `'return_url' is required`
            );
        }

        const accountLink = await this.stripe_.accountLinks.create({
            account: id,
            refresh_url: input.data?.refresh_url as string,
            return_url: input.data?.return_url as string,
            type: "account_onboarding",
        });

        return {
            data: accountLink as unknown as Record<string, unknown>,
        };
    }

    async getWebhookActionAndData(
        payload: PayoutWebhookActionInput
    ): Promise<PayoutWebhookResult> {
        const signature = payload.headers["stripe-signature"] as string

        const event = this.stripe_.webhooks.constructEvent(
            payload.rawData as string | Buffer,
            signature,
            this.config_.webhookSecret
        )

        switch (event.type) {
            case "account.updated":
                return this.getWebhookResultFromAccount_(event.data.object as Stripe.Account)
            default:
                return { action: "not_supported" }
        }
    }
}

export default StripeConnectProviderService
