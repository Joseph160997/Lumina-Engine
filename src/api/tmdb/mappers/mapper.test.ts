import { describe, it, expect } from "vitest";
import {
  buildGenreCatalog,
  mapMovie,
  mapMoviePage,
  mapMovieDetail,
} from "./mapper";

import {
  makeRawMovie,
  makeRawDetail,
  makeRawCast,
  makeRawVideo,
} from "../../../test/factories/tmdb";
import { TmdbMovieListResponseDto } from "../dto/movie.dto";

// Catálogo de géneros real para los tests de mapMovie/mapMoviePage.
const genreCatalog = new Map<number, string>([
  [28, "Action"],
  [12, "Adventure"],
]);

// ═══════════════════════════════════════════════════════════
// buildGenreCatalog
// ═══════════════════════════════════════════════════════════

describe("buildGenreCatalog", () => {
  it("should build a Map keyed by genre id", () => {
    const catalog = buildGenreCatalog([
      { id: 28, name: "Action" },
      { id: 12, name: "Adventure" },
    ]);
    expect(catalog.get(28)).toBe("Action");
    expect(catalog.get(12)).toBe("Adventure");
    expect(catalog.size).toBe(2);
  });

  it("should return an empty Map for an empty array", () => {
    expect(buildGenreCatalog([]).size).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════
// mapMovie
// ═══════════════════════════════════════════════════════════

describe("mapMovie", () => {
  it("should map the base scalar fields", () => {
    const result = mapMovie(makeRawMovie(), genreCatalog);
    expect(result.id).toBe(123);
    expect(result.title).toBe("Movie Title");
    expect(result.originalTitle).toBe("Original Title");
    expect(result.overview).toBe("An overview");
    expect(result.rating).toBe(7.5);
    expect(result.voteCount).toBe(1000);
  });

  // ── toImageUrl se verifica a través de la salida ──
  it("should build posterUrl with the w500 size", () => {
    const result = mapMovie(makeRawMovie(), genreCatalog);
    expect(result.posterUrl).toBe("https://image.tmdb.org/t/p/w500/poster.jpg");
  });

  it("should build backdropUrl with the original size", () => {
    const result = mapMovie(makeRawMovie(), genreCatalog);
    expect(result.backdropUrl).toBe(
      "https://image.tmdb.org/t/p/original/backdrop.jpg",
    );
  });

  it("should return null posterUrl when poster_path is null", () => {
    const result = mapMovie(makeRawMovie({ poster_path: null }), genreCatalog);
    expect(result.posterUrl).toBeNull();
  });

  // ── toReleaseDate se verifica a través de la salida ──
  it("should parse release_date into a Date", () => {
    const result = mapMovie(makeRawMovie(), genreCatalog);
    expect(result.releaseDate).toEqual(new Date("2022-01-15"));
  });

  it("should return null releaseDate when release_date is an empty string", () => {
    const result = mapMovie(makeRawMovie({ release_date: "" }), genreCatalog);
    expect(result.releaseDate).toBeNull();
  });

  // ── mapGenreIds: lookup en catálogo + filtrado de desconocidos ──
  it("should map genre_ids to Genre objects using the catalog", () => {
    const result = mapMovie(
      makeRawMovie({ genre_ids: [28, 12] }),
      genreCatalog,
    );
    expect(result.genres).toEqual([
      { id: 28, name: "Action" },
      { id: 12, name: "Adventure" },
    ]);
  });

  it("should filter out genre_ids that are not in the catalog", () => {
    const result = mapMovie(
      makeRawMovie({ genre_ids: [28, 999] }),
      genreCatalog,
    );
    expect(result.genres).toEqual([{ id: 28, name: "Action" }]);
  });
});

// ═══════════════════════════════════════════════════════════
// mapMoviePage
// ═══════════════════════════════════════════════════════════

describe("mapMoviePage", () => {
  it("should map pagination fields and each movie", () => {
    const raw: TmdbMovieListResponseDto = {
      page: 2,
      results: [makeRawMovie({ id: 1 }), makeRawMovie({ id: 2 })],
      total_pages: 50,
      total_results: 1000,
    };
    const result = mapMoviePage(raw, genreCatalog);
    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(50);
    expect(result.totalResults).toBe(1000);
    expect(result.movies).toHaveLength(2);
    expect(result.movies[0].id).toBe(1);
    expect(result.movies[1].id).toBe(2);
  });

  it("should return empty movies for empty results", () => {
    const raw: TmdbMovieListResponseDto = {
      page: 1,
      results: [],
      total_pages: 0,
      total_results: 0,
    };
    expect(mapMoviePage(raw, genreCatalog).movies).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════
// mapMovieDetail
// ═══════════════════════════════════════════════════════════

describe("mapMovieDetail", () => {
  it("should map the detail-specific fields", () => {
    const result = mapMovieDetail(makeRawDetail());
    expect(result.runtimeMinutes).toBe(120);
    expect(result.budget).toBe(1000000);
    expect(result.revenue).toBe(5000000);
    expect(result.status).toBe("Released");
    expect(result.tagline).toBe("A tagline");
    expect(result.homepageUrl).toBe("https://example.com");
  });

  // El detail trae genres como objetos — NO usa el catálogo
  it("should map genres directly from the genre objects", () => {
    const result = mapMovieDetail(makeRawDetail());
    expect(result.genres).toEqual([{ id: 28, name: "Action" }]);
  });

  // ── mapCastMember se verifica a través de la salida ──
  it("should map cast members with w200 profile images", () => {
    const result = mapMovieDetail(makeRawDetail());
    expect(result.cast).toEqual([
      {
        id: 1,
        name: "Actor Name",
        character: "Hero",
        profileUrl: "https://image.tmdb.org/t/p/w200/profile.jpg",
      },
    ]);
  });

  it("should map a null profile_path to a null profileUrl", () => {
    const result = mapMovieDetail(
      makeRawDetail({
        credits: { cast: [makeRawCast({ profile_path: null })] },
      }),
    );
    expect(result.cast[0].profileUrl).toBeNull();
  });

  // ── mapVideo: youtubeUrl solo para YouTube ──
  it("should build youtubeUrl for YouTube videos", () => {
    const result = mapMovieDetail(makeRawDetail());
    expect(result.videos[0].youtubeUrl).toBe(
      "https://www.youtube.com/watch?v=abc123",
    );
  });

  it("should set youtubeUrl to null for non-YouTube videos", () => {
    const result = mapMovieDetail(
      makeRawDetail({ videos: { results: [makeRawVideo({ site: "Vimeo" })] } }),
    );
    expect(result.videos[0].youtubeUrl).toBeNull();
  });

  // ── Opcionales: credits/videos ausentes → arrays vacíos ──
  it("should default cast to an empty array when credits is absent", () => {
    const result = mapMovieDetail(makeRawDetail({ credits: undefined }));
    expect(result.cast).toEqual([]);
  });

  it("should default videos to an empty array when videos is absent", () => {
    const result = mapMovieDetail(makeRawDetail({ videos: undefined }));
    expect(result.videos).toEqual([]);
  });
});
