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
} from '@mercurjs/types';

import { normalizeAddress, SpraayValidationError } from '../amounts';

export interface SpraayPayoutOptions {
    rpcUrl: string;
    treasuryAddress: string;
    gatewayBaseUrl?: string;
    gatewayTimeoutMs?: number;
    gatewayHeaders?: Record<string, string>;
    signingTimeoutMs?: number;
    minBatchSize?: number;
    maxBatchSize?: number;
    requiredConfirmations?: number;
    logScanChunkSize?: number;
}

/**
 * Currency codes paid out as USDC. "usd" is a label mapping, not an exchange
 * rate: a payout of 12.50 USD is paid as exactly 12.50 USDC, with no conversion
 * and no price lookup. Every other currency is rejected.
 */
const PAYABLE_CURRENCY_CODES = new Set(['usdc', 'usd']);

class SpraayPayoutProviderService implements IPayoutProvider {
    static identifier = 'spraay';
    protected readonly config_: SpraayPayoutOptions;

    constructor(_cradle: Record<string, unknown>, options: SpraayPayoutOptions) {
        this.config_ = options;
        normalizeAddress(options.treasuryAddress, 'treasuryAddress');
    }

    async createPayoutAccount(input: CreatePayoutAccountInput): Promise<CreatePayoutAccountResponse> {
        const walletAddress = input.data?.wallet_address as string | undefined;
        if (!walletAddress) {
            throw new SpraayValidationError('wallet_address is required for Spraay payout accounts');
        }
        const normalized = normalizeAddress(walletAddress, 'wallet_address');

        return {
            id: `spraay_${normalized.toLowerCase()}`,
            status: PayoutAccountStatus.ACTIVE,
            data: {
                wallet_address: normalized,
                provider: 'spraay',
                chain: 'base',
                chain_id: 8453,
            },
        };
    }

    async createPayout(input: CreatePayoutInput): Promise<CreatePayoutResponse> {
        const walletAddress = input.data?.wallet_address as string | undefined;
        if (!walletAddress) {
            throw new SpraayValidationError(
                'wallet_address is required in payout data. The seller payout account must include wallet_address.',
            );
        }
        const normalized = normalizeAddress(walletAddress, 'wallet_address');

        const currencyCode = input.currency_code.toLowerCase();
        if (!PAYABLE_CURRENCY_CODES.has(currencyCode)) {
            throw new SpraayValidationError(
                `Spraay only pays out USDC on Base, accepting currency_code "usdc" or "usd". Got currency_code="${input.currency_code}".`,
            );
        }

        return {
            data: {
                provider: 'spraay',
                currency_code: currencyCode,
                wallet_address: normalized,
                chain: 'base',
                chain_id: 8453,
                queued_at: new Date().toISOString(),
                batch_id: null,
            },
            status: PayoutStatus.PENDING,
        };
    }

    async createOnboarding(input: CreateOnboardingInput): Promise<CreateOnboardingResponse> {
        const walletAddress = input.data?.wallet_address as string | undefined;
        if (walletAddress) {
            normalizeAddress(walletAddress, 'wallet_address');
        }
        return {
            data: {
                provider: 'spraay',
                message: 'Spraay uses noncustodial wallet addresses. No external onboarding flow is required.',
                wallet_address: walletAddress ?? null,
            },
        };
    }

    async getWebhookActionAndData(_payload: PayoutWebhookActionInput): Promise<PayoutWebhookResult> {
        return { action: 'not_supported' };
    }
}

export default SpraayPayoutProviderService;
