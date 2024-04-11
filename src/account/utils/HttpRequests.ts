import { Logger } from "./Logger.js"
import type { Service } from "./Types.js"

export enum HttpMethod {
  Get = "get",
  Post = "post",
  Delete = "delete"
}

/* eslint-disable  @typescript-eslint/no-explicit-any */
export interface HttpRequest {
  url: string
  method: HttpMethod
  body?: Record<string, any>
}

export async function sendRequest<T>(
  { url, method, body }: HttpRequest,
  service: Service
): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  })

  // biome-ignore lint/suspicious/noImplicitAnyLet: <explanation>
  let jsonResponse: any
  try {
    jsonResponse = await response.json()
    Logger.log(`${service} RPC Response`, jsonResponse)
  } catch (error) {
    if (!response.ok) {
      throw new Error(response.statusText)
    }
  }

  if (response.ok) {
    return jsonResponse as T
  }
  if (jsonResponse.error) {
    throw new Error(
      `Error coming from ${service}: ${jsonResponse.error.message}`
    )
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
