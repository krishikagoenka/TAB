# TAB — The Group Wallet That Settles Itself

**A blockchain-powered group expense wallet built for the Monad ecosystem.**

TAB simplifies shared expenses for college friends, roommates, and groups. Whether you're splitting dinner bills, cab fares, books, or event tickets, TAB tracks who owes whom and calculates an optimized settlement plan to minimize unnecessary transfers.

## The Problem

When a group of friends shares expenses, keeping track of payments becomes complicated. People forget who paid, balances become confusing, and settling every individual debt can require multiple transfers.

Traditional expense-splitting apps track debts, but TAB aims to take the process further by combining transparent on-chain records with optimized settlements.

## Our Solution

TAB provides a shared group expense management system where members can record expenses, approve them, track balances, and settle outstanding debts.

Instead of making everyone pay everyone else, TAB calculates a settlement plan that reduces the number of transfers needed to clear the group's net balances.

### Key Features

- **Shared Groups:** Create expense groups and manage group members.
- **Expense Tracking:** Record expenses, identify payers, and specify participants.
- **Expense Approvals:** Allow group members to approve expenses according to the protocol's rules.
- **Automatic Balance Calculation:** Track how much each member owes or is owed.
- **Optimized Settlement:** Calculate who should pay whom and how much, reducing unnecessary transfers.
- **On-Chain Transparency:** Store supported group operations and settlement records on the blockchain.
- **Wallet Integration:** Connect a compatible Web3 wallet to interact with the application.
- **Monad Integration:** Build and test blockchain functionality for the Monad ecosystem.

## How It Works

1. **Create a group:** A user creates a group and registers its members.
2. **Record expenses:** Members record shared expenses and specify who participated.
3. **Approve expenses:** Members provide the required approvals.
4. **Calculate balances:** TAB calculates each member's net balance across the group's expenses.
5. **Generate a settlement plan:** The settlement algorithm determines the proposed payments.
6. **Settle debts:** Authorized users execute the settlement through the supported blockchain workflow.
7. **Verify the result:** Updated balances and transaction records reflect the completed settlement.

### Example

Suppose five friends share expenses during a trip. After accounting for all expenses, the group has the following net balances:

| Friend | Net balance |
|---|---:|
| Alice | +₹600 |
| Bob | +₹400 |
| Charlie | -₹500 |
| Dave | -₹300 |
| Eve | -₹200 |

Positive balances represent money to receive, while negative balances represent money owed.

A possible settlement is:

- Charlie pays Alice ₹500.
- Dave pays Alice ₹100.
- Dave pays Bob ₹200.
- Eve pays Bob ₹200.

This example settles the balances using four transfers. The actual settlement plan depends on the algorithm and the group's balances.

> Note: The example uses rupees for readability. Actual on-chain transactions must use the asset and denomination supported by the deployed contracts.

## Architecture

TAB separates the user interface from blockchain logic.

```text
                 TAB APPLICATION
                        |
          +-------------+-------------+
          |                           |
     Frontend                    Blockchain
          |                           |
    Wallet Connection          Smart Contracts
          |                           |
    Group Dashboard             Group Management
          |                           |
    Expense Management          Expense Approvals
          |                           |
    Balance Dashboard           Balance Tracking
          |                           |
    Settlement Preview          Settlement Logic
          |                           |
          +-------------+-------------+
                        |
                  Monad Testnet
```

### Technology Stack

| Component | Technology |
|---|---|
| Smart contracts | Solidity |
| Contract development | Hardhat |
| Contract tests | Hardhat and TypeScript |
| Blockchain interaction | Ethers.js or the configured Web3 library |
| Frontend | Next.js, React, and TypeScript (planned/integrated as applicable) |
| Wallet | MetaMask or another compatible wallet |
| Blockchain network | Monad Testnet |
| Version control | Git and GitHub |

The final frontend and Web3 libraries should match the dependencies actually installed in the repository.

## Project Structure

```text
TAB/
├── contracts/
│   ├── TabGroupWallet.sol
│   ├── interfaces/
│   └── libraries/
│       └── SettlementMath.sol
├── scripts/
│   ├── deploy.ts
│   └── export-abi.ts
├── test/
│   ├── TabGroupWallet.test.ts
│   └── SettlementAlgorithm.test.ts
├── shared/
│   ├── abi/
│   │   └── TabGroupWallet.json
│   ├── CONTRACT_INTERFACE.md
│   └── deployment.json
├── web/                    # Frontend, when initialized
├── hardhat.config.ts
├── package.json
├── package-lock.json
├── .env.example
├── .gitignore
└── README.md
```

The directory listing describes the intended organization. Keep the actual paths consistent with the files present in the repository.

## Getting Started

### Prerequisites

Install the following:

