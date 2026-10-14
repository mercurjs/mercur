import { decodeFunctionData, encodeFunctionData, Hex } from 'viem';

import { sameAddress } from '../amounts';
import { USDC_BASE } from './constants';

import { erc20Abi, spraayBatchAbi } from './abi';

export interface ExpectedTransfer {
    recipient: string;
    amount: bigint;
}

export interface DecodedSprayToken {
    token: `0x${string}`;
    recipients: Array<{ recipient: `0x${string}`; amount: bigint }>;
}

export function decodeSprayTokenCalldata(data: string | undefined | null): DecodedSprayToken | null {
    if (!data || !/^0x[0-9a-fA-F]*$/.test(data)) {
        return null;
    }
    try {
        const decoded = decodeFunctionData({ abi: spraayBatchAbi, data: data as Hex });
        if (decoded.functionName !== 'sprayToken') {
            return null;
        }
        const [token, recipients] = decoded.args as readonly [
            `0x${string}`,
            ReadonlyArray<{ recipient: `0x${string}`; amount: bigint }>,
        ];
        return { token, recipients: recipients.map(r => ({ recipient: r.recipient, amount: r.amount })) };
    } catch {
        return null;
    }
}

export function diffSprayTokenCalldata(decoded: DecodedSprayToken | null, expected: ExpectedTransfer[]): string[] {
    if (!decoded) {
        return ['calldata is not a sprayToken(address,(address,uint256)[]) call'];
    }
    const problems: string[] = [];
    if (!sameAddress(decoded.token, USDC_BASE)) {
        problems.push(`calldata token ${decoded.token} is not Base USDC ${USDC_BASE}`);
    }
    if (decoded.recipients.length !== expected.length) {
        problems.push(`calldata has ${decoded.recipients.length} recipients, expected ${expected.length}`);
        return problems;
    }
    expected.forEach((item, i) => {
        const actual = decoded.recipients[i];
        if (!sameAddress(actual.recipient, item.recipient)) {
            problems.push(`calldata recipient #${i} is ${actual.recipient}, expected ${item.recipient}`);
        }
        if (actual.amount !== item.amount) {
            problems.push(`calldata amount #${i} is ${actual.amount}, expected ${item.amount}`);
        }
    });
    return problems;
}

export function encodeSprayTokenCalldata(expected: ExpectedTransfer[]): Hex {
    return encodeFunctionData({
        abi: spraayBatchAbi,
        functionName: 'sprayToken',
        args: [USDC_BASE, expected.map(e => ({ recipient: e.recipient as `0x${string}`, amount: e.amount }))],
    });
}

export function encodeApproveCalldata(spender: string, amount: bigint): Hex {
    return encodeFunctionData({ abi: erc20Abi, functionName: 'approve', args: [spender as `0x${string}`, amount] });
}
