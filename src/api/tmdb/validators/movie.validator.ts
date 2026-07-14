import type {
  TmdbRawMovieDto,
  TmdbMovieListResponseDto,
  TmdbRawMovieDetailDto,
  TmdbRawGenreDto,
  TmdbRawCastDto,
  TmdbRawVideoDto,
  TmdbRawCreditsDto,
  TmdbRawVideosDto,
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

/** Valida que un objeto sea un TmdbRawGenreDto ({ id, name }). */
export function isTmdbRawGenreDto(value: unknown): value is TmdbRawGenreDto {
  if (typeof value !== "object" || value === null) return false;
  const dto = value as Record<string, unknown>;

  return typeof dto.id === "number" && typeof dto.name === "string";
}

/** Valida que un objeto sea un TmdbRawCastDto. */
export function isTmdbRawCastDto(value: unknown): value is TmdbRawCastDto {
  if (typeof value !== "object" || value === null) return false;
  const dto = value as Record<string, unknown>;

  return (
    typeof dto.id === "number" &&
    typeof dto.name === "string" &&
    typeof dto.character === "string" &&
    (typeof dto.profile_path === "string" || dto.profile_path === null)
  );
}

/**
 * Sets con los valores literales válidos de `site` y `type` en TmdbRawVideoDto.
 * Evitan repetir comparaciones `===` en cadena y sirven como única fuente
 * de verdad si TMDB agrega un nuevo tipo de video en el futuro.
 */
const VALID_VIDEO_SITES = new Set<TmdbRawVideoDto["site"]>([
  "YouTube",
  "Vimeo",
]);

const VALID_VIDEO_TYPES = new Set<TmdbRawVideoDto["type"]>([
  "Trailer",
  "Teaser",
  "Clip",
  "Featurette",
  "Behind the Scenes",
  "Bloopers",
]);

/** Valida que un objeto sea un TmdbRawVideoDto (incluye sus string literals). */
export function isTmdbRawVideoDto(value: unknown): value is TmdbRawVideoDto {
  if (typeof value !== "object" || value === null) return false;
  const dto = value as Record<string, unknown>;

  return (
    typeof dto.id === "string" &&
    typeof dto.key === "string" &&
    typeof dto.name === "string" &&
    typeof dto.site === "string" &&
    VALID_VIDEO_SITES.has(dto.site as TmdbRawVideoDto["site"]) &&
    typeof dto.type === "string" &&
    VALID_VIDEO_TYPES.has(dto.type as TmdbRawVideoDto["type"]) &&
    typeof dto.official === "boolean"
  );
}

/**
 * Valida el sub-recurso `credits`. Es OPCIONAL en TmdbRawMovieDetailDto:
 * `undefined` es válido (TMDB no lo manda si no se pidió con append_to_response).
 * Si está presente, sí debe tener la forma correcta.
 */
function isTmdbRawCreditsDto(value: unknown): value is TmdbRawCreditsDto {
  if (typeof value !== "object" || value === null) return false;
  const dto = value as Record<string, unknown>;

  return Array.isArray(dto.cast) && dto.cast.every(isTmdbRawCastDto);
}

/** Mismo criterio que `isTmdbRawCreditsDto`, pero para `videos`. */
function isTmdbRawVideosDto(value: unknown): value is TmdbRawVideosDto {
  if (typeof value !== "object" || value === null) return false;
  const dto = value as Record<string, unknown>;

  return Array.isArray(dto.results) && dto.results.every(isTmdbRawVideoDto);
}

/**
 * Valida que un objeto sea un TmdbRawMovieDetailDto completo.
 *
 * Reutiliza `isTmdbRawMovieDto` para los campos heredados de la lista
 * (title, overview, vote_average, etc.) en vez de repetirlos: si TMDB
 * cambia esa forma base, un solo lugar se actualiza.
 *
 * `credits` y `videos` son opcionales: `undefined` pasa; si están
 * presentes, deben cumplir su propio shape.
 */
export function isTmdbRawMovieDetailDto(
  value: unknown,
): value is TmdbRawMovieDetailDto {
  if (typeof value !== "object" || value === null) return false;
  const dto = value as Record<string, unknown>;

  // TmdbRawMovieDetailDto = Omit<TmdbRawMovieDto, "genre_ids"> + campos propios.
  // isTmdbRawMovieDto exige genre_ids, que el detail NO tiene (tiene "genres"
  // en su lugar) — por eso no podemos llamarla directo sobre `dto` completo,
  // chequeamos los campos heredados salvo genre_ids explícitamente acá.
  const hasBaseFields =
    typeof dto.adult === "boolean" &&
    (typeof dto.backdrop_path === "string" || dto.backdrop_path === null) &&
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
    typeof dto.vote_count === "number";

  const hasDetailFields =
    Array.isArray(dto.genres) &&
    dto.genres.every(isTmdbRawGenreDto) &&
    (typeof dto.runtime === "number" || dto.runtime === null) &&
    typeof dto.budget === "number" &&
    typeof dto.revenue === "number" &&
    typeof dto.status === "string" &&
    (typeof dto.tagline === "string" || dto.tagline === null) &&
    (typeof dto.imdb_id === "string" || dto.imdb_id === null) &&
    (typeof dto.homepage === "string" || dto.homepage === null);

  const hasValidCredits =
    dto.credits === undefined || isTmdbRawCreditsDto(dto.credits);

  const hasValidVideos =
    dto.videos === undefined || isTmdbRawVideosDto(dto.videos);

  return hasBaseFields && hasDetailFields && hasValidCredits && hasValidVideos;
}
