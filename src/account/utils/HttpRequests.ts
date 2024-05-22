import { getAAError } from "../../bundler/utils/getAAError.js"
import { Logger } from "./Logger.js"
import type { Service } from "./Types.js"

export enum HttpMethod {
  Get = "get",
  Post = "post",
  Delete = "delete"
}

export interface HttpRequest {
  url: string
  method: HttpMethod
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  body?: Record<string, any>
}

export async function sendRequest<T>(
  { url, method, body }: HttpRequest,
  service: Service
): Promise<T> {
  const stringifiedBody = JSON.stringify(body)
  Logger.log(`${service} RPC Request`, { url, body: stringifiedBody })

  const response = await fetch(url, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: stringifiedBody
  })

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  let jsonResponse: any
  try {
    jsonResponse = await response.json()
    Logger.log(`${service} RPC Response`, jsonResponse)
  } catch (error) {
    if (!response.ok) {
      throw await getAAError(response.statusText, response.status, service)
    }
  }

  if (response.ok) {
    return jsonResponse as T
  }
  if (jsonResponse.error) {
    throw await getAAError(
      `Error coming from ${service}: ${jsonResponse.error.message}`
    )
  }
  if (jsonResponse.message) {
    throw await getAAError(jsonResponse.message, response.status, service)
  }
  if (jsonResponse.msg) {
    throw await getAAError(jsonResponse.msg, response.status, service)
  }
  if (jsonResponse.data) {
    throw await getAAError(jsonResponse.data, response.status, service)
  }
  if (jsonResponse.detail) {
    throw await getAAError(jsonResponse.detail, response.status, service)
  }
  if (jsonResponse.message) {
    throw await getAAError(jsonResponse.message, response.status, service)
  }
  if (jsonResponse.nonFieldErrors) {
    throw await getAAError(
      jsonResponse.nonFieldErrors,
      response.status,
      service
    )
  }
  if (jsonResponse.delegate) {
    throw await getAAError(jsonResponse.delegate, response.status, service)
  }
  throw await getAAError(response.statusText, response.status, service)
}
