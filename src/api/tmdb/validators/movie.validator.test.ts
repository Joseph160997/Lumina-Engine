import { describe, it, expect } from "vitest";
import {
  isTmdbRawMovieDto,
  isTmdbMovieListResponseDto,
  isTmdbGenreListResponseDto,
  isTmdbRawGenreDto,
  isTmdbRawCastDto,
  isTmdbRawVideoDto,
  isTmdbRawMovieDetailDto,
} from "./movie.validator";

// ═══════════════════════════════════════════════════════════
// FACTORIES — un objeto válido por validator, con overrides
// para generar casos inválidos sin repetir el fixture.
// Retornan `unknown` porque testeamos datos potencialmente corruptos.
// ═══════════════════════════════════════════════════════════

const makeMovieDto = (overrides: Record<string, unknown> = {}): unknown => ({
  adult: false,
  backdrop_path: "/backdrop.jpg",
  genre_ids: [28, 12],
  id: 123,
  original_language: "en",
  original_title: "Test Movie",
  overview: "A test overview",
  popularity: 100.5,
  poster_path: "/poster.jpg",
  release_date: "2022-01-01",
  title: "Test Movie",
  video: false,
  vote_average: 7.5,
  vote_count: 1000,
  ...overrides,
});

const makeGenreDto = (overrides: Record<string, unknown> = {}): unknown => ({
  id: 28,
  name: "Action",
  ...overrides,
});

const makeCastDto = (overrides: Record<string, unknown> = {}): unknown => ({
  id: 1,
  name: "Actor Name",
  character: "Hero",
  profile_path: "/profile.jpg",
  ...overrides,
});

const makeVideoDto = (overrides: Record<string, unknown> = {}): unknown => ({
  id: "abc123",
  key: "dQw4w9WgXcQ",
  name: "Official Trailer",
  site: "YouTube",
  type: "Trailer",
  official: true,
  ...overrides,
});

const makeMovieDetailDto = (
  overrides: Record<string, unknown> = {},
): unknown => ({
  // Campos heredados de la lista (SIN genre_ids — el detail no lo tiene)
  adult: false,
  backdrop_path: "/backdrop.jpg",
  id: 123,
  original_language: "en",
  original_title: "Test Movie",
  overview: "A test overview",
  popularity: 100.5,
  poster_path: "/poster.jpg",
  release_date: "2022-01-01",
  title: "Test Movie",
  video: false,
  vote_average: 7.5,
  vote_count: 1000,
  // Campos propios del detail
  genres: [{ id: 28, name: "Action" }],
  runtime: 120,
  budget: 1000000,
  revenue: 5000000,
  status: "Released",
  tagline: "A tagline",
  imdb_id: "tt1234567",
  homepage: "https://example.com",
  credits: { cast: [makeCastDto()] },
  videos: { results: [makeVideoDto()] },
  ...overrides,
});

// ═══════════════════════════════════════════════════════════
// isTmdbRawMovieDto
// ═══════════════════════════════════════════════════════════

