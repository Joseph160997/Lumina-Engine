import { describe, it, expect, vi, beforeEach } from "vitest";
import { httpClient } from "../http/httpClient";
import {
  getValidCache,
  getRawCache,
  setCache,
} from "../indexeddb/indexeddb-cache";
import {
  searchMovies,
  getMovieDetail,
  getFeaturedMovies,
} from "./movie.repository";
import {
  MovieSearchUnavailableError,
  MovieDetailUnavailableError,
  FeaturedMoviesUnavailableError,
} from "./movie.repository.errors";
import { makeListResponse, makeRawDetail } from "../../test/factories/tmdb";

// ═══════════════════════════════════════════════════════════
// MOCKS DE LA I/O
//
// Mockeamos httpClient (la red) y la capa de caché (IndexedDB).
// Los mappers NO se mockean: corren de verdad para verificar que
// el DTO se transforma correctamente al modelo de dominio.
// ═══════════════════════════════════════════════════════════
vi.mock("../http/httpClient", () => ({
  httpClient: vi.fn(),
}));

vi.mock("../indexeddb/indexeddb-cache", () => ({
  getValidCache: vi.fn(),
  getRawCache: vi.fn(),
  setCache: vi.fn(),
}));

// Catálogo de géneros real (los mappers lo usan para resolver genre_ids).
const genreCatalog = new Map<number, string>([
  [28, "Action"],
  [12, "Adventure"],
]);

describe("movie.repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────
  // searchMovies
  // ─────────────────────────────────────────────────────────
  describe("searchMovies", () => {
    // Escenario 1: cache hit → no toca la red
    it("should return cached results without hitting the network when the cache is valid", async () => {
      vi.mocked(getValidCache).mockResolvedValue(makeListResponse());

      const result = await searchMovies("batman", 1, genreCatalog);

      expect(result.movies).toHaveLength(1);
      expect(httpClient).not.toHaveBeenCalled();
      expect(setCache).not.toHaveBeenCalled();
    });

    // Escenario 2: cache miss + red OK → cachea y devuelve
    it("should fetch from the network and cache the response when the cache is empty", async () => {
      vi.mocked(getValidCache).mockResolvedValue(undefined);
      vi.mocked(httpClient).mockResolvedValue(makeListResponse());

      const result = await searchMovies("batman", 1, genreCatalog);

      expect(httpClient).toHaveBeenCalledTimes(1);
      expect(setCache).toHaveBeenCalledTimes(1); // guardó en caché
      expect(result.movies).toHaveLength(1);
    });

    // Escenario 3: red falla + caché vencida → degradación graciosa
    it("should fall back to stale cache when the network fails", async () => {
      vi.mocked(getValidCache).mockResolvedValue(undefined);
      vi.mocked(httpClient).mockRejectedValue(new Error("network down"));
      vi.mocked(getRawCache).mockResolvedValue({
        data: makeListResponse(),
        cachedAt: 0, // vencida, pero usable como último recurso
      });

      const result = await searchMovies("batman", 1, genreCatalog);

      expect(result.movies).toHaveLength(1); // datos viejos > nada
    });

    // Escenario 4: red falla + sin caché → error tipado
    it("should throw MovieSearchUnavailableError when both network and cache fail", async () => {
      vi.mocked(getValidCache).mockResolvedValue(undefined);
      vi.mocked(httpClient).mockRejectedValue(new Error("network down"));
      vi.mocked(getRawCache).mockResolvedValue(undefined);

      await expect(searchMovies("batman", 1, genreCatalog)).rejects.toThrow(
        MovieSearchUnavailableError,
      );
    });

    // Escenario 5: la query se normaliza (mayúsculas/minúsculas comparten caché)
    it("should normalize the query case when building the cache key", async () => {
      vi.mocked(getValidCache).mockResolvedValue(makeListResponse());

      await searchMovies("BATMAN", 1, genreCatalog);

      expect(getValidCache).toHaveBeenCalledWith(
        expect.stringContaining("batman"), // normalizada a minúsculas
        expect.any(Number),
      );
    });
  });

  // ─────────────────────────────────────────────────────────
  // getMovieDetail
  // ─────────────────────────────────────────────────────────
  describe("getMovieDetail", () => {
    it("should return cached detail without hitting the network when the cache is valid", async () => {
      vi.mocked(getValidCache).mockResolvedValue(makeRawDetail());

      const result = await getMovieDetail(123);

      expect(result.id).toBe(123);
      expect(httpClient).not.toHaveBeenCalled();
    });

    it("should fetch from the network and cache when the cache is empty", async () => {
      vi.mocked(getValidCache).mockResolvedValue(undefined);
      vi.mocked(httpClient).mockResolvedValue(makeRawDetail());

      const result = await getMovieDetail(123);

      expect(httpClient).toHaveBeenCalledTimes(1);
      expect(setCache).toHaveBeenCalledTimes(1);
      expect(result.id).toBe(123);
    });

    it("should fall back to stale cache when the network fails", async () => {
      vi.mocked(getValidCache).mockResolvedValue(undefined);
      vi.mocked(httpClient).mockRejectedValue(new Error("network down"));
      vi.mocked(getRawCache).mockResolvedValue({
        data: makeRawDetail(),
        cachedAt: 0,
      });

      const result = await getMovieDetail(123);

      expect(result.id).toBe(123);
    });

    it("should throw MovieDetailUnavailableError when both network and cache fail", async () => {
      vi.mocked(getValidCache).mockResolvedValue(undefined);
      vi.mocked(httpClient).mockRejectedValue(new Error("network down"));
      vi.mocked(getRawCache).mockResolvedValue(undefined);

      await expect(getMovieDetail(123)).rejects.toThrow(
        MovieDetailUnavailableError,
      );
    });
  });

  // ─────────────────────────────────────────────────────────
  // getFeaturedMovies
  // ─────────────────────────────────────────────────────────
  describe("getFeaturedMovies", () => {
    it("should return cached featured without hitting the network when the cache is valid", async () => {
      vi.mocked(getValidCache).mockResolvedValue(makeListResponse());

      const result = await getFeaturedMovies(genreCatalog);

      expect(result.movies).toHaveLength(1);
      expect(httpClient).not.toHaveBeenCalled();
    });

    it("should fetch from the network and cache when the cache is empty", async () => {
      vi.mocked(getValidCache).mockResolvedValue(undefined);
      vi.mocked(httpClient).mockResolvedValue(makeListResponse());

      const result = await getFeaturedMovies(genreCatalog);

      expect(httpClient).toHaveBeenCalledTimes(1);
      expect(setCache).toHaveBeenCalledTimes(1);
      expect(result.movies).toHaveLength(1);
    });

    it("should fall back to stale cache when the network fails", async () => {
      vi.mocked(getValidCache).mockResolvedValue(undefined);
      vi.mocked(httpClient).mockRejectedValue(new Error("network down"));
      vi.mocked(getRawCache).mockResolvedValue({
        data: makeListResponse(),
        cachedAt: 0,
      });

      const result = await getFeaturedMovies(genreCatalog);

      expect(result.movies).toHaveLength(1);
    });

    it("should throw FeaturedMoviesUnavailableError when both network and cache fail", async () => {
      vi.mocked(getValidCache).mockResolvedValue(undefined);
      vi.mocked(httpClient).mockRejectedValue(new Error("network down"));
      vi.mocked(getRawCache).mockResolvedValue(undefined);

      await expect(getFeaturedMovies(genreCatalog)).rejects.toThrow(
        FeaturedMoviesUnavailableError,
      );
    });
  });
});
