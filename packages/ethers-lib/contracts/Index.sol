// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.4.0 <=0.8.15;

import { WalletFactory } from "../scw-contracts/smart-contract-wallet/WalletFactory.sol";
import { SmartWallet } from "../scw-contracts/smart-contract-wallet/SmartWallet.sol";
import { MultiSend } from "../scw-contracts/smart-contract-wallet/libs/MultiSend.sol";
import { MultiSendCallOnly } from "../scw-contracts/smart-contract-wallet/libs/MultiSendCallOnly.sol";
import { WhitelistModule } from "../scw-contracts/smart-contract-wallet/modules/test/WhitelistModule.sol";
import { EntryPoint } from "../scw-contracts/references/aa-4337/EntryPoint.sol";

contract SmartWalletFactoryContract is WalletFactory {
    constructor(address _defaultImpl) WalletFactory(_defaultImpl){}
}
contract SmartWalletContract is SmartWallet {}
contract MultiSendContract is MultiSend {}
contract MultiSendCallOnlyContract is MultiSendCallOnly {}
contract EntryPointContract is EntryPoint {
    constructor(address _create2factory, uint _paymasterStake, uint32 _unstakeDelaySec) EntryPoint(_create2factory, _paymasterStake, _unstakeDelaySec){}
}

