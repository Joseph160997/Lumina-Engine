import type { Movie } from "../types/movie";
import { getCurrentMovies } from "../state/appState";
import { getHeroMovies } from "../state/heroState";
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
 * Busca una película por id en las tres fuentes donde puede estar
 * mostrándose actualmente:
 *
 * 1. currentMovies  → grid de resultados de búsqueda (appState)
 * 2. heroMovies     → carrusel del hero (heroState)
 * 3. favorites      → ya guardada en localStorage (services)
 */
function findMovieById(movieId: number): Movie | undefined {
  return (
    getCurrentMovies().find((movie) => movie.id === movieId) ??
    getHeroMovies().find((movie) => movie.id === movieId) ??
    getFavorites().find((movie) => movie.id === movieId)
  );
}
