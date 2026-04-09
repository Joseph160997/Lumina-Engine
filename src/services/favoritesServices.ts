import { saveData } from "./storage"; // Importamos la función para guardar datos en el localStorage
import { getData } from "./storage"; // Importamos la función para recuperar datos del localStorage
import { Movie } from "../types/movie";

// Definimos una constante para la clave que usaremos en el localStorage para guardar los favoritos.
const FAVS_KEY = "lumina_favorites";

/**
 * Obtenemos la lista de favoritos del localStorage, y si no hay nada, devolvemos un array vacío.
 * Simplemente llamamos a la función getData, que se encarga de recuperar los datos del localStorage, y le pasamos la clave que hemos definido (FAVS_KEY).
 * La función getData se encarga de manejar los errores, y si no encuentra nada, devuelve un array vacío.
 * De esta forma, siempre tendremos un array de favoritos, aunque no haya nada guardado en el localStorage.
 */
export const getFavorites = (): Movie[] => {
  return getData(FAVS_KEY);
};

/**
 * Funcion 2: Verificar si una pelicula ya esta en favoritos.
 * Esta función recibe el id de una pelicula, y devuelve un booleano indicando si esa pelicula ya esta en favoritos o no.
 * Para esto, primero obtenemos la lista de favoritos llamando a la función getFavorites, y luego usamos el método some para verificar si alguna pelicula en esa lista tiene el mismo id que el que nos han pasado.
 * Si encontramos una pelicula con el mismo id, devolvemos true, indicando que esa pelicula ya esta en favoritos. Si no encontramos ninguna pelicula con ese id, devolvemos false.
 */
export const isMovieFavorite = (movieId: string): boolean => {
  const favorites = getFavorites();

  // Devuelve el resultado tras comparar con .some
  return favorites.some((fav) => fav.id === movieId);
};

/**
 * Funcion 3: Agregar o quitar una pelicula de favoritos.
 * Esta función recibe una pelicula, y si esa pelicula ya esta en favoritos, la quita. Si esa pelicula no esta en favoritos, la agrega.
 * Para esto, primero obtenemos la lista de favoritos llamando a la función getFavorites, y luego verificamos si esa pelicula ya esta en favoritos usando la función isMovieFavorite.
 */
export const toggleFavorite = (movie: Movie): void => {
  const favorites = getFavorites();

  const isFav = isMovieFavorite(movie.id); // <== Verificamos si la pelicula ya esta en favoritos.

  if (isFav) {
    // Eliminar de favoritos: Si la pelicula ya esta en favoritos, la quitamos filtrando la lista de favoritos para que no incluya esa pelicula.
    const updatedFavs = favorites.filter((fav) => fav.id !== movie.id);
    saveData(FAVS_KEY, updatedFavs); // <== Guardamos la lista actualizada de favoritos en el localStorage.
  } else {
    // Agregar a favoritos: Si la pelicula no esta en favoritos, la agregamos.
    const updatedFavs = [...favorites, movie]; // <== Creamos una nueva lista de favoritos que incluye la pelicula que queremos agregar.
    saveData(FAVS_KEY, updatedFavs); // <== Guardamos la lista actualizada de favoritos en el localStorage.
  }
};
