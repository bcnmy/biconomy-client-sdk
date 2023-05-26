import { JsonRpcProvider, Web3Provider, Provider } from '@ethersproject/providers'
import { Signer, ethers, BigNumberish, BytesLike, BigNumber } from 'ethers'
import { SmartAccount, DEFAULT_USER_OP } from './BaseAccount'
import { BiconomyPaymasterAPI } from '@biconomy/paymaster'
import {
  NODE_CLIENT_URL,
  EntryPoint_v100__factory,
  SmartAccountFactory_v100,
  SmartAccountFactory_v100__factory,
  SmartAccount_v100__factory,
} from '@biconomy/common'
import { BiconomySmartAccountConfig } from './utils/Types'
import { UserOperation, Transaction } from '@biconomy/core-types'
import NodeClient from '@biconomy/node-client'
import INodeClient from '@biconomy/node-client'
import { IBiconomySmartAccount } from 'interfaces/IBiconomySmartAccount'
import { SupportedChainsResponse, BalancesResponse, BalancesDto, UsdBalanceResponse, SmartAccountByOwnerDto, SmartAccountsResponse, SCWTransactionResponse } from "@biconomy/node-client"

export class BiconomySmartAccount extends SmartAccount implements IBiconomySmartAccount {
  private factory: SmartAccountFactory_v100
  private nodeClient: INodeClient

  constructor(readonly biconomySmartAccountConfig: BiconomySmartAccountConfig) {
    const { signerOrProvider, rpcUrl, epAddress, factoryAddress, bundlerUrl, paymasterUrl, nodeClientUrl } = biconomySmartAccountConfig
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
    this.nodeClient = new NodeClient({ txServiceUrl: nodeClientUrl ?? NODE_CLIENT_URL })
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
      await instance.getInitCode()
      await instance.entryPoint.callStatic.getSenderAddress(instance.initCode);

      throw new Error("getSenderAddress: unexpected result");
    } catch (error: any) {
      const addr = await instance.factory.getAddressForCounterFactualAccount(await instance.signer.getAddress(), ethers.BigNumber.from(0))
      instance.proxy = await SmartAccount_v100__factory.connect(addr, instance.provider);
    }

    return instance
  }

  async getInitCode(): Promise<string> {
    this.initCode = ethers.utils.hexConcat([
      this.factory.address,
      this.factory.interface.encodeFunctionData("deployCounterFactualAccount", [
        await this.signer.getAddress(),
        ethers.BigNumber.from(0),
      ])
    ])
    return this.initCode
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
    return this.proxy.interface.encodeFunctionData("executeCall", [to, value, data])
  }
  /**
   * 
   * @param to { target } array of addresses in transaction
   * @param value  represents array of amount of native tokens associated with each transaction
   * @param data represent array of data associated with each transaction
   * @returns 
   */
  executeBatch(to: Array<string>, value: Array<BigNumberish>, data: Array<BytesLike>) {
    return this.proxy.interface.encodeFunctionData("executeBatchCall", [to, value, data])
  }


  async buildUserOp(transactions: Transaction[]): Promise<UserOperation> {
    const to = transactions.map((element: Transaction) => element.to)
    const data = transactions.map((element: Transaction) => element.data ?? '0x')
    const value = transactions.map((element: Transaction) => element.value ?? BigNumber.from('0'))

    let callData = ''

    if (transactions.length === 1) {
      callData = this.proxy.interface.encodeFunctionData("executeCall", [to[0], value[0], data[0]])
    } else {
      callData = this.proxy.interface.encodeFunctionData("executeBatchCall", [to, value, data])
    }

    let userOp: UserOperation = { ...DEFAULT_USER_OP }
    userOp.sender = this.getSmartAccountAddress()
    userOp.nonce = await this.nonce()
    userOp.initCode = userOp.nonce.eq(0) ? await this.getInitCode() : "0x"
    userOp.callData = callData

    console.log('Building userOp');
    userOp = await this.estimateUserOpGas(userOp)
    userOp = await this.getPaymasterAndData(userOp)
    return userOp
  }

  async getAlltokenBalances(balancesDto: BalancesDto): Promise<BalancesResponse> {
    return this.nodeClient.getAlltokenBalances(balancesDto)
  }

  async getTotalBalanceInUsd(balancesDto: BalancesDto): Promise<UsdBalanceResponse> {
    return this.nodeClient.getTotalBalanceInUsd(balancesDto)
  }

  async getSmartAccountsByOwner(
    smartAccountByOwnerDto: SmartAccountByOwnerDto
  ): Promise<SmartAccountsResponse> {
    return this.nodeClient.getSmartAccountsByOwner(smartAccountByOwnerDto)
  }

  async getTransactionByAddress(
    chainId: number,
    address: string
  ): Promise<SCWTransactionResponse[]> {
    return this.nodeClient.getTransactionByAddress(chainId, address)
  }

  async getTransactionByHash(txHash: string): Promise<SCWTransactionResponse> {
    return this.nodeClient.getTransactionByHash(txHash)
  }

  async getAllSupportedChains(): Promise<SupportedChainsResponse> {
    return this.nodeClient.getAllSupportedChains()
  }
}