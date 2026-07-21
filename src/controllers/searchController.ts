import { searchMovies } from "../api/repositories/movie.repository";
import { renderMovies } from "../ui/render";
import {
  getResolvedGenreCatalog,
  setCurrentMovies,
  setLastSearchMovies,
} from "../state/appState";

const DEFAULT_PAGE = 1;

/** Busca peliculas y las muestra
 * @param {string} query - La cadena de búsqueda ingresada por el usuario.
 * @param {HTMLElement} container - El contenedor donde se mostrarán los resultados.
 * @returns {Promise<void>} - Una promesa que se resuelve cuando la búsqueda y renderizado se completan.
 */
export async function performSearch(
  query: string,
  container: HTMLElement,
): Promise<void> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return;

  try {
    const genreCatalog = getResolvedGenreCatalog();
    const result = await searchMovies(trimmedQuery, DEFAULT_PAGE, genreCatalog);

    setCurrentMovies(result.movies);
    setLastSearchMovies(result.movies);
    renderMovies(result.movies, container);
  } catch (error) {
    console.error("Error al buscar películas:", error);
    renderMovies([], container); // reutiliza el estado vacío ya existente
  }
}
