export type Bundlerconfig = {
    bundlerUrl: string,
    epAddress: string
}

export type UserOpResponse = {
    data: {
        transactionId: string,
        connectionUrl: string
    }
}

export type UserOpGasFieldsResponse = {
    result: {
        preVerificationGas: string,
        verificationGasLimit: string,
        callGasLimit: string,
        maxPriorityFeePerGas: string,
        maxFeePerGas: string,
        gasPrice: string
    }
}
