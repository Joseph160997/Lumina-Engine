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
import {
  makeRawMovie,
  makeRawDetail,
  makeRawCast,
  makeRawVideo,
  makeRawGenre,
  makeListResponse,
} from "../../../test/factories/tmdb";

// ═══════════════════════════════════════════════════════════
// isTmdbRawMovieDto
// ═══════════════════════════════════════════════════════════

describe("isTmdbRawMovieDto", () => {
  it("should accept a complete valid movie DTO", () => {
    expect(isTmdbRawMovieDto(makeRawMovie())).toBe(true);
  });

  // ── Nullables permitidos: backdrop_path y poster_path pueden ser null ──
  it("should accept backdrop_path as null", () => {
    expect(isTmdbRawMovieDto(makeRawMovie({ backdrop_path: null }))).toBe(true);
  });

  it("should accept poster_path as null", () => {
    expect(isTmdbRawMovieDto(makeRawMovie({ poster_path: null }))).toBe(true);
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
    const invalid = { ...makeRawMovie(), id: "not-a-number" };
    expect(isTmdbRawMovieDto(invalid)).toBe(false);
  });

  it("should reject when vote_average is not a number", () => {
    const invalid = { ...makeRawMovie(), vote_average: "not-a-number" };
    expect(isTmdbRawMovieDto(invalid)).toBe(false);
  });

  // ── Rechazo por campo faltante ──

  it("should reject when genre_ids is not an array", () => {
    const invalid = { ...makeRawMovie(), genre_ids: "not-an-array" };
    expect(isTmdbRawMovieDto(invalid)).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════
// isTmdbRawGenreDto
// ═══════════════════════════════════════════════════════════

describe("isTmdbRawGenreDto", () => {
  it("should accept a valid genre DTO", () => {
    expect(isTmdbRawGenreDto(makeRawGenre())).toBe(true);
  });

  it("should reject null", () => {
    expect(isTmdbRawGenreDto(null)).toBe(false);
  });

  it("should reject when name is missing", () => {
    expect(isTmdbRawGenreDto(makeRawGenre({ name: undefined }))).toBe(false);
  });

  it("should reject when id is not a number", () => {
    const invalid = { ...makeRawGenre(), id: "not-a-number" };
    expect(isTmdbRawGenreDto(invalid)).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════
// isTmdbGenreListResponseDto
// ═══════════════════════════════════════════════════════════

describe("isTmdbGenreListResponseDto", () => {
  it("should accept a valid genre list response", () => {
    expect(
      isTmdbGenreListResponseDto({
        genres: [makeRawGenre(), makeRawGenre({ id: 12, name: "Adventure" })],
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
      isTmdbGenreListResponseDto({ genres: [makeRawGenre(), { id: "bad" }] }),
    ).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════
// isTmdbRawCastDto
// ═══════════════════════════════════════════════════════════

describe("isTmdbRawCastDto", () => {
  it("should accept a valid cast DTO", () => {
    expect(isTmdbRawCastDto(makeRawCast())).toBe(true);
  });

  // profile_path es nullable (actores sin foto)
  it("should accept profile_path as null", () => {
    expect(isTmdbRawCastDto(makeRawCast({ profile_path: null }))).toBe(true);
  });

  it("should reject when character is missing", () => {
    expect(isTmdbRawCastDto(makeRawCast({ character: undefined }))).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════
// isTmdbRawVideoDto — valida string literals con Sets
// ═══════════════════════════════════════════════════════════

describe("isTmdbRawVideoDto", () => {
  it("should accept a valid video DTO", () => {
    expect(isTmdbRawVideoDto(makeRawVideo())).toBe(true);
  });

  // Caso clave: `site` fuera del Set permitido → rechazo
  it("should reject an unsupported site", () => {
    const invalid = { ...makeRawVideo(), site: "Disney" };
    expect(isTmdbRawVideoDto(invalid)).toBe(false);
  });

  // Caso clave: `type` fuera del Set permitido → rechazo
  it("should reject an unsupported type", () => {
    const invalid = { ...makeRawVideo(), type: "Frame" };
    expect(isTmdbRawVideoDto(invalid)).toBe(false);
  });

  it("should reject when official is not a boolean", () => {
    const invalid = { ...makeRawVideo(), official: "not-a-boolean" };
    expect(isTmdbRawVideoDto(invalid)).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════
// isTmdbMovieListResponseDto
// ═══════════════════════════════════════════════════════════

describe("isTmdbMovieListResponseDto", () => {
  it("should accept a valid list response", () => {
    expect(isTmdbMovieListResponseDto(makeListResponse())).toBe(true);
  });

  it("should accept an empty results array", () => {
    expect(isTmdbMovieListResponseDto(makeListResponse({ results: [] }))).toBe(
      true,
    );
  });

  it("should reject when page is not a number", () => {
    const page = { ...makeListResponse(), page: "not-a-number" };
    expect(isTmdbMovieListResponseDto(page)).toBe(false);
  });

  // Caso clave: results con UN movie inválido invalida toda la página
  it("should reject when any movie in results is invalid", () => {
    const results = { ...makeListResponse(), results: [makeRawMovie(), {}] };
    expect(isTmdbMovieListResponseDto(results)).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════
// isTmdbRawMovieDetailDto — campos opcionales (credits/videos)
// ═══════════════════════════════════════════════════════════

describe("isTmdbRawMovieDetailDto", () => {
  it("should accept a complete valid detail DTO", () => {
    expect(isTmdbRawMovieDetailDto(makeRawDetail())).toBe(true);
  });

  // Caso clave: credits y videos son OPCIONALES (undefined es válido)
  it("should accept when credits and videos are absent", () => {
    expect(
      isTmdbRawMovieDetailDto(
        makeRawDetail({ credits: undefined, videos: undefined }),
      ),
    ).toBe(true);
  });

  // Caso clave: si credits ESTÁ presente pero mal formado → rechazo
  it("should reject when credits is present but malformed", () => {
    const invalid = { ...makeRawDetail(), credits: "nope" };
    expect(isTmdbRawMovieDetailDto(invalid)).toBe(false);
  });

  it("should reject when videos is present but malformed", () => {
    const invalid = { ...makeRawDetail(), videos: "nope" };
    expect(isTmdbRawMovieDetailDto(invalid)).toBe(false);
  });

  // El detail NO debe tener genre_ids (viene genres como objetos)
  it("should reject when runtime is missing", () => {
    expect(isTmdbRawMovieDetailDto(makeRawDetail({ runtime: undefined }))).toBe(
      false,
    );
  });

  it("should accept runtime as null", () => {
    expect(isTmdbRawMovieDetailDto(makeRawDetail({ runtime: null }))).toBe(
      true,
    );
  });

  it("should reject null", () => {
    expect(isTmdbRawMovieDetailDto(null)).toBe(false);
  });
});
