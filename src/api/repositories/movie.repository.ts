import type { MovieDetail, MoviePage } from "../../types/movie";
import { httpClient } from "../http/httpClient";
import {
  getRawCache,
  getValidCache,
  setCache,
} from "../indexeddb/indexeddb-cache";
import type {
  TmdbMovieListResponseDto,
  TmdbRawMovieDetailDto,
} from "../tmdb/dto/movie.dto";
import { mapMoviePage, mapMovieDetail } from "../tmdb/mappers/mapper";
import {
  isTmdbMovieListResponseDto,
  isTmdbRawMovieDetailDto,
} from "../tmdb/validators/movie.validator";
import {
  MovieDetailUnavailableError,
  MovieSearchUnavailableError,
} from "./movie.repository.errors";

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3/";

const options = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
};

const SEARCH_CACHE_KEY_PREFIX = "tmdb-search";
const SEARCH_CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 horas

/**
 * Busca películas por texto en TMDB, con estrategia de cache-first:
 * 1. Si hay una respuesta cacheada y vigente para esta query+page, se sirve
 *    sin tocar la red.
 * 2. Si no, se pide a la API, se valida, se cachea el DTO crudo (no el
 *    MoviePage ya mapeado — ver nota en el mapper sobre por qué) y se
 *    devuelve mapeado con el catálogo de géneros vigente.
 * 3. Si la red falla, se sirve el último cache disponible aunque esté
 *    vencido, antes de fallar por completo.
 *
 * @param query - Texto de búsqueda ingresado por el usuario.
 * @param page - Número de página de resultados (TMDB pagina de a 20).
 * @param genreCatalog - Catálogo de géneros ya resuelto (ver getGenreCatalog),
 *   inyectado en vez de resuelto internamente para no acoplar este
 *   repository al de géneros y evitar resolverlo más de una vez por sesión.
 */
export async function searchMovies(
  query: string,
  page: number,
  genreCatalog: ReadonlyMap<number, string>,
): Promise<MoviePage> {
  const cacheKey = buildSearchCacheKey(query, page);

  const cached = await getValidCache<TmdbMovieListResponseDto>(
    cacheKey,
    SEARCH_CACHE_TTL_MS,
  );

  if (cached) {
    return mapMoviePage(cached, genreCatalog);
  }

  try {
    const url = `${BASE_URL}search/movie?query=${encodeURIComponent(query)}&page=${page}&language=es-ES`;

    const response = await httpClient<TmdbMovieListResponseDto>(url, {
      ...options,
      validator: isTmdbMovieListResponseDto,
    });

    await setCache(cacheKey, response);
    return mapMoviePage(response, genreCatalog);
  } catch (error) {
    const rawCached = await getRawCache<TmdbMovieListResponseDto>(cacheKey);

    if (rawCached) {
      return mapMoviePage(rawCached.data, genreCatalog);
    }

    throw new MovieSearchUnavailableError(query, page, error);
  }
}

/**
 * Construye una clave de caché única por búsqueda: mismo prefijo para
 * todas las búsquedas (facilita reconocerlas/depurarlas en DevTools),
 * más la query normalizada (para que "Batman" y "batman" compartan
 * entrada) y la página, ya que son resultados distintos entre sí.
 */
function buildSearchCacheKey(query: string, page: number): string {
  const normalizedQuery = query.trim().toLowerCase();
  return `${SEARCH_CACHE_KEY_PREFIX}-${normalizedQuery}-${page}`;
}

const MOVIE_DETAIL_CACHE_TTL_MS = 48 * 60 * 60 * 1000; // 48 horas

export async function getMovieDetail(id: number): Promise<MovieDetail> {
  const cacheKey = buildMovieDetailCacheKey(id);

  const cached = await getValidCache<TmdbRawMovieDetailDto>(
    cacheKey,
    MOVIE_DETAIL_CACHE_TTL_MS,
  );

  if (cached) {
    return mapMovieDetail(cached);
  }

  try {
    const url = `${BASE_URL}movie/${id}?language=es-ES&append_to_response=videos,credits&include_video_language=es,en,null`;

    const response = await httpClient<TmdbRawMovieDetailDto>(url, {
      ...options,
      validator: isTmdbRawMovieDetailDto,
    });
    await setCache(cacheKey, response);
    return mapMovieDetail(response);
  } catch (error) {
    const rawCached = await getRawCache<TmdbRawMovieDetailDto>(cacheKey);

    if (rawCached) {
      return mapMovieDetail(rawCached.data);
    }

    throw new MovieDetailUnavailableError(id, error);
  }
}

function buildMovieDetailCacheKey(id: number): string {
  return `tmdb-movie-detail-${id}`;
}
