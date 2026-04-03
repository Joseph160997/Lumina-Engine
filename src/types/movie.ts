import type { CastMmeber } from "./cast";

export interface Movie {
  id: string; // <=== Id unico para manejar la logica
  title: string; // <=== Titulo de la pelicula
  releaseDate: string; // <=== Año de la pelicula
  budget: number; // <=== Presupuesto de la pelicula
  cast: CastMmeber[]; // <=== Elenco de la pelicula
  director: string; // <=== Director de la pelicula
  rating: number; // <=== Calificacion de la pelicula
  genres: string[]; // <=== Generos de la pelicula
  posterUrl?: string; // <=== Poster de la pelicula
  trailerkey?: string; // <=== Trailer de la pelicula
  overview?: string; // <=== Descripcion de la pelicula
  runtime?: number; // <=== Duracion de la pelicula
  watchProviders?: string[]; // <=== Plataformas donde se puede ver la pelicula
}
