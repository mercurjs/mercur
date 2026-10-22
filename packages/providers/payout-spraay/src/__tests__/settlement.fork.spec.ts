import { encodeSprayTokenCalldata } from '../chain/calldata';
import { ViemChainReader } from '../chain/chain-reader';
import { SPRAAY_BATCH_CONTRACT_BASE } from '../chain/constants';
import { verifySettlement } from '../chain/verify-settlement';
import { computeProtocolFee } from '../amounts';
import { recipients } from './fixtures';
import { FORK_RPC_URL, describeFork, forkClients, fundTreasury, usdcBalance } from './fork-helpers';

describeFork('Spraay settlement on a Base fork', () => {
    const clients = FORK_RPC_URL ? forkClients() : (undefined as never);
    const reader = FORK_RPC_URL ? new ViemChainReader(FORK_RPC_URL, 2_000n) : (undefined as never);
    let snapshot: `0x${string}`;

    beforeEach(async () => {
        snapshot = await clients.testClient.snapshot();
    });

    afterEach(async () => {
        await clients.testClient.revert({ id: snapshot });
    });

    it('pays 100 recipients in one sprayToken transaction and verifies on all three sources', async () => {
        const items = recipients(100, `demo-${Date.now()}`).map((recipient, i) => ({
            recipient,
            amount: 1_000_000n + BigInt(i) * 10_000n,
        }));
        const total = items.reduce((sum, item) => sum + item.amount, 0n);
        const feeBps = await reader.getFeeBps();
        const fee = computeProtocolFee(total, feeBps);

        await fundTreasury(clients, total + fee);
        const before = await usdcBalance(clients, clients.account.address);

        const hash = await clients.walletClient.sendTransaction({
            to: SPRAAY_BATCH_CONTRACT_BASE,
            data: encodeSprayTokenCalldata(items),
        });
        const mined = await clients.publicClient.waitForTransactionReceipt({ hash });

        const [tx, receipt] = await Promise.all([reader.getTransaction(hash), reader.getTransactionReceipt(hash)]);
        const verification = verifySettlement({ tx: tx!, receipt: receipt!, sender: clients.account.address, items });

        expect(verification).toEqual({ ok: true, feeAmount: fee, blockNumber: mined.blockNumber });
        expect(await usdcBalance(clients, clients.account.address)).toBe(before - total - fee);
        for (const item of items) {
            expect(await usdcBalance(clients, item.recipient)).toBe(item.amount);
        }

        const found = await reader.findSprayTokenExecutions(clients.account.address, mined.blockNumber, mined.blockNumber);
        expect(found).toEqual([{ transactionHash: hash, blockNumber: mined.blockNumber }]);

        console.info(
            `[100-payout demo] tx ${hash} block ${mined.blockNumber}: ${items.length} recipients, ` +
                `${total} USDC base units + ${fee} fee, gas used ${mined.gasUsed}`,
        );
    });

    it('classifies an on-chain revert so payouts can be released safely', async () => {
        const items = recipients(3, `revert-${Date.now()}`).map(recipient => ({ recipient, amount: 1_000_000n }));
        await clients.testClient.setBalance({ address: clients.account.address, value: 10n ** 19n });

        // No USDC and no allowance: the call reverts. An explicit gas limit skips the
        // estimate so the transaction is actually mined.
        const hash = await clients.walletClient.sendTransaction({
            to: SPRAAY_BATCH_CONTRACT_BASE,
            data: encodeSprayTokenCalldata(items),
            gas: 500_000n,
        });
        await clients.publicClient.waitForTransactionReceipt({ hash });

        const [tx, receipt] = await Promise.all([reader.getTransaction(hash), reader.getTransactionReceipt(hash)]);
        const verification = verifySettlement({ tx: tx!, receipt: receipt!, sender: clients.account.address, items });

        expect(receipt?.status).toBe('reverted');
        expect(verification).toEqual(expect.objectContaining({ ok: false, kind: 'reverted' }));
    });

    it('reads the live contract configuration from the fork', async () => {
        expect(await reader.getChainId()).toBe(8453);
        expect(await reader.isPaused()).toBe(false);
        expect(await reader.getFeeBps()).toBe(30n);
    });
});
