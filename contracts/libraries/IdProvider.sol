// SPDX-License-Identifier: MIT OR Apache-2

pragma solidity ^0.8.24;

library IdProvider {
    struct Ids {
        mapping(uint => uint) freeList;
        uint nextId;
    }

    // Initialize the state for IDManager
    function init(Ids storage self) internal {
        self.nextId = 1; // Start the ID counter from 1 (or whatever number you'd like)
    }

    // Take an ID, either from the free list or by incrementing the next ID
    function take(Ids storage self) internal returns (uint id) {
        id = self.freeList[0];
        if (id > 0) {
            // Reuse an ID from the free list
            self.freeList[0] = self.freeList[id];
            delete self.freeList[id];
        } else {
            // No free IDs, use the next available ID
            id = self.nextId++;
        }
    }

    // Release an ID, adding it to the free list
    function release(Ids storage self, uint id) internal {
        uint fdid = self.freeList[0];
        if (fdid > 0) {
            self.freeList[id] = fdid;
        }
        self.freeList[0] = id;
    }
}
