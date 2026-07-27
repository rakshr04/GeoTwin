import { supabase } from './supabase';

const configuredBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.trim();

export const apiBaseUrl = (
  configuredBaseUrl || 'http://localhost:4000/api/v1'
).replace(/\/+$/, '');

interface ApiEnvelope<T> {
  data: T;
  requestId: string;
  timestamp: string;
  warnings: string[];
}

interface ApiErrorEnvelope {
  error?: {
    code?: string;
    message?: string;
    fieldErrors?: Array<{ message: string }>;
  };
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors: string[];

  constructor(
    message: string,
    status: number,
    code = 'API_ERROR',
    fieldErrors: string[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export interface ApiRequestOptions
  extends Omit<RequestInit, 'body'> {
  body?: unknown;
  timeoutMs?: number;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new ApiError(
      'Your session has expired. Please sign in again.',
      401,
      'UNAUTHENTICATED',
    );
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? 15_000,
  );
  try {
    const response = await fetch(
      `${apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`,
      {
        ...options,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          ...options.headers,
        },
        body:
          options.body === undefined
            ? undefined
            : JSON.stringify(options.body),
      },
    );
    const payload = (await response
      .json()
      .catch(() => ({}))) as
      | ApiEnvelope<T>
      | ApiErrorEnvelope;
    if (!response.ok) {
      const errorPayload = payload as ApiErrorEnvelope;
      if (response.status === 401) {
        await supabase.auth.signOut();
      }
      throw new ApiError(
        errorPayload.error?.message ??
          `Request failed with status ${response.status}.`,
        response.status,
        errorPayload.error?.code,
        errorPayload.error?.fieldErrors?.map(
          (item) => item.message,
        ) ?? [],
      );
    }
    return (payload as ApiEnvelope<T>).data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (
      error instanceof DOMException &&
      error.name === 'AbortError'
    ) {
      throw new ApiError(
        'The request timed out. Please try again.',
        408,
        'REQUEST_TIMEOUT',
      );
    }
    throw new ApiError(
      'The GeoTwin service could not be reached.',
      0,
      'NETWORK_ERROR',
    );
  } finally {
    window.clearTimeout(timeout);
  }
}
