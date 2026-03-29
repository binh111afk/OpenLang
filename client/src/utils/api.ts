export function getApiBaseUrl() {
  return (
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.NEXT_PUBLIC_API_BASE_URL ||
    ''
  );
}

export function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const baseUrl = getApiBaseUrl();

  return baseUrl ? `${baseUrl}${normalizedPath}` : normalizedPath;
}

export async function fetchJson<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(buildApiUrl(path), init);
  const contentType = response.headers.get('content-type') || '';
  const rawText = await response.text();

  let payload: unknown = null;

  if (rawText) {
    try {
      payload = JSON.parse(rawText);
    } catch {
      if (contentType.includes('text/html') || rawText.startsWith('<') || rawText.startsWith('The page')) {
        throw new Error(
          'API không trả về JSON. Trên môi trường deploy, bạn cần cấu hình `VITE_API_BASE_URL` trỏ tới backend đang chạy `/api/*`.',
        );
      }

      throw new Error(rawText);
    }
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as { error: unknown }).error)
        : `API request failed with status ${response.status}.`;

    throw new Error(message);
  }

  return payload as T;
}
