import { searchMovies } from "../api/repositories/movie.repository";
import { renderMovies, renderPagination } from "../ui/render";
import {
  getCurrentQuery,
  getResolvedGenreCatalog,
  setCurrentMovies,
  setCurrentPage,
  setCurrentQuery,
  setLastSearchMovies,
  setTotalPages,
  setTotalResults,
} from "../state/appState";

const DEFAULT_PAGE = 1;

async function loadPageResult(
  query: string,
  page: number,
  container: HTMLElement,
  paginationContainer?: HTMLElement | null,
): Promise<void> {
  try {
    const genreCatalog = getResolvedGenreCatalog();
    const result = await searchMovies(query, page, genreCatalog);

    setCurrentPage(result.page);
    setTotalPages(result.totalPages);
    setTotalResults(result.totalResults);
    setCurrentMovies(result.movies);
    setLastSearchMovies(result.movies);
    setCurrentQuery(query);

    renderMovies(result.movies, container);

    if (paginationContainer) {
      renderPagination(
        result.page,
        result.totalPages,
        result.totalResults,
        paginationContainer,
      );
    }
  } catch (error) {
    console.error("Error al buscar películas:", error);
    renderMovies([], container);

    if (paginationContainer) {
      renderPagination(1, 1, 0, paginationContainer);
    }
  }
}

/** Busca peliculas y las muestra */
export async function performSearch(
  query: string,
  container: HTMLElement,
  paginationContainer?: HTMLElement | null,
): Promise<void> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return;

  await loadPageResult(
    trimmedQuery,
    DEFAULT_PAGE,
    container,
    paginationContainer,
  );
}

export async function loadPage(
  page: number,
  container: HTMLElement,
  paginationContainer?: HTMLElement | null,
): Promise<void> {
  const trimmedQuery = getCurrentQuery().trim();
  if (!trimmedQuery) return;

  const safePage = Math.max(1, page);
  await loadPageResult(trimmedQuery, safePage, container, paginationContainer);
}
