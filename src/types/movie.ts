import type { CastMember } from "./cast";

export interface Movie {
  id: string; // <=== Id unico para manejar la logica
  title: string; // <=== Titulo de la pelicula
  releaseDate: string; // <=== Fecha de estreno (ISO o texto que muestre la API)
  budget: number; // <=== Presupuesto de la pelicula
  cast: CastMember[]; // <=== Elenco de la pelicula
  director: string; // <=== Director de la pelicula
  rating: number; // <=== Calificacion de la pelicula
  genres: string[]; // <=== Generos de la pelicula
  posterUrl?: string; // <=== Poster de la pelicula
  trailerkey?: string | null; // <=== Clave del trailer en YouTube (TMDB), o null si no hay
  overview?: string; // <=== Descripcion de la pelicula
  runtime?: number; // <=== Duracion de la pelicula
  watchProviders?: { name: string; logo: string | null }[]; // <=== Plataformas (logo puede ser null si TMDB no envía imagen)
  revenue: number; // <=== Recaudacion de la pelicula
}
