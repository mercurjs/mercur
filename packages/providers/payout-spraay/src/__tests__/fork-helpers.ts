import {
    createPublicClient,
    createTestClient,
    createWalletClient,
    encodeAbiParameters,
    http,
    keccak256,
    numberToHex,
    pad,
    type Account,
    type Chain,
    type Hex,
    type PublicClient,
    type TestClient,
    type Transport,
    type WalletClient,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

import { erc20Abi } from '../chain/abi';
import { SPRAAY_BATCH_CONTRACT_BASE, USDC_BASE } from '../chain/constants';
import { TEST_TREASURY_KEY } from './fixtures';

export const FORK_RPC_URL = process.env.SPRAAY_FORK_RPC_URL;

/** Fork specs only run against a local Anvil fork of Base; they are skipped otherwise. */
export const describeFork = FORK_RPC_URL ? describe : describe.skip;

type Clients = {
    account: ReturnType<typeof privateKeyToAccount>;
    publicClient: PublicClient;
    walletClient: WalletClient<Transport, Chain, Account>;
    testClient: TestClient<'anvil'>;
};

export const forkClients = (rpcUrl = FORK_RPC_URL!): Clients => {
    const transport = http(rpcUrl, { retryCount: 0 });
    const account = privateKeyToAccount(TEST_TREASURY_KEY);
    return {
        account,
        publicClient: createPublicClient({ chain: base, transport }) as PublicClient,
        walletClient: createWalletClient({ chain: base, transport, account }),
        testClient: createTestClient({ chain: base, transport, mode: 'anvil' }),
    };
};

export const usdcBalance = (clients: Clients, owner: string) =>
    clients.publicClient.readContract({
        address: USDC_BASE,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [owner as Hex],
    });

let balanceSlot: bigint | undefined;

/**
 * Sets a USDC balance directly in storage. The mapping slot is found by probing
 * and checking balanceOf, so this survives proxy upgrades that move storage.
 */
export async function dealUsdc(clients: Clients, owner: Hex, amount: bigint): Promise<void> {
    const write = async (slot: bigint, value: bigint) => {
        const key = keccak256(encodeAbiParameters([{ type: 'address' }, { type: 'uint256' }], [owner, slot]));
        const previous = await clients.publicClient.getStorageAt({ address: USDC_BASE, slot: key });
        await clients.testClient.setStorageAt({ address: USDC_BASE, index: key, value: pad(numberToHex(value)) });
        return { key, previous: previous ?? pad('0x0') };
    };

    if (balanceSlot !== undefined) {
        await write(balanceSlot, amount);
        return;
    }

    for (let slot = 0n; slot < 20n; slot++) {
        const { key, previous } = await write(slot, amount);
        if ((await usdcBalance(clients, owner)) === amount) {
            balanceSlot = slot;
            return;
        }
        await clients.testClient.setStorageAt({ address: USDC_BASE, index: key, value: previous });
    }
    throw new Error('Could not locate the USDC balance slot on this fork');
}

export async function fundTreasury(clients: Clients, usdc: bigint): Promise<void> {
    await clients.testClient.setBalance({ address: clients.account.address, value: 10n ** 19n });
    await dealUsdc(clients, clients.account.address, usdc);
    const hash = await clients.walletClient.writeContract({
        address: USDC_BASE,
        abi: erc20Abi,
        functionName: 'approve',
        args: [SPRAAY_BATCH_CONTRACT_BASE, usdc],
    });
    await clients.publicClient.waitForTransactionReceipt({ hash });
}
