# TAB — The Group Wallet That Settles Itself 🧾✨

> **Built for the Monad Ecosystem**  
> High-throughput, gas-optimized group expense splitting and automated debt simplification protocol.

---

## 1. Project Overview

**TAB** is an autonomous group wallet and expense-sharing protocol built natively for the **Monad** blockchain. In social trips, hacker houses, shared flats, or DAO working groups, friends and collaborators constantly incur uneven shared expenses. 

Traditionally, settling up requires either:
1. Every person making multiple fragmented peer-to-peer payments ($O(N^2)$ transactions).
2. Clunky off-chain spreadsheets and manual escrow reconciliation.

TAB solves this on Monad by:
- Tracking **net balance conservation** in native `MON` units.
- Eliminating wei-level rounding drift with **deterministic remainder absorption**.
- Generating **greedy debt-simplification settlement plans** that reduce multi-party settlement down to at most $N - 1$ transfers.
- Enforcing **approval thresholds** and **replay/double-settlement protection**.
- Protecting users from denial-of-service with **pull-over-push fallback escrow**.

---

## 2. Architecture & Team Boundaries

The TAB repository is structured with modular separation between the blockchain protocol and frontend client:

```
TAB/
├── contracts/                        # Core Solidity smart contracts (Owned by Person 1)
│   ├── TabGroupWallet.sol            # Main protocol contract (Groups, Expenses, Settlements)
│   ├── interfaces/
│   │   └── ITabGroupWallet.sol       # Contract interface, structs, events, errors
│   ├── libraries/
│   │   └── SettlementMath.sol        # Pure library: Equal split & greedy debt simplification
│   └── test/
│       └── RejectEther.sol           # Mock contract for testing pull-over-push fallback
├── test/                             # Automated test suite (Owned by Person 1)
│   ├── TabGroupWallet.test.ts        # Comprehensive protocol integration tests (32 tests)
│   └── SettlementAlgorithm.test.ts   # Edge cases, cyclic debts & simplification tests (4 tests)
├── scripts/                          # Deployment & utility scripts (Owned by Person 1)
│   ├── deploy.ts                     # Deployment script with automatic artifact generation
│   └── export-abi.ts                 # ABI extraction to shared/ directory
├── shared/                           # Shared integration contract layer
│   ├── abi/                          # Generated contract ABIs for frontend consumption
│   │   ├── TabGroupWallet.json
│   │   └── ITabGroupWallet.json
│   ├── deployment.json               # Live network deployment addresses and metadata
│   └── CONTRACT_INTERFACE.md         # Detailed contract integration specification
├── .env.example                      # Template for network and secret configuration
├── .gitignore                        # Git ignore rules protecting keys and build outputs
├── hardhat.config.ts                 # Hardhat configuration with Monad Testnet support
├── package.json                      # Protocol dependencies and npm scripts
├── tsconfig.json                     # TypeScript configuration
└── README.md                         # Documentation and setup instructions
```

- **Person 1 (Blockchain Engineer)** owns: `contracts/`, `test/`, `scripts/`, `shared/`, root blockchain configuration.
- **Person 2 (Frontend Engineer)** owns: Frontend application and UI connecting to `shared/abi/` and `shared/deployment.json`.

---

## 3. Protocol Mechanics

### A. Balance Convention
TAB tracks net balances using signed integers (`int256`) in native MON wei units:
- **Positive Balance (`+`)**: Member is a **Creditor** (is owed money, should receive MON).
- **Negative Balance (`-`)**: Member is a **Debtor** (owes money, must pay MON).
- **Zero Balance (`0`)**: Member is completely settled.
- **Invariant**: In any closed group at all times, $\sum_{m \in M} \text{balance}(m) \equiv 0$.

### B. Deterministic Remainder Splitting
When an expense amount $A$ is split equally among $N$ participants:
$$\text{baseShare} = \lfloor A / N \rfloor, \quad \text{remainder} = A \pmod N$$
The first $\text{remainder}$ participants pay $\text{baseShare} + 1\text{ wei}$, and the rest pay $\text{baseShare}$.
$$\text{Sum of shares} = \text{remainder} \cdot (\text{baseShare} + 1) + (N - \text{remainder}) \cdot \text{baseShare} \equiv A$$
Zero wei is lost or generated, preventing rounding drift or insolvency.

### C. Greedy Settlement Algorithm & Limitations
- **How it works**: The algorithm inspects the group's net balances, identifying all debtors and creditors. It iteratively pairs the current debtor with the current creditor, transferring $\min(|\text{debt}|, \text{credit})$, until all debts are eliminated.
- **Complexity reduction**: Replaces up to $N(N-1)/2$ pairwise bilateral transfers with at most $N - 1$ transfers.
- **Algorithm limitations**: While greedy matching drastically cuts transaction volume and gas, finding the *absolute theoretical minimum* number of transfers across arbitrary subsets is equivalent to the **Subset Sum / Partition Problem**, an NP-hard problem. Greedy matching provides optimal or near-optimal results for practical group sizes without requiring exponential off-chain computation.

---

## 4. Quickstart & Setup Commands

### Prerequisites
- Node.js version `>= 18.0.0`
- npm version `>= 9.0.0`

### Installation
Clone the repository and install dependencies:
```bash
npm install
```

### Compile Smart Contracts
Compile Solidity contracts with solc `0.8.24` and generate TypeChain typings:
```bash
npm run compile
```

### Run Automated Tests
Execute the full test suite (36 tests covering group management, expense splits, approvals, settlements, and edge cases):
```bash
npm test
```

### Export Contract ABIs
Extract clean ABIs to the `shared/abi/` directory for frontend integration:
```bash
npm run export-abi
```

---

## 5. Deployment

### Monad Testnet Configuration
Official Monad Testnet parameters configured in `hardhat.config.ts`:
- **Network Name**: `monadTestnet`
- **Chain ID**: `10143`
- **RPC URL**: `https://testnet-rpc.monad.xyz`
- **Currency**: `MON`
- **Block Explorer**: `https://testnet.monadexplorer.com`

### Setting up Environment Variables
Create a local `.env` file from the template:
```bash
cp .env.example .env
```
Populate `.env` with your deployment private key:
```env
MONAD_TESTNET_RPC_URL=https://testnet-rpc.monad.xyz
PRIVATE_KEY=your_monad_testnet_private_key_here
```
> ⚠️ **SECURITY WARNING**: Never commit `.env` or real private keys. `.env` is ignored in `.gitignore`.

### Deploy Locally (Hardhat Network)
```bash
npm run deploy:local
```

### Deploy to Monad Testnet
To deploy directly to the live Monad Testnet:
```bash
npm run deploy:monad-testnet
```

Upon deployment, the script automatically:
1. Deploys `TabGroupWallet`.
2. Records the deployed address, transaction hash, and timestamp in `shared/deployment.json`.
3. Synchronizes the ABI into `shared/abi/TabGroupWallet.json`.

---

## 6. Shared Contract Interface
For complete function signatures, event definitions, error codes, and frontend integration examples, see:
👉 [**`shared/CONTRACT_INTERFACE.md`**](file:///c:/Users/me225/OneDrive/Desktop/TAB/shared/CONTRACT_INTERFACE.md)
