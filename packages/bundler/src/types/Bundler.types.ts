export type SendUserOpResponse = {
    code: number,
    message: string,
    data: {
        transactionOd: string,
        connectionUrl: string
    }
}

export type getUserOpGasPricesResponse = {
    code: number,
    message: string,
    data: {
        maxPriorityFeePerGas: string,
        maxFeePerGas: string,
        gasPrice: string
    }
}
