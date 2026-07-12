import { storage } from "./indexedDbClient";

/**
 * Envoltorio genérico para cachear cualquier dato T, guardando también
 * el momento en que se cacheó — necesario para poder decidir después
 * si esa entrada sigue siendo válida o ya expiró.
 */
export interface CacheEntry<T> {
  data: T; // El dato a cachear.
  cachedAt: number; // timestamp en milisegundos (Date.now()) de cuándo se guardó la entrada.
}

/** 24 horas, en milisegundos. Ajustable por llamada si algún endpoint lo necesita distinto. */
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24;

/**
 * Determina si una entrada de caché sigue siendo válida según el TTL dado.
 * Función pura: no hace I/O, no conoce IndexedDB — solo compara timestamps.
 *
 * El tipo de retorno `entry is CacheEntry<T>` es un type predicate: le
 * permite a TypeScript "angostar" (narrow) el tipo de `entry` en el
 * código que llama a esta función. Si `isCacheValid(entry)` devuelve
 * `true`, TS sabe que `entry` NO es `undefined` de ahí en adelante,
 * sin que tengas que volver a chequear vos mismo.
 */
export function isCacheValid<T>(
  entry: CacheEntry<T> | undefined,
  ttlMs: number = DEFAULT_TTL_MS,
): entry is CacheEntry<T> {
  if (!entry) return false;
  const age = Date.now() - entry.cachedAt;
  return age < ttlMs;
}

/**
 * Busca una entrada cacheada por `key` y la devuelve SOLO si sigue
 * siendo válida según el TTL. Si no existe o expiró, devuelve `undefined`
 * — el consumidor decide qué hacer (típicamente: ir a buscarla a la API).
 */
export async function getValidCache<T>(
  key: IDBValidKey,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<T | undefined> {
  const entry = await storage.get<CacheEntry<T>>(key);
  if (!isCacheValid(entry, ttlMs)) return undefined;
  return entry.data;
}

/**
 * Busca la entrada cruda de caché para una key, SIN chequear si venció.
 * Devuelve `undefined` solo si nunca existió (o fue borrada).
 *
 * Uso previsto: fallback de última instancia cuando la petición a la API
 * falló (ej. sin conexión) — preferible mostrar datos viejos, marcados
 * como tales por quien orquesta la llamada, antes que no mostrar nada.
 * Esta función NO sabe nada de la API ni de por qué se la está llamando
 * — esa decisión vive en la capa que orquesta (el Repository), nunca acá.
 */
export async function getRawCache<T>(
  key: IDBValidKey,
): Promise<CacheEntry<T> | undefined> {
  return storage.get<CacheEntry<T>>(key);
}

/**
 * Guarda un dato en caché, envolviéndolo con el timestamp actual.
 * Usa `storage.save`, que ya requiere una `key` explícita (out-of-line).
 */
export async function setCache<T>(key: IDBValidKey, data: T): Promise<void> {
  const entry: CacheEntry<T> = {
    data,
    cachedAt: Date.now(),
  };
  return storage.save(entry, key);
}
