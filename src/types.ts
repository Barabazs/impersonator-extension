/**
 * Information about a blockchain network
 */
export interface NetworkInfo {
  /** Chain ID (e.g., 1 for Ethereum Mainnet) */
  chainId: number;
  /** RPC endpoint URL */
  rpcUrl: string;
  /** Whether this is a pre-configured default network */
  isDefault?: boolean;
  /** Whether the network is enabled for use (defaults to true) */
  isEnabled?: boolean;
  /** Network symbol (e.g., "ETH", "MATIC") - for display purposes */
  symbol?: string;
  /** Block explorer URL - for display purposes */
  blockExplorer?: string;
}

/**
 * Map of network names to network information
 * Key: Network display name (e.g., "Ethereum Mainnet", "Polygon")
 * Value: NetworkInfo object
 */
export type NetworksInfo = {
  [name: string]: NetworkInfo;
};
