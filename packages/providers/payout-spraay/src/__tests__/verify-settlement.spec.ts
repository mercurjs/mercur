import { encodeAbiParameters, encodeEventTopics } from 'viem';

import { erc20Abi, spraayBatchAbi } from '../chain/abi';
import { encodeSprayTokenCalldata } from '../chain/calldata';
import { SPRAAY_BATCH_CONTRACT_BASE, USDC_BASE } from '../chain/constants';
import { ChainLog, ChainReceipt, ChainTransaction, verifySettlement } from '../chain/verify-settlement';
import { TEST_TREASURY, recipients } from './fixtures';

const HASH = '0x1111111111111111111111111111111111111111111111111111111111111111';
const FEE_COLLECTOR = '0x00000000000000000000000000000000000fee00';

const items = recipients(3).map((recipient, i) => ({ recipient, amount: BigInt(i + 1) * 1_000_000n }));
const total = items.reduce((sum, item) => sum + item.amount, 0n);
const fee = (total * 30n) / 10_000n;

const transferLog = (from: string, to: string, value: bigint): ChainLog => ({
    address: USDC_BASE,
    topics: encodeEventTopics({
        abi: erc20Abi,
        eventName: 'Transfer',
        args: { from: from as `0x${string}`, to: to as `0x${string}` },
    }) as string[],
    data: encodeAbiParameters([{ type: 'uint256' }], [value]),
});

const sprayLog = (overrides: { sender?: string; totalAmount?: bigint; recipientCount?: bigint } = {}): ChainLog => ({
    address: SPRAAY_BATCH_CONTRACT_BASE,
    topics: encodeEventTopics({
        abi: spraayBatchAbi,
        eventName: 'SprayTokenExecuted',
        args: { sender: (overrides.sender ?? TEST_TREASURY) as `0x${string}`, token: USDC_BASE },
    }) as string[],
    data: encodeAbiParameters(
        [{ type: 'uint256' }, { type: 'uint256' }, { type: 'uint256' }, { type: 'uint256' }],
        [overrides.totalAmount ?? total, overrides.recipientCount ?? BigInt(items.length), fee, 1_700_000_000n],
    ),
});

const settledLogs = (): ChainLog[] => [
    transferLog(TEST_TREASURY, SPRAAY_BATCH_CONTRACT_BASE, total + fee),
    ...items.map(item => transferLog(SPRAAY_BATCH_CONTRACT_BASE, item.recipient, item.amount)),
    transferLog(SPRAAY_BATCH_CONTRACT_BASE, FEE_COLLECTOR, fee),
    sprayLog(),
];

const tx = (overrides: Partial<ChainTransaction> = {}): ChainTransaction => ({
    hash: HASH,
    from: TEST_TREASURY,
    to: SPRAAY_BATCH_CONTRACT_BASE,
    input: encodeSprayTokenCalldata(items),
    value: 0n,
    nonce: 3,
    ...overrides,
});

const receipt = (logs: ChainLog[] = settledLogs(), status: ChainReceipt['status'] = 'success'): ChainReceipt => ({
    transactionHash: HASH,
    status,
    blockNumber: 100n,
    from: TEST_TREASURY,
    to: SPRAAY_BATCH_CONTRACT_BASE,
    logs,
});

const verify = (t = tx(), r = receipt(), sender = TEST_TREASURY) => verifySettlement({ tx: t, receipt: r, sender, items });

describe('verifySettlement', () => {
    it('accepts a settlement that matches on all three sources', () => {
        expect(verify()).toEqual({ ok: true, feeAmount: fee, blockNumber: 100n });
    });

    it('classifies a revert separately from a mismatch', () => {
        expect(verify(tx(), receipt([], 'reverted'))).toEqual(expect.objectContaining({ ok: false, kind: 'reverted' }));
    });

    it('rejects a transaction from someone other than the treasury', () => {
        const result = verify(tx({ from: recipients(1, 'attacker')[0] }));
        expect(result).toEqual(expect.objectContaining({ ok: false, kind: 'mismatch' }));
    });

    it('rejects calldata that does not match the batch', () => {
        const result = verify(tx({ input: encodeSprayTokenCalldata(items.slice(0, 2)) }));
        expect(result.ok).toBe(false);
    });

    it('rejects a missing recipient transfer', () => {
        const logs = settledLogs().filter((_, i) => i !== 2);
        const result = verify(tx(), receipt(logs));
        expect(!result.ok && result.problems).toEqual(
            expect.arrayContaining([expect.stringContaining(`to ${items[1].recipient}`)]),
        );
    });

    it('rejects an unexpected extra transfer out of the contract', () => {
        const logs = [...settledLogs(), transferLog(SPRAAY_BATCH_CONTRACT_BASE, FEE_COLLECTOR, 1n)];
        const result = verify(tx(), receipt(logs));
        expect(!result.ok && result.problems).toEqual(
            expect.arrayContaining([expect.stringContaining('unexpected USDC transfers')]),
        );
    });

    it('rejects a pull that does not cover total plus fee', () => {
        const logs = settledLogs();
        logs[0] = transferLog(TEST_TREASURY, SPRAAY_BATCH_CONTRACT_BASE, total);
        expect(verify(tx(), receipt(logs)).ok).toBe(false);
    });

    it('rejects an event reporting the wrong totals or sender', () => {
        const swap = (log: ChainLog) => settledLogs().map(l => (l.address === SPRAAY_BATCH_CONTRACT_BASE ? log : l));

        expect(verify(tx(), receipt(swap(sprayLog({ totalAmount: total + 1n })))).ok).toBe(false);
        expect(verify(tx(), receipt(swap(sprayLog({ recipientCount: 2n })))).ok).toBe(false);
        expect(verify(tx(), receipt(swap(sprayLog({ sender: recipients(1, 'other')[0] })))).ok).toBe(false);
    });

    it('requires exactly one SprayTokenExecuted event', () => {
        expect(verify(tx(), receipt([...settledLogs(), sprayLog()])).ok).toBe(false);
        expect(verify(tx(), receipt(settledLogs().slice(0, -1))).ok).toBe(false);
    });

    it('ignores look-alike events emitted by other contracts', () => {
        const forged = { ...sprayLog(), address: recipients(1, 'fake-contract')[0] };
        expect(verify(tx(), receipt([...settledLogs().slice(0, -1), forged])).ok).toBe(false);
    });
});
