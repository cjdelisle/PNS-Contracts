// SPDX-License-Identifier: MIT OR Apache-2

pragma solidity ^0.8.24;

import "@openzeppelin/contracts/interfaces/IERC20.sol";

import "./interface/IAssign.sol";

contract Multipay {
    struct Payout {
        address recipient;
        uint256 amount;
    }
    function multipay(IERC20 token, address from, Payout[] calldata payouts) public {
        for (uint i = 0; i < payouts.length; i++) {
            require(token.transferFrom(from, payouts[i].recipient, payouts[i].amount),
                "Transfer failed");
        }
    }
    struct Registration {
        IInfra.UnitType t;
        uint64 parentDomain;
        string name;
        uint yieldCredits;
        address to;
    }
    function multireg(IAssign assignContract, Registration[] calldata regs) public {
        for (uint i = 0; i < regs.length; i++) {
            assignContract.registerAndAssign(
                regs[i].t,
                regs[i].parentDomain,
                regs[i].name,
                regs[i].yieldCredits,
                regs[i].to
            );
        }
    }
}