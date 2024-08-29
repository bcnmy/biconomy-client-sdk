# @biconomy/sdk Testing Framework

## Testing Setup

> **Note**:  
> - Tests now must be run with node version >= v22

### Network Agnostic Tests
- Tests are executed against locally deployed ephemeral Anvil chains (each with a different ID) with relevant contracts pre-deployed for each test.
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
- Use by setting `const NETWORK_TYPE: TestFileNetworkType = "FILE_LOCALHOST"` at the top of the test file.
- Suitable when you're sure that tests in the file will **not** conflict with other tests using the global network.

### Local Scope
- Use by setting `const NETWORK_TYPE: TestFileNetworkType = "FILE_LOCALHOST"` for test files that may conflict with others.
- Networks scoped locally are isolated to the file in which they are used.
- Tests within the same file using a local network may conflict with each other. If needed, split tests into separate files or use the Test Scope.

### Test Scope
- A network is spun up *only* for the individual test in which it is used. Access this via the `localhostTest` helper in the same file as `"COMMON_LOCALHOST"` or `"FILE_LOCALHOST"` network types.

Example usage:
```typescript
localhostTest("should be used in the following way", async({ config: { bundlerUrl, chain, fundedClients }}) => {
    // chain, bundlerUrl spun up just in time for this test only...
    expect(await fundedClients.smartAccount.getAccountAddress()).toBeTruthy();
});
```

> **Note:** 
> Please avoid using multiple nested describe() blocks in a single test file, as it is unnecessary and can lead to confusion regarding network scope.
> Using *many* test files is preferable, as describe blocks run in parallel. 

## Testing Custom/New Chains
- There is currently one area where SDK tests can be run against a remote testnet: the playground.
- Additionally there are helpers for running tests on files on a public testnet:
    - `const NETWORK_TYPE: TestFileNetworkType = "TESTNET"` will pick up relevant configuration from environment variables, and can be used at the top of a test file to have tests run against the specified testnet instead of the localhost
    - If you want to run a single test on a public testnet *from inside a different describe block* you can use the: `testnetTest` helper:

Example usage:
```typescript
testnetTest("should be used in the following way", async({ config: { bundlerUrl, chain, account }}) => {
    // chain, bundlerUrl etc taken from environment variables...
    expect(account).toBeTruthy(); // from private key, please ensure it is funded if sending txs
});
```

> **Note:** 
> As testnetTest runs against a public testnet the account related to the privatekey (in your env var) must be funded, and the testnet is not 'ephemeral' meaning state is persisted on the testnet after the test teardown. 


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

