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
         
         <button class="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-amber-500 transition-colors">Details</button>
         
         </div>
     </div>
     `;
  });

  // FINALMENTE, INYECTAMOS TODO EL CONTENIDO DE UNA SOLA VEZ, EN EL CONTENEDOR DEL HTML.
  container.innerHTML = htmlContent;
};
