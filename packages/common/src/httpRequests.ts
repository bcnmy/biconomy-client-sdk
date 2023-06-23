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
    if (jsonResponse && jsonResponse.hasOwnProperty('result')) {
      return jsonResponse as T
    } else if (jsonResponse && jsonResponse.hasOwnProperty('error')) {
      const error = jsonResponse.error
      throw new Error(`JSON-RPC error: ${error}`)
    } else {
      throw new Error('Invalid JSON-RPC response')
    }
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
  // Review : ref pm service
  if (jsonResponse.statusCode == 500) {
    if (jsonResponse.message) {
      throw new Error(jsonResponse.message)
    } else {
      throw new Error(
        'Unknown Error: Raise an issue here https://github.com/bcnmy/biconomy-client-sdk/issues with reproduction steps'
      )
    }
  }
  throw new Error('Request failed with status: ' + response.status + ' ' + response.statusText)
}
