import fetch from "node-fetch";

export enum HttpMethod {
  Get = "get",
  Post = "post",
  Delete = "delete",
}

/* eslint-disable  @typescript-eslint/no-explicit-any */
interface HttpRequest {
  url: string;
  method: HttpMethod;
  body?: Record<string, any>;
}

export async function sendRequest<T>({ url, method, body }: HttpRequest): Promise<T> {
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
  } catch (error) {
    if (!response.ok) {
      throw new Error(response.statusText);
    }
  }

  if (response.ok) {
    return jsonResponse as T;
  }
  if (jsonResponse.error) {
    throw new Error(jsonResponse.error);
  }
  if (jsonResponse.message) {
    throw new Error(jsonResponse.message);
  }
  if (jsonResponse.msg) {
    throw new Error(jsonResponse.msg);
  }
  if (jsonResponse.data) {
    throw new Error(jsonResponse.data);
  }
  if (jsonResponse.detail) {
    throw new Error(jsonResponse.detail);
  }
  if (jsonResponse.message) {
    throw new Error(jsonResponse.message);
  }
  if (jsonResponse.nonFieldErrors) {
    throw new Error(jsonResponse.nonFieldErrors);
  }
  if (jsonResponse.delegate) {
    throw new Error(jsonResponse.delegate);
  }
  throw new Error(response.statusText);
}
