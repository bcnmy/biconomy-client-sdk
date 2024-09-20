"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setByteCodeDynamic = exports.sleep = exports.getBundlerUrl = exports.topUp = exports.safeTopUp = exports.fundAndDeploySingleClient = exports.fundAndDeployClients = exports.toFundedTestClients = exports.nonZeroBalance = exports.getBalance = exports.initBundlerInstance = exports.initAnvilPayload = exports.initDeployments = exports.toConfiguredAnvil = exports.ensureBundlerIsReady = exports.toBundlerInstance = exports.toTestClient = exports.initLocalhostNetwork = exports.initTestnetNetwork = exports.killNetwork = exports.killAllNetworks = exports.getTestSmartAccountClient = exports.getTestAccount = exports.pKey = void 0;
const dotenv_1 = require("dotenv");
const get_port_1 = require("get-port");
const instances_1 = require("prool/instances");
const viem_1 = require("viem");
const accounts_1 = require("viem/accounts");
const __contracts_1 = require("../sdk/__contracts");
const utils_1 = require("../sdk/account/utils");
const Logger_1 = require("../sdk/account/utils/Logger");
const createNexusClient_1 = require("../sdk/clients/createNexusClient");
const actions_1 = require("viem/actions");
const createBicoBundlerClient_1 = require("../sdk/clients/createBicoBundlerClient");
const callDatas_1 = require("./callDatas");
const hardhatExec = require("./executables");
(0, dotenv_1.config)();
exports.pKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const getTestAccount = (addressIndex = 0) => {
    return (0, accounts_1.mnemonicToAccount)("test test test test test test test test test test test junk", {
        addressIndex
    });
};
exports.getTestAccount = getTestAccount;
const getTestSmartAccountClient = async ({ account, chain, bundlerUrl, index }) => {
    const smartAccount = await (0, createNexusClient_1.createNexusClient)({
        signer: account,
        chain,
        client: (0, exports.toTestClient)(chain, account),
        transport: (0, viem_1.http)(),
        bundlerTransport: (0, viem_1.http)(bundlerUrl),
        index
    });
    const isDeployed = await smartAccount.account.isDeployed();
    const smartAccountBalance = await (0, exports.getBalance)(smartAccount.client, smartAccount.account.address);
    console.log(smartAccountBalance, "smartAccountBalance");
    if (smartAccountBalance === 0n) {
        const masterClient = (0, exports.toTestClient)(chain, account);
        await (0, exports.topUp)(masterClient, smartAccount.account.address, (0, viem_1.parseEther)("0.1"));
    }
    if (!isDeployed) {
        const hash = await smartAccount.sendTransaction({
            to: viem_1.zeroAddress,
            data: "0x",
            chain
        });
        const receipt = await (0, actions_1.waitForTransactionReceipt)(smartAccount.client, { hash });
        if (receipt.status !== "success") {
            throw new Error("Smart account deployment failed");
        }
    }
    return smartAccount;
};
exports.getTestSmartAccountClient = getTestSmartAccountClient;
const allInstances = new Map();
const killAllNetworks = () => (0, exports.killNetwork)(Array.from(allInstances.keys()));
exports.killAllNetworks = killAllNetworks;
const killNetwork = (ids) => Promise.all(ids.map(async (id) => {
    const instance = allInstances.get(id);
    if (instance) {
        await instance.stop();
        allInstances.delete(id);
    }
}));
exports.killNetwork = killNetwork;
const initTestnetNetwork = async () => {
    const privateKey = process.env.E2E_PRIVATE_KEY_ONE;
    const chainId = process.env.CHAIN_ID;
    const rpcUrl = process.env.RPC_URL;
    const _bundlerUrl = process.env.BUNDLER_URL;
    const paymasterUrl = process.env.PAYMASTER_URL;
    let chain;
    if (!privateKey)
        throw new Error("Missing env var E2E_PRIVATE_KEY_ONE");
    if (!chainId)
        throw new Error("Missing env var CHAIN_ID");
    if (!paymasterUrl)
        console.log("Missing env var PAYMASTER_URL");
    try {
        chain = (0, utils_1.getChain)(+chainId);
    }
    catch (e) {
        if (!rpcUrl)
            throw new Error("Missing env var RPC_URL");
        chain = (0, utils_1.getCustomChain)("Custom Chain", +chainId, rpcUrl);
    }
    const bundlerUrl = _bundlerUrl ?? (0, exports.getBundlerUrl)(+chainId);
    return {
        rpcUrl: chain.rpcUrls.default.http[0],
        rpcPort: 0,
        chain,
        bundlerUrl,
        paymasterUrl,
        bundlerPort: 0,
        account: (0, accounts_1.privateKeyToAccount)(privateKey?.startsWith("0x") ? privateKey : `0x${privateKey}`)
    };
};
exports.initTestnetNetwork = initTestnetNetwork;
const initLocalhostNetwork = async () => {
    const configuredNetwork = await (0, exports.initAnvilPayload)();
    const bundlerConfig = await (0, exports.initBundlerInstance)({
        rpcUrl: configuredNetwork.rpcUrl
    });
    await (0, exports.ensureBundlerIsReady)(bundlerConfig.bundlerUrl, getTestChainFromPort(configuredNetwork.rpcPort));
    allInstances.set(configuredNetwork.instance.port, configuredNetwork.instance);
    allInstances.set(bundlerConfig.bundlerInstance.port, bundlerConfig.bundlerInstance);
    return { ...configuredNetwork, ...bundlerConfig };
};
exports.initLocalhostNetwork = initLocalhostNetwork;
const toTestClient = (chain, account) => (0, viem_1.createTestClient)({
    mode: "anvil",
    chain,
    account,
    transport: (0, viem_1.http)()
})
    .extend(viem_1.publicActions)
    .extend(viem_1.walletActions);
