import { Hex, keccak256, parseTransaction, recoverTransactionAddress, TransactionSerialized } from 'viem';

import { sameAddress } from '../amounts';
import { BASE_CHAIN_ID } from './constants';

export interface SigningRequest {
    from: string;
    to: string;
    data: string;
    value: string;
    chainId: number;
    nonce: number;
    gas: string;
}

export interface InspectedSignedTransaction {
    hash: `0x${string}`;
    from: `0x${string}`;
    nonce: number;
}

export async function inspectSignedTransaction(
    raw: string,
    request: SigningRequest,
): Promise<{ ok: true; tx: InspectedSignedTransaction } | { ok: false; problems: string[] }> {
    if (typeof raw !== 'string' || !/^0x[0-9a-fA-F]+$/.test(raw)) {
        return { ok: false, problems: ['signed transaction must be a 0x-prefixed hex string'] };
    }
    let parsed: ReturnType<typeof parseTransaction>;
    let from: `0x${string}`;
    try {
        parsed = parseTransaction(raw as TransactionSerialized);
        from = await recoverTransactionAddress({ serializedTransaction: raw as TransactionSerialized });
    } catch (e: unknown) {
        const msg = e instanceof Error ? (e as { shortMessage?: string }).shortMessage ?? e.message : String(e);
        return { ok: false, problems: [`could not parse signed transaction: ${msg}`] };
    }
    const problems: string[] = [];
    if (parsed.chainId !== BASE_CHAIN_ID || parsed.chainId !== request.chainId) {
        problems.push(`chainId ${parsed.chainId} != ${request.chainId}`);
    }
    if (!sameAddress(from, request.from)) {
        problems.push(`signer ${from} != ${request.from}`);
    }
    if (!sameAddress(parsed.to ?? undefined, request.to)) {
        problems.push(`to ${parsed.to} != ${request.to}`);
    }
    if ((parsed.data ?? '0x').toLowerCase() !== request.data.toLowerCase()) {
        problems.push('calldata differs from the signing request');
    }
    if ((parsed.value ?? 0n) !== BigInt(request.value)) {
        problems.push(`value ${parsed.value ?? 0n} != ${request.value}`);
    }
    if (parsed.nonce !== request.nonce) {
        problems.push(`nonce ${parsed.nonce} != pinned nonce ${request.nonce}`);
    }
    if (parsed.gas !== undefined && parsed.gas < BigInt(request.gas)) {
        problems.push(`gas limit ${parsed.gas} is below the requested ${BigInt(request.gas)}`);
    }
    if (problems.length) {
        return { ok: false, problems };
    }
    return { ok: true, tx: { hash: keccak256(raw as Hex), from, nonce: parsed.nonce as number } };
}
