import { keccak256 } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

import { encodeSprayTokenCalldata } from '../chain/calldata';
import { BASE_CHAIN_ID, SPRAAY_BATCH_CONTRACT_BASE } from '../chain/constants';
import { inspectSignedTransaction, SigningRequest } from '../chain/signed-transaction';
import { OTHER_KEY, TEST_TREASURY, TEST_TREASURY_KEY, recipients } from './fixtures';

const treasury = privateKeyToAccount(TEST_TREASURY_KEY);

const request: SigningRequest = {
    from: TEST_TREASURY,
    to: SPRAAY_BATCH_CONTRACT_BASE,
    data: encodeSprayTokenCalldata(recipients(2).map(recipient => ({ recipient, amount: 5_000_000n }))),
    value: '0',
    chainId: BASE_CHAIN_ID,
    nonce: 7,
    gas: '300000',
};

const sign = (overrides: Record<string, unknown> = {}, account = treasury) =>
    account.signTransaction({
        type: 'eip1559',
        chainId: request.chainId,
        nonce: request.nonce,
        to: request.to as `0x${string}`,
        data: request.data as `0x${string}`,
        value: 0n,
        gas: BigInt(request.gas),
        maxFeePerGas: 1_000_000_000n,
        maxPriorityFeePerGas: 1_000_000n,
        ...overrides,
    });

describe('inspectSignedTransaction', () => {
    it('accepts the exact approved request and returns its hash', async () => {
        const raw = await sign();
        const result = await inspectSignedTransaction(raw, request);

        expect(result).toEqual({ ok: true, tx: { hash: keccak256(raw), from: TEST_TREASURY, nonce: 7 } });
    });

    it('accepts a higher gas limit than requested', async () => {
        const result = await inspectSignedTransaction(await sign({ gas: 400_000n }), request);
        expect(result.ok).toBe(true);
    });

    it.each([
        ['a different signer', {}, privateKeyToAccount(OTHER_KEY), /signer/],
        ['another contract', { to: '0x0000000000000000000000000000000000000001' }, treasury, /^to /],
        ['different calldata', { data: encodeSprayTokenCalldata([{ recipient: recipients(1, 'x')[0], amount: 1n }]) }, treasury, /calldata/],
        ['attached ETH', { value: 1n }, treasury, /value/],
        ['another nonce', { nonce: 8 }, treasury, /nonce/],
        ['another chain', { chainId: 1 }, treasury, /chainId/],
        ['a lower gas limit', { gas: 100_000n }, treasury, /gas limit/],
    ])('rejects %s', async (_label, overrides, account, problem) => {
        const result = await inspectSignedTransaction(await sign(overrides, account), request);

        expect(result.ok).toBe(false);
        expect(!result.ok && result.problems).toEqual(expect.arrayContaining([expect.stringMatching(problem)]));
    });

    it('rejects non-hex and unparseable input', async () => {
        expect((await inspectSignedTransaction('hello', request)).ok).toBe(false);
        expect((await inspectSignedTransaction('0xdeadbeef', request)).ok).toBe(false);
    });
});
