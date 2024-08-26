# @biconomy/sdk Testing Guide

## Testing Setup

> **Note**:  
> - Tests now must be run with node version >= v22

### Network Agnostic Tests
- Tests are executed against locally deployed ephemeral Anvil chains (chain ID: 31337) with relevant contracts pre-deployed for each test.
- Bundlers for testing are instantiated using [prool](https://github.com/wevm/prool), currently utilizing alto instances. We plan to switch to Biconomy's bundlers when they become available via `prool`.

### Deployment Configuration
A custom script `bun run fetch:deployment` is provided to search for the bytecode of deployed contracts from a customizable location (default: `../../nexus/deployments`). This folder is **auto-generated** in Nexus whenever a new Hardhat deployment is made, ensuring that the SDK remains up-to-date with the latest contract changes.

The script performs the following:
- **ABIs**: Moved to `./src/__contracts/{name}Abi.ts`
- **Addresses**: Moved to `./src/addresses.ts`
- **Additional Fixtures**: Copied to `tests__/contracts`

> **Note**:  
> - Do not edit these files manually; they will be overridden if/when a new Nexus deployment occurs.
> - Avoid hardcoding important addresses (e.g., `const K1_VALIDATOR_ADDRESS = "0x"`). Use `./src/addresses.ts` instead.

## Network Scopes for Tests

To prevent tests from conflicting with one another, networks can be scoped at three levels:

### Global Scope
- Use by setting `const NETWORK_TYPE: TestFileNetworkType = "LOCAL"` at the top of the test file.
- Suitable when you're sure that tests in the file will **not** conflict with other tests using the global network.

### Local Scope
- Use by setting `const NETWORK_TYPE: TestFileNetworkType = "LOCAL"` for test files that may conflict with others.
- Networks scoped locally are isolated to the file in which they are used.
- Tests within the same file using a local network may conflict with each other. If needed, split tests into separate files or use the Test Scope.

### Test Scope
- A network is spun up *only* for the individual test in which it is used. Access this via the `scopedTest` helper in the same file as `"GLOBAL"` or `"LOCAL"` network types.

Example usage:
```typescript
scopedTest("should be used in the following way", async({ config: { bundlerUrl, chain, deployment, fundedClients }}) => {
    expect(await fundedClients.smartAccount.getAccountAddress()).toBeTruthy();
});
```

> **Note:** 
> Please avoid using multiple nested describe() blocks in a single test file, as it is unnecessary and can lead to confusion regarding network scope.

## Testing Custom/New Chains
- There is one area where SDK tests can be run against a remote testnet: the playground.
- The playground does not run in CI/CD but can be triggered manually from the GitHub Actions UI or locally via bun run playground.
- The playground network is configured with environment variables:
    - E2E_PRIVATE_KEY_ONE
    - CHAIN_ID
    - RPC_URL (optional, inferred if unset)
    - BUNDLER_URL (optional, inferred if unset)

## Debugging and Client Issues
It is recommended to use the playground for debugging issues with clients. Please refer to the following guidelines for escalation and handover: [Debugging Client Issues](https://www.notion.so/biconomy/Debugging-Client-Issues-cc01c1cab0224c87b37a4d283370165b)

## Testing Helpers
A [testClient](https://viem.sh/docs/clients/test#extending-with-public--wallet-actions) is available (funded and extended with walletActions and publicActions) during testing. Please use it as a master Client for all things network related. 

