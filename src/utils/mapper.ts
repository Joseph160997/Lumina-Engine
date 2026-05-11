import type { Movie } from "../types/movie";

/**
 * Mapea los datos de la API a un formato más adecuado para la aplicación.
 * @param item - El objeto de película de la API de TMDB.
 * @returns - El objeto con las propiedades necesarias para nuestra interface Movie.
 */
export const mapToMovieData = (item: any): Movie => {
  // Aquí puedes realizar cualquier transformación necesaria.
  return {
    id: item.id.toString(), // <=== Nuestra api devuelve un número, pero nuestra interfaz Movie espera un string, así que lo convertimos.
    title: item.title || "No title", // <=== Si no hay título, ponemos un valor por defecto.
    releaseDate: item.release_date || "Fecha desconocida", // <=== Si no hay fecha de lanzamiento, ponemos un valor por defecto.
    overview:
      item.overview || "No hay descripción disponible para esta pelicula", // <=== Si no hay descripción, ponemos un valor por defecto.
    rating: item.vote_average || 0, // <=== Si no hay rating, ponemos un valor por defecto.
    posterUrl: item.poster_path
      ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
      : "https://via.placeholder.com/500x750?text=No+Image", // <=== Si no hay poster , ponemos una imagen por defecto.
    budget: item.budget || 0, // <=== Si no hay presupuesto, ponemos un valor por defecto.
    cast: [], // <=== Inicialmente, la lista de actores está vacía.
    director: "Director desconocido", // <=== Si no hay director, ponemos un valor por defecto.
    revenue: 0, // <=== Inicialmente, la recaudación está en cero.
    genres: [], // <=== Inicialmente, la lista de géneros está vacía.
  };
};

/**
 * Este mapper solo se usa cuando entramos al detalle de una pelicula.
 * Toma los datos extra que no definimos en el mapper anterior, como el presupuesto, trailer, el elenco y el director.
 * Esto se hace para evitar hacer una petición extra a la API cada vez que mostramos una película en la lista, ya que esos datos no son necesarios en ese contexto.
 * Solo los obtenemos cuando el usuario entra al detalle de una película, donde sí necesitamos esa información.
 */
export const mapToMovieDetails = (data: any): Partial<Movie> => {
  // Buscamos el video que sea un trailer oficial, y que este en youtube.
  const trailer = data.videos?.results.find(
    (v: any) => v.type === "Trailer" && v.site === "YouTube",
  );
  const rawProviders = data["watch/providers"]?.results?.ES?.flatrate || [];

  return {
    revenue: data.revenue || 0, // <=== Si no hay recaudación, ponemos un valor por defecto.
    budget: data.budget || 0, // <=== Si no hay presupuesto, ponemos un valor por defecto.
    runtime: data.runtime || 0, // <=== Si no hay duración, ponemos un valor por defecto.
    cast:
      data.credits?.cast.slice(0, 5).map((actor: any) => ({
        name: actor.name,
        character: actor.character,
        profilePath: actor.profile_path
          ? `https://image.tmdb.org/t/p/w200${actor.profile_path}`
          : null,
      })) || [], // <=== Mapeamos el elenco, y si no hay elenco, ponemos una lista vacía.
    watchProviders:
      rawProviders.map((p: any) => ({
        name: p.provider_name,
        logo: p.logo_path
          ? `https://image.tmdb.org/t/p/original${p.logo_path}`
          : null,
      })) || [], // <=== Mapeamos las plataformas de streaming, y si no hay plataformas, ponemos una lista vacía.
    director:
      data.credits?.crew.find((member: any) => member.job === "Director")
        ?.name || "Director desconocido", // <=== Buscamos el director en el crew, y si no lo encontramos, ponemos un valor por defecto.
    trailerkey: trailer ? trailer.key : null, // <=== Si encontramos un trailer, ponemos su key (que es el ID del video en youtube), si no, ponemos null.
    genres: data.genres?.map((g: any) => g.name) || [], // <=== Mapeamos los géneros, y si no hay géneros, ponemos una lista vacía.
  };
};
