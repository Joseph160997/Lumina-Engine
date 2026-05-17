import { getData, saveData } from "./storage";
import type { Movie } from "../types/movie";

/** Clave única en localStorage para no mezclar con otras apps del mismo origen. */
const FAVS_KEY = "lumina_favorites";

/**
 * Comprueba si un valor parseado puede tratarse como entrada de favorito (objeto con id string).
 * Así ignoramos entradas corruptas o tipos equivocados sin romper toda la lista.
 */
const isFavoriteEntry = (item: unknown): item is Movie => {
  return (
    typeof item === "object" &&
    item !== null &&
    typeof (item as Movie).id === "string"
  );
};

/**
 * Lista de películas favoritas persistidas. Si no hay datos, JSON inválido o no es un array,
 * devuelve [] para que la UI siempre trabaje con un array.
 */
export const getFavorites = (): Movie[] => {
  const raw = getData(FAVS_KEY);

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter(isFavoriteEntry);
};

/**
 * Indica si ya existe un favorito con ese id (comparación por string, igual que en toda la app).
 */
export const isMovieFavorite = (movieId: string): boolean => {
  return getFavorites().some((fav) => fav.id === movieId); // <=== some es un metodo que se utiliza para verificar si alguna pelicula en esa lista tiene el mismo id que el que nos han pasado.
};

/**
 * Añade o quita la película de favoritos. Una sola lectura de lista con `getFavorites()` y
 * el `some` se hace sobre esa misma lista (evita leer y parsear localStorage dos veces).
 */
export const toggleFavorite = (movie: Movie): void => {
  const favorites = getFavorites();
  const isFav = favorites.some((fav) => fav.id === movie.id); // <=== some es un metodo que se utiliza para verificar si alguna pelicula en esa lista tiene el mismo id que el que nos han pasado.

  if (isFav) {
    const updatedFavs = favorites.filter((fav) => fav.id !== movie.id); // <=== filter es un metodo que se utiliza para filtrar la lista de favoritos para que no incluya esa pelicula.
    saveData(FAVS_KEY, updatedFavs); // <=== saveData es una funcion que se utiliza para guardar la lista de favoritos en el localStorage.
  } else {
    // Agregar a favoritos: Si la pelicula no esta en favoritos, la agregamos.
    const updatedFavs = [...favorites, movie]; // <=== [...favorites, movie] es una forma de crear una nueva lista de favoritos que incluye la pelicula que queremos agregar.

    saveData(FAVS_KEY, updatedFavs); // <=== saveData es una funcion que se utiliza para guardar la lista de favoritos en el localStorage.
  }
};
