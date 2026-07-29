import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { storage } from "./indexedDbClient";
import {
  isCacheValid,
  getValidCache,
  getRawCache,
  setCache,
  type CacheEntry,
} from "./indexeddb-cache";

// ═══════════════════════════════════════════════════════════
// MOCK DEL MÓDULO DE INDEXEDDB
//
// Reemplazamos `storage` por funciones falsas (vi.fn()) para no
// tocar una base de datos real.
vi.mock("./indexedDbClient", () => ({
  storage: {
    get: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
  },
}));

// - useFakeTimers + setSystemTime: congelan el reloj → tests
//   determinísticos (sin flakiness en los casos límite de TTL).
// - clearAllMocks: limpia el historial de llamadas de storage
//   entre tests, para que un toHaveBeenCalledWith no se contamine
//   con las llamadas del test anterior.

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T12:00:00Z"));
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

// ═══════════════════════════════════════════════════════════
// isCacheValid — función pura (lógica de TTL)
// ═══════════════════════════════════════════════════════════
describe("isCacheValid", () => {
  it("should return false when the entry is undefined", () => {
    expect(isCacheValid(undefined)).toBe(false);
  });

  it("should return true when the entry is younger than the TTL", () => {
    const entry: CacheEntry<string> = {
      data: "cached-data",
      cachedAt: Date.now() - 1000, // cacheado hace 1 segundo
    };
    // 1s < 5s → todavía válido
    expect(isCacheValid(entry, 5000)).toBe(true);
  });

  it("should return false when the entry is older than the TTL", () => {
    const entry: CacheEntry<string> = {
      data: "cached-data",
      cachedAt: Date.now() - 10000, // cacheado hace 10 segundos
    };
    // 10s > 5s → expirado
    expect(isCacheValid(entry, 5000)).toBe(false);
  });

  // Caso límite: demuestra el valor de los fake timers.
  // age === TTL exactamente; como la comparación es estricta (<),
  // debe devolver false. Con el reloj real, este test sería flaky.
  it("should return false when the age equals the TTL exactly", () => {
    const entry: CacheEntry<string> = {
      data: "cached-data",
      cachedAt: Date.now() - 5000, // exactamente 5s de edad
    };
    expect(isCacheValid(entry, 5000)).toBe(false);
  });

  it("should return true one millisecond before the TTL expires", () => {
    const entry: CacheEntry<string> = {
      data: "cached-data",
      cachedAt: Date.now() - 4999, // 1ms antes del límite
    };
    expect(isCacheValid(entry, 5000)).toBe(true);
  });

  // TTL por defecto: 24 horas (1000 * 60 * 60 * 24 ms)
  describe("with the default 24h TTL", () => {
    const ONE_DAY_MS = 1000 * 60 * 60 * 24;

    it("should return true just before 24h elapse", () => {
      const entry: CacheEntry<string> = {
        data: "data",
        cachedAt: Date.now() - (ONE_DAY_MS - 1000), // 24h menos 1s
      };
      expect(isCacheValid(entry)).toBe(true);
    });

    it("should return false just after 24h elapse", () => {
      const entry: CacheEntry<string> = {
        data: "data",
        cachedAt: Date.now() - (ONE_DAY_MS + 1000), // 24h más 1s
      };
      expect(isCacheValid(entry)).toBe(false);
    });
  });
});

// ═══════════════════════════════════════════════════════════
// getValidCache — devuelve los datos SOLO si la entrada es fresca
// ═══════════════════════════════════════════════════════════
describe("getValidCache", () => {
  it("should return the data when the cached entry is fresh", async () => {
    const entry: CacheEntry<string> = {
      data: "cached-movies",
      cachedAt: Date.now() - 1000, // 1s de edad
    };
    // Configuramos el mock: cuando llamen a storage.get, devuelve esta entrada
    vi.mocked(storage.get).mockResolvedValue(entry);

    const result = await getValidCache<string>("key", 5000); // TTL 5s

    expect(result).toBe("cached-movies"); // 1s < 5s → válido
  });

  it("should return undefined when the cached entry is expired", async () => {
    const entry: CacheEntry<string> = {
      data: "cached-movies",
      cachedAt: Date.now() - 10000, // 10s de edad
    };
    vi.mocked(storage.get).mockResolvedValue(entry);

    const result = await getValidCache<string>("key", 5000); // TTL 5s

    expect(result).toBeUndefined(); // 10s > 5s → expirado
  });

  it("should return undefined when there is no cached entry", async () => {
    vi.mocked(storage.get).mockResolvedValue(undefined);

    const result = await getValidCache<string>("key", 5000);

    expect(result).toBeUndefined();
  });

  it("should query storage with the given key", async () => {
    vi.mocked(storage.get).mockResolvedValue(undefined);

    await getValidCache("my-cache-key", 5000);

    // Verificamos que la función fue llamada con el argumento correcto
    expect(storage.get).toHaveBeenCalledWith("my-cache-key");
  });
});

// ═══════════════════════════════════════════════════════════
// getRawCache — devuelve la entrada cruda SIN chequear validez
// (fallback para cuando la red falla: mejor datos viejos que nada)
// ═══════════════════════════════════════════════════════════
describe("getRawCache", () => {
  it("should return the raw entry even if it is expired", async () => {
    const entry: CacheEntry<string> = {
      data: "stale-data",
      cachedAt: Date.now() - 999999999, // muy vieja
    };
    vi.mocked(storage.get).mockResolvedValue(entry);

    const result = await getRawCache<string>("key");

    // A diferencia de getValidCache, NO filtra por TTL
    expect(result).toEqual(entry);
  });

  it("should return undefined when there is no entry", async () => {
    vi.mocked(storage.get).mockResolvedValue(undefined);

    const result = await getRawCache<string>("key");

    expect(result).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════
// setCache — envuelve los datos con el timestamp actual y guarda
// ═══════════════════════════════════════════════════════════
describe("setCache", () => {
  it("should save the data wrapped with the current timestamp", async () => {
    vi.mocked(storage.save).mockResolvedValue(undefined);

    await setCache("key", { movies: [1, 2, 3] });

    expect(storage.save).toHaveBeenCalledWith(
      { data: { movies: [1, 2, 3] }, cachedAt: Date.now() },
      "key",
    );
  });

  it("should stamp cachedAt with the frozen 'now'", async () => {
    vi.mocked(storage.save).mockResolvedValue(undefined);

    await setCache("key", "payload");

    // Leemos con qué argumentos se llamó al mock (primer llamado, primer argumento)
    const savedEntry = vi.mocked(storage.save).mock
      .calls[0][0] as CacheEntry<string>;
    expect(savedEntry.cachedAt).toBe(
      new Date("2026-01-01T12:00:00Z").getTime(),
    );
  });
});
