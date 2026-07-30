import type { Movie } from "../../types/movie";

/**
 * Factory de Movie (modelo de dominio, no DTO).
 * Mismo patrón que tmdb.ts: objeto válido por defecto + overrides puntuales.
 */
export const makeMovie = (overrides: Partial<Movie> = {}): Movie => ({
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
export const makeMovies = (count: number): Movie[] =>
  Array.from({ length: count }, (_, i) => makeMovie({ id: i + 1 }));
