export async function readApiResponse<T>(response: Response): Promise<T> {
  let body: T & { error?: string };
  try {
    body = (await response.json()) as T & { error?: string };
  } catch {
    throw new Error(`Request failed with HTTP ${response.status}`);
  }

  if (!response.ok) {
    throw new Error(body.error ?? `Request failed with HTTP ${response.status}`);
  }
  return body;
}
