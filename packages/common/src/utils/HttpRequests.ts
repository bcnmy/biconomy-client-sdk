import { getAAError } from "./Helpers/getAAError.js";
import { Logger } from "./Logger.js";
import { Service } from "./Types.js";

export enum HttpMethod {
  Get = "get",
  Post = "post",
  Delete = "delete",
}

/* eslint-disable  @typescript-eslint/no-explicit-any */
export interface HttpRequest {
  url: string;
  method: HttpMethod;
  body?: Record<string, any>;
}

export async function sendRequest<T>({ url, method, body }: HttpRequest, service: Service): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  let jsonResponse;
  try {
    jsonResponse = await response.json();
    Logger.log(`${service} RPC Response`, jsonResponse);
  } catch (error) {
    if (!response.ok) {
      throw await getAAError(response.statusText, service);
    }
  }

  if (response.ok) {
    return jsonResponse as T;
  }
  if (jsonResponse.error) {
    throw await getAAError(jsonResponse.error.message, service);
  }
  if (jsonResponse.message) {
    throw await getAAError(jsonResponse.message, service);
  }
  if (jsonResponse.msg) {
    throw await getAAError(jsonResponse.msg, service);
  }
  if (jsonResponse.data) {
    throw await getAAError(jsonResponse.data, service);
  }
  if (jsonResponse.detail) {
    throw await getAAError(jsonResponse.detail, service);
  }
  if (jsonResponse.message) {
    throw await getAAError(jsonResponse.message, service);
  }
  if (jsonResponse.nonFieldErrors) {
    throw await getAAError(jsonResponse.nonFieldErrors, service);
  }
  if (jsonResponse.delegate) {
    throw await getAAError(jsonResponse.delegate, service);
  }
  throw await getAAError(response.statusText, service);
}
