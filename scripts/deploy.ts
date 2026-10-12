import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("====================================================");
  console.log("   TAB Protocol Deployment — Monad Ecosystem        ");
  console.log("====================================================");

  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error(
      "Deployer account not configured. Please set PRIVATE_KEY in your .env file."
    );
  }

  const deployerAddress = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(deployerAddress);
  const networkName = network.name;
  const chainId = (await ethers.provider.getNetwork()).chainId;

  console.log(`Network:          ${networkName} (Chain ID: ${chainId})`);
  console.log(`Deployer Address: ${deployerAddress}`);
  console.log(`Deployer Balance: ${ethers.formatEther(balance)} MON / Native Token`);

  if (balance === 0n && networkName !== "hardhat" && networkName !== "localhost") {
    console.warn("⚠️  WARNING: Deployer has 0 balance. Deployment may fail due to insufficient gas.");
  }

  console.log("\nDeploying TabGroupWallet contract...");
  const TabFactory = await ethers.getContractFactory("TabGroupWallet");
  const tab = await TabFactory.deploy();
  await tab.waitForDeployment();

  const contractAddress = await tab.getAddress();
  const deploymentTx = tab.deploymentTransaction();

  console.log("\n[✔] TabGroupWallet deployed successfully!");
  console.log(`Contract Address: ${contractAddress}`);
  if (deploymentTx) {
    console.log(`Transaction Hash: ${deploymentTx.hash}`);
  }

  // Update shared/deployment.json
  const sharedDir = path.join(__dirname, "..", "shared");
  if (!fs.existsSync(sharedDir)) {
    fs.mkdirSync(sharedDir, { recursive: true });
  }

  const deploymentRecord = {
    network: networkName,
    chainId: Number(chainId),
    contracts: {
      TabGroupWallet: {
        address: contractAddress,
        deployer: deployerAddress,
        txHash: deploymentTx?.hash || null,
        deployedAt: new Date().toISOString(),
      },
    },
    rpcUrl: networkName === "monadTestnet" ? "https://testnet-rpc.monad.xyz" : "http://127.0.0.1:8545",
    explorerUrl:
      networkName === "monadTestnet"
        ? `https://testnet.monadexplorer.com/address/${contractAddress}`
        : null,
  };

  const deploymentPath = path.join(sharedDir, "deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentRecord, null, 2));
  console.log(`[✔] Saved deployment info to ${deploymentPath}`);

  // Automatically ensure shared/abi is exported
  const sharedAbiDir = path.join(sharedDir, "abi");
  if (!fs.existsSync(sharedAbiDir)) {
    fs.mkdirSync(sharedAbiDir, { recursive: true });
  }

  const artifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "TabGroupWallet.sol",
    "TabGroupWallet.json"
  );
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    fs.writeFileSync(
      path.join(sharedAbiDir, "TabGroupWallet.json"),
      JSON.stringify(artifact.abi, null, 2)
    );
    console.log(`[✔] Exported ABI to ${path.join(sharedAbiDir, "TabGroupWallet.json")}`);
  }

  console.log("\n====================================================");
  console.log("Deployment completed successfully.");
  console.log("====================================================");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
