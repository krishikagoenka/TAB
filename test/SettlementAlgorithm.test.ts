import { expect } from "chai";
import { ethers } from "hardhat";
import { TabGroupWallet } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("TAB Protocol — Settlement Algorithm & Edge Cases", function () {
  let tab: TabGroupWallet;
  let signers: HardhatEthersSigner[];
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;
  let charlie: HardhatEthersSigner;
  let dave: HardhatEthersSigner;
  let emma: HardhatEthersSigner;
  let frank: HardhatEthersSigner;

  beforeEach(async function () {
    signers = await ethers.getSigners();
    [alice, bob, charlie, dave, emma, frank] = signers;

    const TabFactory = await ethers.getContractFactory("TabGroupWallet");
    tab = (await TabFactory.deploy()) as TabGroupWallet;
    await tab.waitForDeployment();
  });

  it("should handle cyclic debts and simplify them down to 0 transfers", async function () {
    // Cyclic debt scenario:
    // Alice pays 100 for Bob
    // Bob pays 100 for Charlie
    // Charlie pays 100 for Alice
    // In bilateral tracking: 3 transfers (Bob -> Alice, Charlie -> Bob, Alice -> Charlie).
    // In TAB net balance tracking:
    // Alice: +100 - 100 = 0
    // Bob: -100 + 100 = 0
    // Charlie: -100 + 100 = 0
    // Simplified transfers: EXACTLY 0 transfers needed!
    await tab.connect(alice).createGroup("Cycle Group", [bob.address, charlie.address], 1);

    await tab.connect(alice).recordExpense(1, alice.address, 100n, "A for B", [bob.address]);
    await tab.connect(bob).recordExpense(1, bob.address, 100n, "B for C", [charlie.address]);
    await tab.connect(charlie).recordExpense(1, charlie.address, 100n, "C for A", [alice.address]);

    expect(await tab.getNetBalance(1, alice.address)).to.equal(0n);
    expect(await tab.getNetBalance(1, bob.address)).to.equal(0n);
    expect(await tab.getNetBalance(1, charlie.address)).to.equal(0n);

    const plan = await tab.getSettlementPlan(1);
    expect(plan.length).to.equal(0);
  });

  it("should simplify a 6-person group with complex criss-crossing expenses into at most N-1 transfers", async function () {
    const members = [bob.address, charlie.address, dave.address, emma.address, frank.address];
    await tab.connect(alice).createGroup("Large Group", members, 1);

    // Expense 1: Alice pays 500 for Bob, Charlie, Dave, Emma, Frank (100 each)
    await tab.connect(alice).recordExpense(
      1,
      alice.address,
      500n,
      "Groceries",
      [bob.address, charlie.address, dave.address, emma.address, frank.address]
    );

    // Expense 2: Bob pays 200 for Alice and Charlie (100 each)
    await tab.connect(bob).recordExpense(
      1,
      bob.address,
      200n,
      "Dinner",
      [alice.address, charlie.address]
    );

    // Expense 3: Dave pays 300 for Alice, Bob, Emma (100 each)
    await tab.connect(dave).recordExpense(
      1,
      dave.address,
      300n,
      "Activities",
      [alice.address, bob.address, emma.address]
    );

    const allMembers = [alice.address, ...members];
    const balances = await Promise.all(allMembers.map((m) => tab.getNetBalance(1, m)));

    // Sum of balances must strictly equal 0
    const sum = balances.reduce((acc, curr) => acc + curr, 0n);
    expect(sum).to.equal(0n);

    // Get simplified plan
    const plan = await tab.getSettlementPlan(1);

    // N = 6 members => maximum possible transfers in simplified plan is N - 1 = 5
    expect(plan.length).to.be.at.most(5);

    // Verify each transfer in the plan moves money from a debtor to a creditor
    for (const t of plan) {
      const fromBal = await tab.getNetBalance(1, t.from);
      const toBal = await tab.getNetBalance(1, t.to);
      expect(fromBal).to.be.lessThan(0n);
      expect(toBal).to.be.greaterThan(0n);
      expect(t.amount).to.be.greaterThan(0n);
    }

    // Verify total transfer amount matches total positive credit
    const totalCredit = balances.filter((b) => b > 0n).reduce((acc, curr) => acc + curr, 0n);
    const planTotal = plan.reduce((acc, curr) => acc + curr.amount, 0n);
    expect(planTotal).to.equal(totalCredit);
  });

  it("should handle 1-wei residual remainder distribution across multiple participants", async function () {
    // 1 wei split among 3 participants
    // 1 / 3 = 0, remainder 1
    // Participant 0 pays 1 wei, Participants 1 and 2 pay 0 wei
    await tab.connect(alice).createGroup("Micro Split", [bob.address, charlie.address], 1);

    await tab.connect(alice).recordExpense(
      1,
      alice.address,
      1n,
      "Single Wei",
      [alice.address, bob.address, charlie.address]
    );

    // Alice paid 1 wei, owed 1 wei => net 0
    expect(await tab.getNetBalance(1, alice.address)).to.equal(0n);
    expect(await tab.getNetBalance(1, bob.address)).to.equal(0n);
    expect(await tab.getNetBalance(1, charlie.address)).to.equal(0n);
  });

  it("should demonstrate greedy settlement behavior with disjoint equal balances", async function () {
    // Disjoint debts:
    // Alice owes Bob 100
    // Charlie owes Dave 100
    // Net balances:
    // Bob: +100
    // Dave: +100
    // Alice: -100
    // Charlie: -100
    // Greedy algorithm matches Alice with Bob (100) and Charlie with Dave (100) -> 2 transfers.
    // Total transfers: 2, perfectly resolving all debts.
    await tab.connect(alice).createGroup("Disjoint Group", [bob.address, charlie.address, dave.address], 1);

    await tab.connect(bob).recordExpense(1, bob.address, 100n, "Bob for Alice", [alice.address]);
    await tab.connect(dave).recordExpense(1, dave.address, 100n, "Dave for Charlie", [charlie.address]);

    const plan = await tab.getSettlementPlan(1);
    expect(plan.length).to.equal(2);
    const totalAmount = plan.reduce((acc, curr) => acc + curr.amount, 0n);
    expect(totalAmount).to.equal(200n);
  });
});
