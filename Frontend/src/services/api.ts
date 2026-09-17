export const MOCK_REQUEST_DELAY_MS = 2000;

type ApiErrorBody = {
  error?: {
    message?: string;
    code?: string;
  };
};

export function mockRequestDelay(duration = MOCK_REQUEST_DELAY_MS) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, duration));
}

export async function apiRequest<T>(path: string, init?: RequestInit) {
  const response = await fetch(path, {
    ...init,
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
    throw new Error(
      body.error?.message ?? "Não foi possível concluir a solicitação.",
    );
  }

  return (await response.json()) as { data: T };
}
