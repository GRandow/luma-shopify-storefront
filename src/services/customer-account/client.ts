import { getValidAccessToken, SessionExpiredError } from '@/features/auth/session';
import { useAuthStore } from '@/features/auth/auth-store';
import { getCustomerAccountConfig } from '@/services/customer-account/config';

export interface GraphQLError {
  message: string;
  extensions?: Record<string, unknown>;
}

interface GraphQLResponse<TData> {
  data?: TData | null;
  errors?: GraphQLError[];
}

export class CustomerAccountApiError extends Error {
  readonly status: number | undefined;
  readonly errors: readonly GraphQLError[];

  constructor(message: string, status?: number, errors: readonly GraphQLError[] = []) {
    super(message);
    this.name = 'CustomerAccountApiError';
    this.status = status;
    this.errors = errors;
  }
}

/**
 * Sends a query to the Customer Account API on behalf of the signed-in
 * customer. The API expects the raw access token in `Authorization` (no
 * `Bearer` prefix). An expired token is refreshed before the request; a 401
 * clears the local session so the UI can send the customer back to sign in.
 */
export async function customerAccountRequest<
  TData,
  TVariables extends object = Record<string, never>,
>(query: string, variables?: TVariables, signal?: AbortSignal): Promise<TData> {
  const config = getCustomerAccountConfig();
  const accessToken = await getValidAccessToken();

  const response = await fetch(config.graphqlEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: accessToken,
    },
    body: JSON.stringify({ query, variables }),
    signal,
  });

  if (response.status === 401) {
    useAuthStore.getState().clear();
    throw new SessionExpiredError();
  }
  if (!response.ok) {
    throw new CustomerAccountApiError(
      `Customer Account API request failed with status ${response.status}`,
      response.status,
    );
  }

  const payload = (await response.json()) as GraphQLResponse<TData>;
  if (payload.errors && payload.errors.length > 0) {
    throw new CustomerAccountApiError(
      payload.errors.map((error) => error.message).join('\n'),
      response.status,
      payload.errors,
    );
  }
  if (!payload.data) {
    throw new CustomerAccountApiError('Customer Account API returned an empty response');
  }
  return payload.data;
}
