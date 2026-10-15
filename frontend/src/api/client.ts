const BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export interface FieldError {
  field: string
  message: string
}

export class ApiError extends Error {
  status: number
  code: string
  details: FieldError[]

  constructor(message: string, status: number, code = 'error', details: FieldError[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init.headers },
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    throw new ApiError('Cannot reach the server. Make sure the backend is running.', 0, 'network_error')
  }

  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const e = body?.error
    // A gateway error with no API error body means the backend itself is down (e.g. dev proxy).
    if (!e && [502, 503, 504].includes(res.status)) {
      throw new ApiError('Cannot reach the server. Make sure the backend is running.', res.status, 'network_error')
    }
    throw new ApiError(e?.message ?? `Request failed (${res.status})`, res.status, e?.code, e?.details ?? [])
  }
  return body as T
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong'
}
