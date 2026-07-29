import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isCacheValid, type CacheEntry } from "./indexeddb-cache";

// ═══════════════════════════════════════════════════════════
// isCacheValid
//
// Congelamos el reloj con fake timers para que Date.now() sea
// determinístico. Sin esto, los casos límite (edad ≈ TTL) serían
// flaky por los microsegundos entre el Date.now() del test y el
// de la función.
// ═══════════════════════════════════════════════════════════

describe("isCacheValid", () => {
  // Se ejecuta ANTES de cada test: fija el "ahora" a una fecha conocida.
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00Z"));
  });

  // Se ejecuta DESPUÉS de cada test: restaura el reloj real para no
  // contaminar otros archivos de test.
  afterEach(() => {
    vi.useRealTimers();
  });

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
    // 5000 < 5000 es false → expirado
    expect(isCacheValid(entry, 5000)).toBe(false);
  });

  it("should return true one millisecond before the TTL expires", () => {
    const entry: CacheEntry<string> = {
      data: "cached-data",
      cachedAt: Date.now() - 4999, // 1ms antes del límite
    };
    // 4999 < 5000 es true → todavía válido
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
