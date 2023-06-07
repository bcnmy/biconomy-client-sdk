import { PaymasterAPI } from '@biconomy/account-abstraction'
import { BiconomyVerifyingPaymasterAPI } from '@biconomy/account-abstraction'
import { BiconomyTokenPaymasterAPI } from '@biconomy/account-abstraction'
import { PaymasterServiceDataType } from '@biconomy/core-types'
import { Logger } from '@biconomy/common'
import fetch from 'node-fetch'

export enum HttpMethod {
  Get = 'get',
  Post = 'post',
  Delete = 'delete'
}

/* eslint-disable  @typescript-eslint/no-explicit-any */
interface HttpRequest {
  url: string
  method: HttpMethod
  body?: Record<string, any>
  headers?: object
}

export async function sendRequest<T>({ url, method, body, headers = {} }: HttpRequest): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: {
      ...headers,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })

  let jsonResponse
  try {
    jsonResponse = await response.json()
  } catch (error) {
    if (!response.ok) {
      throw new Error(response.statusText)
    }
  }

  if (response.ok) {
    return jsonResponse as T
  }
  if (jsonResponse.error) {
    throw new Error(jsonResponse.error)
  }
  if (jsonResponse.message) {
    throw new Error(jsonResponse.message)
  }
  if (jsonResponse.msg) {
    throw new Error(jsonResponse.msg)
  }
  if (jsonResponse.data) {
    throw new Error(jsonResponse.data)
  }
  if (jsonResponse.detail) {
    throw new Error(jsonResponse.detail)
  }
  if (jsonResponse.message) {
    throw new Error(jsonResponse.message)
  }
  if (jsonResponse.nonFieldErrors) {
    throw new Error(jsonResponse.nonFieldErrors)
  }
  if (jsonResponse.delegate) {
    throw new Error(jsonResponse.delegate)
  }
  throw new Error(response.statusText)
}

export async function getPaymaster(
  paymasterUrl: string
): Promise<PaymasterAPI<PaymasterServiceDataType> | undefined> {
  Logger.log('paymasterUrl being passed ', paymasterUrl)

  try {
    const response: any = await sendRequest({
      url: `${paymasterUrl}`,
      method: HttpMethod.Post,
      body: {
        method: 'pm_getPaymasterType',
        params: [],
        id: 4337,
        jsonrpc: '2.0'
      }
    })

    if (response && response.result) {
      // todo // define enums
      if (response.result.type == 'TOKEN') {
        const paymasterAPI = new BiconomyTokenPaymasterAPI({
          paymasterUrl: paymasterUrl,
          strictSponsorshipMode: false
        }) as PaymasterAPI<PaymasterServiceDataType>

        paymasterAPI.paymasterAddress = response.result.address
        return paymasterAPI
      } else if (response.result.type == 'VERIFYING') {
        const paymasterAPI = new BiconomyVerifyingPaymasterAPI({
          paymasterUrl: paymasterUrl,
          strictSponsorshipMode: false
        }) as PaymasterAPI<PaymasterServiceDataType>

        paymasterAPI.paymasterAddress = response.result.address
        return paymasterAPI
      } else {
        return undefined
      }
    } else {
      return undefined
    }
  } catch (error) {
    Logger.error("can't query paymaster type and address error: ", error)
    return undefined
  }
}
