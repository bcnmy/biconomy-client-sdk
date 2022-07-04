// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.4.0 <=0.8.15;

import { WalletFactory } from "../scw-contracts/smart-contract-wallet/WalletFactory.sol";
import { SmartWallet } from "../scw-contracts/smart-contract-wallet/SmartWallet.sol";
import { MultiSend } from "../scw-contracts/smart-contract-wallet/libs/MultiSend.sol";
import { WhitelistModule } from "../scw-contracts/smart-contract-wallet/modules/test/WhitelistModule.sol";

contract SmartWalletFactoryContract is WalletFactory {
    constructor(address _defaultImpl) WalletFactory(_defaultImpl){}
}
contract SmartWalletContract is SmartWallet {}
contract MultiSendContract is MultiSend {}

