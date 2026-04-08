import type { Movie } from "../types/movie.ts";
import { formatCurrency, formatRunTime } from "../utils/formatters.ts";

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
export const renderMovieDetails = (movie: Movie, container: HTMLElement) => {
  if (!container) return;

  // 1. Logica de plataformas de streaming "watchProviders"
  // 1. Extraemos los proveedores del objeto 'movie' que ya viene mapeado
  const providers = movie.watchProviders || [];

  const providersHtml =
    providers.length > 0
      ? `
  <div class="mt-6">
    <h4 class="font-bold text-sm text-slate-100 mb-2 tracking-widest uppercase">Disponible en:</h4>
    <div class="flex gap-3"> 
      ${providers
        .map(
          (p: any) => `
        <img src="${p.logo}" 
             title="${p.name}" 
             alt="${p.name}"
             class="w-10 h-10 rounded-lg hover:scale-110 transition-transform cursor-help object-contain border border-slate-700" />
      `,
        )
        .join("")}   
    </div>
  </div>`
      : "<p class='mt-6 text-slate-400 text-sm italic'>No disponible en plataformas de streaming.</p>";

  // 2. Logica de reparto "cast"
  const castHtml =
    movie.cast && movie.cast.length > 0
      ? `
     <div class="mt-10">
      <h3 class="text-xl font-bold text-white mb-6 border-l-4 border-blue-600 pl-4 uppercase tracking-tight">Reparto Principal</h3>
      <div class="flex gap-6 overflow-x-auto pb-6 coustom-scrollbar"> ${movie.cast
        .map(
          (actor: any) => `
        <div class="shrink-0 w-32 group"> 
        <div class="relative overflow-hidden rounded-lg mb-3 shadow-lg aspect-2/3">
          <img src="${actor.profilePath || "https://placehold.co/185x278?text=No+Photo"}"
              alt="${actor.name}" class="w-full h-full object-cover transition-transform duration-300 group-hover:-scale-110"/>
              </div>
              <p class="text-white text-sm font-bold leading-tight truncate">${actor.name}</p>
              <p class="text-slate-500 text-xs mt-1 truncate"> ${actor.character}</p>
              </div>
              `,
        )
        .join("")} 
              </div>
              </div>
     `
      : "<p class ='mt-10 text-slate-500 text-sm italic'>No hay información de reparto disponible.</p>";

  // 3. Logica de detalles de la pelicula
  // inyectamos todo en el contenedor del modal, usando template literals para insertar los datos de la pelicula en el HTML.
  const htmlContent = `
  <div class="flex flex-col md:flex-row gap-8"> 
   <img src="${movie.posterUrl}" class="w-full md:w-64 rounded-xl shadow-2xl border border-slate-700"/>
   
    <div class="flex-1">
      <h2 class="text-4xl font-black mb-4 text-white tracking-tight">${movie.title}</h2>

      <div class="flex flex-wrap gap-2 mb-6">
        ${
          movie.genres
            ?.map(
              (
                genre,
              ) => `<span class="px-3 py-1 bg-blue-500/50 text-blue-500 border border-blue-500/50 text-xs font-bold rounded-full hover:bg-blue-500/10 transition-colors hover:text-white  cursor-pointer">
          ${genre}</span>`,
            )
            .join("") || ""
        }
      </div>

      <p class="text-lg text-slate-300 leading-relaxed mb-8 italic">"${movie.overview}"</p>

      <div class="flex items-center gap-2 mt-4 bg-slate-800/50 mb-6 p-3 rounded-lg border border-slate-700">
       <div class="flex flex-col">
       <span class="text-[10px] uppercase tracking-tight text-pink-500 font-bold">Director</span>
        <p class="text-slate-100 font-medium">${movie.director}</p>
        </div>
        </div>

        <!-- LANZAMIENTO -->
      <div class="grid grid-cols-2 gap-4"> 
      <div class="bg-slate-800/40 p-4 rounded-xl border border-slate-700">
      <span class="block text-blue-500 font-bold text-[10px] uppercase mb-1">Lanzamiento</span>
      <p class="text-white font-medium">${movie.releaseDate}</p>
      </div> 
        
      <!-- PUNTUACIÓN -->
      <div class="bg-slate-800/40 p-4 rounded-xl border border-slate-700">
      <span class="block text-yellow-500 font-bold text-[10px] uppercase mb-1">Rating</span>
      <p class="text-white font-medium">✨ ${movie.rating.toFixed(1)} / 10</p>
      </div>

      <!-- DURACIÓN -->
      <div class="bg-slate-800/40 p-4 rounded-xl border border-slate-700">
      <span class="block text-emerald-500 font-bold text-[10px] uppercase mb-1">Duración</span>
      <p class="text-white font-medium">⏱️ ${formatRunTime(movie.runtime || 0)}</p>
      </div>

      <!-- PRESUPUESTO -->
      <div class="bg-slate-800/40 p-4 rounded-xl border border-slate-800">
      <span class="text-[10px] uppercase tracking-widest text-red-400 font-bold blok mb-1">Presupuesto</span>
      <p class="text-emerald-100  font-mono text-sm md:text-lg font-semibold truncate" title="${formatCurrency(movie.budget)}">${movie.budget > 0 ? formatCurrency(movie.budget) : "N/A"}</p>
      </div>

      <!-- BLOQUE DE Ingresos -->
      <div class="bg-slate-800/40 p-3 rounded-xl border border-slate-800 min-w-0">
      <span class="text-[10px] uppercase tracking-widest text-amber-400 font-bold blok mb-1">Ingresos</span>
      <p class="text-blue-100  font-mono text-sm md:text-lg font-semibold truncate" title="${formatCurrency(movie.revenue)}">${movie.revenue > 0 ? formatCurrency(movie.revenue) : "N/A"}</p>
      </div>
      
      </div> 

        <!-- PLATAFORMAS DE STREAMING -->
        ${providersHtml}

      </div>
      </div>
       
        ${castHtml}
        
      <div class="mt-8">
      ${
        movie.trailerkey
          ? ` 
        <h3 class="text-xl font-bold text-white mb-4">Trailer Oficial</h3> 
        <iframe class="w-full aspect-video rounded-lg shadow-lg" src="https://www.youtube.com/embed/${movie.trailerkey}" title="Trailer de ${movie.title}" allowfullscreen></iframe>
        `
          : "<p class='text-slate-500 italic'>No hay trailer disponible para esta película.</p>"
      }
      </div>
    
  
   `;

  container.innerHTML = htmlContent;
};
