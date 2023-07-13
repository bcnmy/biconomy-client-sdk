# Biconomy SDK
The Biconomy Software Development Kit (SDK) is plug &amp; play toolkit for dApps to make use of ERC4337 Account Abstraction and enable a highly customised one-click experiences for their users. It presents a comprehensive range of solutions, from user onboarding to sustained engagement, managing and deploying smart accounts, dispatching user transactions with gas abtraction of your choice. This SDK functions in a non-custodial fashion, provides a unified solution that enhances the user experience within your dApp.


## Packages 
### Account

Building and sending UserOperations is a key offering of any toolkit designed for ERC4337. The Biconomy account package stands as an exemplary toolkit in this regard. Meticulously crafted with developers' needs in mind, this package seamlessly integrates the essential features associated with ERC-4337. It simplifies the process of creating and sending UserOperations, thus optimizing the development and management of decentralized applications (dApps).

The Biconomy account package achieves this by providing a comprehensive set of methods that enable developers to effortlessly create UserOperations. Combined with the sophisticated backend infrastructure of the Biconomy platform, it ensures efficient and reliable transmission of these operations across EVM networks.

### Bundler

In the context of  (ERC4337), the concept of a bundler plays a central role in the infrastructure. This concept is integral to the operation of account abstraction across any network that utilizes the Ethereum Virtual Machine (EVM). 

Bundler infrastructure is designed and implemented in accordance with standardised specifications. This standardisation across all bundlers offers a significant advantage, particularly when it comes to interoperability with various tools and services, such as the Biconomy SDK.


### Paymaster

ERC4337, Account abstraction, introduces the concept of Paymasters. These specialised entities play a pivotal role in revolutionising the traditional gas payment system in EVM transactions. Paymasters, acting as third-party intermediaries, possess the capability to sponsor gas fees for an account, provided specific predefined conditions are satisfied.



## Services

<img width="1076" alt="Screenshot 2022-11-13 at 7 45 04 PM" src="https://user-images.githubusercontent.com/90545960/201531668-b616d0b7-d94a-4ee5-9e4a-709836f8dfc0.png">

1. SDK Backend node - responsible for chain configurations and gas estimation endpoints
2. Indexer 
3. Paymaster Service - used for checking policies and verifying paymaster signing
4. Bundler Node



## Quickstart


https://github.com/bcnmy/sdk-examples/blob/modular-sdk-v3/backend-node/README.md 


## Resources

https://docs.biconomy.io/introduction/overview 

https://dashboard.biconomy.io/ 



