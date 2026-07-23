/**
 * Jerarquía de errores para el cliente HTTP (`httpClient`).
 *
 * Todas las clases heredan de `HttpClientError`, lo que permite:
 * 1. Distinguir errores propios del cliente HTTP de cualquier otro error
 *    inesperado del código de negocio, vía `instanceof HttpClientError`.
 * 2. Usar `kind` como discriminante en un `switch` exhaustivo verificado
 *    en tiempo de compilación (ver `httpClient.ts` para el caso de uso).
 *
 * NOTA IMPORTANTE sobre narrowing: tipar una variable como `HttpClientError`
 * (la clase abstracta) NO le permite a TypeScript expandirla automáticamente
 * a la unión de sus subclases concretas — TypeScript no puede asumir que
 * conoce todas las subclases que existen en el programa (mundo abierto).
 * Por eso exportamos también `AnyHttpClientError`: una unión explícita y
 * cerrada, que sí permite narrowing completo (acceso a `timeoutMs`, `status`,
 * etc. dentro de cada `case` de un switch sobre `kind`).
 */

/** Valores posibles del discriminante `kind`, en un solo lugar reusable. */
export type HttpClientErrorKind =
  "timeout" | "cancelled" | "http" | "validation" | "network";

/**
 * Clase base abstracta. No se instancia directamente — cada subclase
 * fija su propio `kind` literal.
 */
export abstract class HttpClientError extends Error {
  abstract readonly kind: HttpClientErrorKind;

  constructor(
    message: string,
    public readonly url: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = this.constructor.name;
  }
}

/**
 * La petición excedió el tiempo límite configurado y fue abortada
 * por el `AbortController` interno del cliente (no por el caller).
 */
export class TimeoutError extends HttpClientError {
  readonly kind = "timeout" as const;

  constructor(
    url: string,
    public readonly timeoutMs: number,
  ) {
    super(
      `Petición abortada: se excedió el tiempo límite de ${timeoutMs}ms.`,
      url,
    );
  }
}

/**
 * La petición fue cancelada deliberadamente por el caller, a través
 * de la `signal` externa pasada en `options`. No representa un fallo:
 * es un resultado esperado (ej. cleanup de un `useEffect`, o una
 * búsqueda descartada por una nueva).
 */
export class CancelledError extends HttpClientError {
  readonly kind = "cancelled" as const;

  constructor(url: string) {
    super(`Petición cancelada por el caller: ${url}`, url);
  }
}

/**
 * El servidor respondió, pero con un status HTTP fuera del rango 2xx.
 * Una sola clase parametrizada por `status` cubre el conjunto abierto
 * de códigos HTTP sin necesidad de crear una clase nueva por cada código
 * que TMDB pueda devolver.
 */
export class HttpError extends HttpClientError {
  readonly kind = "http" as const;

  constructor(
    url: string,
    public readonly status: number,
    public readonly statusText: string,
  ) {
    super(`Error HTTP ${status}: ${statusText}`, url);
  }

  /** Azúcar sintáctica para diferenciar comportamiento sin nuevas clases. */
  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  get isServerError(): boolean {
    return this.status >= 500;
  }
}

/**
 * La respuesta llegó y es JSON válido, pero no cumple el shape
 * esperado según el `validator` provisto por el consumidor.
 *
 * `rawData` es para debugging interno (logs, Sentry) — nunca debe
 * mostrarse directamente al usuario final, ya que puede contener
 * cualquier estructura devuelta por el servidor.
 */
export class ValidationError extends HttpClientError {
  readonly kind = "validation" as const;

  constructor(
    url: string,
    public readonly rawData: unknown,
  ) {
    super(
      "La respuesta del servidor no coincide con el formato esperado.",
      url,
    );
  }
}

/**
 * `fetch` nunca llegó a producir una `Response` (DNS caído, sin
 * conexión, error de CORS, etc.). El `TypeError` original de `fetch`
 * se preserva vía `cause` para no perder contexto de diagnóstico.
 */
export class NetworkError extends HttpClientError {
  readonly kind = "network" as const;

  constructor(url: string, cause?: unknown) {
    super(`Error de red al acceder a ${url}`, url, { cause });
  }
}

/**
 * Unión cerrada de todas las subclases concretas. Úsala (en vez de
 * `HttpClientError` a secas) en cualquier punto donde necesites
 * narrowing exhaustivo por `kind` con acceso a las propiedades
 * específicas de cada subclase.
 */
export type AnyHttpClientError =
  TimeoutError | CancelledError | HttpError | ValidationError | NetworkError;
