import { describe, it, expect, vi, beforeEach } from "vitest";
import { getData, saveData } from "./storage";
import {
  getFavorites,
  isMovieFavorite,
  toggleFavorite,
} from "./favoritesServices";
import { makeMovie } from "../test/factories/movie";
import type { Movie } from "../types/movie";

// ═══════════════════════════════════════════════════════════
// MOCK DE LA CAPA DE STORAGE (localStorage)
//
// Reemplazamos getData/saveData por funciones falsas para testear
// la lógica de negocio de favoritos sin tocar el almacenamiento
// real. La lógica no debe saber de dónde vienen los datos.
// ═══════════════════════════════════════════════════════════
vi.mock("./storage", () => ({
  getData: vi.fn(),
  saveData: vi.fn(),
}));

// Clave privada del módulo — la replicamos para verificar que
// saveData guarda en el lugar correcto.
const FAVS_KEY = "lumina_favorites";

/**
 * Simula una entrada tal como la devuelve JSON.parse desde
 * localStorage: las fechas vienen como STRINGS ISO (no como Date).
 * Es el formato real que getFavorites debe "revivir".
 */
const makeRawStored = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  title: "Test Movie",
  originalTitle: "Test Movie",
  overview: "An overview",
  posterUrl: null,
  backdropUrl: null,
  releaseDate: "2022-01-15T00:00:00.000Z", // string ISO, como viene de JSON
  rating: 7.5,
  voteCount: 100,
  genres: [],
  ...overrides,
});

describe("favoritesServices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────
  // getFavorites — lee, filtra corruptos y revive fechas
  // ─────────────────────────────────────────────────────────
  describe("getFavorites", () => {
    it("should return an empty array when storage is empty", () => {
      vi.mocked(getData).mockReturnValue(null);
      expect(getFavorites()).toEqual([]);
    });

    it("should return an empty array when storage holds a non-array value", () => {
      vi.mocked(getData).mockReturnValue({ not: "an array" });
      expect(getFavorites()).toEqual([]);
    });

    // El test más valioso: garantiza que reviveMovie reconstruye el Date.
    it("should revive releaseDate from an ISO string to a Date instance", () => {
      vi.mocked(getData).mockReturnValue([makeRawStored()]);

      const result = getFavorites();

      expect(result[0].releaseDate).toBeInstanceOf(Date);
      expect(result[0].releaseDate).toEqual(
        new Date("2022-01-15T00:00:00.000Z"),
      );
    });

    it("should keep releaseDate as null when the stored value is null", () => {
      vi.mocked(getData).mockReturnValue([
        makeRawStored({ releaseDate: null }),
      ]);
      expect(getFavorites()[0].releaseDate).toBeNull();
    });

    // isFavoriteEntry es defensivo: descarta entradas corruptas del storage.
    it("should filter out corrupt entries that lack a numeric id", () => {
      vi.mocked(getData).mockReturnValue([
        makeRawStored({ id: 1 }),
        { id: "not-a-number", title: "Corrupt" }, // id no numérico
        null, // entrada nula
      ]);

      const result = getFavorites();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });
  });

  // ─────────────────────────────────────────────────────────
  // isMovieFavorite — pertenencia por id
  // ─────────────────────────────────────────────────────────
  describe("isMovieFavorite", () => {
    it("should return true when the movie id is in favorites", () => {
      vi.mocked(getData).mockReturnValue([makeRawStored({ id: 5 })]);
      expect(isMovieFavorite(5)).toBe(true);
    });

    it("should return false when the movie id is not in favorites", () => {
      vi.mocked(getData).mockReturnValue([makeRawStored({ id: 5 })]);
      expect(isMovieFavorite(99)).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────
  // toggleFavorite — agrega o quita, y persiste
  // ─────────────────────────────────────────────────────────
  describe("toggleFavorite", () => {
    it("should add a movie that is not yet a favorite", () => {
      vi.mocked(getData).mockReturnValue([]); // sin favoritos
      const movie = makeMovie({ id: 7 });

      toggleFavorite(movie);

      expect(saveData).toHaveBeenCalledWith(FAVS_KEY, [movie]);
    });

    it("should remove a movie that is already a favorite", () => {
      vi.mocked(getData).mockReturnValue([makeRawStored({ id: 7 })]);
      const movie = makeMovie({ id: 7 });

      toggleFavorite(movie);

      expect(saveData).toHaveBeenCalledWith(FAVS_KEY, []); // removida
    });

    it("should preserve the other favorites when removing one", () => {
      vi.mocked(getData).mockReturnValue([
        makeRawStored({ id: 1 }),
        makeRawStored({ id: 7 }),
      ]);

      toggleFavorite(makeMovie({ id: 7 }));

      // Inspeccionamos con qué se llamó a saveData (2º argumento)
      const saved = vi.mocked(saveData).mock.calls[0][1] as Movie[];
      expect(saved).toHaveLength(1);
      expect(saved[0].id).toBe(1); // la 7 fue removida, la 1 se conserva
    });
  });
});
