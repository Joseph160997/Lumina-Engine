import { describe, it, expect, vi, beforeEach } from "vitest";
import { toggleMovieFavorite } from "./favoritesController";
import { getCurrentMovies } from "../state/appState";
import { getHeroMovies } from "../state/heroState";
import {
  getFavorites,
  isMovieFavorite,
  toggleFavorite,
} from "../services/favoritesServices";
import { makeMovie } from "../test/factories/movie";

// ═══════════════════════════════════════════════════════════
// MOCKS DE LOS MÓDULOS DEPENDIENTES
//
// Usamos importOriginal para preservar el resto de las exportaciones
// de cada módulo y pisar SOLO las funciones que usa el controller.
// Es la forma robusta: si mañana el controller importa algo más del
// mismo módulo, el mock no se rompe.
// ═══════════════════════════════════════════════════════════
vi.mock("../state/appState", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../state/appState")>();
  return { ...actual, getCurrentMovies: vi.fn() };
});

vi.mock("../state/heroState", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../state/heroState")>();
  return { ...actual, getHeroMovies: vi.fn() };
});

vi.mock("../services/favoritesServices", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../services/favoritesServices")>();
  return {
    ...actual,
    getFavorites: vi.fn(),
    isMovieFavorite: vi.fn(),
    toggleFavorite: vi.fn(),
  };
});

describe("toggleMovieFavorite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Estado inicial: las tres fuentes vacías. Cada test pisa lo que necesita.
    vi.mocked(getCurrentMovies).mockReturnValue([]);
    vi.mocked(getHeroMovies).mockReturnValue([]);
    vi.mocked(getFavorites).mockReturnValue([]);
  });

  it("should toggle a movie found in the current grid", () => {
    const movie = makeMovie({ id: 1 });
    vi.mocked(getCurrentMovies).mockReturnValue([movie]);
    vi.mocked(isMovieFavorite).mockReturnValue(true); // estado post-toggle

    const result = toggleMovieFavorite(1);

    expect(toggleFavorite).toHaveBeenCalledWith(movie);
    expect(result).toBe(true);
  });

  // no funcionaba porque findMovieById no buscaba en heroMovies.
  it("should toggle a movie found in the hero carousel", () => {
    const movie = makeMovie({ id: 2 });
    vi.mocked(getHeroMovies).mockReturnValue([movie]);
    vi.mocked(isMovieFavorite).mockReturnValue(true);

    const result = toggleMovieFavorite(2);

    expect(toggleFavorite).toHaveBeenCalledWith(movie);
    expect(result).toBe(true);
  });

  it("should toggle a movie found in favorites (e.g. removing it)", () => {
    const movie = makeMovie({ id: 3 });
    vi.mocked(getFavorites).mockReturnValue([movie]);
    vi.mocked(isMovieFavorite).mockReturnValue(false); // ya no es favorita

    const result = toggleMovieFavorite(3);

    expect(toggleFavorite).toHaveBeenCalledWith(movie);
    expect(result).toBe(false);
  });

  // Guardia: si la película no está en ninguna fuente, NO se togglea
  // (no tenemos el objeto Movie para pasarle a toggleFavorite).
  it("should NOT toggle when the movie is not in any source", () => {
    vi.mocked(isMovieFavorite).mockReturnValue(false);

    const result = toggleMovieFavorite(999);

    expect(toggleFavorite).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });

  // Verifica el orden del ?? : currentMovies gana sobre heroMovies y favorites.
  it("should prioritize currentMovies over heroMovies and favorites", () => {
    const gridMovie = makeMovie({ id: 1, title: "From Grid" });
    const heroMovie = makeMovie({ id: 1, title: "From Hero" });
    vi.mocked(getCurrentMovies).mockReturnValue([gridMovie]);
    vi.mocked(getHeroMovies).mockReturnValue([heroMovie]);
    vi.mocked(isMovieFavorite).mockReturnValue(true);

    toggleMovieFavorite(1);

    expect(toggleFavorite).toHaveBeenCalledWith(gridMovie);
  });
});
