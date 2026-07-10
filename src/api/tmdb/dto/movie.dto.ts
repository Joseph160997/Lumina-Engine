type TmdbMovieStatus =
  | "Rumored"
  | "Planned"
  | "In Production"
  | "Post Production"
  | "Released"
  | "Canceled";

export interface TmdbRawVideoDto {
  readonly id: string;
  readonly key: string; // ID de YouTube, ej: "dQw4w9WgXcQ"
  readonly name: string;
  readonly site: "YouTube" | "Vimeo";
  readonly type:
    | "Trailer"
    | "Teaser"
    | "Clip"
    | "Featurette"
    | "Behind the Scenes"
    | "Bloopers";
  readonly official: boolean;
}

export interface TmdbRawCastDto {
  readonly id: number;
  readonly name: string;
  readonly character: string;
  readonly profile_path: string | null;
}

// Sub-recursos que TMDB solo incluye si pides append_to_response=credits,videos
export interface TmdbRawCreditsDto {
  readonly cast: ReadonlyArray<TmdbRawCastDto>;
}

export interface TmdbRawVideosDto {
  readonly results: ReadonlyArray<TmdbRawVideoDto>;
}

/**
 * Respuesta cruda de un endpoint de lista/búsqueda de TMDB.
 * Aplica a: /discover/movie, /search/movie, /movie/popular, /movie/top_rated, etc.
 */
export interface TmdbMovieListResponseDto {
  readonly page: number;
  readonly results: ReadonlyArray<TmdbRawMovieDto>;
  readonly total_pages: number;
  readonly total_results: number;
}

/**
 * Película tal cual viene en el JSON crudo de TMDB dentro de una lista.
 * NOTA: este shape NO corresponde al endpoint de detalle (/movie/{id}),
 * que trae `genres` (objetos) en vez de `genre_ids`, además de otros
 * campos (runtime, budget, revenue, status, tagline, imdb_id, credits, videos, etc.).
 */
export interface TmdbRawMovieDto {
  readonly adult: boolean;
  readonly backdrop_path: string | null; // null si no hay imagen
  readonly genre_ids: ReadonlyArray<number>; // solo IDs; en detalle vienen objetos completos
  readonly id: number;
  readonly original_language: string; // código ISO 639-1, ej: "en"
  readonly original_title: string;
  readonly overview: string;
  readonly popularity: number;
  readonly poster_path: string | null; // ruta relativa, ej: "/abc123.jpg"
  readonly release_date: string; // "YYYY-MM-DD" o "" si es desconocida
  readonly title: string;
  readonly video: boolean;
  readonly vote_average: number;
  readonly vote_count: number;
}

export interface TmdbRawGenreDto {
  readonly id: number;
  readonly name: string;
}

/**
 * Respuesta cruda de un endpoint de detalle de TMDB (/movie/{id}).
 * Contiene todos los campos de TmdbRawMovieDto, más otros campos extra.
 * NOTA: este shape NO corresponde a la lista/búsqueda, que trae `genre_ids` (IDs) en vez de `genres` (objetos).
 */
export interface TmdbRawMovieDetailDto extends Omit<
  TmdbRawMovieDto,
  "genre_ids"
> {
  readonly genres: ReadonlyArray<TmdbRawGenreDto>;
  readonly runtime: number | null;
  readonly budget: number;
  readonly revenue: number;
  readonly status: TmdbMovieStatus;
  readonly tagline: string | null;
  readonly imdb_id: string | null;
  readonly homepage: string | null;
  readonly credits?: TmdbRawCreditsDto;
  readonly videos?: TmdbRawVideosDto;
}
