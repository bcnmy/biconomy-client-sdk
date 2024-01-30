/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import transakSDK from "@transak/transak-sdk";
import { ITransakDto, environments } from "./interface.js";

class TransakSDK {
  apiKey: string;

  /* eslint-disable  @typescript-eslint/no-explicit-any */
  transak: any;

  constructor(environment: environments, transakData: ITransakDto = {}) {
    if (environment === "PRODUCTION") {
      this.apiKey = "f7d64c91-8f89-4018-9577-9098e42290af";
    } else {
      this.apiKey = "c71ecd4a-0819-46a7-8d63-c8b7148aaf63";
    }
    const transak = new transakSDK({
      apiKey: this.apiKey,
      widgetHeight: "625px",
      widgetWidth: "500px",
      environment: environment,
      ...transakData,
    });
    this.transak = transak;
  }

  init(): void {
    try {
      this.transak.init();
      /* eslint-disable  @typescript-eslint/no-explicit-any */
    } catch (err: any) {
      throw new Error(`Error while init transakSDK ${err}`);
    }
  }

  getTransak(): any {
    return this.transak;
  }
}

export default TransakSDK;
