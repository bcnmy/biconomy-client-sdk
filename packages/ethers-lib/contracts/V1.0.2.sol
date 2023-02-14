// SPDX-License-Identifier: UNLICENSED
// @review
pragma solidity ^0.8.0;

import { SmartAccountFactory } from "scw-contracts-v1.0.2/contracts/smart-contract-wallet/SmartAccountFactory.sol";
import { SmartAccount } from "scw-contracts-v1.0.2/contracts/smart-contract-wallet/SmartAccount.sol";
import { MultiSend } from "scw-contracts-v1.0.2/contracts/smart-contract-wallet/libs/MultiSend.sol";
import { MultiSendCallOnly } from "scw-contracts-v1.0.2/contracts/smart-contract-wallet/libs/MultiSendCallOnly.sol";
import { EntryPoint } from "scw-contracts-v1.0.2/contracts/smart-contract-wallet/aa-4337/core/EntryPoint.sol";

contract SmartWalletFactoryContract_v1_0_2 is SmartAccountFactory {
    constructor(address _defaultImpl) SmartAccountFactory(_defaultImpl){}
}
contract SmartWalletContract_v1_0_2 is SmartAccount {}
contract MultiSendContract_v1_0_2 is MultiSend {}
contract MultiSendCallOnlyContract_v1_0_2 is MultiSendCallOnly {}
contract EntryPointContract_v1_0_2 is EntryPoint {
    constructor() EntryPoint(){}
}

