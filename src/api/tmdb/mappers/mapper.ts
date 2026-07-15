import type {
  TmdbMovieListResponseDto,
  TmdbRawMovieDto,
  TmdbRawMovieDetailDto,
  TmdbRawCastDto,
  TmdbRawVideoDto,
  TmdbRawGenreDto,
} from "../dto/movie.dto";
import type {
  Movie,
  MovieDetail,
  MoviePage,
  Genre,
  CastMember,
  Video,
} from "../../../types/movie";

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p";
const YOUTUBE_WATCH_URL = "https://www.youtube.com/watch?v=";

/** Construye una URL completa de imagen o null si no hay path. */
function toImageUrl(
  path: string | null,
  size: "w200" | "w342" | "w500" | "original" = "w500",
): string | null {
  return path ? `${IMAGE_BASE_URL}/${size}${path}` : null;
}

/** TMDB manda "" cuando no conoce la fecha; lo normalizamos a null. */
function toReleaseDate(raw: string): Date | null {
  return raw ? new Date(raw) : null;
}

/**
 * Convierte genre_ids (solo números) a objetos Genre completos,
 * usando un catálogo de géneros ya cargado (ver nota más abajo).
 */
function mapGenreIds(
  genreIds: ReadonlyArray<number>,
  genreCatalog: ReadonlyMap<number, string>,
): ReadonlyArray<Genre> {
  return genreIds
    .map((id) => {
      const name = genreCatalog.get(id);
      return name ? { id, name } : null;
    })
    .filter((genre): genre is Genre => genre !== null);
}

/** Convierte un arreglo de géneros crudos de TMDB a objetos Genre de dominio.
 */
function mapGenres(
  raw: ReadonlyArray<{ id: number; name: string }>,
): ReadonlyArray<Genre> {
  return raw.map(({ id, name }) => ({ id, name }));
}

function mapCastMember(raw: TmdbRawCastDto): CastMember {
  return {
    id: raw.id,
    name: raw.name,
    character: raw.character,
    profileUrl: toImageUrl(raw.profile_path, "w200"),
  };
}

function mapVideo(raw: TmdbRawVideoDto): Video {
  return {
    id: raw.id,
    key: raw.key,
    name: raw.name,
    type: raw.type,
    isOfficial: raw.official,
    youtubeUrl:
      raw.site === "YouTube" ? `${YOUTUBE_WATCH_URL}${raw.key}` : null,
  };
}

/** Crea un catálogo de géneros para mapear IDs a nombres. */
export function buildGenreCatalog(
  genres: ReadonlyArray<TmdbRawGenreDto>,
): ReadonlyMap<number, string> {
  return new Map(
    genres.map((genre): [number, string] => [genre.id, genre.name]),
  );
}

/**
 * Mapea una película de lista/búsqueda.
 * Requiere el catálogo de géneros porque el DTO solo trae IDs sueltos.
 */
export function mapMovie(
  raw: TmdbRawMovieDto,
  genreCatalog: ReadonlyMap<number, string>,
): Movie {
  return {
    id: raw.id,
    title: raw.title,
    originalTitle: raw.original_title,
    overview: raw.overview,
    posterUrl: toImageUrl(raw.poster_path),
    backdropUrl: toImageUrl(raw.backdrop_path, "original"),
    releaseDate: toReleaseDate(raw.release_date),
    rating: raw.vote_average,
    voteCount: raw.vote_count,
    genres: mapGenreIds(raw.genre_ids, genreCatalog),
  };
}

export function mapMoviePage(
  raw: TmdbMovieListResponseDto,
  genreCatalog: ReadonlyMap<number, string>,
): MoviePage {
  return {
    page: raw.page,
    totalPages: raw.total_pages,
    totalResults: raw.total_results,
    movies: raw.results.map((movie) => mapMovie(movie, genreCatalog)),
  };
}

/**
 * Mapea el detalle completo de una película.
 * Aquí NO se necesita el catálogo de géneros porque el DTO
 * ya trae genres como objetos completos ({id, name}).
 */
export function mapMovieDetail(raw: TmdbRawMovieDetailDto): MovieDetail {
  return {
    id: raw.id,
    title: raw.title,
    originalTitle: raw.original_title,
    overview: raw.overview,
    posterUrl: toImageUrl(raw.poster_path),
    backdropUrl: toImageUrl(raw.backdrop_path, "original"),
    releaseDate: toReleaseDate(raw.release_date),
    rating: raw.vote_average,
    voteCount: raw.vote_count,
    genres: mapGenres(raw.genres),
    runtimeMinutes: raw.runtime,
    budget: raw.budget,
    revenue: raw.revenue,
    status: raw.status,
    tagline: raw.tagline,
    homepageUrl: raw.homepage,
    cast: raw.credits?.cast.map(mapCastMember) ?? [],
    videos: raw.videos?.results.map(mapVideo) ?? [],
  };
}
