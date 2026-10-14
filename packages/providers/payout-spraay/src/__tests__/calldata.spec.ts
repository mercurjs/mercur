import { encodeFunctionData } from 'viem';

import { spraayBatchAbi } from '../chain/abi';
import {
    decodeSprayTokenCalldata,
    diffSprayTokenCalldata,
    encodeApproveCalldata,
    encodeSprayTokenCalldata,
} from '../chain/calldata';
import { USDC_BASE } from '../chain/constants';
import { recipients } from './fixtures';

describe('sprayToken calldata', () => {
    const expected = recipients(3).map((recipient, i) => ({ recipient, amount: BigInt(i + 1) * 1_000_000n }));

    it('round-trips through encode and decode', () => {
        const decoded = decodeSprayTokenCalldata(encodeSprayTokenCalldata(expected));

        expect(decoded?.token).toBe(USDC_BASE);
        expect(decoded?.recipients).toEqual(expected);
        expect(diffSprayTokenCalldata(decoded, expected)).toEqual([]);
    });

    it('reports a swapped recipient, a changed amount and a reordering', () => {
        const tampered = [
            { ...expected[0], recipient: expected[1].recipient },
            { ...expected[1], amount: expected[1].amount + 1n },
            expected[2],
        ];

        const problems = diffSprayTokenCalldata(decodeSprayTokenCalldata(encodeSprayTokenCalldata(tampered)), expected);

        expect(problems).toEqual([
            expect.stringContaining('recipient #0'),
            expect.stringContaining('amount #1'),
        ]);
    });

    it('reports a dropped recipient', () => {
        const problems = diffSprayTokenCalldata(
            decodeSprayTokenCalldata(encodeSprayTokenCalldata(expected.slice(0, 2))),
            expected,
        );

        expect(problems).toEqual([expect.stringContaining('2 recipients, expected 3')]);
    });

    it('rejects calldata for a token other than Base USDC', () => {
        const data = encodeFunctionData({
            abi: spraayBatchAbi,
            functionName: 'sprayToken',
            args: ['0x4200000000000000000000000000000000000006', expected],
        });

        expect(diffSprayTokenCalldata(decodeSprayTokenCalldata(data), expected)).toEqual([
            expect.stringContaining('is not Base USDC'),
        ]);
    });

    it('does not decode other functions or garbage', () => {
        expect(decodeSprayTokenCalldata(encodeApproveCalldata(expected[0].recipient, 1n))).toBeNull();
        expect(decodeSprayTokenCalldata('0xdeadbeef')).toBeNull();
        expect(decodeSprayTokenCalldata('not hex')).toBeNull();
        expect(diffSprayTokenCalldata(null, expected)).toEqual([expect.stringContaining('not a sprayToken')]);
    });
});
