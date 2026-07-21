import type { Movie } from "../types/movie";
import { getCurrentMovies } from "../state/appState";
import {
  getFavorites,
  isMovieFavorite,
  toggleFavorite,
} from "../services/favoritesServices";

/**
 * Alterna el estado de favorito de una película por su id, y devuelve
 * si ahora es favorita o no. No toca el DOM — quien llama decide qué
 * íconos actualizar (grid, modal, ambos, ninguno).
 */
export function toggleMovieFavorite(movieId: number): boolean {
  const movie = findMovieById(movieId);
  if (!movie) return isMovieFavorite(movieId);

  toggleFavorite(movie);
  return isMovieFavorite(movieId);
}

/**
 * Busca una película por id primero en lo que está mostrándose ahora
 * (grid o resultados de búsqueda), y si no aparece ahí, en favoritos
 * — cubre el caso del modal abierto sobre una película que ya era
 * favorita desde antes de esta sesión.
 */
function findMovieById(movieId: number): Movie | undefined {
  return (
    getCurrentMovies().find((movie) => movie.id === movieId) ??
    getFavorites().find((movie) => movie.id === movieId)
  );
}

/** Actualiza el botón de favoritos en la barra de navegación */
export function refreshFavoritesButton(button: HTMLButtonElement): void {
  const favorites = getFavorites();

  if (favorites.length > 0) {
    button.classList.remove("hidden");
    button.innerText = `❤️ Mis favoritos (${favorites.length})`;
  } else {
    button.classList.add("hidden");
  }
}
