const DEFAULT_ERROR_MESSAGE = "요청 처리에 실패했습니다";

function errorMessage(body: unknown): string {
  if (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof body.error === "string" &&
    body.error.trim()
  ) {
    return body.error;
  }

  return DEFAULT_ERROR_MESSAGE;
}

export async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);

  if (!response.ok) {
    let body: unknown;

    try {
      body = await response.json();
    } catch {
      throw new Error(DEFAULT_ERROR_MESSAGE);
    }

    throw new Error(errorMessage(body));
  }

  return response.json() as Promise<T>;
}
