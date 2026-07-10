import type {
  TmdbRawMovieDto,
  TmdbMovieListResponseDto,
} from "../dto/movie.dto";

/** Valida que un objeto sea un TmdbRawMovieDto */

export function isTmdbRawMovieDto(value: unknown): value is TmdbRawMovieDto {
  if (typeof value !== "object" || value === null) return false;
  const dto = value as Record<string, unknown>;

  return (
    typeof dto.adult === "boolean" &&
    (typeof dto.backdrop_path === "string" || dto.backdrop_path === null) &&
    Array.isArray(dto.genre_ids) &&
    typeof dto.id === "number" &&
    typeof dto.original_language === "string" &&
    typeof dto.original_title === "string" &&
    typeof dto.overview === "string" &&
    typeof dto.popularity === "number" &&
    (typeof dto.poster_path === "string" || dto.poster_path === null) &&
    typeof dto.release_date === "string" &&
    typeof dto.title === "string" &&
    typeof dto.video === "boolean" &&
    typeof dto.vote_average === "number" &&
    typeof dto.vote_count === "number"
  );
}

/** Valida que un objeto sea un TmdbMovieListResponseDto */
export function isTmdbMovieListResponseDto(
  value: unknown,
): value is TmdbMovieListResponseDto {
  if (typeof value !== "object" || value === null) return false;

  const dto = value as Record<string, unknown>;

  return (
    typeof dto.page === "number" &&
    typeof dto.total_pages === "number" &&
    typeof dto.total_results === "number" &&
    Array.isArray(dto.results) &&
    dto.results.every(isTmdbRawMovieDto)
  );
}
