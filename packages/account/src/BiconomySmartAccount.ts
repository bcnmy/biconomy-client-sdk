import { JsonRpcProvider, Web3Provider, Provider } from '@ethersproject/providers'
import { Signer, ethers, BigNumberish, BytesLike, BigNumber } from 'ethers'
import { SmartAccount } from './SmartAccount'
import { BiconomyPaymasterAPI } from '@biconomy/paymaster'
import {
  EntryPoint_v100__factory,
  SmartAccountFactory_v100,
  SmartAccountFactory_v100__factory,
  SmartAccount_v100__factory,
} from '@biconomy/common'
import { BiconomySmartAccountConfig } from './utils/Types'
export class BiconomySmartAccount extends SmartAccount {
  private factory: SmartAccountFactory_v100

  constructor(readonly biconomySmartAccountConfig: BiconomySmartAccountConfig) {
    const { signerOrProvider, rpcUrl, epAddress, factoryAddress, bundlerUrl, paymasterUrl } = biconomySmartAccountConfig
    super({
      bundlerUrl,
      epAddress
    })
    this.provider = new JsonRpcProvider(rpcUrl);
    this.entryPoint = EntryPoint_v100__factory.connect(epAddress, this.provider);
    this.factory = SmartAccountFactory_v100__factory.connect(
      factoryAddress,
      this.provider
    );
    try {
      if (Signer.isSigner(signerOrProvider)) {
        this.signer = signerOrProvider
      } else if (Provider.isProvider(signerOrProvider)) {
        this.signer = signerOrProvider.getSigner()
      }
      else {
        console.error('signer or provider is not valid')
      }
    } catch (error) {
      throw new Error("No signer provided")
    }
    console.log(paymasterUrl);
    if (paymasterUrl)
      this.paymaster = new BiconomyPaymasterAPI(paymasterUrl)
  }
  /**
   * @description This function will initialise BiconomyAccount class state
   * @returns Promise<BiconomyAccount>
   */
  async init(): Promise<BiconomySmartAccount> {
    const instance = new BiconomySmartAccount({
      signerOrProvider: this.biconomySmartAccountConfig.signerOrProvider,
      rpcUrl: this.biconomySmartAccountConfig.rpcUrl,
      epAddress: this.biconomySmartAccountConfig.epAddress,
      factoryAddress: this.biconomySmartAccountConfig.factoryAddress,
      bundlerUrl: this.biconomySmartAccountConfig.bundlerUrl,
      paymasterUrl: this.biconomySmartAccountConfig.paymasterUrl
    }
    );
    try {
      instance.chainId = await this.provider.getNetwork().then((net) => net.chainId)
      instance.initCode = await ethers.utils.hexConcat([
        instance.factory.address,
        instance.factory.interface.encodeFunctionData("deployCounterFactualAccount", [
          await instance.signer.getAddress(),
          ethers.BigNumber.from(0),
        ]),
      ])
      await instance.entryPoint.callStatic.getSenderAddress(instance.initCode);

      throw new Error("getSenderAddress: unexpected result");
    } catch (error: any) {
      const addr = await instance.factory.getAddressForCounterFactualAccount(await instance.signer.getAddress(), ethers.BigNumber.from(0))
      instance.proxy = await SmartAccount_v100__factory.connect(addr, instance.provider);
      instance.initCode = '0x'
    }
    console.log(instance.userOp);
    console.log(instance.proxy.address);

    instance.useDefaults({
      sender: instance.proxy.address
    })
    return instance
  }
  /**
   * @description an overrided function to showcase overriding example
   * @returns 
   */
  nonce(): Promise<BigNumber> {
    console.log('Overiding example');
    return this.proxy.nonce()
  }
  /**
   * 
   * @param to { target } address of transaction 
   * @param value  represents amount of native tokens
   * @param data represent data associated with transaction
   * @returns 
   */
  execute(to: string, value: BigNumberish, data: BytesLike) {
    return this.setCallData(
      this.proxy.interface.encodeFunctionData("executeCall", [to, value, data])
    );
  }
  /**
   * 
   * @param to { target } array of addresses in transaction
   * @param value  represents array of amount of native tokens associated with each transaction
   * @param data represent array of data associated with each transaction
   * @returns 
   */
  executeBatch(to: Array<string>, value: Array<BigNumberish>, data: Array<BytesLike>) {
    return this.setCallData(
      this.proxy.interface.encodeFunctionData("executeBatchCall", [to, value, data])
    );
  }
}