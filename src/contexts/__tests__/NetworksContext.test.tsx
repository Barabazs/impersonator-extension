import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { NetworksProvider, useNetworks } from '../NetworksContext';
import { NetworksInfo } from '@/types';
import { DEFAULT_NETWORKS } from '@/data/defaultNetworks';

// Mock chrome.storage API
const mockStorageGet = vi.fn();
const mockStorageSet = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  global.chrome = {
    storage: {
      sync: {
        get: mockStorageGet,
        set: mockStorageSet,
      },
    },
  } as any;
});

describe('NetworksContext', () => {
  describe('Initial Load - Fresh Install', () => {
    it('should initialize with all default networks on fresh install', async () => {
      mockStorageGet.mockResolvedValue({ networksInfo: undefined });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <NetworksProvider>{children}</NetworksProvider>
      );

      const { result } = renderHook(() => useNetworks(), { wrapper });

      await waitFor(() => {
        expect(result.current.networksInfo).toBeDefined();
      });

      const networksInfo = result.current.networksInfo!;

      // Should have all 25 default networks
      expect(Object.keys(networksInfo).length).toBe(
        Object.keys(DEFAULT_NETWORKS).length
      );

      // All should be marked as default and enabled
      Object.values(networksInfo).forEach((network) => {
        expect(network.isDefault).toBe(true);
        expect(network.isEnabled).toBe(true);
      });

      // Should save to storage
      expect(mockStorageSet).toHaveBeenCalledWith({
        networksInfo: expect.any(Object),
      });
    });
  });

  describe('Migration - Old Format', () => {
    it('should migrate old format networks (without isDefault field)', async () => {
      const oldFormatNetwork: NetworksInfo = {
        'Ethereum Mainnet': {
          chainId: 1,
          rpcUrl: 'https://custom-rpc.com',
        },
        'Custom Network': {
          chainId: 999,
          rpcUrl: 'https://custom-network.com',
        },
      };

      mockStorageGet.mockResolvedValue({ networksInfo: oldFormatNetwork });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <NetworksProvider>{children}</NetworksProvider>
      );

      const { result } = renderHook(() => useNetworks(), { wrapper });

      await waitFor(() => {
        expect(result.current.networksInfo).toBeDefined();
      });

      const networksInfo = result.current.networksInfo!;

      // Should have all defaults + custom network
      expect(Object.keys(networksInfo).length).toBeGreaterThan(
        Object.keys(DEFAULT_NETWORKS).length
      );

      // Ethereum Mainnet should be marked as default (but with custom RPC)
      expect(networksInfo['Ethereum Mainnet'].isDefault).toBe(true);
      expect(networksInfo['Ethereum Mainnet'].rpcUrl).toBe(
        'https://custom-rpc.com'
      );
      expect(networksInfo['Ethereum Mainnet'].isEnabled).toBe(true);

      // Custom Network should NOT be marked as default
      expect(networksInfo['Custom Network'].isDefault).toBe(false);
      expect(networksInfo['Custom Network'].chainId).toBe(999);
      expect(networksInfo['Custom Network'].isEnabled).toBe(true);

      // Should save migrated format
      expect(mockStorageSet).toHaveBeenCalled();
    });
  });

  describe('Merge Logic - Existing User with Custom Networks', () => {
    it('should preserve custom networks when merging with defaults', async () => {
      const existingNetworks: NetworksInfo = {
        'My Custom L2': {
          chainId: 12345,
          rpcUrl: 'https://my-custom-l2.com',
          isDefault: false,
          isEnabled: true,
        },
      };

      mockStorageGet.mockResolvedValue({ networksInfo: existingNetworks });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <NetworksProvider>{children}</NetworksProvider>
      );

      const { result } = renderHook(() => useNetworks(), { wrapper });

      await waitFor(() => {
        expect(result.current.networksInfo).toBeDefined();
      });

      const networksInfo = result.current.networksInfo!;

      // Should have defaults + custom network
      expect(Object.keys(networksInfo)).toContain('My Custom L2');
      expect(networksInfo['My Custom L2'].isDefault).toBe(false);
      expect(networksInfo['My Custom L2'].chainId).toBe(12345);

      // Should also have all defaults
      expect(networksInfo['Ethereum Mainnet']).toBeDefined();
      expect(networksInfo['Polygon']).toBeDefined();
    });
  });

  describe('getEnabledNetworks()', () => {
    it('should return only enabled networks', async () => {
      const networksWithDisabled: NetworksInfo = {
        'Network 1': {
          chainId: 1,
          rpcUrl: 'https://network1.com',
          isEnabled: true,
        },
        'Network 2': {
          chainId: 2,
          rpcUrl: 'https://network2.com',
          isEnabled: false,
        },
        'Network 3': {
          chainId: 3,
          rpcUrl: 'https://network3.com',
          // isEnabled undefined (should default to true)
        },
      };

      mockStorageGet.mockResolvedValue({ networksInfo: networksWithDisabled });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <NetworksProvider>{children}</NetworksProvider>
      );

      const { result } = renderHook(() => useNetworks(), { wrapper });

      await waitFor(() => {
        expect(result.current.networksInfo).toBeDefined();
      });

      const enabledNetworks = result.current.getEnabledNetworks();

      // Should only include Network 1 and Network 3
      expect(Object.keys(enabledNetworks)).toHaveLength(
        Object.keys(DEFAULT_NETWORKS).length + 2
      ); // defaults + Network 1 & 3
      expect(enabledNetworks['Network 2']).toBeUndefined();
    });

    it('should return empty object when all networks are disabled', async () => {
      const allDisabled: NetworksInfo = {
        'Network 1': {
          chainId: 1,
          rpcUrl: 'https://network1.com',
          isEnabled: false,
        },
      };

      mockStorageGet.mockResolvedValue({ networksInfo: allDisabled });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <NetworksProvider>{children}</NetworksProvider>
      );

      const { result } = renderHook(() => useNetworks(), { wrapper });

      await waitFor(() => {
        expect(result.current.networksInfo).toBeDefined();
      });

      // Disable all default networks
      const networksInfo = result.current.networksInfo!;
      const allNetworks = Object.keys(networksInfo);

      act(() => {
        allNetworks.forEach((name) => {
          if (networksInfo[name].isEnabled !== false) {
            result.current.toggleNetworkEnabled(name);
          }
        });
      });

      await waitFor(() => {
        const enabled = result.current.getEnabledNetworks();
        expect(Object.keys(enabled).length).toBe(0);
      });
    });
  });

  describe('toggleNetworkEnabled()', () => {
    it('should toggle network enabled state', async () => {
      mockStorageGet.mockResolvedValue({ networksInfo: undefined });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <NetworksProvider>{children}</NetworksProvider>
      );

      const { result } = renderHook(() => useNetworks(), { wrapper });

      await waitFor(() => {
        expect(result.current.networksInfo).toBeDefined();
      });

      const networkName = 'Ethereum Mainnet';
      const initialState =
        result.current.networksInfo![networkName].isEnabled;

      // Toggle network
      act(() => {
        result.current.toggleNetworkEnabled(networkName);
      });

      await waitFor(() => {
        expect(result.current.networksInfo![networkName].isEnabled).toBe(
          !initialState
        );
      });

      // Toggle back
      act(() => {
        result.current.toggleNetworkEnabled(networkName);
      });

      await waitFor(() => {
        expect(result.current.networksInfo![networkName].isEnabled).toBe(
          initialState
        );
      });
    });

    it('should persist toggle state to storage', async () => {
      mockStorageGet.mockResolvedValue({ networksInfo: undefined });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <NetworksProvider>{children}</NetworksProvider>
      );

      const { result } = renderHook(() => useNetworks(), { wrapper });

      await waitFor(() => {
        expect(result.current.networksInfo).toBeDefined();
      });

      act(() => {
        result.current.toggleNetworkEnabled('Polygon');
      });

      await waitFor(() => {
        expect(mockStorageSet).toHaveBeenCalledWith({
          networksInfo: expect.objectContaining({
            Polygon: expect.objectContaining({
              isEnabled: false,
            }),
          }),
        });
      });
    });
  });

  describe('resetToDefaults()', () => {
    it('should reset all networks to defaults', async () => {
      const customNetworks: NetworksInfo = {
        'Custom Network': {
          chainId: 999,
          rpcUrl: 'https://custom.com',
          isDefault: false,
          isEnabled: true,
        },
        'Ethereum Mainnet': {
          chainId: 1,
          rpcUrl: 'https://custom-eth-rpc.com',
          isDefault: true,
          isEnabled: false, // Disabled
        },
      };

      mockStorageGet.mockResolvedValue({ networksInfo: customNetworks });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <NetworksProvider>{children}</NetworksProvider>
      );

      const { result } = renderHook(() => useNetworks(), { wrapper });

      await waitFor(() => {
        expect(result.current.networksInfo).toBeDefined();
      });

      // Reset to defaults
      act(() => {
        result.current.resetToDefaults();
      });

      await waitFor(() => {
        const networksInfo = result.current.networksInfo!;

        // Custom network should be gone
        expect(networksInfo['Custom Network']).toBeUndefined();

        // Ethereum Mainnet should have default RPC
        expect(networksInfo['Ethereum Mainnet'].rpcUrl).toBe(
          DEFAULT_NETWORKS['Ethereum Mainnet'].rpcUrl
        );

        // All networks should be enabled
        expect(networksInfo['Ethereum Mainnet'].isEnabled).toBe(true);
      });
    });
  });

  describe('Network Symbols and Metadata', () => {
    it('should include symbol and blockExplorer for default networks', async () => {
      mockStorageGet.mockResolvedValue({ networksInfo: undefined });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <NetworksProvider>{children}</NetworksProvider>
      );

      const { result } = renderHook(() => useNetworks(), { wrapper });

      await waitFor(() => {
        expect(result.current.networksInfo).toBeDefined();
      });

      const networksInfo = result.current.networksInfo!;

      // Check Ethereum Mainnet has symbol
      expect(networksInfo['Ethereum Mainnet'].symbol).toBe('ETH');
      expect(networksInfo['Ethereum Mainnet'].blockExplorer).toBe(
        'https://etherscan.io'
      );

      // Check Polygon has symbol
      expect(networksInfo['Polygon'].symbol).toBe('MATIC');
      expect(networksInfo['Polygon'].blockExplorer).toBe(
        'https://polygonscan.com'
      );
    });
  });
});
