import type { ApiFailure, ApiSuccess } from "@openclaw/shared";

export function success<T>(requestId: string, data: T): ApiSuccess<T> {
  return {
    success: true,
    request_id: requestId,
    data
  };
}

export function failure(
  requestId: string,
  code: string,
  message: string,
  details: unknown = null
): ApiFailure {
  return {
    success: false,
    request_id: requestId,
    error: {
      code,
      message,
      details
    }
  };
}

export function createRequestId(): string {
  return `req_${crypto.randomUUID().replaceAll("-", "")}`;
}

