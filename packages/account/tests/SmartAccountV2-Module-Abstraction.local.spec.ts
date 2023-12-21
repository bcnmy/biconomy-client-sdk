// import { EntryPoint, EntryPoint__factory } from "@account-abstraction/contracts";

// import { BiconomySmartAccountV2 } from "../src/BiconomySmartAccountV2";
// import { ChainId } from "@biconomy/core-types";

// const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
// const signer = provider.getSigner();

// describe("BiconomySmartAccountV2 Module Abstraction", () => {
// let entryPoint: EntryPoint;
// beforeAll(async () => {
//   entryPoint = await new EntryPoint__factory(signer).deploy();
//   console.log("ep address ", entryPoint.address);
//   await new Promise((resolve) => setTimeout(resolve, 10000));
// }, 30000);
// it("Create smart account with default module (ECDSA)", async () => {
//   const account: BiconomySmartAccountV2 = await BiconomySmartAccountV2.create({
//     chainId: ChainId.GANACHE,
//     rpcUrl: "http://127.0.0.1:8545",
//     entryPointAddress: entryPoint.address,
//     signer,
//     /*defaultValidationModule: await ECDSAOwnershipValidationModule.create({
//       signer: signer,
//       moduleAddress: ecdsaModule.address,
//     }),*/
//   });
//   const address = await account.getAccountAddress();
//   console.log("Module Abstraction Test - Account address ", address);
//   expect(address).toBe(await account.getAccountAddress());
//   const module = account.activeValidationModule;
//   console.log(`ACTIVE MODULE - ${module.getAddress()}`);
// }, 10000);
// it("Create smart account with ECDSA module", async () => {
//   const account: BiconomySmartAccountV2 = await BiconomySmartAccountV2.create({
//     chainId: ChainId.GANACHE,
//     rpcUrl: "http://127.0.0.1:8545",
//     entryPointAddress: entryPoint.address,
//     signer,
//   });
//   const address = await account.getAccountAddress();
//   console.log("Module Abstraction Test - Account address ", address);
//   expect(address).toBe(await account.getAccountAddress());
//   const module = account.activeValidationModule;
//   console.log(`ACTIVE MODULE - ${module.getAddress()}`);
// }, 10000);
// });
