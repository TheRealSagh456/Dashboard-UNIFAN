type ApiErrorBody = {
  error?: {
    message?: string;
    code?: string;
  };
};

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
