import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("==> Exporting ABI for shared frontend & integration...");

  const sharedAbiDir = path.join(__dirname, "..", "shared", "abi");
  if (!fs.existsSync(sharedAbiDir)) {
    fs.mkdirSync(sharedAbiDir, { recursive: true });
  }

  const contracts = ["TabGroupWallet", "ITabGroupWallet"];

  for (const contractName of contracts) {
    const artifactPath = path.join(
      __dirname,
      "..",
      "artifacts",
      "contracts",
      contractName === "ITabGroupWallet" ? "interfaces" : "",
      `${contractName}.sol`,
      `${contractName}.json`
    );

    if (fs.existsSync(artifactPath)) {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
      const targetPath = path.join(sharedAbiDir, `${contractName}.json`);
      fs.writeFileSync(targetPath, JSON.stringify(artifact.abi, null, 2));
      console.log(`[✔] Exported ABI for ${contractName} -> ${targetPath}`);
    } else {
      console.warn(`[!] Artifact not found at ${artifactPath}`);
    }
  }

  console.log("==> ABI export complete.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
