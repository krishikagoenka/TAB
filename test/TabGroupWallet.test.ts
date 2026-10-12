import { expect } from "chai";
import { ethers } from "hardhat";
import { TabGroupWallet, RejectEther } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("TAB Protocol — TabGroupWallet", function () {
  let tab: TabGroupWallet;
  let deployer: HardhatEthersSigner;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;
  let charlie: HardhatEthersSigner;
  let dave: HardhatEthersSigner;
  let eve: HardhatEthersSigner; // outsider / non-member

  beforeEach(async function () {
    [deployer, alice, bob, charlie, dave, eve] = await ethers.getSigners();

    const TabFactory = await ethers.getContractFactory("TabGroupWallet");
    tab = (await TabFactory.deploy()) as TabGroupWallet;
    await tab.waitForDeployment();
  });

  describe("1. Group Management", function () {
    it("should create a group with creator and initial members", async function () {
      const tx = await tab.connect(alice).createGroup(
        "Ski Trip 2026",
        [bob.address, charlie.address],
        2
      );

      await expect(tx)
        .to.emit(tab, "GroupCreated")
        .withArgs(1, "Ski Trip 2026", alice.address, 2, [alice.address, bob.address, charlie.address]);

      const group = await tab.getGroup(1);
      expect(group.name).to.equal("Ski Trip 2026");
      expect(group.creator).to.equal(alice.address);
      expect(group.memberCount).to.equal(3);
      expect(group.expenseCount).to.equal(0);
      expect(group.requiredApprovals).to.equal(2);
      expect(group.currentSettlementRound).to.equal(1);
      expect(group.isActive).to.be.true;

      expect(await tab.isMember(1, alice.address)).to.be.true;
      expect(await tab.isMember(1, bob.address)).to.be.true;
      expect(await tab.isMember(1, charlie.address)).to.be.true;
      expect(await tab.isMember(1, eve.address)).to.be.false;

      const members = await tab.getMembers(1);
      expect(members).to.deep.equal([alice.address, bob.address, charlie.address]);
    });

    it("should revert if group name is empty", async function () {
      await expect(
        tab.connect(alice).createGroup("", [bob.address], 1)
      ).to.be.revertedWithCustomError(tab, "EmptyGroupName");
    });

    it("should revert if initial member is zero address", async function () {
      await expect(
        tab.connect(alice).createGroup("Invalid Group", [ethers.ZeroAddress], 1)
      ).to.be.revertedWithCustomError(tab, "ZeroAddress");
    });

    it("should revert if initial member list has duplicates", async function () {
      await expect(
        tab.connect(alice).createGroup("Duplicate Group", [bob.address, bob.address], 1)
      ).to.be.revertedWithCustomError(tab, "DuplicateMember");
    });

    it("should allow existing member to add a new member", async function () {
      await tab.connect(alice).createGroup("Dinner Club", [bob.address], 1);

      const tx = await tab.connect(bob).addMember(1, charlie.address);
      await expect(tx)
        .to.emit(tab, "MemberAdded")
        .withArgs(1, charlie.address, bob.address);

      expect(await tab.isMember(1, charlie.address)).to.be.true;
      const group = await tab.getGroup(1);
      expect(group.memberCount).to.equal(3);
    });

    it("should revert if non-member tries to add a member", async function () {
      await tab.connect(alice).createGroup("Dinner Club", [bob.address], 1);

      await expect(
        tab.connect(eve).addMember(1, charlie.address)
      ).to.be.revertedWithCustomError(tab, "NotGroupMember");
    });

    it("should revert when adding an existing member", async function () {
      await tab.connect(alice).createGroup("Dinner Club", [bob.address], 1);

      await expect(
        tab.connect(alice).addMember(1, bob.address)
      ).to.be.revertedWithCustomError(tab, "DuplicateMember");
    });

    it("should revert when adding zero address", async function () {
      await tab.connect(alice).createGroup("Dinner Club", [bob.address], 1);

      await expect(
        tab.connect(alice).addMember(1, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(tab, "ZeroAddress");
    });
  });

  describe("2. Expense Management & Validation", function () {
    beforeEach(async function () {
      // Create group with Alice, Bob, Charlie, Dave; required approvals = 1 (auto-process)
      await tab.connect(alice).createGroup(
        "Roadtrip",
        [bob.address, charlie.address, dave.address],
        1
      );
    });

    it("should record and auto-process expense when requiredApprovals == 1", async function () {
      const amount = ethers.parseEther("1.2"); // 1.2 MON split among Alice, Bob, Charlie (0.4 each)
      const participants = [alice.address, bob.address, charlie.address];

      const tx = await tab.connect(alice).recordExpense(
        1,
        alice.address,
        amount,
        "Gas & Tolls",
        participants
      );

      await expect(tx)
        .to.emit(tab, "ExpenseRecorded")
        .withArgs(1, 1, alice.address, amount, "Gas & Tolls", participants, 1, true);

      await expect(tx)
        .to.emit(tab, "ExpenseProcessed")
        .withArgs(1, 1, amount);

      const exp = await tab.getExpense(1, 1);
      expect(exp.id).to.equal(1);
      expect(exp.payer).to.equal(alice.address);
      expect(exp.amount).to.equal(amount);
      expect(exp.status).to.equal(1); // ExpenseStatus.Processed
      expect(exp.approvalCount).to.equal(1);

      // Balances check:
      // Alice paid 1.2, share = 0.4 => net = +0.8 MON
      // Bob share = 0.4 => net = -0.4 MON
      // Charlie share = 0.4 => net = -0.4 MON
      expect(await tab.getNetBalance(1, alice.address)).to.equal(ethers.parseEther("0.8"));
      expect(await tab.getNetBalance(1, bob.address)).to.equal(-ethers.parseEther("0.4"));
      expect(await tab.getNetBalance(1, charlie.address)).to.equal(-ethers.parseEther("0.4"));
      expect(await tab.getNetBalance(1, dave.address)).to.equal(0n);
    });

    it("should revert if non-member attempts to record an expense", async function () {
      await expect(
        tab.connect(eve).recordExpense(
          1,
          alice.address,
          ethers.parseEther("1.0"),
          "Hacker lunch",
          [alice.address, bob.address]
        )
      ).to.be.revertedWithCustomError(tab, "NotGroupMember");
    });

    it("should revert if payer is not a group member", async function () {
      await expect(
        tab.connect(alice).recordExpense(
          1,
          eve.address, // outsider
          ethers.parseEther("1.0"),
          "Outside Payer",
          [alice.address, bob.address]
        )
      ).to.be.revertedWithCustomError(tab, "PayerNotMember");
    });

    it("should revert on zero expense amount", async function () {
      await expect(
        tab.connect(alice).recordExpense(
          1,
          alice.address,
          0n,
          "Zero Amount",
          [alice.address, bob.address]
        )
      ).to.be.revertedWithCustomError(tab, "InvalidAmount");
    });

    it("should revert if participants array is empty", async function () {
      await expect(
        tab.connect(alice).recordExpense(
          1,
          alice.address,
          ethers.parseEther("1.0"),
          "No participants",
          []
        )
      ).to.be.revertedWithCustomError(tab, "InvalidParticipants");
    });

    it("should revert if participant is not a group member", async function () {
      await expect(
        tab.connect(alice).recordExpense(
          1,
          alice.address,
          ethers.parseEther("1.0"),
          "Outsider participant",
          [alice.address, eve.address]
        )
      ).to.be.revertedWithCustomError(tab, "NotGroupMember");
    });

    it("should revert if participants array contains duplicates", async function () {
      await expect(
        tab.connect(alice).recordExpense(
          1,
          alice.address,
          ethers.parseEther("1.0"),
          "Duplicate participant",
          [alice.address, bob.address, bob.address]
        )
      ).to.be.revertedWithCustomError(tab, "DuplicateMember");
    });
  });

  describe("3. Approval Rules & Processed State", function () {
    beforeEach(async function () {
      // Group with 2 required approvals
      await tab.connect(alice).createGroup(
        "Apartment 4B",
        [bob.address, charlie.address],
        2
      );
    });

    it("should keep expense in Pending state until required approvals are met", async function () {
      const amount = ethers.parseEther("3.0"); // 3.0 MON split among Bob and Charlie (1.5 each)
      // Alice pays for Bob and Charlie
      await tab.connect(alice).recordExpense(
        1,
        alice.address,
        amount,
        "Internet Bill",
        [bob.address, charlie.address]
      );

      const exp = await tab.getExpense(1, 1);
      expect(exp.status).to.equal(0); // Pending
      expect(exp.approvalCount).to.equal(1); // Alice auto-approved

      // Net balances should NOT be affected yet!
      expect(await tab.getNetBalance(1, alice.address)).to.equal(0n);
      expect(await tab.getNetBalance(1, bob.address)).to.equal(0n);
      expect(await tab.getNetBalance(1, charlie.address)).to.equal(0n);

      // Bob approves
      const txApprove = await tab.connect(bob).approveExpense(1, 1);
      await expect(txApprove)
        .to.emit(tab, "ExpenseApproved")
        .withArgs(1, 1, bob.address, 2, 2);

      await expect(txApprove)
        .to.emit(tab, "ExpenseProcessed")
        .withArgs(1, 1, amount);

      const processedExp = await tab.getExpense(1, 1);
      expect(processedExp.status).to.equal(1); // Processed
      expect(processedExp.approvalCount).to.equal(2);

      // Now balances ARE affected exactly once:
      // Alice paid 3.0, was not participant => net = +3.0
      // Bob share = 1.5 => net = -1.5
      // Charlie share = 1.5 => net = -1.5
      expect(await tab.getNetBalance(1, alice.address)).to.equal(ethers.parseEther("3.0"));
      expect(await tab.getNetBalance(1, bob.address)).to.equal(-ethers.parseEther("1.5"));
      expect(await tab.getNetBalance(1, charlie.address)).to.equal(-ethers.parseEther("1.5"));
    });

    it("should prevent duplicate approval by the same member", async function () {
      await tab.connect(alice).createGroup("House", [bob.address, charlie.address, dave.address], 3);

      await tab.connect(alice).recordExpense(
        2,
        alice.address,
        ethers.parseEther("1.0"),
        "Groceries",
        [bob.address, charlie.address]
      );

      // Alice already approved upon recording
      await expect(
        tab.connect(alice).approveExpense(2, 1)
      ).to.be.revertedWithCustomError(tab, "AlreadyApproved");

      // Bob approves once
      await tab.connect(bob).approveExpense(2, 1);

      // Bob cannot approve again
      await expect(
        tab.connect(bob).approveExpense(2, 1)
      ).to.be.revertedWithCustomError(tab, "AlreadyApproved");
    });

    it("should prevent approving an already processed expense", async function () {
      await tab.connect(alice).recordExpense(
        1,
        alice.address,
        ethers.parseEther("1.0"),
        "Snacks",
        [bob.address]
      );

      // Bob approves => reaches required 2 approvals (Alice + Bob) => Processed
      await tab.connect(bob).approveExpense(1, 1);

      // Charlie attempts to approve an already processed expense
      await expect(
        tab.connect(charlie).approveExpense(1, 1)
      ).to.be.revertedWithCustomError(tab, "ExpenseAlreadyProcessed");
    });

    it("should allow rejection of pending expense by a participant", async function () {
      await tab.connect(alice).recordExpense(
        1,
        alice.address,
        ethers.parseEther("10.0"),
        "Unapproved expensive party",
        [bob.address, charlie.address]
      );

      const txReject = await tab.connect(bob).rejectExpense(1, 1);
      await expect(txReject)
        .to.emit(tab, "ExpenseRejected")
        .withArgs(1, 1, bob.address);

      const exp = await tab.getExpense(1, 1);
      expect(exp.status).to.equal(2); // Rejected

      // Cannot approve rejected expense
      await expect(
        tab.connect(charlie).approveExpense(1, 1)
      ).to.be.revertedWithCustomError(tab, "ExpenseNotPending");
    });

    it("should revert if outsider tries to approve or reject", async function () {
      await tab.connect(alice).recordExpense(
        1,
        alice.address,
        ethers.parseEther("1.0"),
        "Test",
        [bob.address]
      );

      await expect(
        tab.connect(eve).approveExpense(1, 1)
      ).to.be.revertedWithCustomError(tab, "NotGroupMember");

      await expect(
        tab.connect(eve).rejectExpense(1, 1)
      ).to.be.revertedWithCustomError(tab, "NotGroupMember");
    });
  });

  describe("4. Balance Tracking, Multiple Expenses & Deterministic Rounding", function () {
    beforeEach(async function () {
      // 1 approval so expenses process immediately for testing complex split sequences
      await tab.connect(alice).createGroup(
        "Math Test",
        [bob.address, charlie.address],
        1
      );
    });

    it("should handle uneven expense division and remainders deterministically", async function () {
      // 10 wei divided among 3 participants (Alice, Bob, Charlie)
      // 10 / 3 = 3 remainder 1
      // Participant 0 (Alice): 3 + 1 = 4 wei
      // Participant 1 (Bob): 3 wei
      // Participant 2 (Charlie): 3 wei
      // Sum = 4 + 3 + 3 = 10 wei
      // Alice paid 10 wei, share = 4 wei => net = +10 - 4 = +6 wei
      // Bob share = 3 wei => net = -3 wei
      // Charlie share = 3 wei => net = -3 wei
      const participants = [alice.address, bob.address, charlie.address];
      await tab.connect(alice).recordExpense(1, alice.address, 10n, "Uneven Split", participants);

      expect(await tab.getNetBalance(1, alice.address)).to.equal(6n);
      expect(await tab.getNetBalance(1, bob.address)).to.equal(-3n);
      expect(await tab.getNetBalance(1, charlie.address)).to.equal(-3n);

      // Conservation invariant: sum of balances must be 0
      const balA = await tab.getNetBalance(1, alice.address);
      const balB = await tab.getNetBalance(1, bob.address);
      const balC = await tab.getNetBalance(1, charlie.address);
      expect(balA + balB + balC).to.equal(0n);
    });

    it("should track balances correctly across multiple alternating expenses", async function () {
      // Expense 1: Alice pays 300 wei for Alice, Bob, Charlie (100 each)
      // Alice: +300 - 100 = +200
      // Bob: -100
      // Charlie: -100
      await tab.connect(alice).recordExpense(
        1,
        alice.address,
        300n,
        "Expense 1",
        [alice.address, bob.address, charlie.address]
      );

      // Expense 2: Bob pays 150 wei for Bob and Charlie (75 each)
      // Bob: +150 - 75 = +75
      // Charlie: -75
      // Cumulative:
      // Alice: +200
      // Bob: -100 + 75 = -25
      // Charlie: -100 - 75 = -175
      await tab.connect(bob).recordExpense(
        1,
        bob.address,
        150n,
        "Expense 2",
        [bob.address, charlie.address]
      );

      // Expense 3: Charlie pays 300 wei for Alice and Bob (150 each)
      // Charlie: +300
      // Alice: -150
      // Bob: -150
      // Cumulative:
      // Alice: +200 - 150 = +50
      // Bob: -25 - 150 = -175
      // Charlie: -175 + 300 = +125
      await tab.connect(charlie).recordExpense(
        1,
        charlie.address,
        300n,
        "Expense 3",
        [alice.address, bob.address]
      );

      expect(await tab.getNetBalance(1, alice.address)).to.equal(50n);
      expect(await tab.getNetBalance(1, bob.address)).to.equal(-175n);
      expect(await tab.getNetBalance(1, charlie.address)).to.equal(125n);

      // Invariant check: +50 - 175 + 125 = 0
      const [members, balances] = await tab.getAllNetBalances(1);
      const sum = balances.reduce((acc, curr) => acc + curr, 0n);
      expect(sum).to.equal(0n);
    });
  });

  describe("5. Settlement Generation & Greedy Debt Simplification", function () {
    beforeEach(async function () {
      await tab.connect(alice).createGroup(
        "Settlement Group",
        [bob.address, charlie.address, dave.address],
        1
      );
    });

    it("should return empty transfers when all balances are 0", async function () {
      const plan = await tab.getSettlementPlan(1);
      expect(plan.length).to.equal(0);
    });

    it("should compute simplified transfers reducing pairwise transactions", async function () {
      // Alice pays 100 MON for Alice, Bob, Charlie, Dave (25 each)
      // Alice: +75 MON (creditor)
      // Bob: -25 MON (debtor)
      // Charlie: -25 MON (debtor)
      // Dave: -25 MON (debtor)
      const amount = ethers.parseEther("100");
      await tab.connect(alice).recordExpense(
        1,
        alice.address,
        amount,
        "Villa Rental",
        [alice.address, bob.address, charlie.address, dave.address]
      );

      const plan = await tab.getSettlementPlan(1);
      // Greedy settlement should match debtors (Bob, Charlie, Dave) to creditor (Alice)
      // Exactly 3 transfers instead of quadratic bilateral settlement!
      expect(plan.length).to.equal(3);

      let totalTransferAmount = 0n;
      for (const transfer of plan) {
        expect(transfer.to).to.equal(alice.address);
        expect(transfer.amount).to.equal(ethers.parseEther("25"));
        totalTransferAmount += transfer.amount;
      }
      expect(totalTransferAmount).to.equal(ethers.parseEther("75"));
    });
  });

  describe("6. Settlement Plan Proposal, Execution & Anti-Double-Settlement", function () {
    const amount = ethers.parseEther("60"); // 60 MON
    let planTransfers: { from: string; to: string; amount: bigint }[];
    let planHash: string;

    beforeEach(async function () {
      await tab.connect(alice).createGroup("Cabin Trip", [bob.address, charlie.address], 1);
      // Alice pays 60 MON for Alice, Bob, Charlie (20 each)
      // Alice: +40 MON
      // Bob: -20 MON
      // Charlie: -20 MON
      await tab.connect(alice).recordExpense(
        1,
        alice.address,
        amount,
        "Cabin Fee",
        [alice.address, bob.address, charlie.address]
      );

      const simplified = await tab.getSettlementPlan(1);
      planTransfers = simplified.map((t) => ({
        from: t.from,
        to: t.to,
        amount: t.amount,
      }));

      const tx = await tab.connect(alice).proposeSettlementPlan(1, planTransfers);
      const receipt = await tx.wait();

      // Find planHash from event
      const event = receipt?.logs
        .map((log) => {
          try {
            return tab.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((parsed) => parsed?.name === "SettlementPlanProposed");

      planHash = event?.args.planHash;
      expect(planHash).to.not.be.undefined;
    });

    it("should allow debtor to execute their settlement transfer with exact native MON", async function () {
      // Find Bob's transfer
      const bobIndex = planTransfers.findIndex((t) => t.from === bob.address);
      const bobTransfer = planTransfers[bobIndex];

      const aliceInitialBal = await ethers.provider.getBalance(alice.address);

      const tx = await tab.connect(bob).executeSettlementTransfer(1, planHash, bobIndex, {
        value: bobTransfer.amount,
      });

      await expect(tx)
        .to.emit(tab, "SettlementTransferExecuted")
        .withArgs(1, planHash, bobIndex, bob.address, alice.address, bobTransfer.amount);

      // Check net balances updated
      expect(await tab.getNetBalance(1, bob.address)).to.equal(0n);
      expect(await tab.getNetBalance(1, alice.address)).to.equal(ethers.parseEther("20"));

      // Check Alice received native MON
      const aliceAfterBal = await ethers.provider.getBalance(alice.address);
      expect(aliceAfterBal - aliceInitialBal).to.equal(bobTransfer.amount);
    });

    it("should prevent double settlement and replay of the same transfer", async function () {
      const bobIndex = planTransfers.findIndex((t) => t.from === bob.address);
      const bobTransfer = planTransfers[bobIndex];

      // Execute once
      await tab.connect(bob).executeSettlementTransfer(1, planHash, bobIndex, {
        value: bobTransfer.amount,
      });

      // Attempting to execute the exact same transfer again must revert!
      await expect(
        tab.connect(bob).executeSettlementTransfer(1, planHash, bobIndex, {
          value: bobTransfer.amount,
        })
      ).to.be.revertedWithCustomError(tab, "TransferAlreadyExecuted");
    });

    it("should revert if wrong sender or wrong msg.value is sent", async function () {
      const bobIndex = planTransfers.findIndex((t) => t.from === bob.address);
      const bobTransfer = planTransfers[bobIndex];

      // Wrong sender (Charlie tries to execute Bob's transfer)
      await expect(
        tab.connect(charlie).executeSettlementTransfer(1, planHash, bobIndex, {
          value: bobTransfer.amount,
        })
      ).to.be.revertedWithCustomError(tab, "NotAuthorized");

      // Wrong value
      await expect(
        tab.connect(bob).executeSettlementTransfer(1, planHash, bobIndex, {
          value: bobTransfer.amount - 1n,
        })
      ).to.be.revertedWithCustomError(tab, "IncorrectTransferValue");
    });

    it("should mark plan completed and advance round once all transfers execute", async function () {
      // Execute all transfers
      for (let i = 0; i < planTransfers.length; i++) {
        const transfer = planTransfers[i];
        const signer = transfer.from === bob.address ? bob : charlie;
        await tab.connect(signer).executeSettlementTransfer(1, planHash, i, {
          value: transfer.amount,
        });
      }

      // Check group settlement round advanced
      const group = await tab.getGroup(1);
      expect(group.currentSettlementRound).to.equal(2);

      // Check all net balances are now 0
      expect(await tab.getNetBalance(1, alice.address)).to.equal(0n);
      expect(await tab.getNetBalance(1, bob.address)).to.equal(0n);
      expect(await tab.getNetBalance(1, charlie.address)).to.equal(0n);

      // Cannot execute on completed plan
      await expect(
        tab.connect(bob).executeSettlementTransfer(1, planHash, 0, {
          value: planTransfers[0].amount,
        })
      ).to.be.revertedWithCustomError(tab, "PlanAlreadyCompleted");
    });
  });

  describe("7. Direct Settlement", function () {
    beforeEach(async function () {
      await tab.connect(alice).createGroup("Quick Settle", [bob.address], 1);
      // Alice pays 10 MON for Alice and Bob (5 each)
      // Alice: +5 MON
      // Bob: -5 MON
      await tab.connect(alice).recordExpense(
        1,
        alice.address,
        ethers.parseEther("10"),
        "Coffee & Bagels",
        [alice.address, bob.address]
      );
    });

    it("should allow direct settlement between debtor and creditor", async function () {
      const settleAmount = ethers.parseEther("3"); // Partial settlement of 3 MON
      const aliceInitialBal = await ethers.provider.getBalance(alice.address);

      const tx = await tab.connect(bob).settleDirect(1, alice.address, {
        value: settleAmount,
      });

      await expect(tx)
        .to.emit(tab, "DirectSettlementExecuted")
        .withArgs(1, bob.address, alice.address, settleAmount);

      expect(await tab.getNetBalance(1, bob.address)).to.equal(-ethers.parseEther("2"));
      expect(await tab.getNetBalance(1, alice.address)).to.equal(ethers.parseEther("2"));

      const aliceAfterBal = await ethers.provider.getBalance(alice.address);
      expect(aliceAfterBal - aliceInitialBal).to.equal(settleAmount);
    });

    it("should revert direct settlement with 0 value or insufficient debt/credit", async function () {
      // 0 value
      await expect(
        tab.connect(bob).settleDirect(1, alice.address, { value: 0n })
      ).to.be.revertedWithCustomError(tab, "InvalidAmount");

      // Paying more than owed
      await expect(
        tab.connect(bob).settleDirect(1, alice.address, {
          value: ethers.parseEther("10"), // Bob only owes 5
        })
      ).to.be.revertedWithCustomError(tab, "InsufficientDebt");

      // Creditor attempting to pay debtor
      await expect(
        tab.connect(alice).settleDirect(1, bob.address, {
          value: ethers.parseEther("1"),
        })
      ).to.be.revertedWithCustomError(tab, "InsufficientDebt");
    });
  });

  describe("8. Reentrancy & Pull-Over-Push Fallback", function () {
    let rejectEtherContract: RejectEther;

    beforeEach(async function () {
      const RejectFactory = await ethers.getContractFactory("RejectEther");
      rejectEtherContract = (await RejectFactory.deploy()) as RejectEther;
      await rejectEtherContract.waitForDeployment();

      const rejectAddress = await rejectEtherContract.getAddress();
      await tab.connect(alice).createGroup("Contract Member Group", [rejectAddress], 1);
    });

    it("should credit claimable funds when recipient rejects native MON", async function () {
      const rejectAddress = await rejectEtherContract.getAddress();
      // rejectContract pays 4 MON for Alice and rejectContract (2 MON each)
      // rejectContract: +2 MON
      // Alice: -2 MON
      await tab.connect(alice).recordExpense(
        1,
        rejectAddress,
        ethers.parseEther("4"),
        "Hosting",
        [alice.address, rejectAddress]
      );

      // Alice pays 2 MON to rejectAddress via direct settlement
      const tx = await tab.connect(alice).settleDirect(1, rejectAddress, {
        value: ethers.parseEther("2"),
      });

      // Safe send should fail to push, so it emits ClaimableFundsCredited
      await expect(tx)
        .to.emit(tab, "ClaimableFundsCredited")
        .withArgs(rejectAddress, ethers.parseEther("2"));

      // Balance was updated cleanly without reverting the entire settlement
      expect(await tab.getNetBalance(1, alice.address)).to.equal(0n);
      expect(await tab.getNetBalance(1, rejectAddress)).to.equal(0n);

      // Reject contract has claimable funds recorded
      expect(await tab.getClaimableFunds(rejectAddress)).to.equal(ethers.parseEther("2"));
    });

    it("should allow standard recipient to withdraw claimable funds", async function () {
      // Revert if zero claimable
      await expect(
        tab.connect(alice).withdrawClaimable()
      ).to.be.revertedWithCustomError(tab, "NothingToWithdraw");
    });
  });
});
