import type { Movie } from "../types/movie";

// Estado privado del módulo — nadie fuera de este archivo puede tocarlo directo.
let currentMovies: ReadonlyArray<Movie> = [];
let lastSearchMovies: ReadonlyArray<Movie> = [];
let isViewingFavorites = false;
let genreCatalog: ReadonlyMap<number, string> = new Map();

// --- Películas mostradas actualmente en el grid ---
export function getCurrentMovies(): ReadonlyArray<Movie> {
  return currentMovies;
}
export function setCurrentMovies(movies: ReadonlyArray<Movie>): void {
  currentMovies = movies;
}

// --- Películas mostradas en la última búsqueda ---
export function getLastSearchMovies(): ReadonlyArray<Movie> {
  return lastSearchMovies;
}
export function setLastSearchMovies(movies: ReadonlyArray<Movie>): void {
  lastSearchMovies = movies;
}

// --- Indica si estamos viendo favoritos o no ---
export function getIsViewingFavorites(): boolean {
  return isViewingFavorites;
}
export function setIsViewingFavorites(value: boolean): void {
  isViewingFavorites = value;
}

// --- Catalogo de generos ---
export function getResolvedGenreCatalog(): ReadonlyMap<number, string> {
  return genreCatalog;
}
export function setResolvedGenreCatalog(
  value: ReadonlyMap<number, string>,
): void {
  genreCatalog = value;
}