- Node.js and npm.
- Git.
- A compatible Web3 wallet, such as MetaMask.
- A Monad testnet RPC connection for blockchain deployment and interaction.

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd TAB
```

Replace the placeholder with the actual GitHub repository URL.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example environment file:

```bash
cp .env.example .env
```

On Windows, you can copy `.env.example` to `.env` using File Explorer or PowerShell.

Fill in the values required by the project's configuration. For example:

```dotenv
MONAD_TESTNET_RPC_URL=https://testnet-rpc.monad.xyz
PRIVATE_KEY=your_testnet_deployer_private_key
MONAD_EXPLORER_API_KEY=
LOCALHOST_RPC_URL=http://127.0.0.1:8545
REPORT_GAS=false
```

Use the exact variable names expected by `hardhat.config.ts`.

**Security:** Never commit `.env`, private keys, wallet seed phrases, or other secrets. Use a dedicated development wallet funded only with testnet assets.

### 4. Compile the smart contracts

```bash
npx hardhat compile
```

This checks that the Solidity contracts compile successfully.

### 5. Run the tests

```bash
npx hardhat test
```

Tests should cover group creation, membership permissions, expense recording, approvals, balance calculations, settlement generation, and settlement execution.

A successful compilation does not guarantee that all tests pass. Check the test output before proceeding.

## Deployment

TAB is intended to run on Monad Testnet during development and demonstration.

Before deploying:

1. Confirm that the Monad testnet configuration in `hardhat.config.ts` is correct.
2. Configure the RPC URL and deployment wallet in `.env`.
3. Ensure the deployment wallet has sufficient testnet MON for gas.
4. Compile the contracts and run the tests.
5. Execute the deployment script using the network name defined in `hardhat.config.ts`.

For example, if the configured network is named `monadTestnet`:

```bash
npx hardhat run scripts/deploy.ts --network monadTestnet
```

Use the actual configured network name if it differs.

After deployment:

- Record the actual deployed contract address.
- Export the ABI if required:

```bash
npx hardhat run scripts/export-abi.ts
```

- Update the deployment configuration consumed by the frontend.
- Verify that the frontend uses the correct network, contract address, and ABI.

Deployment is complete only after the contract has been successfully deployed and the resulting address has been verified.

## Settlement Algorithm

The settlement algorithm operates on the net balances of group members.

1. Calculate each member's net balance.
2. Separate members who need to pay from members who need to receive money.
3. Match debtors with creditors.
4. Generate transfers that reduce the outstanding balances.
5. Validate and execute the resulting settlement according to the contract's rules.

The goal is to reduce the number of transfers compared with settling every debt separately.

The precise minimum-transfer problem can be computationally expensive for larger groups. A greedy matching algorithm can produce a valid, efficient settlement, but it does not guarantee the globally minimum number of transfers in every case.

## Testing Strategy

TAB's testing strategy should include:

- Group creation and member registration.
- Access control and authorization.
- Expense creation and participant validation.
- Approval requirements and duplicate approval prevention.
- Correct balance updates across multiple expenses.
- Settlement calculation and transfer validation.
- Double-settlement prevention.
- Invalid inputs and rounding edge cases.
- Failed transactions and relevant security scenarios.

Run the test suite before committing changes or deploying new contract versions.

## Development Workflow

For a team working on TAB:

- **Blockchain engineer:** Owns Solidity contracts, settlement logic, tests, deployment scripts, and ABI generation.
- **Frontend engineer:** Owns the UI, wallet connection, group dashboard, expense forms, and blockchain integration.

Both contributors should coordinate changes to shared interface documentation, ABI files, package configuration, and deployment configuration.

Use descriptive conventional commit messages, for example:

```bash
git add .
git commit -m "feat(contracts): implement group expense tracking"
```

Follow the team's agreed branch and pull-request workflow. Do not commit generated secrets or overwrite another contributor's changes.

## Current Project Status

TAB is being developed as a hackathon MVP.

The intended milestones are:

- [x] Initial blockchain project configuration
- [x] Core group-wallet and settlement contract implementation
- [x] Initial contract tests and deployment tooling
- [x] Confirm all compilation and test results
- [ ] Deploy and verify contracts on Monad Testnet
- [ ] Complete frontend and wallet integration
- [ ] Test the end-to-end five-friend demonstration

Update the checklist as each milestone is verified. A checked implementation milestone does not, by itself, establish that the feature has been deployed or tested successfully.

## Future Improvements

Potential extensions include:

- Custom expense-splitting ratios.
- Multiple supported payment assets.
- Improved settlement optimization.
- Richer expense history and notifications.
- Group invitations and recurring expenses.
- Additional security reviews and automated testing.

## Contributing

Contributions are welcome. Before proposing changes, coordinate with the team, follow the repository's coding conventions, add tests for new functionality, and document any changes to the contract interface.

## License

Add the license selected by the project maintainers before distributing the project publicly.

---

**TAB — Spend together. Track transparently. Settle smarter.**
