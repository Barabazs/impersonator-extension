import React, { createContext, useState, useEffect, useContext } from "react";
import { useUpdateEffect } from "@chakra-ui/react";
import { NetworksInfo } from "@/types";
import { getDefaultNetworksAsNetworksInfo } from "@/data/defaultNetworks";

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
 * Pre-computed default networks in NetworkInfo format
 * Computed once at module load for performance
 */
const defaultsAsNetworkInfo: NetworksInfo = getDefaultNetworksAsNetworksInfo();

/**
 * Merge default networks with user-saved networks
 * User networks take precedence over defaults
 */
const mergeWithDefaults = (storedNetworks: NetworksInfo | undefined): NetworksInfo => {
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
      // Check if BOTH name AND chainId match a default network to avoid misclassification
      const matchingDefault = Object.entries(defaultsAsNetworkInfo).find(
        ([defaultName, defaultInfo]) =>
          defaultName === name && defaultInfo.chainId === networkInfo.chainId
      );

      if (matchingDefault) {
        // User has a custom RPC for a default network
        // Keep user's RPC but mark as default
        merged[name] = {
          ...networkInfo,
          isDefault: true,
          isEnabled: networkInfo.isEnabled !== undefined ? networkInfo.isEnabled : true,
          symbol: matchingDefault[1].symbol,
          blockExplorer: matchingDefault[1].blockExplorer,
        };
      } else {
        // Truly custom network (different name or chainId from defaults)
        merged[name] = {
          ...networkInfo,
          isDefault: false,
          isEnabled: networkInfo.isEnabled !== undefined ? networkInfo.isEnabled : true,
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
      } else {
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
    setNetworksInfo(getDefaultNetworksAsNetworksInfo());
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
