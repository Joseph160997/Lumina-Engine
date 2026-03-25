import type { Movie } from "../types/movie";

// Obtenemos la key de la API de TMDB, la cual usaremos para hacer las llamadas a la API de TMDB.
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

// Creamos la URL base para hacer las llamadas a la API de TMDB.
const BASE_URL = "https://api.themoviedb.org/3/";

/**
 *  Creación de cabeceras, las cuales usaremos par ahacer las llamadas a la API de TMDB.
 *  Aqui es donde le decimos a TMDB quienes somos usando nuestro token.
 */
const options = {
  methodo: "Get", // <=== El metodo que usaremos para hacer las llamadas a la API.
  headers: {
    // <=== Las cabeceras son las que usaremos para hacer las llamadas a la API.
    accept: "application/json", // <=== El formato de datos que usaremos para hacer las llamadas a la API.
    Authorization: `Bearer ${API_KEY}`, // <=== La key que usaremos para hacer las llamadas a la API.
  },
};

/**
 * Busca peliculas por un texto ("query") en la API de TMDB.
 */
export const searchMovies = async (query: string): Promise<Movie[]> => {
  // 1. Preparamos la URL con el texto de la busqueda.
  // encodeURIComponent nos ayuda a evitar problemas con los caracteres especiales, como los espacios.
  const url = `${BASE_URL}/search/movie?query=${encodeURIComponent(query)}&language=es-ES`;

  try {
    // 2. Hacemos la llamada a la API de TMDB. (AWAIT nos ayuda a esperar la respuesta de la API)
    const response = await fetch(url, options);

    // 3. Verificamos si la respuesta del servidor es correcta (200 OK)
    if (!response.ok) {
      throw new Error("Error en la petición a la API de TMDB");
    }

    // 4. Convertimos la respuesta a FORMATO JSON
    const data = await response.json();

    // 5. OBTENEMOS LOS RESULTADOS Y LOS GUARDAMOS EN UN ARRAY
    // MAPPER: Transfromamos los resultados de nuestra API a nuestro propio formato. (Objeto Movie)
    return data.results.map((item: any): Movie => {
      return {
        id: item.id,
        title: item.title,
        releaseDate: item.release_date,
        genre: "Movie",
        budget: 0, //El buscador general no da presupuesto, hay que hacer una llamada a la API de TMDB para obtenerlo.
        cast: [], //El buscador general no da cast, hay que buscarlo con otro endpoit de la API de TMDB.
        director: "Unknown",
        rating: item.vote_average,
        posterUrl: item.poster_path
          ? `https://image.tmdb.org/t/p/w500/${item.poster_path}`
          : undefined,
      };
    });

    // 6. Si algo falla, mostramos un error en la consola.
  } catch (error) {
    console.error("SearchMovies error:", error);
    return []; // Si algo falla, devolvemos un array vacio, para que no rompa la app.
  }
};

/**
 * Obtiene todos los detalles de una pelicula especifica por su id en la API de TMDB.
 */
export const getMovieDetails = async (id: string): Promise<Movie | null> => {
  // 1. URL específica para obtener los detalles de una pelicula.
  // append_to_response=credit, tare el reparto en una misma llaamda
  const url = `${BASE_URL}/movie/${id}?language=es-ES&append_to_response=credits`;

  try {
    // 1.1 Hacemos la llamada a la api de TMDB.
    const response = await fetch(url, options);

    // 1.2 Verificamos si la respuesta del servidor es correcta.
    if (!response.ok)
      throw new Error("Error al obtrener detalles de la pelicula");

    // 1.3 Convertimos la respuesta a formato JSON.
    const data = await response.json();

    // 2. Obtenemos los resultado y los mapeamos a nuestro propio formato.
    // MAPEAMOS AL OBJETO MOVIE
    return {
      id: data.id.toString(), // <== convertimos el id a string.
      title: data.title,
      releaseDate: data.release_date,
      genre: data.genres?.[0]?.name || "General", // <== Obtenemos el primer genero de la pelicula.
      budget: data.budget, // <== Obtenemos el presupuesto de la pelicula.
      cast:
        data.credits?.cast?.slice(0, 5).map((actor: any) => actor.name) || [], // <== Obtenemos el reparto de la pelicula, y limitamos a 5
      director:
        data.credits?.crew?.find((person: any) => person.job === "Director")
          ?.name || "Unknown", // <== Obtenemos el director de la pelicula.
      rating: data.vote_average,
      posterUrl: data.poster_path
        ? `https://image.tmdb.org/t/p/w500/${data.poster_path}`
        : undefined,
    };
  } catch (error) {
    console.error("getMovieDetails error:", error);
    return null;
  }
};
