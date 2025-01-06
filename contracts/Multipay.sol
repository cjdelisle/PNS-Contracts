// SPDX-License-Identifier: MIT OR Apache-2

pragma solidity ^0.8.24;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/interfaces/IERC721.sol";

import "./interface/IAssign.sol";
import "./interface/IYieldVault.sol";

contract Multipay {
    struct Payout {
        address recipient;
        uint256 amount;
    }
    function multipay(IERC20 token, address from, Payout[] calldata payouts) public {
        uint256 total = 0;
        for (uint i = 0; i < payouts.length; i++) {
            require(token.transferFrom(from, payouts[i].recipient, payouts[i].amount),
                "Transfer failed");
            total += payouts[i].amount;
        }
        require(from == msg.sender || token.allowance(from, msg.sender) >= total,
            "Not allowed to transfer from this address");
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
    struct NftSend {
        address recipient;
        uint256 nftId;
    }
    function nftSend(IERC721 nftContract, address from, NftSend[] calldata sends) public {
        bool needIndividualApprovals =
            from != msg.sender && !nftContract.isApprovedForAll(from, msg.sender);
        for (uint i = 0; i < sends.length; i++) {
            nftContract.safeTransferFrom(from, sends[i].recipient, sends[i].nftId);
            require(!needIndividualApprovals || nftContract.getApproved(sends[i].nftId) == msg.sender,
                "Not approved to transfer these NFTs");
        }
    }
    function lpComputeYields(
        IYieldVault yv,
        uint256[] calldata tokenIds
    ) public view returns (uint256[] memory available) {
        available = new uint256[](tokenIds.length);
        for (uint256 i = 0; i < tokenIds.length; i++) {
            available[i] = yv.lpComputeYields(tokenIds[i]);
        }
    }
}