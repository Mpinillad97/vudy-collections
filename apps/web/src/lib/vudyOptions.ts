/**
 * Curated option lists for the payment-network/token/currency selects.
 *
 * These are UI-level choices only — the API contract is unchanged (it still
 * accepts free-form strings for requestedChain/requestedToken/currency).
 * "polygon" + "USDC" + "USD" are the only combination verified end-to-end
 * against real, production Vudy during this project; they're kept as the
 * defaults. The rest of the network/token list reflects chains and tokens
 * Vudy's payment infrastructure is built around, per product guidance — not
 * independently re-verified one by one here.
 */

export interface SelectOption {
  value: string;
  label: string;
}

export const CURRENCY_OPTIONS: SelectOption[] = [{ value: 'USD', label: 'USD — Dólar estadounidense' }];

export const NETWORK_OPTIONS: SelectOption[] = [
  { value: 'polygon', label: 'Polygon' },
  { value: 'ethereum', label: 'Ethereum' },
  { value: 'arbitrum', label: 'Arbitrum' },
  { value: 'avalanche', label: 'Avalanche' },
  { value: 'base', label: 'Base' },
  { value: 'optimism', label: 'Optimism' },
  { value: 'linea', label: 'Linea' },
  { value: 'bnb', label: 'BNB Chain' },
];

export const TOKEN_OPTIONS: SelectOption[] = [
  { value: 'USDC', label: 'USDC' },
  { value: 'USDT', label: 'USDT' },
];
