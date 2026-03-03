/**
 * 환경 변수에서 API 베이스 URL 목록을 가져옵니다.
 * - VITE_API_BASE_URLS: 쉼표로 구분된 여러 주소 (공백 제거)
 * - VITE_API_BASE_URL: 단일 주소 (하위 호환)
 * - 없으면 localhost:8000
 */
function getApiBaseUrls(): string[] {
  const multiple = import.meta.env.VITE_API_BASE_URLS;
  if (multiple && typeof multiple === 'string') {
    return multiple
      .split(',')
      .map((u: string) => u.trim())
      .filter(Boolean);
  }
  const single = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  return [single];
}

const BASE_URLS = getApiBaseUrls();

/**
 * 여러 베이스 URL에 대해 순서대로 시도합니다.
 * 네트워크 오류나 서버 오류(5xx) 시 다음 URL로 재시도합니다.
 * @param path - API 경로 (예: /api/generate-vocabulary)
 * @param options - fetch 옵션
 * @returns 성공한 Response (또는 마지막 실패 시 throw)
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const pathNormalized = path.startsWith('/') ? path : `/${path}`;
  let lastError: Error | null = null;

  for (const baseUrl of BASE_URLS) {
    const url = `${baseUrl.replace(/\/$/, '')}${pathNormalized}`;
    try {
      const response = await fetch(url, options);
      // 5xx면 다음 URL 시도, 그 외(2xx, 4xx)는 그대로 반환
      if (response.status >= 500) {
        lastError = new Error(`서버 오류 (${response.status}): ${url}`);
        continue;
      }
      return response;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // 네트워크 오류 등 → 다음 URL 시도
      continue;
    }
  }

  throw lastError ?? new Error('API 요청에 실패했습니다.');
}
