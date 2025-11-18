import React, { createContext, useState, useEffect, useContext } from "react";
import { useUpdateEffect } from "@chakra-ui/react";
import { NetworksInfo } from "@/types";
import { DEFAULT_NETWORKS } from "@/data/defaultNetworks";

type NetworkContextType = {
  networksInfo: NetworksInfo | undefined;
  setNetworksInfo: React.Dispatch<
    React.SetStateAction<NetworksInfo | undefined>
  >;
  reloadRequired: boolean;
  setReloadRequired: React.Dispatch<React.SetStateAction<boolean>>;
  toggleNetworkEnabled: (networkName: string) => void;
  resetToDefaults: () => void;
  getEnabledNetworks: () => NetworksInfo;
};

export const NetworksContext = createContext<NetworkContextType>({
  networksInfo: undefined,
  setNetworksInfo: () => {},
  reloadRequired: false,
  setReloadRequired: () => {},
  toggleNetworkEnabled: () => {},
  resetToDefaults: () => {},
  getEnabledNetworks: () => ({}),
});

/**
 * Merge default networks with user-saved networks
 * User networks take precedence over defaults
 */
const mergeWithDefaults = (storedNetworks: NetworksInfo | undefined): NetworksInfo => {
  // Convert DEFAULT_NETWORKS to NetworkInfo format
  const defaultsAsNetworkInfo: NetworksInfo = {};
  Object.entries(DEFAULT_NETWORKS).forEach(([name, info]) => {
    defaultsAsNetworkInfo[name] = {
      chainId: info.chainId,
      rpcUrl: info.rpcUrl,
      symbol: info.symbol,
      blockExplorer: info.blockExplorer,
      isDefault: true,
      isEnabled: true, // Enable all defaults by default
    };
  });

  // If no stored networks, return all defaults
  if (!storedNetworks || Object.keys(storedNetworks).length === 0) {
    return defaultsAsNetworkInfo;
  }

  // Merge: Start with defaults, then overlay user networks
  const merged: NetworksInfo = { ...defaultsAsNetworkInfo };

  Object.entries(storedNetworks).forEach(([name, networkInfo]) => {
    // Check if this is a migration from old format (no isDefault field)
    const needsMigration = networkInfo.isDefault === undefined;

    if (needsMigration) {
      // Old format: { chainId, rpcUrl }
      // Check if chainId matches any default network
      const matchingDefault = Object.entries(defaultsAsNetworkInfo).find(
        ([, defaultInfo]) => defaultInfo.chainId === networkInfo.chainId
      );

      if (matchingDefault) {
        // User has a custom RPC for a default network
        // Keep user's RPC but mark as default
        merged[name] = {
          ...networkInfo,
          isDefault: true,
          isEnabled: true,
          symbol: matchingDefault[1].symbol,
          blockExplorer: matchingDefault[1].blockExplorer,
        };
      } else {
        // Truly custom network
        merged[name] = {
          ...networkInfo,
          isDefault: false,
          isEnabled: true,
        };
      }
    } else {
      // Already migrated format - use as is
      merged[name] = networkInfo;
    }
  });

  return merged;
};

export const NetworksProvider: React.FunctionComponent<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [networksInfo, setNetworksInfo] = useState<NetworksInfo>();
  const [reloadRequired, setReloadRequired] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { networksInfo: storedNetworksInfo } =
        (await chrome.storage.sync.get("networksInfo")) as {
          networksInfo: NetworksInfo | undefined;
        };

      // Merge stored networks with defaults
      const mergedNetworks = mergeWithDefaults(storedNetworksInfo);
      setNetworksInfo(mergedNetworks);
      setIsInitialized(true);

      // If this is a fresh install or first time with defaults, save merged networks
      if (!storedNetworksInfo || Object.keys(storedNetworksInfo).length === 0) {
        await chrome.storage.sync.set({
          networksInfo: mergedNetworks,
        });
      } else if (storedNetworksInfo) {
        // Check if any stored network needs migration (has old format)
        const needsMigration = Object.values(storedNetworksInfo).some(
          (net) => net.isDefault === undefined
        );

        if (needsMigration) {
          // Save migrated format
          await chrome.storage.sync.set({
            networksInfo: mergedNetworks,
          });
        }
      }
    };

    fetch();
  }, []);

  useUpdateEffect(() => {
    const saveToBrowser = async () => {
      if (isInitialized && networksInfo) {
        await chrome.storage.sync.set({
          networksInfo,
        });
      }
    };

    saveToBrowser();
  }, [networksInfo]);

  /**
   * Toggle a network's enabled state
   */
  const toggleNetworkEnabled = (networkName: string) => {
    setNetworksInfo((prev) => {
      if (!prev || !prev[networkName]) return prev;

      return {
        ...prev,
        [networkName]: {
          ...prev[networkName],
          isEnabled: !prev[networkName].isEnabled,
        },
      };
    });
  };

  /**
   * Reset all networks to defaults (removes custom networks and resets RPC URLs)
   */
  const resetToDefaults = () => {
    const defaultsAsNetworkInfo: NetworksInfo = {};
    Object.entries(DEFAULT_NETWORKS).forEach(([name, info]) => {
      defaultsAsNetworkInfo[name] = {
        chainId: info.chainId,
        rpcUrl: info.rpcUrl,
        symbol: info.symbol,
        blockExplorer: info.blockExplorer,
        isDefault: true,
        isEnabled: true,
      };
    });

    setNetworksInfo(defaultsAsNetworkInfo);
  };

  /**
   * Get only enabled networks
   */
  const getEnabledNetworks = (): NetworksInfo => {
    if (!networksInfo) return {};

    const enabled: NetworksInfo = {};
    Object.entries(networksInfo).forEach(([name, info]) => {
      if (info.isEnabled !== false) {
        // isEnabled is undefined or true
        enabled[name] = info;
      }
    });

    return enabled;
  };

  return (
    <NetworksContext.Provider
      value={{
        networksInfo,
        setNetworksInfo,
        reloadRequired,
        setReloadRequired,
        toggleNetworkEnabled,
        resetToDefaults,
        getEnabledNetworks,
      }}
    >
      {children}
    </NetworksContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useNetworks = () => useContext(NetworksContext);