describe("isTmdbRawMovieDto", () => {
  it("should accept a complete valid movie DTO", () => {
    expect(isTmdbRawMovieDto(makeMovieDto())).toBe(true);
  });

  // ── Nullables permitidos: backdrop_path y poster_path pueden ser null ──
  it("should accept backdrop_path as null", () => {
    expect(isTmdbRawMovieDto(makeMovieDto({ backdrop_path: null }))).toBe(true);
  });

  it("should accept poster_path as null", () => {
    expect(isTmdbRawMovieDto(makeMovieDto({ poster_path: null }))).toBe(true);
  });

  // ── Rechazo de no-objetos ──
  it("should reject null", () => {
    expect(isTmdbRawMovieDto(null)).toBe(false);
  });

  it("should reject a primitive (string)", () => {
    expect(isTmdbRawMovieDto("not an object")).toBe(false);
  });

  it("should reject an empty object", () => {
    expect(isTmdbRawMovieDto({})).toBe(false);
  });

  // ── Rechazo por tipo incorrecto en un campo ──
  it("should reject when id is not a number", () => {
    expect(isTmdbRawMovieDto(makeMovieDto({ id: "not-a-number" }))).toBe(false);
  });

  it("should reject when vote_average is not a number", () => {
    expect(isTmdbRawMovieDto(makeMovieDto({ vote_average: "7.5" }))).toBe(
      false,
    );
  });

  // ── Rechazo por campo faltante ──
  it("should reject when title is missing", () => {
    expect(isTmdbRawMovieDto(makeMovieDto({ title: undefined }))).toBe(false);
  });

  it("should reject when genre_ids is not an array", () => {
    expect(isTmdbRawMovieDto(makeMovieDto({ genre_ids: "28" }))).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════
// isTmdbRawGenreDto
// ═══════════════════════════════════════════════════════════

describe("isTmdbRawGenreDto", () => {
  it("should accept a valid genre DTO", () => {
    expect(isTmdbRawGenreDto(makeGenreDto())).toBe(true);
  });

  it("should reject null", () => {
    expect(isTmdbRawGenreDto(null)).toBe(false);
  });

  it("should reject when name is missing", () => {
    expect(isTmdbRawGenreDto(makeGenreDto({ name: undefined }))).toBe(false);
  });

  it("should reject when id is not a number", () => {
    expect(isTmdbRawGenreDto(makeGenreDto({ id: "28" }))).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════
// isTmdbGenreListResponseDto
// ═══════════════════════════════════════════════════════════

describe("isTmdbGenreListResponseDto", () => {
  it("should accept a valid genre list response", () => {
    expect(
      isTmdbGenreListResponseDto({
        genres: [makeGenreDto(), makeGenreDto({ id: 12, name: "Adventure" })],
      }),
    ).toBe(true);
  });

  it("should accept an empty genres array", () => {
    expect(isTmdbGenreListResponseDto({ genres: [] })).toBe(true);
  });

  it("should reject when genres is not an array", () => {
    expect(isTmdbGenreListResponseDto({ genres: "not-array" })).toBe(false);
  });

  // Caso clave: un array con UN elemento inválido invalida todo
  it("should reject when any genre in the array is invalid", () => {
    expect(
      isTmdbGenreListResponseDto({ genres: [makeGenreDto(), { id: "bad" }] }),
    ).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════
// isTmdbRawCastDto
// ═══════════════════════════════════════════════════════════

describe("isTmdbRawCastDto", () => {
  it("should accept a valid cast DTO", () => {
    expect(isTmdbRawCastDto(makeCastDto())).toBe(true);
  });

  // profile_path es nullable (actores sin foto)
  it("should accept profile_path as null", () => {
    expect(isTmdbRawCastDto(makeCastDto({ profile_path: null }))).toBe(true);
  });

  it("should reject when character is missing", () => {
    expect(isTmdbRawCastDto(makeCastDto({ character: undefined }))).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════
// isTmdbRawVideoDto — valida string literals con Sets
// ═══════════════════════════════════════════════════════════

describe("isTmdbRawVideoDto", () => {
  it("should accept a valid video DTO", () => {
    expect(isTmdbRawVideoDto(makeVideoDto())).toBe(true);
  });

  // Caso clave: `site` fuera del Set permitido → rechazo
  it("should reject an unsupported site", () => {
    expect(isTmdbRawVideoDto(makeVideoDto({ site: "Dailymotion" }))).toBe(
      false,
    );
  });

  // Caso clave: `type` fuera del Set permitido → rechazo
  it("should reject an unsupported type", () => {
    expect(isTmdbRawVideoDto(makeVideoDto({ type: "Interview" }))).toBe(false);
  });

  it("should reject when official is not a boolean", () => {
    expect(isTmdbRawVideoDto(makeVideoDto({ official: "yes" }))).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════
// isTmdbMovieListResponseDto
// ═══════════════════════════════════════════════════════════

describe("isTmdbMovieListResponseDto", () => {
  const makeListResponse = (
    overrides: Record<string, unknown> = {},
  ): unknown => ({
    page: 1,
    results: [makeMovieDto()],
    total_pages: 10,
    total_results: 200,
    ...overrides,
  });

  it("should accept a valid list response", () => {
    expect(isTmdbMovieListResponseDto(makeListResponse())).toBe(true);
  });

  it("should accept an empty results array", () => {
    expect(isTmdbMovieListResponseDto(makeListResponse({ results: [] }))).toBe(
      true,
    );
  });

  it("should reject when page is not a number", () => {
    expect(isTmdbMovieListResponseDto(makeListResponse({ page: "1" }))).toBe(
      false,
    );
  });

  // Caso clave: results con UN movie inválido invalida toda la página
  it("should reject when any movie in results is invalid", () => {
    expect(
      isTmdbMovieListResponseDto(
        makeListResponse({ results: [makeMovieDto(), { id: "bad" }] }),
      ),
    ).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════
// isTmdbRawMovieDetailDto — campos opcionales (credits/videos)
// ═══════════════════════════════════════════════════════════

describe("isTmdbRawMovieDetailDto", () => {
  it("should accept a complete valid detail DTO", () => {
    expect(isTmdbRawMovieDetailDto(makeMovieDetailDto())).toBe(true);
  });

  // Caso clave: credits y videos son OPCIONALES (undefined es válido)
  it("should accept when credits and videos are absent", () => {
    expect(
      isTmdbRawMovieDetailDto(
        makeMovieDetailDto({ credits: undefined, videos: undefined }),
      ),
    ).toBe(true);
  });

  // Caso clave: si credits ESTÁ presente pero mal formado → rechazo
  it("should reject when credits is present but malformed", () => {
    expect(
      isTmdbRawMovieDetailDto(
        makeMovieDetailDto({ credits: { cast: "nope" } }),
      ),
    ).toBe(false);
  });

  it("should reject when videos is present but malformed", () => {
    expect(
      isTmdbRawMovieDetailDto(
        makeMovieDetailDto({ videos: { results: "nope" } }),
      ),
    ).toBe(false);
  });

  // El detail NO debe tener genre_ids (viene genres como objetos)
  it("should reject when runtime is missing", () => {
    expect(
      isTmdbRawMovieDetailDto(makeMovieDetailDto({ runtime: undefined })),
    ).toBe(false);
  });

  it("should accept runtime as null", () => {
    expect(isTmdbRawMovieDetailDto(makeMovieDetailDto({ runtime: null }))).toBe(
      true,
    );
  });

  it("should reject null", () => {
    expect(isTmdbRawMovieDetailDto(null)).toBe(false);
  });
});
