"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clean = exports.deploy = exports.cleanOne = exports.init = void 0;
const execa_1 = require("execa");
const cwd = "./node_modules/nexus";
const init = async () => await (0, execa_1.execa)({ cwd }) `yarn install --frozen-lockfile`;
exports.init = init;
const cleanOne = async (rpcPort) => await (0, execa_1.execa)({ cwd }) `rm -rf ./deployments/anvil-${rpcPort}`;
exports.cleanOne = cleanOne;
const deploy = async (rpcPort) => {
    await (0, exports.cleanOne)(rpcPort);
    return await (0, execa_1.execa)({
        cwd,
        env: {
            HH_RPC_URL: `http://localhost:${rpcPort}`,
            HH_CHAIN_NAME: `anvil-${rpcPort}`,
            HH_CHAIN_ID: rpcPort.toString()
        }
    }) `yarn deploy:hardhat --network anvil-${rpcPort}`;
};
exports.deploy = deploy;
const clean = async () => await (0, execa_1.execa)({ cwd }) `rm -rf ./deployments`;
exports.clean = clean;
//# sourceMappingURL=executables.js.map