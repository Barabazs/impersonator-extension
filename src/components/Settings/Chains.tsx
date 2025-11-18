import React, { useState, useMemo } from "react";
import {
  Box,
  Button,
  Center,
  Flex,
  HStack,
  Spacer,
  Stack,
  Text,
  Heading,
  Switch,
  Badge,
  Input,
  InputGroup,
  InputLeftElement,
  useToast,
  Divider,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import { CloseIcon, SearchIcon, RepeatIcon, StarIcon } from "@chakra-ui/icons";
import { useNetworks } from "@/contexts/NetworksContext";
import { NetworksInfo } from "@/types";
import AddChain from "./AddChain";
import EditChain from "./EditChain";

interface ChainCardProps {
  chainName: string;
  network: NetworksInfo[string];
  openEditChain: () => void;
  onToggle: () => void;
}

function ChainCard({ chainName, network, openEditChain, onToggle }: ChainCardProps) {
  const isEnabled = network.isEnabled !== false;

  return (
    <Box
      p="1rem"
      w="full"
      maxW="24rem"
      border="1px solid"
      borderColor={isEnabled ? "white" : "gray.600"}
      fontSize="sm"
      rounded="md"
      opacity={isEnabled ? 1 : 0.5}
      transition="all 0.2s"
    >
      <Flex alignItems="center" mb="0.5rem">
        <HStack spacing={2} flex="1">
          <Text fontWeight="bold" fontSize="md">
            {chainName}
          </Text>
          {network.isDefault && (
            <Tooltip label="Pre-configured network" placement="top">
              <Badge colorScheme="blue" fontSize="xs">
                <HStack spacing={1}>
                  <StarIcon boxSize={2} />
                  <Text>Default</Text>
                </HStack>
              </Badge>
            </Tooltip>
          )}
          {network.symbol && (
            <Badge colorScheme="gray" fontSize="xs">
              {network.symbol}
            </Badge>
          )}
        </HStack>
        <Switch
          size="sm"
          isChecked={isEnabled}
          onChange={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        />
      </Flex>

      <VStack align="start" spacing={1} fontSize="xs" color="gray.300">
        <HStack>
          <Text fontWeight="semibold" minW="60px">
            Chain ID:
          </Text>
          <Text>{network.chainId}</Text>
        </HStack>
        <HStack align="start">
          <Text fontWeight="semibold" minW="60px">
            RPC:
          </Text>
          <Text
            flex="1"
            overflow="hidden"
            whiteSpace="nowrap"
            textOverflow="ellipsis"
            title={network.rpcUrl}
          >
            {network.rpcUrl}
          </Text>
        </HStack>
      </VStack>

      <Button
        size="xs"
        mt="0.5rem"
        variant="outline"
        onClick={openEditChain}
        isDisabled={!isEnabled}
      >
        {network.isDefault ? "View / Edit RPC" : "Edit / Delete"}
      </Button>
    </Box>
  );
}

function Chains({ close }: { close: () => void }) {
  const { networksInfo, toggleNetworkEnabled, resetToDefaults } = useNetworks();
  const toast = useToast();

  const [tab, setTab] = useState<React.ReactElement>();
  const [searchQuery, setSearchQuery] = useState("");

  // Separate and filter networks
  const { defaultNetworks, customNetworks } = useMemo(() => {
    if (!networksInfo) return { defaultNetworks: {}, customNetworks: {} };

    const defaults: NetworksInfo = {};
    const customs: NetworksInfo = {};

    Object.entries(networksInfo).forEach(([name, info]) => {
      const matchesSearch =
        searchQuery === "" ||
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        info.chainId.toString().includes(searchQuery);

      if (matchesSearch) {
        if (info.isDefault) {
          defaults[name] = info;
        } else {
          customs[name] = info;
        }
      }
    });

    return { defaultNetworks: defaults, customNetworks: customs };
  }, [networksInfo, searchQuery]);

  const handleResetToDefaults = () => {
    if (
      window.confirm(
        "This will remove all custom networks and reset all RPC URLs to defaults. Continue?"
      )
    ) {
      resetToDefaults();
      toast({
        title: "Reset Complete",
        description: "All networks have been reset to defaults",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (tab !== undefined) {
    return tab;
  }

  return (
    <>
      <Flex mb="1rem">
        <Spacer />
        <Button size="xs" variant="ghost" onClick={() => close()}>
          <CloseIcon />
        </Button>
      </Flex>

      <VStack spacing={4} align="stretch">
        {/* Header */}
        <Flex alignItems="center" gap={2}>
          <Heading size="md">Networks</Heading>
          <Spacer />
          <Tooltip label="Reset all networks to defaults">
            <Button size="xs" variant="outline" onClick={handleResetToDefaults}>
              <RepeatIcon mr="0.5rem" />
              Reset
            </Button>
          </Tooltip>
        </Flex>

        {/* Search Bar */}
        <InputGroup size="sm">
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Search networks by name or chain ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            rounded="md"
          />
        </InputGroup>

        {/* Networks List */}
        <Box maxH="60vh" overflowY="auto" pr="2">
          <VStack spacing={4} align="stretch">
            {/* Default Networks Section */}
            {Object.keys(defaultNetworks).length > 0 && (
              <Box>
                <Heading size="sm" mb="0.5rem" color="blue.300">
                  Pre-configured Networks ({Object.keys(defaultNetworks).length})
                </Heading>
                <Text fontSize="xs" color="gray.400" mb="0.5rem">
                  Popular EVM chains with verified RPC endpoints. Toggle to
                  enable/disable.
                </Text>
                <Stack spacing={3}>
                  {Object.entries(defaultNetworks).map(([chainName, network]) => (
                    <ChainCard
                      key={chainName}
                      chainName={chainName}
                      network={network}
                      openEditChain={() =>
                        setTab(
                          <EditChain
                            back={() => setTab(undefined)}
                            chainName={chainName}
                          />
                        )
                      }
                      onToggle={() => toggleNetworkEnabled(chainName)}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            {/* Divider */}
            {Object.keys(defaultNetworks).length > 0 &&
              Object.keys(customNetworks).length > 0 && (
                <Divider borderColor="gray.600" />
              )}

            {/* Custom Networks Section */}
            {Object.keys(customNetworks).length > 0 && (
              <Box>
                <Heading size="sm" mb="0.5rem" color="purple.300">
                  Custom Networks ({Object.keys(customNetworks).length})
                </Heading>
                <Text fontSize="xs" color="gray.400" mb="0.5rem">
                  Networks you've added manually.
                </Text>
                <Stack spacing={3}>
                  {Object.entries(customNetworks).map(([chainName, network]) => (
                    <ChainCard
                      key={chainName}
                      chainName={chainName}
                      network={network}
                      openEditChain={() =>
                        setTab(
                          <EditChain
                            back={() => setTab(undefined)}
                            chainName={chainName}
                          />
                        )
                      }
                      onToggle={() => toggleNetworkEnabled(chainName)}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            {/* No Results */}
            {Object.keys(defaultNetworks).length === 0 &&
              Object.keys(customNetworks).length === 0 &&
              searchQuery && (
                <Center py="2rem">
                  <Text color="gray.500">
                    No networks match "{searchQuery}"
                  </Text>
                </Center>
              )}
          </VStack>
        </Box>

        {/* Add Chain Button */}
        <Button
          colorScheme="green"
          onClick={() => setTab(<AddChain back={() => setTab(undefined)} />)}
          w="full"
        >
          + Add Custom Network
        </Button>
      </VStack>
    </>
  );
}

export default Chains;
