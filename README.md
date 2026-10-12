# TAB — The Group Wallet That Settles Itself

A shared group wallet for college friends who split dinner bills, cabs, books, and tickets. TAB records expenses, calculates balances, and proposes an optimized settlement that minimizes unnecessary transfers — all on Monad.

## Architecture

```
TAB/
├── web/          # Next.js frontend (TypeScript + Tailwind + wagmi)
├── contracts/    # Solidity smart contracts (Person 1)
└── package.json  # Monorepo root
```

## Quick Start

### Prerequisites
- Node.js 18+
- npm 9+
- MetaMask or compatible wallet

### Installation

```bash
# Install all dependencies
npm install

# Copy environment variables
cp web/.env.example web/.env.local

# Start development server
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Deployed TabGroup contract address | — |
| `NEXT_PUBLIC_CHAIN_RPC_URL` | Monad testnet RPC endpoint | `https://testnet-rpc.monad.xyz` |
| `NEXT_PUBLIC_CHAIN_ID` | Chain ID for Monad testnet | `10143` |
| `NEXT_PUBLIC_USE_MOCK` | Enable mock adapter for development | `true` |

### Demo Mode

Set `NEXT_PUBLIC_USE_MOCK=true` to run with pre-populated demo data:
- 5 friends with sample wallets
- Pre-created groups and expenses
- Full settlement flow without real transactions

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Blockchain**: wagmi v2 + viem v2
- **Chain**: Monad Testnet
- **Icons**: Lucide React

## Features

- 🏠 Landing page with product overview
- 👛 Wallet connection with network detection
- 👥 Create and manage groups
- 💰 Add and track shared expenses
- 📊 View net balances per member
- 🔄 Optimized settlement with minimal transfers
- ✅ On-chain expense approval workflow

## Contributing

- Frontend changes go in `web/`
- Smart contract changes go in `contracts/`
- Use conventional commits: `feat(web): ...`, `feat(contracts): ...`

## License

MIT
