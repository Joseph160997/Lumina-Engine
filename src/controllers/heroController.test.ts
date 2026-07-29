import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getNextHeroIndex } from "./heroController";
import { setHeroMovies } from "../state/heroState";
import type { Movie } from "../types/movie";

// ═══════════════════════════════════════════════════════════
// Factory local de Movie.
// getNextHeroIndex solo usa `.length`, pero setHeroMovies exige
// Movie[] tipado, así que construimos objetos válidos.
const makeMovie = (overrides: Partial<Movie> = {}): Movie => ({
  id: 1,
  title: "Test Movie",
  originalTitle: "Test Movie",
  overview: "An overview",
  posterUrl: null,
  backdropUrl: null,
  releaseDate: null,
  rating: 7.5,
  voteCount: 100,
  genres: [],
  ...overrides,
});

/** Crea N películas con ids distintos. */
const makeMovies = (count: number): Movie[] =>
  Array.from({ length: count }, (_, i) => makeMovie({ id: i + 1 }));

describe("getNextHeroIndex", () => {
  // Cargamos un estado conocido ANTES de cada test: 3 películas
  // (índices válidos: 0, 1, 2). Usamos la API pública setHeroMovies.
  beforeEach(() => {
    setHeroMovies(makeMovies(3));
  });

  // Limpiamos el estado DESPUÉS de cada test para que ninguno
  // contamine al siguiente. El aislamiento entre tests es sagrado.
  afterEach(() => {
    setHeroMovies([]);
  });

  it("should advance to the next index", () => {
    expect(getNextHeroIndex(0)).toBe(1);
    expect(getNextHeroIndex(1)).toBe(2);
  });

  // Caso clave: wrap-around. (2 + 1) % 3 = 0 → vuelve al inicio.
  it("should wrap around to 0 when at the last index", () => {
    expect(getNextHeroIndex(2)).toBe(0);
  });

  // Guardia defensiva: sin películas, no hay índice válido → 0.
  it("should return 0 when there are no movies", () => {
    setHeroMovies([]);
    expect(getNextHeroIndex(0)).toBe(0);
  });

  // Con una sola película, siempre volvemos a ella: (0 + 1) % 1 = 0.
  it("should return 0 when there is a single movie", () => {
    setHeroMovies(makeMovies(1));
    expect(getNextHeroIndex(0)).toBe(0);
  });
});
