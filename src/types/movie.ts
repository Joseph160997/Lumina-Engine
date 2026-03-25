export interface Movie {
  id: string; // <=== Id unico para manejar la logica
  title: string; // <=== Titulo de la pelicula
  releaseDate: string; // <=== Año de la pelicula
  budget: number; // <=== Presupuesto de la pelicula
  cast: string[]; // <=== Actores de la pelicula
  director: string; // <=== Director de la pelicula
  rating: number; // <=== Calificacion de la pelicula
  genre: string; // <=== Genero de la pelicula
  posterUrl?: string; // <=== Poster de la pelicula
}
