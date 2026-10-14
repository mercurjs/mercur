/**
 * v1 is pinned to Base mainnet + native USDC. These values are not configurable on purpose:
 * every on-chain verification step compares against them.
 */
export const BASE_CHAIN_ID = 8453;
/** Spraay batch contract on Base (SprayContract, feeBps-based 0.3% protocol fee, MAX_RECIPIENTS = 200). */
export const SPRAAY_BATCH_CONTRACT_BASE = '0x1646452F98E36A3c9Cfc3eDD8868221E207B5eEC' as const;
/** Circle native USDC on Base. */
export const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;
export const USDC_DECIMALS = 6;
export const USDC_SYMBOL = 'USDC';

/** Hard limit enforced by both the gateway (`Maximum 200 recipients`) and the contract (`MAX_RECIPIENTS`). */
export const MAX_RECIPIENTS_PER_BATCH = 200;
/** Minimum batch size before automatic aggregation (operator can override via manual trigger). */
export const MIN_BATCH_SIZE = 2;

export const DEFAULT_GATEWAY_URL = 'https://gateway.spraay.app';
export const GATEWAY_EXECUTE_PATH = '/api/v1/batch/execute';
export const GATEWAY_ESTIMATE_PATH = '/api/v1/batch/estimate';
/** Settlement chain slug accepted by the gateway's `chain` field (OpenAPI v3.8.3). */
export const GATEWAY_CHAIN_SLUG = 'base';

export const DEFAULT_REQUIRED_CONFIRMATIONS = 10;
export const DEFAULT_LOG_SCAN_CHUNK_SIZE = 2_000;
/** Multiplier (in percent) applied to a local eth_estimateGas when choosing the signing gas limit. */
export const LOCAL_GAS_ESTIMATE_PADDING_PERCENT = 125;

/** How long a batch waits for an operator signature before expiring (ms). */
export const DEFAULT_SIGNING_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours

/** Spraay protocol fee in basis points. */
export const SPRAAY_FEE_BPS = 30n; // 0.3%
