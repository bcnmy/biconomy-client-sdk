export type Bundlerconfig = {
    bundlerUrl: string,
    entryPointAddress: string
}

export type UserOpResponse = {
    data: {
        transactionOd: string,
        connectionUrl: string
    }
}

export type UserOpGasPricesResponse = {
    result: {
        preVerificationGas: string,
        verificationGasLimit: string,
        callGasLimit: string,
        maxPriorityFeePerGas: string,
        maxFeePerGas: string,
        gasPrice: string
    }
}
