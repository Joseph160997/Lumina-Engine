import type {
  TmdbRawMovieDto,
  TmdbRawGenreDto,
  TmdbRawCastDto,
  TmdbRawVideoDto,
  TmdbRawMovieDetailDto,
  TmdbMovieListResponseDto,
  TmdbGenreListResponseDto,
} from "../../api/tmdb/dto/movie.dto";

/**
 * Factories de fixtures para los DTOs crudos de TMDB.
 *
 * Patrón "factory con overrides": cada función devuelve un objeto VÁLIDO
 * completo; pasándole un Partial<T> se pisan campos puntuales. Centraliza
 * la forma de los DTOs para que validator, mapper y futuros tests compartan
 * una única fuente de verdad.
 *
 * Para crear objetos INVÁLIDOS (tests del validator), usá spread + override
 * en el punto de uso — ver nota en movie.validator.test.ts.
 */

export const makeRawMovie = (
  overrides: Partial<TmdbRawMovieDto> = {},
): TmdbRawMovieDto => ({
  adult: false,
  backdrop_path: "/backdrop.jpg",
  genre_ids: [28, 12],
  id: 123,
  original_language: "en",
  original_title: "Original Title",
  overview: "An overview",
  popularity: 100,
  poster_path: "/poster.jpg",
  release_date: "2022-01-15",
  title: "Movie Title",
  video: false,
  vote_average: 7.5,
  vote_count: 1000,
  ...overrides,
});

export const makeRawGenre = (
  overrides: Partial<TmdbRawGenreDto> = {},
): TmdbRawGenreDto => ({
  id: 28,
  name: "Action",
  ...overrides,
});

export const makeRawCast = (
  overrides: Partial<TmdbRawCastDto> = {},
): TmdbRawCastDto => ({
  id: 1,
  name: "Actor Name",
  character: "Hero",
  profile_path: "/profile.jpg",
  ...overrides,
});

export const makeRawVideo = (
  overrides: Partial<TmdbRawVideoDto> = {},
): TmdbRawVideoDto => ({
  id: "v1",
  key: "abc123",
  name: "Official Trailer",
  site: "YouTube",
  type: "Trailer",
  official: true,
  ...overrides,
});

/**
 * Detalle de película. Compone makeRawMovie (reutiliza la base) y le
 * quita `genre_ids`, que el endpoint de detalle NO trae (trae `genres`
 * como objetos completos). Buen ejemplo de composición de factories.
 */
export const makeRawDetail = (
  overrides: Partial<TmdbRawMovieDetailDto> = {},
): TmdbRawMovieDetailDto => {
  const { genre_ids: _sinGenreIds, ...base } = makeRawMovie();
  return {
    ...base,
    genres: [makeRawGenre()],
    runtime: 120,
    budget: 1000000,
    revenue: 5000000,
    status: "Released",
    tagline: "A tagline",
    imdb_id: "tt1234567",
    homepage: "https://example.com",
    credits: { cast: [makeRawCast()] },
    videos: { results: [makeRawVideo()] },
    ...overrides,
  };
};

export const makeListResponse = (
  overrides: Partial<TmdbMovieListResponseDto> = {},
): TmdbMovieListResponseDto => ({
  page: 1,
  results: [makeRawMovie()],
  total_pages: 10,
  total_results: 200,
  ...overrides,
});

export const makeGenreListResponse = (
  overrides: Partial<TmdbGenreListResponseDto> = {},
): TmdbGenreListResponseDto => ({
  genres: [makeRawGenre()],
  ...overrides,
});
