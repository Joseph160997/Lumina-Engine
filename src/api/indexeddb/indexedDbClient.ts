/**
 * Servicio de persistencia utilizando la Web API nativa IndexedDB.
 * Patrón Singleton (una sola conexión reutilizada) + Genéricos (CRUD
 * reutilizable para cualquier forma de dato T).
 * Todos los fallos se normalizan a subclases de `IndexedDbError`
 * (ver `indexeddb-client.errors.ts`) — nunca se propaga un DOMException
 * ni una excepción nativa sin clasificar, sea síncrona o asíncrona.
 */
import {
  type AnyIndexedDbError,
  type IndexedDbOperation,
  DbBlockedError,
  DbOpenError,
  DbQuotaExceededError,
  DbTransactionError,
} from "./indexeddb-client.errors";

const DB_NAME = "lumina-db";
const DB_VERSION = 1;
const STORE_NAME = "lumina-store";

let dbInstance: IDBDatabase | null = null;

/**
 * Abre (o reutiliza) la conexión con la base de datos.
 */
const initDb = (): Promise<IDBDatabase> => {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(new DbOpenError(DB_NAME, DB_VERSION, request.error));
    };

    request.onblocked = () => {
      reject(new DbBlockedError(DB_NAME, DB_VERSION));
    };
  });
};

/**
 * Clasifica CUALQUIER fallo —evento nativo async o excepción síncrona—
 * en la subclase correcta de `IndexedDbError`. Recibe `unknown` (no
 * `DOMException | null`) porque se reutiliza en dos contextos distintos:
 * errores que llegan vía evento (`onerror`, siempre DOMException) y
 * excepciones síncronas atrapadas con try/catch (pueden ser cualquier cosa).
 */
const toStoreError = (
  cause: unknown,
  operation: IndexedDbOperation,
): AnyIndexedDbError => {
  if (cause instanceof DOMException && cause.name === "QuotaExceededError") {
    return new DbQuotaExceededError(DB_NAME, STORE_NAME, cause);
  }
  return new DbTransactionError(DB_NAME, STORE_NAME, operation, cause);
};

/** Convierte un IDBRequest (get) en una Promise tipada. */
const requestToPromise = <T>(
  request: IDBRequest<T>,
  operation: IndexedDbOperation,
): Promise<T> => {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(toStoreError(request.error, operation));
  });
};

/** Convierte una IDBTransaction (put/delete/clear) en una Promise<void>. */
const transactionToPromise = (
  transaction: IDBTransaction,
  operation: IndexedDbOperation,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () =>
      reject(toStoreError(transaction.error, operation));
    transaction.onerror = () =>
      reject(toStoreError(transaction.error, operation));
  });
};

/**
 * API pública de persistencia IndexedDB, con operaciones CRUD genéricas
 * (save/get/delete/clear) y normalización de errores a subclases de
 * `IndexedDbError` (ver `indexeddb-client.errors.ts`).
 */
export const storage = {
  async save<T>(item: T, key: IDBValidKey): Promise<void> {
    const db = await initDb();

    let transaction: IDBTransaction;
    try {
      transaction = db.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put(item, key);
    } catch (error) {
      throw toStoreError(error, "save");
    }

    return transactionToPromise(transaction, "save");
  },

  async get<T>(key: IDBValidKey): Promise<T | undefined> {
    const db = await initDb();

    let request: IDBRequest<T | undefined>;
    try {
      const transaction = db.transaction(STORE_NAME, "readonly");
      request = transaction.objectStore(STORE_NAME).get(key);
    } catch (error) {
      throw toStoreError(error, "get");
    }

    return requestToPromise(request, "get");
  },

  async delete(key: IDBValidKey): Promise<void> {
    const db = await initDb();

    let transaction: IDBTransaction;
    try {
      transaction = db.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).delete(key);
    } catch (error) {
      throw toStoreError(error, "delete");
    }

    return transactionToPromise(transaction, "delete");
  },

  async clear(): Promise<void> {
    const db = await initDb();

    let transaction: IDBTransaction;
    try {
      transaction = db.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).clear();
    } catch (error) {
      throw toStoreError(error, "clear");
    }

    return transactionToPromise(transaction, "clear");
  },
};
