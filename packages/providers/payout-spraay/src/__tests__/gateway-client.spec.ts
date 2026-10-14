import {
    SpraayGatewayClient,
    SpraayGatewayError,
    SpraayGatewayPaymentRequiredError,
    type FetchLike,
} from '../gateway/spraay-gateway.client';
import { recipients } from './fixtures';

const respond = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

const input = { recipients: recipients(2), amounts: ['1000000', '2000000'], sender: recipients(1, 'treasury')[0] };

describe('SpraayGatewayClient', () => {
    it('posts the batch to /api/v1/batch/execute with the Base chain slug and USDC symbol', async () => {
        const calls: Array<{ url: string; body: unknown }> = [];
        const fetch: FetchLike = async (url, init) => {
            calls.push({ url, body: JSON.parse(String(init?.body)) });
            return respond(200, { success: true, transaction: { to: '0x1', data: '0x' } });
        };

        await new SpraayGatewayClient({ baseUrl: 'https://gateway.test/', fetch }).execute(input);

        expect(calls).toEqual([
            {
                url: 'https://gateway.test/api/v1/batch/execute',
                body: { token: 'USDC', chain: 'base', ...input },
            },
        ]);
    });

    it('surfaces 402 Payment Required as its own error instead of retrying', async () => {
        const fetch: FetchLike = async () => respond(402, { x402Version: 1, accepts: [] });

        await expect(new SpraayGatewayClient({ fetch }).execute(input)).rejects.toBeInstanceOf(
            SpraayGatewayPaymentRequiredError,
        );
    });

    it('rejects HTTP errors and responses that do not report success', async () => {
        const failing: FetchLike = async () => respond(400, { error: 'Maximum 200 recipients' });
        const unsuccessful: FetchLike = async () => respond(200, { success: false });

        await expect(new SpraayGatewayClient({ fetch: failing }).execute(input)).rejects.toThrow(/Maximum 200 recipients/);
        await expect(new SpraayGatewayClient({ fetch: unsuccessful }).execute(input)).rejects.toBeInstanceOf(
            SpraayGatewayError,
        );
    });

    it('wraps network failures', async () => {
        const fetch: FetchLike = async () => {
            throw new Error('ECONNREFUSED');
        };

        await expect(new SpraayGatewayClient({ fetch }).execute(input)).rejects.toThrow(/ECONNREFUSED/);
    });
});
