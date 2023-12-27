export const extractChainId = (url: string): number => {
  try {
    const regex = /\/api\/v2\/(\d+)\/[a-zA-Z0-9.-]+$/;
    const match = regex.exec(url)!;
    return parseInt(match[1]);
  } catch (error) {
    throw new Error("Invalid chain id");
  }
};
