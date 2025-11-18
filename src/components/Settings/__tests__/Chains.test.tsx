import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import Chains from '../Chains';
import { NetworksProvider } from '@/contexts/NetworksContext';
import theme from '@/theme';

// Mock chrome.storage
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

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ChakraProvider theme={theme}>
      <NetworksProvider>{component}</NetworksProvider>
    </ChakraProvider>
  );
};

describe('Chains Component', () => {
  const mockClose = vi.fn();

  it('should render the Networks heading', async () => {
    mockStorageGet.mockResolvedValue({ networksInfo: undefined });

    renderWithProviders(<Chains close={mockClose} />);

    await waitFor(() => {
      expect(screen.getByText('Networks')).toBeInTheDocument();
    });
  });

  it('should render search input', async () => {
    mockStorageGet.mockResolvedValue({ networksInfo: undefined });

    renderWithProviders(<Chains close={mockClose} />);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(
        /search networks by name or chain id/i
      );
      expect(searchInput).toBeInTheDocument();
    });
  });

  it('should display default networks section', async () => {
    mockStorageGet.mockResolvedValue({ networksInfo: undefined });

    renderWithProviders(<Chains close={mockClose} />);

    await waitFor(() => {
      expect(
        screen.getByText(/Pre-configured Networks/i)
      ).toBeInTheDocument();
    });
  });

  it('should show Add Custom Network button', async () => {
    mockStorageGet.mockResolvedValue({ networksInfo: undefined });

    renderWithProviders(<Chains close={mockClose} />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /add custom network/i })
      ).toBeInTheDocument();
    });
  });

  it('should filter networks when searching', async () => {
    mockStorageGet.mockResolvedValue({ networksInfo: undefined });

    renderWithProviders(<Chains close={mockClose} />);

    await waitFor(() => {
      expect(screen.getByText('Ethereum Mainnet')).toBeInTheDocument();
      expect(screen.getByText('Polygon')).toBeInTheDocument();
    });

    // Search for "polygon"
    const searchInput = screen.getByPlaceholderText(
      /search networks by name or chain id/i
    );
    fireEvent.change(searchInput, { target: { value: 'polygon' } });

    await waitFor(() => {
      expect(screen.getByText('Polygon')).toBeInTheDocument();
      expect(screen.queryByText('Ethereum Mainnet')).not.toBeInTheDocument();
    });
  });

  it('should filter networks by chain ID', async () => {
    mockStorageGet.mockResolvedValue({ networksInfo: undefined });

    renderWithProviders(<Chains close={mockClose} />);

    await waitFor(() => {
      expect(screen.getByText('Ethereum Mainnet')).toBeInTheDocument();
    });

    // Search by chain ID "1"
    const searchInput = screen.getByPlaceholderText(
      /search networks by name or chain id/i
    );
    fireEvent.change(searchInput, { target: { value: '1' } });

    await waitFor(() => {
      expect(screen.getByText('Ethereum Mainnet')).toBeInTheDocument();
      // Chain IDs containing '1': 1, 10, 100, 137, 11155111, 42161, etc.
      // So multiple networks should still be visible
    });
  });

  it('should show "no results" message when search has no matches', async () => {
    mockStorageGet.mockResolvedValue({ networksInfo: undefined });

    renderWithProviders(<Chains close={mockClose} />);

    await waitFor(() => {
      expect(screen.getByText('Ethereum Mainnet')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(
      /search networks by name or chain id/i
    );
    fireEvent.change(searchInput, {
      target: { value: 'NonexistentNetwork' },
    });

    await waitFor(() => {
      expect(
        screen.getByText(/No networks match "NonexistentNetwork"/i)
      ).toBeInTheDocument();
    });
  });

  it('should display default network badge', async () => {
    mockStorageGet.mockResolvedValue({ networksInfo: undefined });

    renderWithProviders(<Chains close={mockClose} />);

    await waitFor(() => {
      const defaultBadges = screen.getAllByText('Default');
      expect(defaultBadges.length).toBeGreaterThan(0);
    });
  });

  it('should display network symbols as badges', async () => {
    mockStorageGet.mockResolvedValue({ networksInfo: undefined });

    renderWithProviders(<Chains close={mockClose} />);

    await waitFor(() => {
      expect(screen.getAllByText('ETH').length).toBeGreaterThan(0);
      // Multiple networks can have the same symbol (e.g., Polygon and Polygon Mumbai both have MATIC)
      expect(screen.getAllByText('MATIC').length).toBeGreaterThan(0);
    });
  });

  it('should call close callback when close button is clicked', async () => {
    mockStorageGet.mockResolvedValue({ networksInfo: undefined });

    renderWithProviders(<Chains close={mockClose} />);

    await waitFor(() => {
      expect(screen.getByText('Networks')).toBeInTheDocument();
    });

    const closeButton = screen.getByRole('button', { name: '' }); // Close icon button
    fireEvent.click(closeButton);

    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('should show custom networks section when custom networks exist', async () => {
    const customNetworks = {
      'Ethereum Mainnet': {
        chainId: 1,
        rpcUrl: 'https://rpc.ankr.com/eth',
        isDefault: true,
        isEnabled: true,
        symbol: 'ETH',
      },
      'My Custom Network': {
        chainId: 99999,
        rpcUrl: 'https://custom.network',
        isDefault: false,
        isEnabled: true,
      },
    };

    mockStorageGet.mockResolvedValue({ networksInfo: customNetworks });

    renderWithProviders(<Chains close={mockClose} />);

    await waitFor(() => {
      expect(screen.getByText(/Custom Networks \(1\)/i)).toBeInTheDocument();
      expect(screen.getByText('My Custom Network')).toBeInTheDocument();
    });
  });

  it('should show reset button', async () => {
    mockStorageGet.mockResolvedValue({ networksInfo: undefined });

    renderWithProviders(<Chains close={mockClose} />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /reset/i })
      ).toBeInTheDocument();
    });
  });

  it('should display network count in section headers', async () => {
    mockStorageGet.mockResolvedValue({ networksInfo: undefined });

    renderWithProviders(<Chains close={mockClose} />);

    await waitFor(() => {
      // Should show count of default networks
      expect(
        screen.getByText(/Pre-configured Networks \(25\)/i)
      ).toBeInTheDocument();
    });
  });
});
