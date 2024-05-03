"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBundlerUrl = exports.topUp = exports.nonZeroBalance = exports.checkBalance = exports.getConfig = exports.getEnvVars = void 0;
const viem_1 = require("viem");
const accounts_1 = require("viem/accounts");
const account_1 = require("../src/account");
const bundler_1 = require("../src/bundler");
const getEnvVars = () => {
    const fields = [
        "BUNDLER_URL",
        "E2E_PRIVATE_KEY_ONE",
        "E2E_PRIVATE_KEY_TWO",
        "E2E_BICO_PAYMASTER_KEY_AMOY",
        "E2E_BICO_PAYMASTER_KEY_BASE",
        "CHAIN_ID"
    ];
    const errorFields = fields.filter((field) => !process.env[field]);
    if (errorFields.length) {
        throw new Error(`Missing environment variable${errorFields.length > 1 ? "s" : ""}: ${errorFields.join(", ")}`);
    }
    return {
        bundlerUrl: process.env.BUNDLER_URL || "",
        privateKey: process.env.E2E_PRIVATE_KEY_ONE || "",
        privateKeyTwo: process.env.E2E_PRIVATE_KEY_TWO || "",
        paymasterUrl: `https://paymaster.biconomy.io/api/v1/80002/${process.env.E2E_BICO_PAYMASTER_KEY_AMOY || ""}`,
        paymasterUrlTwo: `https://paymaster.biconomy.io/api/v1/84532/${process.env.E2E_BICO_PAYMASTER_KEY_BASE || ""}`,
        chainId: process.env.CHAIN_ID || "0"
    };
};
exports.getEnvVars = getEnvVars;
const getConfig = () => {
    const { paymasterUrl, paymasterUrlTwo, bundlerUrl, chainId: chainIdFromEnv, privateKey, privateKeyTwo } = (0, exports.getEnvVars)();
    const chains = [Number.parseInt(chainIdFromEnv)];
    const chainId = chains[0];
    const chain = (0, account_1.getChain)(chainId);
    try {
        const chainIdFromBundlerUrl = (0, bundler_1.extractChainIdFromBundlerUrl)(bundlerUrl);
        chains.push(chainIdFromBundlerUrl);
    }
    catch (e) { }
    try {
        const chainIdFromPaymasterUrl = (0, bundler_1.extractChainIdFromPaymasterUrl)(paymasterUrl);
        chains.push(chainIdFromPaymasterUrl);
    }
    catch (e) { }
    const allChainsMatch = chains.every((chain) => chain === chains[0]);
    if (!allChainsMatch) {
        throw new Error("Chain IDs do not match");
    }
    return {
        chain,
        chainId,
        paymasterUrl,
        paymasterUrlTwo,
        bundlerUrl,
        privateKey,
        privateKeyTwo
    };
};
exports.getConfig = getConfig;
const checkBalance = (owner, tokenAddress) => {
    const { chain } = (0, exports.getConfig)();
    const publicClient = (0, viem_1.createPublicClient)({
        chain,
        transport: (0, viem_1.http)()
    });
    if (!tokenAddress) {
        return publicClient.getBalance({ address: owner });
    }
    return publicClient.readContract({
        address: tokenAddress,
        abi: (0, viem_1.parseAbi)([
            "function balanceOf(address owner) view returns (uint balance)"
        ]),
        functionName: "balanceOf",
        args: [owner]
    });
};
exports.checkBalance = checkBalance;
const nonZeroBalance = async (address, tokenAddress) => {
    const balance = await (0, exports.checkBalance)(address, tokenAddress);
    if (balance > BigInt(0))
        return;
    throw new Error(`Insufficient balance ${tokenAddress ? `of token ${tokenAddress}` : "of native token"} during test setup of owner: ${address}`);
};
exports.nonZeroBalance = nonZeroBalance;
const topUp = async (recipient, amount = BigInt(1000000), token) => {
    const { chain, privateKey } = (0, exports.getConfig)();
    const account = (0, accounts_1.privateKeyToAccount)(`0x${privateKey}`);
    const sender = account.address;
    const publicClient = (0, viem_1.createPublicClient)({
        chain,
        transport: (0, viem_1.http)()
    });
    const balanceOfSender = await (0, exports.checkBalance)(sender, token);
    const balanceOfRecipient = await (0, exports.checkBalance)(recipient, token);
    if (balanceOfRecipient > amount) {
        account_1.Logger.log(`balanceOfRecipient (${recipient}) already has enough ${token ?? "native token"} (${balanceOfRecipient}) during topUp`);
        return await Promise.resolve();
    }
    if (balanceOfSender < amount) {
        throw new Error(`Insufficient ${token ? token : ""}balance during test setup: ${balanceOfSender}`);
    }
    account_1.Logger.log(`topping up (${recipient}): (${balanceOfRecipient}).`);
    const walletClient = (0, viem_1.createWalletClient)({
        account,
        chain,
        transport: (0, viem_1.http)()
    });
    if (token) {
        const hash = await walletClient.writeContract({
            address: token,
            abi: (0, viem_1.parseAbi)([
                "function transfer(address recipient, uint256 amount) external"
            ]),
            functionName: "transfer",
            args: [recipient, amount]
        });
        await publicClient.waitForTransactionReceipt({ hash });
    }
    else {
        const hash = await walletClient.sendTransaction({
            to: recipient,
            value: amount
        });
        await publicClient.waitForTransactionReceipt({ hash });
    }
};
exports.topUp = topUp;
const getBundlerUrl = (chainId) => `https://bundler.biconomy.io/api/v2/${chainId}/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f14`;
exports.getBundlerUrl = getBundlerUrl;
//# sourceMappingURL=utils.js.map