// SPDX-License-Identifier: UNLICENSED
// @review
pragma solidity ^0.8.17;

import { SmartAccountFactory } from "scw-contracts-v1.0.0/contracts/smart-contract-wallet/SmartAccountFactory.sol";
import { SmartAccount } from "scw-contracts-v1.0.0/contracts/smart-contract-wallet/SmartAccount.sol";
import { MultiSend } from "scw-contracts-v1.0.0/contracts/smart-contract-wallet/libs/MultiSend.sol";
import { MultiSendCallOnly } from "scw-contracts-v1.0.0/contracts/smart-contract-wallet/libs/MultiSendCallOnly.sol";
import { EntryPoint } from "scw-contracts-v1.0.0/contracts/smart-contract-wallet/aa-4337/core/EntryPoint.sol";
import { FallbackGasTank } from "fallback-contracts-v1.0.0/contracts/gas-tank/FallbackGasTank.sol";
import { DefaultCallbackHandler } from "scw-contracts-v1.0.0/contracts/smart-contract-wallet/handler/DefaultCallbackHandler.sol";
import "@account-abstraction/contracts/interfaces/IEntryPoint.sol";

contract SmartWalletFactoryContract_v1_0_0 is SmartAccountFactory {
    constructor(address _basicImplementation) SmartAccountFactory(_basicImplementation){}
}
contract SmartWalletContract_v1_0_0 is SmartAccount {
    constructor(IEntryPoint anEntryPoint) SmartAccount(IEntryPoint(anEntryPoint)){}
}
contract MultiSendContract_v1_0_0 is MultiSend {}
contract MultiSendCallOnlyContract_v1_0_0 is MultiSendCallOnly {}
contract EntryPointContract_v1_0_0 is EntryPoint {
    constructor() EntryPoint(){}
}
contract FallbackGasTankContract_v1_0_0 is FallbackGasTank {
    constructor(address _owner, address _verifyingSigner) FallbackGasTank(_owner, _verifyingSigner) {}
}

contract DefaultCallbackHandler_v1_0_0 is DefaultCallbackHandler {}
