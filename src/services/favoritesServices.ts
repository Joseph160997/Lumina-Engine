import { getData, saveData } from "./storage";
import type { Movie } from "../types/movie";

/** Clave única en localStorage para no mezclar con otras apps del mismo origen. */
const FAVS_KEY = "lumina_favorites";

/**
 * Comprueba si un valor parseado puede tratarse como entrada de favorito (objeto con id numérico).
 * Así ignoramos entradas corruptas o tipos equivocados sin romper toda la lista.
 */
const isFavoriteEntry = (item: unknown): item is Movie => {
  return (
    typeof item === "object" &&
    item !== null &&
    typeof (item as Movie).id === "number"
  );
};

/**
 * localStorage serializa Date a string ISO (JSON.parse no reconstruye
 * instancias de Date). Esta función restaura la forma real de un Movie
 * después de leerlo del storage, para que el resto de la app pueda
 * confiar en que releaseDate es un Date real, tal como declara el tipo.
 */
function reviveMovie(raw: Movie): Movie {
  return {
    ...raw,
    releaseDate: raw.releaseDate ? new Date(raw.releaseDate) : null,
  };
}

export const getFavorites = (): Movie[] => {
  const raw = getData(FAVS_KEY);

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter(isFavoriteEntry).map(reviveMovie);
};

/**
 * Indica si ya existe un favorito con ese id (comparación por número, igual que en toda la app).
 */
export const isMovieFavorite = (movieId: number): boolean => {
  return getFavorites().some((fav) => fav.id === movieId);
};

/**
 * Añade o quita la película de favoritos. Una sola lectura de lista con `getFavorites()` y
 * el `some` se hace sobre esa misma lista (evita leer y parsear localStorage dos veces).
 */
export const toggleFavorite = (movie: Movie): void => {
  const favorites = getFavorites();
  const isFav = favorites.some((fav) => fav.id === movie.id);

  if (isFav) {
    const updatedFavs = favorites.filter((fav) => fav.id !== movie.id);
    saveData(FAVS_KEY, updatedFavs);
  } else {
    // Agregar a favoritos: Si la pelicula no esta en favoritos, la agregamos.
    const updatedFavs = [...favorites, movie];

    saveData(FAVS_KEY, updatedFavs);
  }
};
