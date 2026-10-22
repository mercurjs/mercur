import {
    SpraayValidationError,
    computeProtocolFee,
    formatUsdc,
    normalizeAddress,
    parseRawAmount,
    parseUsdcDecimal,
    sameAddress,
} from '../amounts';

describe('parseUsdcDecimal', () => {
    it.each([
        ['1', 1_000_000n],
        ['12.5', 12_500_000n],
        ['0.000001', 1n],
        ['12.500000000', 12_500_000n],
        ['1000000', 1_000_000_000_000n],
        [' 3.25 ', 3_250_000n],
    ])('converts %p to base units', (input, expected) => {
        expect(parseUsdcDecimal(input)).toBe(expected);
    });

    it.each(['0', '0.0', '-1', '1e6', 'abc', '', '01.5', '1.'])('rejects %p', input => {
        expect(() => parseUsdcDecimal(input)).toThrow(SpraayValidationError);
    });

    it('refuses to round amounts finer than 6 decimals', () => {
        expect(() => parseUsdcDecimal('0.0000001')).toThrow(/more than 6 decimal places/);
        expect(() => parseUsdcDecimal('1.1234567')).toThrow(/more than 6 decimal places/);
    });
});

describe('parseRawAmount', () => {
    it('accepts positive integer strings', () => {
        expect(parseRawAmount('1500000')).toBe(1_500_000n);
    });

    it.each(['0', '1.5', '-5', '0x10', ''])('rejects %p', input => {
        expect(() => parseRawAmount(input)).toThrow(SpraayValidationError);
    });
});

describe('computeProtocolFee', () => {
    it('applies basis points with floor rounding', () => {
        expect(computeProtocolFee(1_000_000n, 30n)).toBe(3_000n);
        expect(computeProtocolFee(333n, 30n)).toBe(0n);
        expect(computeProtocolFee(100_000_000_000n, 30n)).toBe(300_000_000n);
    });
});

describe('formatUsdc', () => {
    it.each([
        [1_000_000n, '1'],
        [1_500_000n, '1.5'],
        [1n, '0.000001'],
        [0n, '0'],
    ])('formats %p', (raw, expected) => {
        expect(formatUsdc(raw)).toBe(expected);
    });
});

describe('normalizeAddress', () => {
    it('checksums valid addresses', () => {
        expect(normalizeAddress('0x833589fcd6edb6e08f4c7c32d4f71b54bda02913')).toBe(
            '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        );
    });

    it('rejects the zero address and malformed input', () => {
        expect(() => normalizeAddress('0x0000000000000000000000000000000000000000')).toThrow(SpraayValidationError);
        expect(() => normalizeAddress('0x1234')).toThrow(SpraayValidationError);
    });

    it('compares case-insensitively', () => {
        expect(sameAddress('0xAbC0000000000000000000000000000000000001', '0xabc0000000000000000000000000000000000001')).toBe(true);
        expect(sameAddress(null, '0xabc0000000000000000000000000000000000001')).toBe(false);
    });
});
