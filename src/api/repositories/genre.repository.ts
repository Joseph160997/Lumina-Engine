import { httpClient } from "../http/httpClient";
import {
  getRawCache,
  getValidCache,
  setCache,
} from "../indexeddb/indexeddb-cache";
import type { TmdbGenreListResponseDto } from "../tmdb/dto/movie.dto";
import { buildGenreCatalog } from "../tmdb/mappers/mapper";
import { isTmdbGenreListResponseDto } from "../tmdb/validators/movie.validator";
import { GenreCatalogUnavailableError } from "./genre.repository.errors";

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const options = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
};

const GENRE_CACHE_KEY = "tmdb-genre-catalog";
const GENRE_CATALOG_TTL_MS = 15 * 24 * 60 * 60 * 1000; // 15 días

export async function getGenreCatalog(): Promise<ReadonlyMap<number, string>> {
  // Primero intento obtener el catálogo de géneros desde la caché válida.
  const cachedCatalog = await getValidCache<TmdbGenreListResponseDto>(
    GENRE_CACHE_KEY,
    GENRE_CATALOG_TTL_MS,
  );

  if (cachedCatalog) {
    // Si hay un catálogo válido en caché, lo mapeo a un ReadonlyMap y lo devuelvo.
    return buildGenreCatalog(cachedCatalog.genres);
  }

  // Si no hay un catálogo válido en caché, intento obtenerlo de la red.
  try {
    const url = "https://api.themoviedb.org/3/genre/movie/list?language=es-ES";
    const response = await httpClient<TmdbGenreListResponseDto>(url, {
      ...options,
      validator: isTmdbGenreListResponseDto,
    });

    // Si la respuesta es válida, la cacheo y devuelvo el catálogo mapeado.
    await setCache(GENRE_CACHE_KEY, response);
    return buildGenreCatalog(response.genres);
  } catch (error) {
    const rawCachedCatalog =
      await getRawCache<TmdbGenreListResponseDto>(GENRE_CACHE_KEY);
    if (rawCachedCatalog) {
      return buildGenreCatalog(rawCachedCatalog.data.genres);
    }
    throw new GenreCatalogUnavailableError(error);
  }
}
