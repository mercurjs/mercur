import { getAddress, isAddress, zeroAddress } from 'viem';

import { USDC_DECIMALS } from './chain/constants';

const RAW_INTEGER = /^(0|[1-9][0-9]*)$/;
const UINT256_MAX = (1n << 256n) - 1n;

export class SpraayValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SpraayValidationError';
    }
}

export function parseRawAmount(value: string, label = 'amount'): bigint {
    if (typeof value !== 'string' || !RAW_INTEGER.test(value)) {
        throw new SpraayValidationError(
            `${label} must be a positive integer string in raw USDC base units (6 decimals, e.g. "1500000" = 1.50 USDC); got "${String(value)}"`,
        );
    }
    const parsed = BigInt(value);
    if (parsed <= 0n) {
        throw new SpraayValidationError(`${label} must be greater than zero`);
    }
    if (parsed > UINT256_MAX) {
        throw new SpraayValidationError(`${label} exceeds uint256`);
    }
    return parsed;
}

const DECIMAL = /^(0|[1-9][0-9]*)(?:\.([0-9]+))?$/;

/**
 * Converts a major-unit USDC amount as Medusa stores it (e.g. "12.5", or "12.500000000"
 * from a numeric column) into raw base units. Rejects anything finer than 6 decimals
 * instead of rounding, so a payout is never silently altered.
 */
export function parseUsdcDecimal(value: string, label = 'amount'): bigint {
    const match = typeof value === 'string' ? DECIMAL.exec(value.trim()) : null;
    if (!match) {
        throw new SpraayValidationError(`${label} must be a non-negative decimal string; got "${String(value)}"`);
    }
    const fraction = (match[2] ?? '').replace(/0+$/, '');
    if (fraction.length > USDC_DECIMALS) {
        throw new SpraayValidationError(`${label} "${value}" has more than ${USDC_DECIMALS} decimal places`);
    }
    const raw = BigInt(match[1]) * 10n ** BigInt(USDC_DECIMALS) + BigInt(fraction.padEnd(USDC_DECIMALS, '0') || '0');
    if (raw <= 0n) {
        throw new SpraayValidationError(`${label} must be greater than zero`);
    }
    return raw;
}

export function computeProtocolFee(totalRaw: bigint, feeBps: bigint): bigint {
    return (totalRaw * feeBps) / 10_000n;
}

export function formatUsdc(raw: bigint): string {
    const negative = raw < 0n;
    const abs = negative ? -raw : raw;
    const base = 10n ** BigInt(USDC_DECIMALS);
    const whole = abs / base;
    const fraction = (abs % base).toString().padStart(USDC_DECIMALS, '0').replace(/0+$/, '');
    return `${negative ? '-' : ''}${whole.toString()}${fraction ? '.' + fraction : ''}`;
}

export function normalizeAddress(value: string, label = 'address'): `0x${string}` {
    if (typeof value !== 'string' || !isAddress(value, { strict: false })) {
        throw new SpraayValidationError(`${label} is not a valid EVM address: "${String(value)}"`);
    }
    const checksummed = getAddress(value);
    if (checksummed === zeroAddress) {
        throw new SpraayValidationError(`${label} must not be the zero address`);
    }
    return checksummed;
}

export function sameAddress(a: string | null | undefined, b: string | null | undefined): boolean {
    return !!a && !!b && a.toLowerCase() === b.toLowerCase();
}
