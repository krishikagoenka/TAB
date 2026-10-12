// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title RejectEther
 * @notice Mock contract that rejects incoming native MON to test pull-over-push escrow fallback.
 */
contract RejectEther {
    // Reverts on any incoming native transfer
    receive() external payable {
        revert("RejectEther: cannot accept MON");
    }

    fallback() external payable {
        revert("RejectEther: fallback rejected");
    }
}
