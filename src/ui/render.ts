import type { Movie } from "../types/movie.ts";

/**
 * 1. La función recibe el array de peliculas "limpias" (Tipo Movie), y renderiza cada pelicula en el contenedor del HTML.
 * 2. Exportamos la funcion para que pueda ser utilizada en otros archivos, como en main.ts.
 * Recibe un array, y el elemneto de DOM donde se va a renderizar la grilla de peliculas.
 */
export const renderMovies = (movie: Movie[], container: HTMLElement): void => {
  // existe el contendor, si no, "return" (vete de aqui).
  if (!container) return;

  // Creamos una variable para acumular el HTML que vamos a renderizar.
  let htmlContent = ""; // <== Acumulador de HTML, ES un string vacio al principio, y luego se va llenando con cada pelicula del array.

  // Usamos .forEach para recorrer cada pelicula del array, y generar el HTML para cada una.
  movie.forEach((movie) => {
    // acumulamos el HTML de card en la variable "htmlContent", usamos += para ir sumando cada card al HTML total.
    htmlContent += `
     <div class="group relative bg-slate-800 rounded-lg overflow-hidden shadow-lg transition-all hover:scale-105 hover:-translate-y-2">
       <img src="${movie.posterUrl}" alt="${movie.title}" class="w-full aspect-2/3 object-cover group-hover:scale-105 transition-transform">
       <div class="p-4">
        <h3 class="text-white text-lg font-bold truncate">${movie.title}</h3>
         <p class="text-slate-400 text-sm">${movie.releaseDate}</p>
         
         <button data-id="${movie.id}" class="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-amber-500 transition-colors">Details</button>
         
         </div>
     </div>
     `;
  });

  // FINALMENTE, INYECTAMOS TODO EL CONTENIDO DE UNA SOLA VEZ, EN EL CONTENEDOR DEL HTML.
  container.innerHTML = htmlContent;
};

/**
 * Esta función se encarga de renderizar los detalles de una película en el modal.
 * Recibe un objeto de tipo Movie, y el elemento de DOM donde se va a renderizar el contenido del modal.
 */
export const renderMovieDetails = (movie: any, container: HTMLElement) => {
  if (!container) return;

  //Buscamo el trailler, filtramos los videos pata que e sitio sea "Youtube", y el tipo sea "Trailer", y obtenemos la clave del video (key) para poder mostrar el trailler en el modal.
  const trailer = movie.videos.results.find(
    (video: any) => video.site === "YouTube" && video.type === "Trailer",
  );

  // Generamos el HTML del iframe del trailler, si existe el trailler, mostramos el iframe con el video, si no, mostramos un mensaje de que no hay trailler disponible.
  const trailerHtml = trailer
    ? `<div class"mt-8">
  <h3 class"text-xl font-bold mb-4">Trailer Oficial</h>
  
   <iframe class="w-full aspect-video rounded-xl shadow-2xl" 
   src="https://www.youtube.com/embed/${trailer.key}"
   title="Youtube video player" frameborder="0" allowfullscreen>
   </iframe>
   </div> `
    : "<p class='mt-8 text-slate-500'>No hay trailer disponible</p>";

  //para los logos de las peliculas.
  const providers =
    movie["watch/providers"]?.results?.ES?.flatrate ||
    movie["watch/providers"]?.results?.MX?.flatrate ||
    [];

  const providersHtml =
    providers.length > 0
      ? `<div class="mt-6">
    <h4 class="text-sm font-bold text-slate-400 uppercase mb-3">Disponible En:</h4>
     <div class="flex gap-3"> ${providers
       .map(
         (p: any) => `
       <img src="https://image.tmdb.org/t/p/original${p.logo_path}" title="${p.provider_name}" class="w-10 h-10 rounded-lg hover:scale-110 transition-transform cursor-help object-contain" /> 
     `,
       )
       .join("")}</div>
   </div>
 `
      : "<p class='mt-6 text-slate-500'>No hay plataformas de streaming disponibles</p>";

  // FÍJATE en los cambios: poster_path, overview, release_date y vote_average
  const htmlContent = ` 
  <div class="flex flex-col md:flex-row gap-8">
   <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" class="w-full md:w-64 rounded-xl shadow-lg"/>
    <div class="flex-1">
     <h2 class="text-3xl font-bold mb-4">${movie.title}</h2>

     <p class="text-lg font-bold text-white leading-relaxed mb-6">${movie.overview}</p>

     <div class="grid grid-cols-2 gap-4 text-sm">
       <div class="bg-slate-800 p-3 rounded-lg"> 
         <span class="block text-slate-500 uppercase font-bold">Lanzamiento</span>
          ${movie.release_date}
       </div> 
       <div class="bg-slate-800 p-3 rounded-lg">
         <span class="block text-slate-500 uppercase font-bold">Puntuación</span>
         ✨ ${movie.vote_average.toFixed(1)}
        </div>
         <div class="bg-slate-800 p-3 rounded-lg"> 
         <span class="block text-slate-500 uppercase font-bold">Duración</span>
          ${movie.runtime} min
       </div> 

       ${providersHtml}
        </div>
     </div>
  </div>
  ${trailerHtml}
  `;

  container.innerHTML = htmlContent;
};
