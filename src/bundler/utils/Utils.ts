export const extractChainIdFromUrl = (url: string) => {
  try {
    const pathSegments = new URL(url).pathname.split("/");
    const chainId = pathSegments[3];
    const chainIdNumber = Number.parseInt(chainId);

    if (!chainId || isNaN(chainIdNumber)) {
      throw new Error();
    }

    return chainIdNumber;
  } catch {
    throw new Error("Invalid chain id");
  }
};

export const extractChainIdFromBundlerUrl = (url: string): number =>
  extractChainIdFromUrl(url);

export const extractChainIdFromPaymasterUrl = (url: string): number =>
  extractChainIdFromUrl(url);
