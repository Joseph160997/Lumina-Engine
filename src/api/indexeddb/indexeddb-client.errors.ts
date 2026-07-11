/**
 * Jerarquía de errores para el wrapper de IndexedDB.
 *
 * Sigue el mismo patrón que `http-client.errors.ts`: una clase base
 * abstracta con un discriminante `kind`, más una unión cerrada
 * (`AnyIndexedDbError`) para narrowing exhaustivo en un `switch`.
 *
 * NOTA: `DbQuotaExceededError` se nombra con prefijo `Db` a propósito,
 * para no colisionar conceptualmente con `QuotaExceededError`, que ya
 * existe como DOMException nativa del navegador.
 */

/** Valores posibles del discriminante `kind`. */
export type IndexedDbErrorKind =
  | "open-failed"
  | "blocked"
  | "quota-exceeded"
  | "transaction-failed";

/** Operaciones puntuales que pueden fallar sobre un object store. */
export type IndexedDbOperation = "save" | "get" | "delete" | "clear";

/**
 * Clase base abstracta. No se instancia directamente — cada subclase
 * fija su propio `kind` literal.
 */
export abstract class IndexedDbError extends Error {
  abstract readonly kind: IndexedDbErrorKind;

  constructor(
    message: string,
    public readonly dbName: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = this.constructor.name;
  }
}

/**
 * `indexedDB.open()` falló antes de llegar a `onsuccess` u `onupgradeneeded`.
 * Causas típicas: navegador sin soporte (Safari en incógnito histórico),
 * corrupción del storage local, o el usuario denegó permisos de storage.
 *
 * Detectado en `request.onerror` del `open()`.
 */
export class DbOpenError extends IndexedDbError {
  readonly kind = "open-failed" as const;

  constructor(
    dbName: string,
    public readonly dbVersion: number,
    cause?: unknown,
  ) {
    super(
      `No se pudo abrir la base de datos "${dbName}" (v${dbVersion}).`,
      dbName,
      { cause },
    );
  }
}

/**
 * La apertura quedó bloqueada porque otra pestaña tiene abierta una
 * versión anterior de la misma DB y no permite completar el upgrade.
 *
 * Detectado en `request.onblocked()` del `open()`.
 *
 * IMPORTANTE: a diferencia de las otras 3, esto no es necesariamente
 * un fallo terminal — el navegador puede seguir esperando a que la
 * pestaña vieja se cierre. Se recomienda usarlo junto a un timeout
 * en el wrapper (ej. "si sigue bloqueado tras N segundos, avisar
 * al usuario"), no como rechazo inmediato de la promesa de apertura.
 */
export class DbBlockedError extends IndexedDbError {
  readonly kind = "blocked" as const;

  constructor(
    dbName: string,
    public readonly dbVersion: number,
  ) {
    super(
      `Apertura de "${dbName}" (v${dbVersion}) bloqueada por otra pestaña ` +
        `con una versión anterior abierta.`,
      dbName,
    );
  }
}

/**
 * Se superó la cuota de almacenamiento del origen al intentar escribir.
 *
 * Único error de esta jerarquía con una acción correctiva razonable:
 * el consumidor puede decidir llamar a `clear()` sobre el store (o
 * sobre entradas viejas/expiradas) y reintentar la operación.
 */
export class DbQuotaExceededError extends IndexedDbError {
  readonly kind = "quota-exceeded" as const;

  constructor(
    dbName: string,
    public readonly storeName: string,
    cause?: unknown,
  ) {
    super(
      `Cuota de almacenamiento excedida al escribir en "${storeName}" ` +
        `de la base de datos "${dbName}".`,
      dbName,
      { cause },
    );
  }
}

/**
 * Una operación puntual (get/save/delete/clear) falló dentro de una
 * transacción — constraint violation, error interno del navegador, etc.
 *
 * Detectado en `transaction.onabort` o `transaction.onerror`.
 */
export class DbTransactionError extends IndexedDbError {
  readonly kind = "transaction-failed" as const;

  constructor(
    dbName: string,
    public readonly storeName: string,
    public readonly operation: IndexedDbOperation,
    cause?: unknown,
  ) {
    super(
      `Falló la operación "${operation}" sobre "${storeName}" ` +
        `en la base de datos "${dbName}".`,
      dbName,
      { cause },
    );
  }
}

/**
 * Unión cerrada de todas las subclases concretas. Úsala para narrowing
 * exhaustivo por `kind` en un `switch`, con acceso a las propiedades
 * específicas de cada subclase.
 */
export type AnyIndexedDbError =
  | DbOpenError
  | DbBlockedError
  | DbQuotaExceededError
  | DbTransactionError;
