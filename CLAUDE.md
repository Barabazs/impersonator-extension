# CLAUDE.md - AI Assistant Guide for Impersonator Extension

**Last Updated:** 2025-11-18
**Version:** 0.1.2
**Project Type:** Browser Extension (Chrome & Firefox)

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Key Concepts](#architecture--key-concepts)
3. [Directory Structure](#directory-structure)
4. [Development Workflows](#development-workflows)
5. [Code Conventions](#code-conventions)
6. [Key Files & Their Purposes](#key-files--their-purposes)
7. [Build System](#build-system)
8. [Testing & Quality](#testing--quality)
9. [Common Tasks](#common-tasks)
10. [Important Considerations for AI Assistants](#important-considerations-for-ai-assistants)

---

## Project Overview

### What is Impersonator?

Impersonator is a browser extension that allows developers and testers to **impersonate any Ethereum wallet address** on decentralized applications (dapps). It injects a custom web3 provider into webpages, similar to MetaMask, but gives users the freedom to set any custom address and network.

**Key Features:**
- Set custom Ethereum addresses (or ENS names) per browser tab
- Switch between custom blockchain networks per tab simultaneously
- Works on any dapp that supports MetaMask's EIP-1193 provider interface
- Can be used without MetaMask (MetaMask must be disabled if installed)
- Tab-scoped state: Different tabs can have different addresses/chains active at the same time

**Primary Use Cases:**
- Frontend developers testing dapp UIs with different wallet addresses
- QA testing without needing access to real wallets
- Demonstrating dapps with specific addresses
- Testing cross-chain functionality

**License:** MIT
**Homepage:** https://impersonator.xyz

---

## Architecture & Key Concepts

### Extension Architecture Overview

The extension has a **three-layer architecture** to work around browser security isolation:

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: Popup UI (src/App.tsx, src/components/)            │
│ - User interface for configuration                          │
│ - Built with React + Chakra UI                              │
│ - Runs in isolated extension context                        │
└───────────────────────┬─────────────────────────────────────┘
                        │ chrome.tabs.sendMessage()
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: Content Script (src/chrome/inject.ts)              │
│ - Message bridge between popup and injected script          │
│ - Runs in webpage context (but isolated)                    │
│ - Forwards messages via window.postMessage()                │
└───────────────────────┬─────────────────────────────────────┘
                        │ window.postMessage()
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: Injected Script (src/chrome/impersonator.ts)       │
│ - Custom EIP-1193 provider (ImpersonatorProvider)           │
│ - Replaces/augments window.ethereum                         │
│ - Actually interacts with dapp code                         │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Patterns

#### 1. **Content Script Bridge Pattern**
**Problem:** Extension popup and injected code cannot directly communicate due to browser security isolation.

**Solution:** The content script (`inject.ts`) acts as a message relay:
- Receives messages from popup via `chrome.runtime.onMessage`
- Forwards to injected script via `window.postMessage`
- Bidirectional message flow with type discrimination

**Implementation Details:**
- Messages are typed (e.g., `setAddress`, `setChainId`, `getInfo`, `init`)
- Content script maintains a local `store` object for cross-tab state consistency
- All messages include a `type` field for routing

#### 2. **Custom EIP-1193 Provider**
**Implementation:** `ImpersonatorProvider` class extends `EventEmitter`

**Key Methods:**
- `request(method, params)` - Main EIP-1193 entry point
- `send(method, params)` - Legacy method support
- `setAddress(address)` - Updates impersonated address, emits `accountsChanged`
- `setChainId(chainId, rpcUrl)` - Updates network, emits `chainChanged`

**Provider Behavior:**
- Returns fake address/chainId for read operations (`eth_accounts`, `eth_chainId`)
- Proxies actual blockchain calls to real RPC via `@ethersproject/providers`
- Supports chain switching via `wallet_switchEthereumChain` and `wallet_addEthereumChain`
- Sets `isMetaMask: true` for dapp compatibility
- Sets `isImpersonator: true` for identification

#### 3. **React Context for Global State**
**Location:** `src/contexts/NetworksContext.tsx`

**Purpose:** Manages blockchain network configurations across the extension

**Features:**
- **Pre-configured Default Networks:** 25 popular EVM chains included out-of-the-box
- **Enable/Disable Networks:** Toggle networks on/off without deleting them
- **Automatic Migration:** Seamlessly merges defaults with existing custom networks
- Persists to `chrome.storage.sync` for cross-device sync
- Provides `useNetworks()` hook for consumption
- Tracks `reloadRequired` state when networks change

**New Context Methods:**
- `toggleNetworkEnabled(networkName)` - Enable/disable a network
- `resetToDefaults()` - Remove all custom networks and reset to defaults
- `getEnabledNetworks()` - Get only networks that are enabled

**Storage Schema:**
```typescript
networksInfo: {
  [chainName: string]: {
    chainId: number;
    rpcUrl: string;
    isDefault?: boolean;     // Whether this is a pre-configured network
    isEnabled?: boolean;     // Whether the network is enabled (default: true)
    symbol?: string;         // Network symbol (e.g., "ETH", "MATIC")
    blockExplorer?: string;  // Block explorer URL
  }
}
```

**Default Networks (src/data/defaultNetworks.ts):**
- **Layer 1 (3):** Ethereum Mainnet, BSC, Avalanche
- **Layer 2 (8):** Polygon, Arbitrum, Optimism, Base, zkSync Era, Linea, Scroll, Mantle
- **Sidechains (9):** Gnosis, Fantom, Celo, Moonbeam, Aurora, Cronos, Evmos, Kava, Metis
- **Testnets (5):** Sepolia, Polygon Mumbai, BSC Testnet, Arbitrum Sepolia, Optimism Sepolia
- All defaults use verified public RPC endpoints (primarily Ankr)

#### 4. **Tab-Scoped State Management**
**Unique Feature:** Each browser tab can have independent address/chain configuration

**Implementation:**
- Popup communicates with specific tabs via `chrome.tabs.sendMessage(tabId, ...)`
- Content script maintains per-tab state
- Enables simultaneous testing of different addresses/chains in different tabs

**Example Use Case:**
- Tab 1: Uniswap on Polygon with `apoorv.eth`
- Tab 2: Sushiswap on Ethereum Mainnet with `vitalik.eth`

---

## Directory Structure

```
impersonator-extension/
├── src/                              # Main TypeScript/React source code
│   ├── chrome/                       # Extension-specific logic
│   │   ├── inject.ts                 # Content script (message bridge)
│   │   └── impersonator.ts           # Injected provider (window.ethereum)
│   ├── components/                   # React UI components
│   │   └── Settings/
│   │       ├── index.tsx             # Settings page wrapper
│   │       ├── Chains.tsx            # Network list UI (with toggle/search)
│   │       ├── AddChain.tsx          # Add network form
│   │       └── EditChain.tsx         # Edit/delete network form
│   ├── contexts/
│   │   └── NetworksContext.tsx       # Global network state management
│   ├── data/                         # Static data and configurations
│   │   └── defaultNetworks.ts        # Pre-configured network list (25 chains)
│   ├── App.tsx                       # Main popup UI
│   ├── index.tsx                     # React entry point
│   ├── index.css                     # Global styles
│   ├── theme.ts                      # Chakra UI theme
│   └── types.ts                      # TypeScript type definitions
├── public/                           # Static extension assets
│   ├── manifest.json                 # Chrome extension manifest (v3)
│   ├── impersonatorLogo.png
│   └── icons/                        # Extension icons (16, 48, 128px)
├── .github/
│   └── .workflow/
│       └── release.yaml              # CI/CD for Firefox publishing
├── vite.config.ts                    # Vite config for popup
├── vite.config.inpage.ts             # Vite config for injected script
├── vite.config.inject.ts             # Vite config for content script
├── tsconfig.json                     # TypeScript configuration
├── tsconfig.build.json               # Build-specific TS config
├── tsconfig.node.json                # Node.js TS config
├── .eslintrc.cjs                     # ESLint configuration
├── package.json                      # Dependencies and scripts
├── index.html                        # Popup HTML entry
└── .node-version                     # Node.js version (LTS Iron)
```

---

## Development Workflows

### Initial Setup

```bash
# Install dependencies (uses Yarn)
yarn install

# Verify Node.js version matches .node-version (LTS Iron)
node --version
```

### Development Mode

```bash
# Start all builds in watch mode (recommended)
yarn dev

# Or start individual builds
yarn dev:web      # Popup UI only
yarn dev:inpage   # Injected provider only
yarn dev:inject   # Content script only
```

**Build Output:** `build/` directory
- `index.html` - Popup UI
- `static/js/main.js` - Popup bundle
- `static/js/inpage.js` - Injected provider (IIFE)
- `static/js/inject.js` - Content script (IIFE)

### Testing in Browser

```bash
# Load extension in Chromium
yarn chrome:run

# Load extension in Firefox (with browser console)
yarn firefox:run
```

**Manual Testing:**
1. Extension automatically reloads in browser when files change (in dev mode)
2. Open a dapp (e.g., Uniswap, OpenSea)
3. Click extension icon to open popup
4. Set address and network
5. Toggle "Enabled" switch
6. Connect wallet in dapp (will see custom address)

### Production Build

```bash
# Build all bundles for production
yarn build

# Build individual bundles
yarn build:web      # Popup
yarn build:inpage   # Provider
yarn build:inject   # Content script
```

### Code Quality

```bash
# Run ESLint
yarn lint
```

**Note:** No automated tests currently exist. All testing is manual.

---

## Code Conventions

### TypeScript

- **Strict Mode:** Enabled in `tsconfig.json`
- **Target:** ES2020
- **Module:** ESNext
- **No Implicit Any:** Disabled (see `.eslintrc.cjs`)
- **Path Aliases:** `@/` maps to `src/`

**Example:**
```typescript
import { useNetworks } from "@/contexts/NetworksContext";
```

### ESLint Rules

From `.eslintrc.cjs`:
- **Base:** `eslint:recommended`, `@typescript-eslint/recommended`
- **React Hooks:** Enforced
- **Custom Overrides:**
  - `prefer-const`: OFF (allows `let` usage)
  - `@typescript-eslint/ban-ts-comment`: OFF (allows `@ts-ignore`)
  - `@typescript-eslint/no-explicit-any`: OFF (allows `any` type)

### React Conventions

- **Functional Components:** All components use function syntax
- **Hooks:** React hooks (`useState`, `useEffect`, `useUpdateEffect`) used throughout
- **Chakra UI:** Primary component library
  - Import components from `@chakra-ui/react`
  - Custom theme defined in `src/theme.ts`
- **File Naming:**
  - Components: PascalCase (e.g., `AddChain.tsx`)
  - Utilities/services: camelCase (e.g., `inject.ts`)

### State Management

- **Local State:** `useState` for component-level state
- **Global State:** React Context (`NetworksContext`)
- **Persistence:** `chrome.storage.sync` API

**Storage Keys:**
- `address` - Current wallet address (resolved from ENS)
- `displayAddress` - Display version (may be ENS name)
- `chainName` - Selected blockchain network name
- `isEnabled` - Extension enabled/disabled state
- `networksInfo` - All configured networks (object)

### Naming Conventions

**Variables/Functions:**
- `camelCase` for variables and functions
- `PascalCase` for classes and React components
- `UPPER_CASE` not commonly used (no constants file)

**Message Types:** (used in window.postMessage and chrome.runtime.sendMessage)
- `setAddress` - Update impersonated address
- `setChainId` - Update blockchain network
- `getInfo` - Fetch current state
- `init` - Initialize provider
- `switchEthereumChain` - Response to chain switch request
- `i_switchEthereumChain` - Request chain switch (from injected script)

---

## Key Files & Their Purposes

### Critical Files

| File Path | Purpose | Key Functions/Exports |
|-----------|---------|----------------------|
| `src/chrome/inject.ts` | Content script that bridges popup ↔ injected script | Message relay via `chrome.runtime.onMessage` and `window.postMessage` |
| `src/chrome/impersonator.ts` | Custom EIP-1193 provider implementation | `ImpersonatorProvider` class, `request()`, `send()`, `setAddress()`, `setChainId()` |
| `src/App.tsx` | Main popup UI | Address input, network selector (enabled networks only), enable toggle, settings navigation |
| `src/contexts/NetworksContext.tsx` | Global network state management | `NetworksContext`, `useNetworks()` hook, `networksInfo` persistence, `toggleNetworkEnabled()`, `resetToDefaults()`, `getEnabledNetworks()` |
| `src/data/defaultNetworks.ts` | **NEW** Pre-configured network definitions | `DEFAULT_NETWORKS` (25 chains), `getNetworksByCategory()`, `getNetworkByChainId()` |
| `src/components/Settings/Chains.tsx` | Network management UI | **ENHANCED** Displays default/custom networks separately, toggle switches, search/filter, reset button |
| `src/components/Settings/AddChain.tsx` | Add custom network form | Auto-fetches chainId from RPC URL, saves to context |
| `src/components/Settings/EditChain.tsx` | Edit/delete network form | Modify existing network, delete custom networks |
| `src/types.ts` | TypeScript type definitions | `NetworkInfo` interface (extended with `isDefault`, `isEnabled`, `symbol`, `blockExplorer`), `NetworksInfo` type |
| `public/manifest.json` | Extension manifest | Permissions, content scripts, web-accessible resources |

### Configuration Files

| File | Purpose |
|------|---------|
| `vite.config.ts` | Main build config (popup UI) |
| `vite.config.inpage.ts` | Build config for injected provider (IIFE) |
| `vite.config.inject.ts` | Build config for content script (IIFE) |
| `tsconfig.json` | TypeScript compiler options |
| `.eslintrc.cjs` | ESLint rules and plugins |
| `package.json` | Dependencies, scripts, metadata |

### Build Outputs

| File | Source | Purpose |
|------|--------|---------|
| `build/index.html` | `index.html` + `src/index.tsx` | Popup UI entry point |
| `build/static/js/main.js` | `src/index.tsx` + `src/App.tsx` + components | Popup React bundle |
| `build/static/js/inpage.js` | `src/chrome/impersonator.ts` | Injected provider script (IIFE) |
| `build/static/js/inject.js` | `src/chrome/inject.ts` | Content script (IIFE) |

---

## Build System

### Build Tools

- **Primary:** Vite 5.4
- **Compiler:** TypeScript 4.9.5
- **Minifier:** Terser 5.34
- **Task Runner:** Concurrently 9.0.1 (for parallel builds)

### Build Configurations

The project has **three separate Vite configs** to handle different bundle requirements:

#### 1. Popup Build (`vite.config.ts`)
- **Entry:** `index.html`
- **Output:** `build/index.html` + `build/static/js/main.js`
- **Format:** ES Module (for modern browsers)
- **Features:**
  - React + Chakra UI
  - Code splitting enabled
  - Source maps in development

#### 2. Injected Provider Build (`vite.config.inpage.ts`)
- **Entry:** `src/chrome/impersonator.ts`
- **Output:** `build/static/js/inpage.js`
- **Format:** IIFE (Immediately Invoked Function Expression)
- **Features:**
  - Self-executing script
  - No external dependencies (all bundled)
  - Terser minification with `keep_fnames: true`, `keep_classnames: true`
  - Node polyfills included (except console)

#### 3. Content Script Build (`vite.config.inject.ts`)
- **Entry:** `src/chrome/inject.ts`
- **Output:** `build/static/js/inject.js`
- **Format:** IIFE
- **Features:**
  - Self-executing script
  - Minimal size (no external deps)
  - Terser minification

### Important Build Settings

**Terser Configuration (shared across all builds):**
```javascript
{
  keep_classnames: true,
  keep_fnames: true,
  // Preserves function/class names for debugging
}
```

**Node Polyfills:**
- Included via `vite-plugin-node-polyfills`
- Excludes `console` (uses native browser console)

**Path Resolution:**
- `@/` alias maps to `src/` via `vite-tsconfig-paths`

---

## Testing & Quality

### Automated Testing

**Test Framework:** Vitest + React Testing Library

**Test Scripts:**
```bash
# Run tests in watch mode
yarn test

# Run tests once (CI mode)
yarn test:run

# Generate coverage report
yarn test:coverage

# Open test UI in browser
yarn test:ui
```

**Test Coverage:**
- **Unit Tests:** NetworksContext logic, defaultNetworks utilities
- **Component Tests:** Chains UI, network filtering, toggle switches
- **Mocked APIs:** chrome.storage, chrome.tabs, chrome.runtime

**Test Files:**
```
src/
├── test/
│   ├── setup.ts                     # Global test configuration
│   └── README.md                    # Testing guide
├── contexts/__tests__/
│   └── NetworksContext.test.tsx     # Context logic tests
├── components/Settings/__tests__/
│   └── Chains.test.tsx              # UI component tests
└── data/__tests__/
    └── defaultNetworks.test.ts      # Network data tests
```

**Key Test Scenarios:**
- ✅ Fresh install initializes with 25 default networks
- ✅ Migration from old format preserves user data
- ✅ Custom networks merge correctly with defaults
- ✅ Enable/disable toggle updates state
- ✅ getEnabledNetworks() filters correctly
- ✅ resetToDefaults() removes custom networks
- ✅ Search/filter UI works as expected
- ✅ Network symbols and metadata display correctly

### Quality Assurance

**Static Analysis:**
- **ESLint:** Code linting (run via `yarn lint`)
- **TypeScript:** Compile-time type checking
- **Vitest:** Automated unit and component tests

### Manual Testing Workflow

1. **Start Development Mode:**
   ```bash
   yarn dev
   ```

2. **Load Extension in Browser:**
   ```bash
   # Chrome/Chromium
   yarn chrome:run

   # Firefox
   yarn firefox:run
   ```

3. **Test Scenarios:**
   - Set valid Ethereum address, verify dapp sees it
   - Set ENS name (e.g., `vitalik.eth`), verify resolution
   - Switch networks, verify `chainChanged` event fires
   - Test tab-scoped state (different addresses in different tabs)
   - Test with real dapps (Uniswap, OpenSea, etc.)
   - Verify enable/disable toggle works
   - Add custom network, verify persistence
   - Edit/delete network, verify changes persist
   - Toggle default networks on/off
   - Search for networks by name or chain ID
   - Reset to defaults and verify behavior

### Browser Compatibility

**Supported Browsers:**
- Chrome (via Chrome Web Store)
- Chromium-based browsers (Edge, Brave, etc.)
- Firefox (via Firefox Add-ons)

**Manifest Version:** 3 (latest standard)

---

## Common Tasks

### Adding a New Network Configuration Feature

**Example:** Add support for custom RPC headers

1. **Update Types** (`src/types.ts`):
   ```typescript
   export interface ChainInfo {
     chainId: number;
     rpcUrl: string;
     headers?: Record<string, string>; // NEW
   }
   ```

2. **Update Context** (`src/contexts/NetworksContext.tsx`):
   - Add headers field to storage schema
   - Update state management

3. **Update UI** (`src/components/Settings/AddChain.tsx`, `EditChain.tsx`):
   - Add input fields for headers
   - Update form submission logic

4. **Update Provider** (`src/chrome/impersonator.ts`):
   - Pass headers to `StaticJsonRpcProvider` constructor
   - Update `setChainId` method

### Modifying the Message Protocol

**Example:** Add new message type for transaction signing

1. **Define Message Type** (document in this file):
   - `signTransaction` - Request transaction signature

2. **Update Content Script** (`src/chrome/inject.ts`):
   ```typescript
   chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
     switch (request.type) {
       case "signTransaction":
         window.postMessage({ type: "signTransaction", msg: request.msg }, "*");
         break;
     }
   });
   ```

3. **Update Injected Provider** (`src/chrome/impersonator.ts`):
   ```typescript
   async send(method: string, params?: Array<any>): Promise<any> {
     switch (method) {
       case "eth_signTransaction":
         // Implementation
         break;
     }
   }
   ```

4. **Update Popup** (if needed in `src/App.tsx`):
   - Add UI for triggering signature
   - Send message via `chrome.tabs.sendMessage`

### Adding a New UI Component

**Example:** Add a transaction history viewer

1. **Create Component** (`src/components/TransactionHistory.tsx`):
   ```typescript
   import { Box, Text } from "@chakra-ui/react";

   export default function TransactionHistory() {
     return (
       <Box>
         <Text>Transaction History</Text>
       </Box>
     );
   }
   ```

2. **Update App** (`src/App.tsx`):
   - Import component
   - Add navigation/routing

3. **Update Theme** (if needed in `src/theme.ts`):
   - Add custom styles
   - Extend Chakra theme

### Debugging Extension Issues

**Console Locations:**
1. **Popup UI:** Right-click popup → Inspect
2. **Content Script:** Open browser DevTools on webpage → Console tab (filter by extension ID)
3. **Injected Script:** Same as content script (uses `console.log` in `impersonator.ts`)
4. **Background Script:** N/A (this extension has no background script)

**Common Debugging Techniques:**
- Add `console.log` statements in all three layers
- Use `chrome.storage.sync.get()` to inspect stored state
- Check `window.ethereum` in dapp console (should show `isImpersonator: true`)
- Verify messages are flowing: Popup → Content Script → Injected Script

---

## Important Considerations for AI Assistants

### When Modifying Code

1. **Preserve Extension Security:**
   - Never bypass `chrome.runtime.onMessage` security checks
   - Always validate message sources (`if (e.source !== window)`)
   - Don't expose sensitive data to webpage context

2. **Maintain Three-Layer Architecture:**
   - Popup ↔ Content Script ↔ Injected Script
   - Always use proper message passing (don't try to merge layers)
   - Content script is the ONLY bridge between popup and injected code

3. **Build System Awareness:**
   - Three separate Vite configs exist for a reason (different output formats)
   - IIFE format is required for inject.ts and impersonator.ts
   - Don't accidentally change build format to ESM

4. **Storage API Usage:**
   - Always use `chrome.storage.sync` (not `localStorage`)
   - Sync storage has size limits (100KB per item, 102KB total)
   - Use `chrome.storage.sync.get()` and `.set()` (async APIs)

5. **EIP-1193 Compliance:**
   - Provider must implement `request(method, params)`
   - Must emit `accountsChanged` and `chainChanged` events
   - Must set `isMetaMask: true` for dapp compatibility
   - See: https://eips.ethereum.org/EIPS/eip-1193

### Common Pitfalls

**Pitfall 1: Trying to communicate directly between popup and injected script**
- **Wrong:** Popup tries to access `window.ethereum` directly
- **Right:** Popup → `chrome.tabs.sendMessage` → Content Script → `window.postMessage` → Injected Script

**Pitfall 2: Modifying manifest.json without testing**
- **Issue:** Incorrect permissions can break extension
- **Solution:** Always test manifest changes in both Chrome and Firefox

**Pitfall 3: Breaking IIFE format**
- **Issue:** Changing Vite config to ESM breaks inject.js/inpage.js
- **Solution:** Keep IIFE format for scripts injected into webpage

**Pitfall 4: Forgetting to rebuild**
- **Issue:** Changes to `inject.ts` or `impersonator.ts` require rebuild
- **Solution:** Use `yarn dev` to enable watch mode

**Pitfall 5: Hardcoding RPC URLs**
- **Issue:** RPC URLs can change or rate-limit
- **Solution:** Always use user-configured networks from `NetworksContext`

### Code Review Checklist

When reviewing or modifying code, check:

- [ ] TypeScript types are properly defined (no `any` unless necessary)
- [ ] Message types are documented and consistent across layers
- [ ] Storage operations use `chrome.storage.sync` (not localStorage)
- [ ] EIP-1193 provider methods return correct types (Promise<any>)
- [ ] Event emitters fire `accountsChanged` and `chainChanged` when state changes
- [ ] Build configs remain separate for popup/inject/inpage
- [ ] Error handling exists for RPC calls (network failures)
- [ ] ENS resolution has fallback to public RPC
- [ ] UI uses Chakra UI components (consistency)
- [ ] No security vulnerabilities (XSS, injection, etc.)

### Testing Checklist

When adding new features, manually test:

- [ ] Feature works in Chrome
- [ ] Feature works in Firefox
- [ ] Feature persists across browser restarts (if using storage)
- [ ] Feature works with tab-scoped state (different addresses per tab)
- [ ] Feature handles errors gracefully (network failures, invalid input)
- [ ] Feature doesn't break existing functionality
- [ ] Feature works on real dapps (Uniswap, OpenSea, etc.)
- [ ] UI is responsive (mobile view)
- [ ] Changes are reflected in popup after page reload

### Documentation Updates

When making significant changes, update:

- [ ] This CLAUDE.md file (if architecture changes)
- [ ] README.md (if user-facing features change)
- [ ] Code comments (for complex logic)
- [ ] Message type documentation (if new messages added)
- [ ] Type definitions in `src/types.ts`

### CI/CD Pipeline

**Continuous Integration** runs automatically on every push and pull request.

**GitHub Actions Workflows:**

**1. CI Workflow** (`.github/workflows/ci.yaml`)
- **Triggers:** Push to main/master/develop, pull requests
- **Jobs:**
  - **Test & Lint:**
    - Install dependencies
    - Run ESLint
    - Run Vitest tests
    - Generate coverage report
    - Upload coverage to Codecov (optional)
  - **Build:**
    - Build extension with Vite
    - Verify build outputs
    - Upload build artifacts (7-day retention)

**2. Release Workflow** (`.github/workflows/release.yaml`)
- **Triggers:** GitHub release published
- **Jobs:**
  - **Firefox Submission:**
    - Build production version
    - Archive source code
    - Sign and submit to Firefox Add-ons automatically

**Status Checks:**
All pull requests must pass:
- ✅ Linting (ESLint)
- ✅ Tests (Vitest)
- ✅ Build verification

**Viewing Results:**
- Check the "Actions" tab in GitHub repository
- View coverage reports in PR comments (if Codecov configured)
- Download build artifacts from workflow runs

### Deployment Workflow

**Chrome Web Store:**
1. Build production version: `yarn build`
2. Zip `build/` directory
3. Upload to Chrome Web Store dashboard
4. Wait for review (usually 1-3 days)

**Firefox Add-ons:**
1. Build production version: `yarn build`
2. GitHub Actions automatically builds and signs on release
3. See `.github/workflows/release.yaml` for CI/CD details

**Important:** Always test production builds locally before publishing:
```bash
yarn build
yarn chrome:run  # Test Chrome build
yarn firefox:run # Test Firefox build
```

---

## Message Protocol Reference

### Popup → Content Script (chrome.runtime.sendMessage)

| Type | Payload | Purpose |
|------|---------|---------|
| `setAddress` | `{ address: string, displayAddress: string }` | Update impersonated address |
| `setChainId` | `{ chainId: number, chainName: string, rpcUrl: string }` | Update blockchain network |
| `getInfo` | `{}` | Fetch current address/chain info |

### Content Script → Injected Script (window.postMessage)

| Type | Payload | Purpose |
|------|---------|---------|
| `init` | `{ isEnabled: boolean, address: string, chainId: number, rpcUrl: string }` | Initialize provider on page load |
| `setAddress` | `{ address: string }` | Update address in provider |
| `setChainId` | `{ chainId: number, rpcUrl: string }` | Update chain in provider |
| `switchEthereumChain` | `{ chainId: number, rpcUrl: string }` | Response to wallet_switchEthereumChain |

### Injected Script → Content Script (window.postMessage)

| Type | Payload | Purpose |
|------|---------|---------|
| `i_switchEthereumChain` | `{ chainId: number }` | Request chain switch (dapp initiated) |

### Content Script → Popup (sendResponse)

| Type | Payload | Purpose |
|------|---------|---------|
| `getInfo` response | `{ address: string, chainId: number }` | Return current state to popup |

---

## FAQ for AI Assistants

**Q: Why are there three Vite configs?**
A: Different output formats are required. Popup needs ESM for modern browsers, while inject.js and inpage.js need IIFE format to execute in webpage context.

**Q: Can I use localStorage instead of chrome.storage.sync?**
A: No. Extension popup and content scripts have separate localStorage contexts. Use chrome.storage.sync for shared state.

**Q: Why does the provider set both `isMetaMask: true` and `isImpersonator: true`?**
A: `isMetaMask: true` ensures dapp compatibility (many dapps check for MetaMask specifically). `isImpersonator: true` allows detection of Impersonator for debugging.

**Q: Can I add a background script?**
A: Yes, but it's not necessary for current functionality. All state is managed in popup and content scripts.

**Q: How do I debug "message not received" issues?**
A: Check console logs in all three contexts (popup, content script, injected script). Verify message types match exactly and source validation passes.

**Q: Can I use Axios or Fetch for RPC calls?**
A: Use `@ethersproject/providers` for consistency. It handles JSON-RPC formatting, error handling, and retries.

**Q: Why does ENS resolution use mainnet?**
A: ENS records are stored on Ethereum mainnet. Even when using other chains, ENS lookups must query mainnet.

**Q: Can I add TypeScript decorators?**
A: Not recommended. TypeScript 4.9.5 has experimental decorator support, but it's not enabled in tsconfig.json.

**Q: How do I add support for a new RPC method?**
A: Add a case in the `send()` method switch statement in `src/chrome/impersonator.ts`. Decide whether to proxy to real RPC or return fake data.

**Q: Can I use React Router for popup navigation?**
A: Not recommended for a simple popup. Current approach (conditional rendering based on state) is sufficient and lighter.

---

## Version History

**0.1.2** (Current)
- Migrated from Create React App to Vite
- Updated dependencies
- Added Firefox support

**Previous Versions:** See git history for details

---

## Additional Resources

- **EIP-1193 Provider Spec:** https://eips.ethereum.org/EIPS/eip-1193
- **Chrome Extension Docs:** https://developer.chrome.com/docs/extensions/
- **Firefox Extension Docs:** https://extensionworkshop.com/
- **Chakra UI Docs:** https://chakra-ui.com/
- **Vite Docs:** https://vitejs.dev/
- **ethers.js Docs:** https://docs.ethers.org/v5/

---

**End of CLAUDE.md**

*This document should be updated whenever significant architectural changes are made to the codebase.*
