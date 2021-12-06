# Solidity Game - Motorbike Attack

_Inspired by OpenZeppelin's [Ethernaut](https://ethernaut.openzeppelin.com), Motorbike Level_

⚠️Do not try on mainnet!

## Task

**`Motorbike`** has a brand new upgradeable engine design.

Would you be able to `selfdestruct` its engine and make the motorbike unusable?

_Hint:_

1. [EIP-1967](https://eips.ethereum.org/EIPS/eip-1967)
2. [UUPS](https://forum.openzeppelin.com/t/uups-proxies-tutorial-solidity-javascript/7786) upgradeable pattern
3. [Initializable](https://github.com/OpenZeppelin/openzeppelin-upgrades/blob/master/packages/core/contracts/Initializable.sol) contract

## Solution 🤔

Through the previous games, now you have enough knowledge about:
- `delegatecall`
- proxy and implementation
- storage layout

In that sense, this game is easy enough for you.
Just read EIP-1967, and understand where they saved the address of logic implementation.

Then, you should realize that `Engine` contract itself is vulnerable, and all you have to do is find the address of it.

No more!

Here are the previous games useful to solve this game:
- `delegatecall` - [Delegation](https://github.com/maAPPsDEV/delegation-attack)
- reading contract storage - [Vault](https://github.com/maAPPsDEV/vault-attack), [Privacy](https://github.com/maAPPsDEV/privacy-attack)
- proxy pattern - [PuzzleWallet](https://github.com/maAPPsDEV/puzzle-wallet-attack)

## Source Code

⚠️This contract contains a bug or risk. Do not use on mainnet!

```solidity
// SPDX-License-Identifier: MIT

pragma solidity <0.7.0;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/proxy/Initializable.sol";

contract Motorbike {
    // keccak-256 hash of "eip1967.proxy.implementation" subtracted by 1
    bytes32 internal constant _IMPLEMENTATION_SLOT = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
    
    struct AddressSlot {
        address value;
    }
    
    // Initializes the upgradeable proxy with an initial implementation specified by `_logic`.
    constructor(address _logic) public {
        require(Address.isContract(_logic), "ERC1967: new implementation is not a contract");
        _getAddressSlot(_IMPLEMENTATION_SLOT).value = _logic;
        (bool success,) = _logic.delegatecall(
            abi.encodeWithSignature("initialize()")
        );
        require(success, "Call failed");
    }

    // Delegates the current call to `implementation`.
    function _delegate(address implementation) internal virtual {
        // solhint-disable-next-line no-inline-assembly
        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), implementation, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())
            switch result
            case 0 { revert(0, returndatasize()) }
            default { return(0, returndatasize()) }
        }
    }

    // Fallback function that delegates calls to the address returned by `_implementation()`. 
    // Will run if no other function in the contract matches the call data
    fallback () external payable virtual {
        _delegate(_getAddressSlot(_IMPLEMENTATION_SLOT).value);
    }
    
    // Returns an `AddressSlot` with member `value` located at `slot`.
    function _getAddressSlot(bytes32 slot) internal pure returns (AddressSlot storage r) {
        assembly {
            r_slot := slot
        }
    }
}

contract Engine is Initializable {
    // keccak-256 hash of "eip1967.proxy.implementation" subtracted by 1
    bytes32 internal constant _IMPLEMENTATION_SLOT = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;

    address public upgrader;
    uint256 public horsePower;

    struct AddressSlot {
        address value;
    }

    function initialize() external initializer {
        horsePower = 1000;
        upgrader = msg.sender;
    }

    // Upgrade the implementation of the proxy to `newImplementation`
    // subsequently execute the function call
    function upgradeToAndCall(address newImplementation, bytes memory data) external payable {
        _authorizeUpgrade();
        _upgradeToAndCall(newImplementation, data);
    }

    // Restrict to upgrader role
    function _authorizeUpgrade() internal view {
        require(msg.sender == upgrader, "Can't upgrade");
    }

    // Perform implementation upgrade with security checks for UUPS proxies, and additional setup call.
    function _upgradeToAndCall(
        address newImplementation,
        bytes memory data
    ) internal {
        // Initial upgrade and setup call
        _setImplementation(newImplementation);
        if (data.length > 0) {
            (bool success,) = newImplementation.delegatecall(data);
            require(success, "Call failed");
        }
    }
    
    // Stores a new address in the EIP1967 implementation slot.
    function _setImplementation(address newImplementation) private {
        require(Address.isContract(newImplementation), "ERC1967: new implementation is not a contract");
        
        AddressSlot storage r;
        assembly {
            r_slot := _IMPLEMENTATION_SLOT
        }
        r.value = newImplementation;
    }
}

```

## Configuration

### Install Dependencies

```
yarn install
```

## Test and Attack!💥

### Run Tests

```
yarn test
```

You should see the result like following:

```

  Hacker
Hacker contract deployed at 0x8464135c8F25Da09e49BC8782676a84730C318bC
Engine deployed at 0x5FbDB2315678afecb367f032d93F642f64180aa3
Motorbike deployed at 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
deployer 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
hacker 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
    √ should validate Motorbike is working
retrieved address slot value 0x0000000000000000000000005fbdb2315678afecb367f032d93f642f64180aa3
decoded Engine address 0x5fbdb2315678afecb367f032d93f642f64180aa3
initialize() was successful
fake Engine address 0x8398bcd4f633c72939f9043db78c574a91c99c0a
destorySelf has been called from 0x8464135c8f25da09e49bc8782676a84730c318bc
upgradeToAndCall() was successful
    √ should destory engine successfully
    √ should revert on any engine interactions


  3 passing (1s)

```
