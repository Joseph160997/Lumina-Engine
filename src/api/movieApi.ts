import { Movie } from "../types/movie";
import { mapToMovieData } from "../utils/mapper";

// --- Configuración fija del cliente TMDB (v3) --------------------------------
// La clave viene del archivo .env como VITE_TMDB_API_KEY. Vite la inyecta en build;
// debe ser el "API Read Access Token" de TMDB para usar Authorization: Bearer.
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

// Todas las rutas de esta API cuelgan de /3/ (no repetimos el dominio en cada función).
// Importante: la URL termina en "/" para concatenar "search/movie" o "movie/123" sin "//" raro.
const BASE_URL = "https://api.themoviedb.org/3/";

/**
 * Opciones reutilizables en cada fetch: GET + cabeceras de identificación.
 * TMDB devuelve JSON; el Bearer es cómo autenticas la petición (no va api_key en la query).
 */
const options = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
};

/**
 * Busca películas por texto en TMDB (endpoint search/movie).
 *
 * Antes se llamaba `fetchMovie`; el nombre `searchMovies` deja claro que puede haber
 * muchos resultados y que es una búsqueda, no "una sola película".
 *
 * Flujo: trim del texto → si queda vacío no llamamos a la API → fetch → comprobar OK →
 * JSON → tomar `results` con cuidado (si la API falla en forma, no asumimos que existe)
 * → cada ítem pasa por mapToMovieData para cumplir tu interfaz Movie.
 *
 * Si algo falla (red, HTTP no OK, JSON raro), registramos en consola y devolvemos [] para
 * que la UI pueda seguir (grid vacío) sin tirar toda la app.
 *
 * @param query - Texto que escribe el usuario en el buscador
 * @returns Siempre un array (vacío si error o sin resultados)
 */
export const searchMovies = async (query: string): Promise<Movie[]> => {
  // 1) Normalizamos espacios; evita disparar la API con solo espacios.
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  // 2) Construimos la URL: query va codificado (tildes, espacios, símbolos).
  //    language=es-ES pide textos en español (títulos, overviews cuando existan).
  const url = `${BASE_URL}search/movie?query=${encodeURIComponent(trimmed)}&language=es-ES`;

  try {
    // 3) Petición HTTP; `options` lleva el Bearer y accept JSON.
    const response = await fetch(url, options);

    // 4) response.ok es false para 4xx/5xx; entonces entramos al catch vía throw
    //    y al final devolvemos [] (misma política que errores de red).
    if (!response.ok) {
      throw new Error(
        `Búsqueda TMDB falló: ${response.status} ${response.statusText}`,
      );
    }

    // 5) Cuerpo JSON; tipamos mínimo { results?: ... } para guiar a TypeScript.
    const data = (await response.json()) as { results?: unknown[] };

    // 6) TMDB normalmente manda results: []. Si por algún motivo no es array, usamos [].
    const results = Array.isArray(data.results) ? data.results : [];

    // 7) Cada elemento crudo de TMDB → objeto Movie de tu app (ids string, posterUrl, etc.).
    return results.map((item) => mapToMovieData(item));
  } catch (error) {
    // 8) Red caída, CORS en entornos raros, JSON inválido, o el throw del paso 4.
    console.error("Error al buscar peliculas:", error);
    return [];
  }
};

/**
 * Obtiene UNA película por ID con datos extra en la misma respuesta.
 *
 * Antes se llamaba `fetchMoviesDetails` (plural confuso). Aquí el nombre es singular
 * porque el id identifica una sola ficha.
 *
 * Endpoint: GET /movie/{id} con append_to_response para no hacer 3 peticiones aparte:
 * - videos → trailers (YouTube, etc.)
 * - watch/providers → dónde ver (streaming); el mapper elige región (ej. ES)
 * - credits → cast y crew (director en el mapper)
 *
 * No devolvemos Movie todavía: devolvemos el JSON crudo (Record<string, unknown>) porque
 * main.ts fusiona mapToMovieData(raw) + mapToMovieDetails(raw). Así esta capa solo habla HTTP.
 *
 * Si HTTP falla, lanzamos Error: main.ts tiene try/catch en el modal y muestra mensaje al usuario.
 *
 * @param id - ID numérico de TMDB como string (como lo usas en toda la app)
 * @returns Objeto JSON de TMDB; el mapper lo convierte en campos de Movie
 */
export const fetchMovieDetails = async (
  id: string,
): Promise<Record<string, unknown>> => {
  // 1) ID en la ruta codificado por si viniera con caracteres no seguros (defensivo).
  //    Misma variante de idioma que la búsqueda (es-ES) para coherencia.
  //    include_video_language filtra qué pistas de vídeo considera TMDB al listar trailers.
  const url = `${BASE_URL}movie/${encodeURIComponent(id)}?language=es-ES&append_to_response=videos,watch/providers,credits&include_video_language=es,en,null`;

  // 2) Una sola petición con todo lo anexo (videos + providers + credits).
  const response = await fetch(url, options);

  // 3) Aquí no devolvemos []: sin detalle no hay modal útil. Quien llama decide el mensaje de error.
  if (!response.ok) {
    throw new Error(
      `Detalle TMDB falló: ${response.status} ${response.statusText}`,
    );
  }

  // 4) Parseamos JSON y lo devolvemos; el tipado amplio evita mentir propiedades concretas
  //    (videos, credits, etc.) que ya consume mapToMovieDetails con acceso defensivo (?.).
  return (await response.json()) as Record<string, unknown>; //<== as Record<string, unknown> es un tipo de dato que representa un objeto con propiedades de tipo string y valor desconocido.
};
