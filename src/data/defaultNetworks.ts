/**
 * Default EVM Networks Configuration
 *
 * This file contains pre-configured popular EVM-compatible blockchain networks
 * with reliable public RPC endpoints. Users can enable/disable these networks
 * or customize RPC URLs as needed.
 *
 * Network Selection Criteria:
 * - High usage/popularity in DeFi and Web3
 * - Reliable public RPC endpoints
 * - Active development and community
 *
 * RPC Provider Sources:
 * - Ankr (ankr.com) - Multi-chain public RPCs
 * - ChainList (chainlist.org) - Community verified endpoints
 * - Network-specific public endpoints
 *
 * Last Updated: 2025-11-18
 */

export interface DefaultNetworkInfo {
  chainId: number;
  rpcUrl: string;
  symbol?: string;
  blockExplorer?: string;
  category: 'mainnet-l1' | 'mainnet-l2' | 'sidechain' | 'testnet';
}

export type DefaultNetworksMap = {
  [networkName: string]: DefaultNetworkInfo;
};

/**
 * Pre-configured network list with verified RPC endpoints
 * Networks are ordered by popularity and usage
 */
export const DEFAULT_NETWORKS: DefaultNetworksMap = {
  // ==================== Layer 1 Networks ====================

  "Ethereum Mainnet": {
    chainId: 1,
    rpcUrl: "https://rpc.ankr.com/eth",
    symbol: "ETH",
    blockExplorer: "https://etherscan.io",
    category: 'mainnet-l1',
  },

  "BSC (Binance Smart Chain)": {
    chainId: 56,
    rpcUrl: "https://rpc.ankr.com/bsc",
    symbol: "BNB",
    blockExplorer: "https://bscscan.com",
    category: 'mainnet-l1',
  },

  "Avalanche C-Chain": {
    chainId: 43114,
    rpcUrl: "https://rpc.ankr.com/avalanche",
    symbol: "AVAX",
    blockExplorer: "https://snowtrace.io",
    category: 'mainnet-l1',
  },

  // ==================== Layer 2 Networks ====================

  "Polygon": {
    chainId: 137,
    rpcUrl: "https://rpc.ankr.com/polygon",
    symbol: "MATIC",
    blockExplorer: "https://polygonscan.com",
    category: 'mainnet-l2',
  },

  "Arbitrum One": {
    chainId: 42161,
    rpcUrl: "https://rpc.ankr.com/arbitrum",
    symbol: "ETH",
    blockExplorer: "https://arbiscan.io",
    category: 'mainnet-l2',
  },

  "Optimism": {
    chainId: 10,
    rpcUrl: "https://rpc.ankr.com/optimism",
    symbol: "ETH",
    blockExplorer: "https://optimistic.etherscan.io",
    category: 'mainnet-l2',
  },

  "Base": {
    chainId: 8453,
    rpcUrl: "https://mainnet.base.org",
    symbol: "ETH",
    blockExplorer: "https://basescan.org",
    category: 'mainnet-l2',
  },

  "zkSync Era": {
    chainId: 324,
    rpcUrl: "https://mainnet.era.zksync.io",
    symbol: "ETH",
    blockExplorer: "https://explorer.zksync.io",
    category: 'mainnet-l2',
  },

  "Linea": {
    chainId: 59144,
    rpcUrl: "https://rpc.linea.build",
    symbol: "ETH",
    blockExplorer: "https://lineascan.build",
    category: 'mainnet-l2',
  },

  "Scroll": {
    chainId: 534352,
    rpcUrl: "https://rpc.scroll.io",
    symbol: "ETH",
    blockExplorer: "https://scrollscan.com",
    category: 'mainnet-l2',
  },

  "Mantle": {
    chainId: 5000,
    rpcUrl: "https://rpc.mantle.xyz",
    symbol: "MNT",
    blockExplorer: "https://explorer.mantle.xyz",
    category: 'mainnet-l2',
  },

  // ==================== Sidechains & Alt L1s ====================

  "Gnosis": {
    chainId: 100,
    rpcUrl: "https://rpc.ankr.com/gnosis",
    symbol: "xDAI",
    blockExplorer: "https://gnosisscan.io",
    category: 'sidechain',
  },

  "Fantom Opera": {
    chainId: 250,
    rpcUrl: "https://rpc.ankr.com/fantom",
    symbol: "FTM",
    blockExplorer: "https://ftmscan.com",
    category: 'sidechain',
  },

  "Celo": {
    chainId: 42220,
    rpcUrl: "https://forno.celo.org",
    symbol: "CELO",
    blockExplorer: "https://celoscan.io",
    category: 'sidechain',
  },

  "Moonbeam": {
    chainId: 1284,
    rpcUrl: "https://rpc.ankr.com/moonbeam",
    symbol: "GLMR",
    blockExplorer: "https://moonscan.io",
    category: 'sidechain',
  },

  "Aurora": {
    chainId: 1313161554,
    rpcUrl: "https://mainnet.aurora.dev",
    symbol: "ETH",
    blockExplorer: "https://aurorascan.dev",
    category: 'sidechain',
  },

  "Cronos": {
    chainId: 25,
    rpcUrl: "https://evm.cronos.org",
    symbol: "CRO",
    blockExplorer: "https://cronoscan.com",
    category: 'sidechain',
  },

  "Evmos": {
    chainId: 9001,
    rpcUrl: "https://evmos-evm.publicnode.com",
    symbol: "EVMOS",
    blockExplorer: "https://escan.live",
    category: 'sidechain',
  },

  "Kava": {
    chainId: 2222,
    rpcUrl: "https://evm.kava.io",
    symbol: "KAVA",
    blockExplorer: "https://kavascan.com",
    category: 'sidechain',
  },

  "Metis": {
    chainId: 1088,
    rpcUrl: "https://andromeda.metis.io/?owner=1088",
    symbol: "METIS",
    blockExplorer: "https://andromeda-explorer.metis.io",
    category: 'sidechain',
  },

  // ==================== Testnets ====================

  "Sepolia": {
    chainId: 11155111,
    rpcUrl: "https://rpc.ankr.com/eth_sepolia",
    symbol: "ETH",
    blockExplorer: "https://sepolia.etherscan.io",
    category: 'testnet',
  },

  "Polygon Mumbai": {
    chainId: 80001,
    rpcUrl: "https://rpc.ankr.com/polygon_mumbai",
    symbol: "MATIC",
    blockExplorer: "https://mumbai.polygonscan.com",
    category: 'testnet',
  },

  "BSC Testnet": {
    chainId: 97,
    rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545",
    symbol: "BNB",
    blockExplorer: "https://testnet.bscscan.com",
    category: 'testnet',
  },

  "Arbitrum Sepolia": {
    chainId: 421614,
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    symbol: "ETH",
    blockExplorer: "https://sepolia.arbiscan.io",
    category: 'testnet',
  },

  "Optimism Sepolia": {
    chainId: 11155420,
    rpcUrl: "https://sepolia.optimism.io",
    symbol: "ETH",
    blockExplorer: "https://sepolia-optimism.etherscan.io",
    category: 'testnet',
  },
};

