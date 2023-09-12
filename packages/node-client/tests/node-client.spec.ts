import { Signer as AbstractSigner } from "ethers";
import { Web3Provider } from "@ethersproject/providers";
import NodeClient from "../dist/src";

type EthereumInstance = {
  chainId?: number;
  provider?: Web3Provider;
  signer?: AbstractSigner;
};

describe("Node Client tests", function () {
  let nodeClient: NodeClient;
  let gasUsed: number;

  beforeAll(async () => {
    nodeClient = new NodeClient({ txServiceUrl: "https://sdk-backend.staging.biconomy.io/v1" });
  });

  describe("Gas Estimation Endpoints", () => {
    it("Empty test to remove warning", () => {});
  });
});
