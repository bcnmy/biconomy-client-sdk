import fetch from 'node-fetch'
import { Logger } from './Logger'

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
  Logger.log('jsonRpc request body ', JSON.stringify(body))
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
  Logger.log('jsonRpc response ', jsonResponse)

  if (response.ok) {
    if (jsonResponse && jsonResponse.hasOwnProperty('result')) {
      return jsonResponse as T
    }
    // else
  }
  const errorObject = { code: response.status, message: response.statusText, data: undefined }

  if (jsonResponse?.error) {
    if (typeof jsonResponse.error === 'string') {
      const error = jsonResponse.error
      errorObject.code = response.status
      errorObject.message = error
      delete errorObject.data
      throw errorObject
    } else if (typeof jsonResponse.error === 'object') {
      const error = jsonResponse.error
      errorObject.code = error?.code
      errorObject.message = error?.message
      errorObject.data = error?.handleOpsCallData
      throw errorObject
    }
  }
  if (jsonResponse?.message) {
    errorObject.message = jsonResponse.message
    throw errorObject
  }
  if (jsonResponse?.msg) {
    errorObject.message = jsonResponse.msg
    throw errorObject
  }

  throw new Error(
    'Unknown Error: Raise an issue here https://github.com/bcnmy/biconomy-client-sdk/issues with reproduction steps'
  )
}
