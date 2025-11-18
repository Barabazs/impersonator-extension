import { describe, it, expect } from 'vitest';
import {
  DEFAULT_NETWORKS,
  getNetworksByCategory,
  getNetworkByChainId,
  getDefaultNetworksAsNetworksInfo,
} from '../defaultNetworks';

describe('defaultNetworks', () => {
  describe('DEFAULT_NETWORKS', () => {
    it('should have all 25 networks defined', () => {
      expect(Object.keys(DEFAULT_NETWORKS).length).toBe(25);
    });

    it('should have all required fields for each network', () => {
      Object.entries(DEFAULT_NETWORKS).forEach(([, network]) => {
        expect(network.chainId).toBeDefined();
        expect(typeof network.chainId).toBe('number');
        expect(network.rpcUrl).toBeDefined();
        expect(typeof network.rpcUrl).toBe('string');
        expect(network.rpcUrl).toMatch(/^https?:\/\//);
        expect(network.category).toBeDefined();
        expect(['mainnet-l1', 'mainnet-l2', 'sidechain', 'testnet']).toContain(
          network.category
        );
      });
    });

    it('should have unique chain IDs', () => {
      const chainIds = Object.values(DEFAULT_NETWORKS).map((n) => n.chainId);
      const uniqueChainIds = new Set(chainIds);
      expect(chainIds.length).toBe(uniqueChainIds.size);
    });

    it('should have valid RPC URLs', () => {
      Object.values(DEFAULT_NETWORKS).forEach((network) => {
        expect(network.rpcUrl).toMatch(/^https:\/\//);
      });
    });
  });

  describe('getNetworksByCategory()', () => {
    it('should return networks grouped by category', () => {
      const categorized = getNetworksByCategory();

      expect(categorized['mainnet-l1']).toBeDefined();
      expect(categorized['mainnet-l2']).toBeDefined();
      expect(categorized['sidechain']).toBeDefined();
      expect(categorized['testnet']).toBeDefined();
    });

    it('should have 3 Layer 1 networks', () => {
      const categorized = getNetworksByCategory();
      expect(categorized['mainnet-l1'].length).toBe(3);
    });

    it('should have 8 Layer 2 networks', () => {
      const categorized = getNetworksByCategory();
      expect(categorized['mainnet-l2'].length).toBe(8);
    });

    it('should have 9 sidechain networks', () => {
      const categorized = getNetworksByCategory();
      expect(categorized['sidechain'].length).toBe(9);
    });

    it('should have 5 testnet networks', () => {
      const categorized = getNetworksByCategory();
      expect(categorized['testnet'].length).toBe(5);
    });

    it('should return correct network info in each category', () => {
      const categorized = getNetworksByCategory();

      // Check that Ethereum Mainnet is in L1
      const ethMainnet = categorized['mainnet-l1'].find(
        (n) => n.name === 'Ethereum Mainnet'
      );
      expect(ethMainnet).toBeDefined();
      expect(ethMainnet!.info.chainId).toBe(1);

      // Check that Polygon is in L2
      const polygon = categorized['mainnet-l2'].find(
        (n) => n.name === 'Polygon'
      );
      expect(polygon).toBeDefined();
      expect(polygon!.info.chainId).toBe(137);
    });
  });

  describe('getNetworkByChainId()', () => {
    it('should find Ethereum Mainnet by chain ID 1', () => {
      const result = getNetworkByChainId(1);
      expect(result).toBeDefined();
      expect(result!.name).toBe('Ethereum Mainnet');
      expect(result!.info.symbol).toBe('ETH');
    });

    it('should find Polygon by chain ID 137', () => {
      const result = getNetworkByChainId(137);
      expect(result).toBeDefined();
      expect(result!.name).toBe('Polygon');
      expect(result!.info.symbol).toBe('MATIC');
    });

    it('should find Arbitrum One by chain ID 42161', () => {
      const result = getNetworkByChainId(42161);
      expect(result).toBeDefined();
      expect(result!.name).toBe('Arbitrum One');
    });

    it('should return undefined for unknown chain ID', () => {
      const result = getNetworkByChainId(99999);
      expect(result).toBeUndefined();
    });
  });

  describe('getDefaultNetworksAsNetworksInfo()', () => {
    it('should convert to NetworksInfo format', () => {
      const networksInfo = getDefaultNetworksAsNetworksInfo();

      expect(Object.keys(networksInfo).length).toBe(25);

      // Check that format is correct
      Object.entries(networksInfo).forEach(([, info]) => {
        expect(info.chainId).toBeDefined();
        expect(typeof info.chainId).toBe('number');
        expect(info.rpcUrl).toBeDefined();
        expect(typeof info.rpcUrl).toBe('string');
      });
    });

    it('should preserve chain IDs and RPC URLs', () => {
      const networksInfo = getDefaultNetworksAsNetworksInfo();

      expect(networksInfo['Ethereum Mainnet'].chainId).toBe(1);
      expect(networksInfo['Ethereum Mainnet'].rpcUrl).toBe(
        'https://rpc.ankr.com/eth'
      );

      expect(networksInfo['Polygon'].chainId).toBe(137);
      expect(networksInfo['Polygon'].rpcUrl).toBe(
        'https://rpc.ankr.com/polygon'
      );
    });
  });

  describe('Specific Network Checks', () => {
    it('should have Ethereum Mainnet with correct details', () => {
      const eth = DEFAULT_NETWORKS['Ethereum Mainnet'];
      expect(eth.chainId).toBe(1);
      expect(eth.symbol).toBe('ETH');
      expect(eth.blockExplorer).toBe('https://etherscan.io');
      expect(eth.category).toBe('mainnet-l1');
    });

    it('should have Polygon with correct details', () => {
      const polygon = DEFAULT_NETWORKS['Polygon'];
      expect(polygon.chainId).toBe(137);
      expect(polygon.symbol).toBe('MATIC');
      expect(polygon.blockExplorer).toBe('https://polygonscan.com');
      expect(polygon.category).toBe('mainnet-l2');
    });

    it('should have Base with correct details', () => {
      const base = DEFAULT_NETWORKS['Base'];
      expect(base.chainId).toBe(8453);
      expect(base.symbol).toBe('ETH');
      expect(base.category).toBe('mainnet-l2');
    });

    it('should have Sepolia testnet', () => {
      const sepolia = DEFAULT_NETWORKS['Sepolia'];
      expect(sepolia.chainId).toBe(11155111);
      expect(sepolia.category).toBe('testnet');
    });
  });
});
