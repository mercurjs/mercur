import { getAddress, keccak256, slice, toHex } from 'viem';

/** Anvil's first default account. Public test key: never use it outside a local fork. */
export const TEST_TREASURY_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const;
export const TEST_TREASURY = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as const;
export const OTHER_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d' as const;

export const recipients = (count: number, seed = 'spraay-recipient'): `0x${string}`[] =>
    Array.from({ length: count }, (_, i) => getAddress(slice(keccak256(toHex(`${seed}-${i}`)), 12)));
