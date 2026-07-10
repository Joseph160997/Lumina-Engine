import {
  CancelledError,
  HttpError,
  NetworkError,
  TimeoutError,
  ValidationError,
  type AnyHttpClientError,
} from "./http-client.errors";

/**
 * Realiza una petición HTTP utilizando fetch con validación y timeout.
 * Lanza siempre una subclase de `HttpClientError` (ver `http-client.errors.ts`)
 * para cualquier fallo relativo al ciclo de vida de la petición.
 *
 * Excepción: una URL malformada lanza un `TypeError` nativo, sincrónico,
 * FUERA de esta jerarquía — representa un bug del caller (dev-time),
 * no un resultado posible de una petición bien formada.
 *
 * @template T - El tipo de datos esperado en la respuesta.
 * @param url - La URL a la que se realizará la petición.
 * @param options - Opciones extendidas de RequestInit con un validador opcional.
 * @param timeout - Tiempo máximo en milisegundos antes de abortar (default: 8000ms).
 * @return Promise<T> - Se resuelve con los datos tipados como T o rechaza con AnyHttpClientError.
 */
export const httpClient = async <T>(
  url: string,
  options?: RequestInit & { validator?: (data: unknown) => data is T },
  timeout: number = 8000,
): Promise<T> => {
  // Sin `if`: se valida siempre. Si esto lanza, es un bug de programación
  // (URL mal construida), no un fallo de red — se propaga tal cual.
  new URL(url);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const signal = options?.signal
      ? AbortSignal.any([controller.signal, options.signal])
      : controller.signal;

    const response = await fetch(url, { ...options, signal });

    if (!response.ok) {
      throw new HttpError(url, response.status, response.statusText);
    }

    // Se separa lectura de parseo para preservar el body crudo
    // si el JSON.parse falla (response.json() no se puede releer).
    const rawText = await response.text();
    let data: unknown;
    try {
      data = JSON.parse(rawText);
    } catch {
      throw new ValidationError(url, rawText);
    }

    if (options?.validator && !options.validator(data)) {
      throw new ValidationError(url, data);
    }

    return data as T;
  } catch (error: unknown) {
    throw normalizeError(
      error,
      url,
      timeout,
      controller.signal,
      options?.signal,
    );
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Convierte cualquier error atrapado (unknown) en una subclase concreta
 * de `HttpClientError`. Recibe solo `internalSignal: AbortSignal` (no el
 * `AbortController` completo) — Interface Segregation: la función solo
 * necesita leer `.aborted`, no acceso a `.abort()` ni al resto de la API
 * del controller. Como beneficio directo, un test unitario puede pasar
 * un `AbortSignal` de prueba sin tener que construir un controller real.
 */
function normalizeError(
  error: unknown,
  url: string,
  timeoutMs: number,
  internalSignal: AbortSignal,
  externalSignal: AbortSignal | null | undefined,
): AnyHttpClientError {
  // Ya viene clasificado desde el try — no volver a envolverlo.
  if (error instanceof HttpError || error instanceof ValidationError) {
    return error;
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    if (externalSignal?.aborted) {
      return new CancelledError(url);
    }
    if (internalSignal.aborted) {
      return new TimeoutError(url, timeoutMs);
    }
  }

  if (error instanceof TypeError) {
    return new NetworkError(url, error);
  }

  return new NetworkError(url, error);
}
