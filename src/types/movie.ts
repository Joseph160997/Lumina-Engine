export interface Genre {
  readonly id: number;
  readonly name: string;
}

export interface CastMember {
  readonly id: number;
  readonly name: string;
  readonly character: string;
  readonly profileUrl: string | null;
}

export interface Video {
  readonly id: string;
  readonly key: string;
  readonly name: string;
  readonly type: string;
  readonly isOfficial: boolean;
  readonly youtubeUrl: string | null; // ya resuelto, listo para usar
}

/**
 * Película tal como la consume el resto de la app.
 * Corresponde a una entrada de lista/búsqueda (TmdbRawMovieDto).
 */
export interface Movie {
  readonly id: number;
  readonly title: string;
  readonly originalTitle: string;
  readonly overview: string;
  readonly posterUrl: string | null;
  readonly backdropUrl: string | null;
  readonly releaseDate: Date | null;
  readonly rating: number; // antes vote_average
  readonly voteCount: number;
  readonly genres: ReadonlyArray<Genre>;
}

/**
 * Película con el detalle completo.
 * Corresponde al endpoint /movie/{id} (TmdbRawMovieDetailDto).
 */
export interface MovieDetail extends Omit<Movie, "genres"> {
  readonly genres: ReadonlyArray<Genre>;
  readonly runtimeMinutes: number | null;
  readonly budget: number;
  readonly revenue: number;
  readonly status: string;
  readonly tagline: string | null;
  readonly homepageUrl: string | null;
  readonly cast: ReadonlyArray<CastMember>;
  readonly videos: ReadonlyArray<Video>;
}

/**
 * Página de resultados, ya en formato de dominio.
 */
export interface MoviePage {
  readonly page: number;
  readonly totalPages: number;
  readonly totalResults: number;
  readonly movies: ReadonlyArray<Movie>;
}