exports.toTestClient = toTestClient;
const toBundlerInstance = async ({ rpcUrl, bundlerPort }) => {
    const instance = (0, instances_1.alto)({
        entrypoints: [__contracts_1.default.entryPoint.address],
        rpcUrl: rpcUrl,
        executorPrivateKeys: [exports.pKey],
        entrypointSimulationContract: __contracts_1.default.entryPointSimulations.address,
        safeMode: false,
        port: bundlerPort
    });
    await instance.start();
    return instance;
};
exports.toBundlerInstance = toBundlerInstance;
const ensureBundlerIsReady = async (bundlerUrl, chain) => {
    const bundler = (0, createBicoBundlerClient_1.createBicoBundlerClient)({
        chain,
        transport: (0, viem_1.http)(bundlerUrl)
    });
    while (true) {
        try {
            await bundler.getChainId();
            return;
        }
        catch {
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }
};
exports.ensureBundlerIsReady = ensureBundlerIsReady;
const toConfiguredAnvil = async ({ rpcPort }) => {
    const instance = (0, instances_1.anvil)({
        hardfork: "Cancun",
        chainId: rpcPort,
        port: rpcPort,
        codeSizeLimit: 1000000000000
    });
    await instance.start();
    await (0, exports.initDeployments)(rpcPort);
    return instance;
};
exports.toConfiguredAnvil = toConfiguredAnvil;
const initDeployments = async (rpcPort) => {
    console.log(`using hardhat to deploy nexus contracts to http://localhost:${rpcPort}`);
    await hardhatExec.init();
    await hardhatExec.clean();
    await hardhatExec.deploy(rpcPort);
    console.log("hardhat deployment complete.");
    console.log("setting bytecode with hardcoded calldata.");
    const chain = getTestChainFromPort(rpcPort);
    const account = (0, exports.getTestAccount)();
    const testClient = (0, exports.toTestClient)(chain, account);
    console.log("setting bytecode with dynamic calldata from a testnet");
    await setByteCodeHardcoded(testClient);
    await (0, exports.setByteCodeDynamic)(testClient, callDatas_1.TEST_CONTRACTS);
    console.log("bytecode deployment complete.");
    console.log("");
};
exports.initDeployments = initDeployments;
const portOptions = { exclude: [] };
const initAnvilPayload = async () => {
    const rpcPort = await (0, get_port_1.default)(portOptions);
    portOptions.exclude.push(rpcPort);
    const rpcUrl = `http://localhost:${rpcPort}`;
    const chain = getTestChainFromPort(rpcPort);
    const instance = await (0, exports.toConfiguredAnvil)({ rpcPort });
    return { rpcUrl, chain, instance, rpcPort };
};
exports.initAnvilPayload = initAnvilPayload;
const initBundlerInstance = async ({ rpcUrl }) => {
    const bundlerPort = await (0, get_port_1.default)(portOptions);
    portOptions.exclude.push(bundlerPort);
    const bundlerUrl = `http://localhost:${bundlerPort}`;
    const bundlerInstance = await (0, exports.toBundlerInstance)({ rpcUrl, bundlerPort });
    return { bundlerInstance, bundlerUrl, bundlerPort };
};
exports.initBundlerInstance = initBundlerInstance;
const getBalance = (testClient, owner, tokenAddress) => {
    if (!tokenAddress) {
        return testClient.getBalance({ address: owner });
    }
    return testClient.readContract({
        address: tokenAddress,
        abi: (0, viem_1.parseAbi)([
            "function balanceOf(address owner) public view returns (uint256 balance)"
        ]),
        functionName: "balanceOf",
        args: [owner]
    });
};
exports.getBalance = getBalance;
const nonZeroBalance = async (testClient, address, tokenAddress) => {
    const balance = await (0, exports.getBalance)(testClient, address, tokenAddress);
    if (balance > BigInt(0))
        return;
    throw new Error(`Insufficient balance ${tokenAddress ? `of token ${tokenAddress}` : "of native token"} during test setup of owner: ${address}`);
};
exports.nonZeroBalance = nonZeroBalance;
const toFundedTestClients = async ({ chain, bundlerUrl }) => {
    const account = (0, exports.getTestAccount)(2);
    const recipientAccount = (0, exports.getTestAccount)(3);
    const walletClient = (0, viem_1.createWalletClient)({
        account,
        chain,
        transport: (0, viem_1.http)()
    });
    const recipientWalletClient = (0, viem_1.createWalletClient)({
        account: recipientAccount,
        chain,
        transport: (0, viem_1.http)()
    });
    const testClient = (0, exports.toTestClient)(chain, (0, exports.getTestAccount)());
    const nexus = await (0, createNexusClient_1.createNexusClient)({
        signer: account,
        transport: (0, viem_1.http)(),
        bundlerTransport: (0, viem_1.http)(bundlerUrl),
        chain
    });
    const smartAccountAddress = await nexus.account.getAddress();
    await (0, exports.fundAndDeployClients)(testClient, [nexus]);
    return {
        account,
        recipientAccount,
        walletClient,
        recipientWalletClient,
        testClient,
        nexus,
        smartAccountAddress
    };
};
exports.toFundedTestClients = toFundedTestClients;
const fundAndDeployClients = async (testClient, nexusClients) => {
    return await Promise.all(nexusClients.map((nexusClient) => (0, exports.fundAndDeploySingleClient)(testClient, nexusClient)));
};
exports.fundAndDeployClients = fundAndDeployClients;
const fundAndDeploySingleClient = async (testClient, nexusClient) => {
    try {
        const accountAddress = await nexusClient.account.getAddress();
        await (0, exports.topUp)(testClient, accountAddress);
        const hash = await nexusClient.sendTransaction({
            calls: [
                {
                    to: viem_1.zeroAddress,
                    value: 0n
                }
            ]
        });
        const { status, transactionHash } = await testClient.waitForTransactionReceipt({
            hash
        });
        if (status !== "success") {
            throw new Error("Failed to deploy smart account");
        }
        return transactionHash;
    }
    catch (e) {
        console.error(`Error initializing smart account: ${e}`);
        return Promise.resolve();
    }
};
exports.fundAndDeploySingleClient = fundAndDeploySingleClient;
const safeTopUp = async (testClient, recipient, amount = 100000000000000000000n, token) => {
    try {
        return await (0, exports.topUp)(testClient, recipient, amount, token);
    }
    catch (error) {
        Logger_1.Logger.error(`Error topping up account: ${error}`);
    }
};
exports.safeTopUp = safeTopUp;
const topUp = async (testClient, recipient, amount = 100000000000000000000n, token) => {
    const balanceOfRecipient = await (0, exports.getBalance)(testClient, recipient, token);
    if (balanceOfRecipient > amount) {
        Logger_1.Logger.log(`balanceOfRecipient (${recipient}) already has enough ${token ?? "native token"} (${balanceOfRecipient}) during safeTopUp`);
        return await Promise.resolve();
    }
    Logger_1.Logger.log(`topping up (${recipient}): (${balanceOfRecipient}).`);
    if (token) {
        const hash = await testClient.writeContract({
            address: token,
            abi: (0, viem_1.parseAbi)([
                "function transfer(address recipient, uint256 amount) external"
            ]),
            functionName: "transfer",
            args: [recipient, amount]
        });
        return await testClient.waitForTransactionReceipt({ hash });
    }
    const hash = await testClient.sendTransaction({
        to: recipient,
        value: amount
    });
    return await testClient.waitForTransactionReceipt({ hash });
};
exports.topUp = topUp;
const getBundlerUrl = (chainId) => `https://bundler.biconomy.io/api/v3/${chainId}/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f14`;
exports.getBundlerUrl = getBundlerUrl;
const getTestChainFromPort = (port) => (0, utils_1.getCustomChain)(`Anvil-${port}`, port, `http://localhost:${port}`, "");
const setByteCodeHardcoded = async (testClient) => {
    const DETERMINISTIC_DEPLOYER = "0x4e59b44847b379578588920ca78fbf26c0b4956c";
    const entrypointSimulationHash = await testClient.sendTransaction({
        to: DETERMINISTIC_DEPLOYER,
        data: callDatas_1.ENTRY_POINT_SIMULATIONS_CREATECALL,
        gas: 15000000n
    });
    const entrypointHash = await testClient.sendTransaction({
        to: DETERMINISTIC_DEPLOYER,
        data: callDatas_1.ENTRY_POINT_V07_CREATECALL,
        gas: 15000000n
    });
    await Promise.all([
        testClient.waitForTransactionReceipt({ hash: entrypointSimulationHash }),
        testClient.waitForTransactionReceipt({ hash: entrypointHash })
    ]);
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
exports.sleep = sleep;
const setByteCodeDynamic = async (testClient, deployParams) => {
    const deployParamsArray = Object.values(deployParams);
    const bytecodes = (await Promise.all(deployParamsArray.map(({ chainId, address }) => {
        const fetchChain = (0, utils_1.getChain)(chainId);
        const publicClient = (0, viem_1.createPublicClient)({
            chain: fetchChain,
            transport: (0, viem_1.http)()
        });
        return publicClient.getCode({ address });
    })));
    await Promise.all(deployParamsArray.map(({ address }, index) => testClient.setCode({
        bytecode: bytecodes[index],
        address
    })));
};
exports.setByteCodeDynamic = setByteCodeDynamic;
//# sourceMappingURL=testUtils.js.map