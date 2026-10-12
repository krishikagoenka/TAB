// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ITabGroupWallet} from "../interfaces/ITabGroupWallet.sol";

/**
 * @title SettlementMath
 * @notice Pure math library for TAB expense splitting and greedy debt simplification.
 * @dev Explains and implements:
 * 1. Deterministic equal splitting with remainder absorption.
 * 2. Greedy bipartite matching for debt simplification.
 * 
 * ALGORITHM LIMITATIONS:
 * The greedy matching algorithm matches the current debtor with the current creditor,
 * reducing pairwise debts to at most (N - 1) transfers. While this significantly minimizes
 * transaction overhead compared to quadratic bilateral debts (N*(N-1)/2), it is a greedy heuristic.
 * Finding the absolute minimal number of cash flow transfers across all subsets is equivalent
 * to the NP-hard Subset Sum / Partition Problem. In practice, greedy simplification is optimal
 * or near-optimal for group sizes common in social, travel, and DAO expense sharing.
 */
library SettlementMath {
    struct Party {
        address member;
        uint256 amount;
    }

    /**
     * @notice Computes equal split shares and remainder.
     * @param totalAmount Total expense amount in wei.
     * @param count Number of participants sharing the expense.
     * @return baseShare The base share each participant owes.
     * @return remainder The number of participants who will pay (baseShare + 1 wei).
     */
    function splitEqually(
        uint256 totalAmount,
        uint256 count
    ) internal pure returns (uint256 baseShare, uint256 remainder) {
        require(count > 0, "Zero participants");
        baseShare = totalAmount / count;
        remainder = totalAmount % count;
    }

    /**
     * @notice Computes a simplified debt settlement plan from member balances.
     * @param members Array of group member addresses.
     * @param balances Corresponding net balances for each member.
     * @return transfers Array of simplified transfers (from debtor to creditor).
     */
    function computeGreedySettlement(
        address[] memory members,
        int256[] memory balances
    ) internal pure returns (ITabGroupWallet.DebtTransfer[] memory transfers) {
        uint256 len = members.length;
        require(len == balances.length, "Length mismatch");

        // Step 1: Count debtors and creditors
        uint256 debtorCount = 0;
        uint256 creditorCount = 0;

        for (uint256 i = 0; i < len; i++) {
            if (balances[i] < 0) {
                debtorCount++;
            } else if (balances[i] > 0) {
                creditorCount++;
            }
        }

        // If no debts exist, return empty array
        if (debtorCount == 0 || creditorCount == 0) {
            return new ITabGroupWallet.DebtTransfer[](0);
        }

        // Step 2: Populate debtors and creditors lists
        Party[] memory debtors = new Party[](debtorCount);
        Party[] memory creditors = new Party[](creditorCount);

        uint256 dIdx = 0;
        uint256 cIdx = 0;

        for (uint256 i = 0; i < len; i++) {
            if (balances[i] < 0) {
                debtors[dIdx++] = Party({
                    member: members[i],
                    amount: uint256(-balances[i])
                });
            } else if (balances[i] > 0) {
                creditors[cIdx++] = Party({
                    member: members[i],
                    amount: uint256(balances[i])
                });
            }
        }

        // Step 3: Greedy bipartite settlement
        // Max possible transfers is debtorCount + creditorCount
        ITabGroupWallet.DebtTransfer[] memory tempTransfers =
            new ITabGroupWallet.DebtTransfer[](debtorCount + creditorCount);
        uint256 transferCount = 0;

        uint256 d = 0;
        uint256 c = 0;

        while (d < debtorCount && c < creditorCount) {
            uint256 settleAmount = debtors[d].amount < creditors[c].amount
                ? debtors[d].amount
                : creditors[c].amount;

            if (settleAmount > 0) {
                tempTransfers[transferCount++] = ITabGroupWallet.DebtTransfer({
                    from: debtors[d].member,
                    to: creditors[c].member,
                    amount: settleAmount
                });

                debtors[d].amount -= settleAmount;
                creditors[c].amount -= settleAmount;
            }

            if (debtors[d].amount == 0) {
                d++;
            }
            if (creditors[c].amount == 0) {
                c++;
            }
        }

        // Step 4: Copy to exact sized memory array
        transfers = new ITabGroupWallet.DebtTransfer[](transferCount);
        for (uint256 i = 0; i < transferCount; i++) {
            transfers[i] = tempTransfers[i];
        }
    }
}