/**
 * Get networks grouped by category
 */
export const getNetworksByCategory = () => {
  const categorized: Record<string, Array<{ name: string; info: DefaultNetworkInfo }>> = {
    'mainnet-l1': [],
    'mainnet-l2': [],
    'sidechain': [],
    'testnet': [],
  };

  Object.entries(DEFAULT_NETWORKS).forEach(([name, info]) => {
    categorized[info.category].push({ name, info });
  });

  return categorized;
};

/**
 * Get network by chain ID
 */
export const getNetworkByChainId = (chainId: number): { name: string; info: DefaultNetworkInfo } | undefined => {
  const entry = Object.entries(DEFAULT_NETWORKS).find(([_, info]) => info.chainId === chainId);
  return entry ? { name: entry[0], info: entry[1] } : undefined;
};

/**
 * Convert DEFAULT_NETWORKS format to NetworksInfo format (for backward compatibility)
 */
export const getDefaultNetworksAsNetworksInfo = () => {
  const networksInfo: { [name: string]: { chainId: number; rpcUrl: string } } = {};

  Object.entries(DEFAULT_NETWORKS).forEach(([name, info]) => {
    networksInfo[name] = {
      chainId: info.chainId,
      rpcUrl: info.rpcUrl,
    };
  });

  return networksInfo;
};
