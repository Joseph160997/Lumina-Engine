import type { Movie } from "../types/movie";

let heroMovies: ReadonlyArray<Movie> = [];
let heroIndex = 0;

export function getHeroMovies(): ReadonlyArray<Movie> {
  return heroMovies;
}
export function setHeroMovies(movies: ReadonlyArray<Movie>): void {
  heroMovies = movies;
}

export function getHeroIndex(): number {
  return heroIndex;
}
export function setHeroIndex(index: number): void {
  heroIndex = index;
}
