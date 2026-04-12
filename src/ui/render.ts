import type { Movie } from "../types/movie.ts";
import { formatCurrency, formatRunTime } from "../utils/formatters.ts";
import { isMovieFavorite } from "../services/favoritesServices.ts";

/**
 * Funcion para centralizar la logica d eimagenes.
 */
const DEFAULT_POSTER = "https://via.placeholder.com/500x750?text=No+Image";

/**
 * Función para obtener la URL de una imagen de una película.
 * La función recibe un string que puede ser nulo o una ruta relativa a una imagen.
 * Si el string es nulo, devuelve la imagen por defecto.
 * Si el string ya es una URL completa, la devuelve sin modificar.
 * Si el string es una ruta relativa, la completa con la base URL de la API de TMDB y devuelve la URL completa.
 * @param path - string que puede ser nulo o una ruta relativa a una imagen.
 * @returns string - la URL de la imagen.
 */
export const getPosterUrl = (path: string | undefined): string => {
  // Si no hay poster, devolvemos la imagen por defecto.
  if (!path) return DEFAULT_POSTER;

  // Si el path ya es una URL completa, lo devolvemos tal cual.
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  // Si el path es una ruta relativa, la completa con la base URL de la API de TMDB.
  return `https://image.tmdb.org/t/p/w500${path}`;
};

/**
 * Esta función se encarga de renderizar una grilla de películas en un contenedor del HTML.
 * Recibe un array de objetos de tipo Movie, y el elemento de DOM donde se va a renderizar la grilla de películas.
 * La función es exportada para que pueda ser utilizada en otros archivos, como en main.ts.
 *
 * Paso 1: Verificar si el contenedor existe, si no es el caso, la función termina sin hacer nada.
 * Paso 2: Se crea una variable para acumular el HTML que se va a renderizar. Esta variable es un string vacío al principio.
 * Paso 3: Se utiliza el método .forEach() para recorrer cada objeto del array de películas.
 * Paso 4: Dentro del bucle .forEach(), se genera el HTML para cada tarjeta de película.
 *       El HTML generado se acumula en la variable "htmlContent" utilizando el operador +=.
 *       Cada tarjeta de película tiene una imagen, un título, una fecha de lanzamiento, y un botón de detalles.
 * Paso 5: Finalmente, se inyecta todo el contenido de la variable "htmlContent" en el contenedor del HTML.
 */
export const renderMovies = (movies: Movie[], container: HTMLElement): void => {
  // Paso 1: Verificar si el contenedor existe
  if (!container) return;

  if (movies.length === 0) {
    container.innerHTML = `
    <div class="col-span-full flex flex-col items-center justify-center py-20 text-center animate-fade-in">
    <div class="bg-slate-400/50 p-6 rounded-full mb-6">
     <span class="text-6xl">🔍</span>
      </div>
      <h2 class="text-2xl font-bold text-white mb-2">No se encontraron resultados</h2>
      <p class="text-slate-400 font-bold  max-w-md mx-auto">No hay películas que coincidan con tu búsqueda, Intenta con otro título o verifica la ortografía.</p>
      <button class="mt-8 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-300 transition-colors" onclick="window.location.reload()">Volver a Buscar</button>
    </div>
    `;
    return;
  }

  // Paso 2: Crear una variable para acumular el HTML
  let htmlContent = "";

  // Paso 3: Recorrer cada objeto del array de películas
  movies.forEach((movie) => {
    // Paso 4: Generar el HTML para cada tarjeta de película
    htmlContent += `
     <div class="group relative bg-slate-800 rounded-lg overflow-hidden shadow-lg transition-all hover:scale-105 hover:-translate-y-2">
       <img src="${getPosterUrl(movie.posterUrl)}" alt="${movie.title}" class="w-full aspect-2/3 object-cover group-hover:scale-105 transition-transform">
       <button data-id="${movie.id}" class="favorite-btn absolute top-3 right-3 p-2 rounded-full bg-slate-900/60 backdrop-blur-md border border-slate-700 hover:scale-110 transition-transform">
         <span class="heart-icon ${isMovieFavorite(movie.id) ? "text-red-500" : "text-slate-300"} text-xl">${isMovieFavorite(movie.id) ? "❤️" : "🤍"}</span>
       </button>
       <div class="p-4">
        <h3 class="text-white text-lg font-bold truncate">${movie.title}</h3>
         <p class="text-slate-400 text-sm">${movie.releaseDate}</p>
         
         <button data-id="${movie.id}" class="details-btn mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-amber-500 transition-colors">Details</button>
         
       </div>
     </div>
     `;
  });

  // Paso 5: Inyectar todo el contenido en el contenedor del HTML
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
  <div class="sticky top-0 z-20 flex justify-baseline mb-4">
  <button data-id="${movie.id}" class="modal-favorite-btn p-3 py-3 rounded-full bg-slate-600/50 backdrop-blur-md border border-slate-400 shdow-2xl hover:scale-110 transition-all cursor-pointer">
    <span class="modal-heart-icon ${isMovieFavorite(movie.id) ? "text-red-500" : "text-slate-300"} text-2xl">${isMovieFavorite(movie.id) ? "❤️" : "🤍"}</span>
  </button>
  </div>


  <div class="flex flex-col md:flex-row gap-8"> 
   <img src="${getPosterUrl(movie.posterUrl)}" class="w-full md:w-64 rounded-xl shadow-2xl border border-slate-700"/>
   
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
      <div class="bg-slate-800/40 p-4 rounded-lg border border-slate-700">
      <span class="block text-blue-500 font-bold text-[10px] uppercase mb-1">Lanzamiento</span>
      <p class="text-white font-medium">${movie.releaseDate}</p>
      </div> 
        
      <!-- PUNTUACIÓN -->
      <div class="bg-slate-800/40 p-4 rounded-lg border border-slate-700">
      <span class="block text-yellow-500 font-bold text-[10px] uppercase mb-1">Rating</span>
      <p class="text-white font-medium">✨ ${movie.rating.toFixed(1)} / 10</p>
      </div>

      <!-- DURACIÓN -->
      <div class="bg-slate-800/40 p-4 rounded-lg border border-slate-700">
      <span class="block text-emerald-500 font-bold text-[10px] uppercase mb-1">Duración</span>
      <p class="text-white font-medium">⏱️ ${(movie.runtime ?? 0) > 0 ? formatRunTime(movie.runtime!) : "No Disponible"}</p>
      </div>

      <!-- PRESUPUESTO -->
      <div class="bg-slate-800/40 p-4 rounded-lg border border-slate-800">
      <span class="text-[10px] uppercase tracking-widest text-red-400 font-bold blok mb-1">Presupuesto</span>
      <p class="text-emerald-100  font-mono text-sm md:text-lg font-semibold truncate" title="${formatCurrency(movie.budget)}">${movie.budget > 0 ? formatCurrency(movie.budget) : "N/A"}</p>
      </div>

      <!-- BLOQUE DE Ingresos -->
      <div class="bg-slate-800/40 p-3 rounded-lg border border-slate-800 min-w-0">
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
