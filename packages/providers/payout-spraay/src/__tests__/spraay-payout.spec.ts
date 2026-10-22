import { PayoutStatus } from '@mercurjs/types';

import { SpraayValidationError } from '../amounts';
import SpraayPayoutProviderService from '../services/spraay-payout';
import { TEST_TREASURY, recipients } from './fixtures';

const provider = new SpraayPayoutProviderService({}, { rpcUrl: 'http://127.0.0.1:8545', treasuryAddress: TEST_TREASURY });
const [wallet] = recipients(1, 'seller');

const createPayout = (currency_code: string, data: Record<string, unknown> = { wallet_address: wallet }) =>
    provider.createPayout({ account_id: 'acc_1', amount: 12.5, currency_code, data });

describe('SpraayPayoutProviderService.createPayout', () => {
    it.each(['usdc', 'USDC', 'usd', 'USD'])('queues a %s payout as pending USDC on Base', async currency => {
        const result = await createPayout(currency);

        expect(result.status).toBe(PayoutStatus.PENDING);
        expect(result.data).toEqual(
            expect.objectContaining({
                provider: 'spraay',
                currency_code: currency.toLowerCase(),
                wallet_address: wallet,
                chain_id: 8453,
                batch_id: null,
            }),
        );
    });

    it.each(['eur', 'usdt', 'gbp', 'us', ''])('rejects currency %p', async currency => {
        await expect(createPayout(currency)).rejects.toThrow(SpraayValidationError);
    });

    it('requires a valid seller wallet address', async () => {
        await expect(createPayout('usd', {})).rejects.toThrow(/wallet_address is required/);
        await expect(createPayout('usd', { wallet_address: '0x1234' })).rejects.toThrow(SpraayValidationError);
    });
});
