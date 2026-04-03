import type { Movie } from "../types/movie";
import { mapToMovieData } from "../utils/mapper";

// Obtenemos la key de la API de TMDB, la cual usaremos para hacer las llamadas a la API de TMDB.
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

// Creamos la URL base para hacer las llamadas a la API de TMDB.
const BASE_URL = "https://api.themoviedb.org/3/";

/**
 *  Creación de cabeceras, las cuales usaremos par ahacer las llamadas a la API de TMDB.
 *  Aqui es donde le decimos a TMDB quienes somos usando nuestro token.
 */
const options = {
  method: "GET", // <=== El metodo que usaremos para hacer las llamadas a la API.
  headers: {
    // <=== Las cabeceras son las que usaremos para hacer las llamadas a la API.
    accept: "application/json", // <=== El formato de datos que usaremos para hacer las llamadas a la API.
    Authorization: `Bearer ${API_KEY}`, // <=== La key que usaremos para hacer las llamadas a la API.
  },
};

/**
 * Busca peliculas por un texto ("query") en la API de TMDB.
 */
export const fetchMovie = async (query: string): Promise<any> => {
  // preparamos la URL, Usamos encodeURIComponent para asegurarnos de que el texto de busqueda sea seguro para usar en una URL.
  const url = `${BASE_URL}/search/movie?query=${encodeURIComponent(query)}&language=es-ES`;

  try {
    // Hacemos la llamada a la API de TMDB usando fetch, y le pasamos las opciones que preparamos antes.
    const response = await fetch(url, options);

    // Si la respuesta no es exitosa, lanzamos un error.
    if (!response.ok) {
      throw new Error(
        `Error en la busqueda de peliculas...: ${response.statusText}`,
      );
    }

    // Si la respuesta es exitosa, convertimos la respuesta a JSON, y extraemos el array de peliculas.
    const data = await response.json();

    // Devolvemos la data crauda tal caul viene de la API.
    return data.results.map(mapToMovieData);
  } catch (error) {
    // si hay un error, lo mostramos en la consola, y devolvemos un array vacio para evitar que la app se rompa.
    console.error("Error al buscar peliculas:", error);
    return { results: [] };
  }
};

/**
 * Obtiene los detalles específicos de una película por su ID.
 */
/**export const fetchMovieDetails = async (id: string): Promise<Movie> => {
  // Preparamos la URL para obtener los detalles de la película, incluyendo videos y créditos.
  const url = `${BASE_URL}/movie/${id}?append_to_response=videos,credits&language=es-ES`;

  try {
    // Hacemos la llamada a la API de TMDB usando fetch, y le pasamos las opciones que preparamos antes.
    const response = await fetch(url, options);

    // Si la respuesta no es exitosa, lanzamos un error.
    if (!response.ok) {
      throw new Error(
        `Error al obtener detalles de la película: ${response.statusText}`,
      );
    }

    // Si la respuesta es exitosa, convertimos la respuesta a JSON.
    const data = await response.json();

    // Mapeamos los datos básicos y luego fusionamos con los detalles adicionales.
    const basicMovie = mapToMovieData(data); //
    const details = mapToMovieDetais(data);

    // Devolvemos la película completa con todos los detalles.
    return { ...basicMovie, ...details };
  } catch (error) {
    // Si hay un error, lo mostramos en la consola y lanzamos el error, o
    console.error("Error al obtener detalles de la película:", error);
    throw error;
  }
};
*/

/**
 * NUeva funcion para obtener detales especificos por su id.
 */
/**
 * Obtiene los detalles específicos de una película por su ID.
 * La llamada a la API de TMDB se hace con el endpoint "/movie/{id}" y se le pasa la clave de la API como parámetro "api_key".
 * Se devuelve un objeto con los detalles de la película en formato JSON.
 */
export const fetchMoviesDetails = async (id: string) => {
  // Hacemos la llamada a la API de TMDB con el endpoint "/movie/{id}" y le pasamos la clave de la API como parámetro "api_key".
  const response = await fetch(
    `https://api.themoviedb.org/3/movie/${id}?language=es-MX&append_to_response=videos,watch/providers,credits&include_video_language=es,en,null`,
    options,
  );

  // Si la respuesta no es exitosa, lanzamos un error.
  if (!response.ok) throw new Error("Error al obtener los detalles");

  // Devolvemos los detalles de la película en formato JSON.
  return await response.json();
};
