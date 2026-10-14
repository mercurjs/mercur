/**
 * ABI fragments for the Spraay batch contract (SprayContract.sol) deployed on Base at
 * 0x1646452F98E36A3c9Cfc3eDD8868221E207B5eEC, and the ERC-20 surface of USDC.
 *
 * The function signatures match the calldata the Spraay gateway encodes in
 * POST /api/v1/batch/execute (`sprayToken(address,(address,uint256)[])`).
 */
export const spraayBatchAbi = [
    {
        type: 'function',
        name: 'sprayToken',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'token', type: 'address' },
            {
                name: 'recipients',
                type: 'tuple[]',
                components: [
                    { name: 'recipient', type: 'address' },
                    { name: 'amount', type: 'uint256' },
                ],
            },
        ],
        outputs: [],
    },
    {
        type: 'function',
        name: 'sprayETH',
        stateMutability: 'payable',
        inputs: [
            {
                name: 'recipients',
                type: 'tuple[]',
                components: [
                    { name: 'recipient', type: 'address' },
                    { name: 'amount', type: 'uint256' },
                ],
            },
        ],
        outputs: [],
    },
    {
        type: 'function',
        name: 'sprayEqual',
        stateMutability: 'payable',
        inputs: [
            { name: 'token', type: 'address' },
            { name: 'recipients', type: 'address[]' },
            { name: 'amountPerRecipient', type: 'uint256' },
        ],
        outputs: [],
    },
    {
        type: 'function',
        name: 'feeBps',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        type: 'function',
        name: 'paused',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'bool' }],
    },
    {
        type: 'event',
        name: 'SprayTokenExecuted',
        anonymous: false,
        inputs: [
            { name: 'sender', type: 'address', indexed: true },
            { name: 'token', type: 'address', indexed: true },
            { name: 'totalAmount', type: 'uint256', indexed: false },
            { name: 'recipientCount', type: 'uint256', indexed: false },
            { name: 'feeAmount', type: 'uint256', indexed: false },
            { name: 'timestamp', type: 'uint256', indexed: false },
        ],
    },
] as const;

export const erc20Abi = [
    {
        type: 'function',
        name: 'approve',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool' }],
    },
    {
        type: 'function',
        name: 'allowance',
        stateMutability: 'view',
        inputs: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
        ],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        type: 'function',
        name: 'balanceOf',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        type: 'event',
        name: 'Transfer',
        anonymous: false,
        inputs: [
            { name: 'from', type: 'address', indexed: true },
            { name: 'to', type: 'address', indexed: true },
            { name: 'value', type: 'uint256', indexed: false },
        ],
    },
] as const;
