// SPDX-License-Identifier: UNLICENSED
// @review
pragma solidity ^0.8.0;

import { WalletFactory } from "scw-contracts-v1.0.1/contracts/smart-contract-wallet/WalletFactory.sol";
import { SmartWallet } from "scw-contracts-v1.0.1/contracts/smart-contract-wallet/SmartWallet.sol";
import { MultiSend } from "scw-contracts-v1.0.1/contracts/smart-contract-wallet/libs/MultiSend.sol";
import { MultiSendCallOnly } from "scw-contracts-v1.0.1/contracts/smart-contract-wallet/libs/MultiSendCallOnly.sol";
import { EntryPoint } from "scw-contracts-v1.0.1/contracts/references/aa-4337/EntryPoint.sol";

contract SmartWalletFactoryContract_v1_0_1 is WalletFactory {
    constructor(address _defaultImpl) WalletFactory(_defaultImpl){}
}
contract SmartWalletContract_v1_0_1 is SmartWallet {}
contract MultiSendContract_v1_0_1 is MultiSend {}
contract MultiSendCallOnlyContract_v1_0_1 is MultiSendCallOnly {}
contract EntryPointContract_v1_0_1 is EntryPoint {
    constructor(address _create2factory, uint _paymasterStake, uint32 _unstakeDelaySec) EntryPoint(_create2factory, _paymasterStake, _unstakeDelaySec){}
}

