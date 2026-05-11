import type { Movie } from "../types/movie.ts";
import {
  formatCurrency,
  formatDate,
  formatRunTime,
} from "../utils/formatters.ts";
import { isMovieFavorite } from "../services/favoritesServices.ts";

/** Evita que comillas o `<>` en textos de la API rompan el HTML o abran XSS al usar innerHTML. */
const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Centraliza la lógica de URLs de poster (TMDB, URL absoluta o placeholder).
 */
const DEFAULT_POSTER = "https://via.placeholder.com/500x750?text=No+Image";
const PROVIDER_LOGO_PLACEHOLDER = "https://via.placeholder.com/80x80?text=Logo";

/**
 * Devuelve la URL final del poster (ver `DEFAULT_POSTER`).
 */
export const getPosterUrl = (path: string | undefined): string => {
  if (!path) return DEFAULT_POSTER;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `https://image.tmdb.org/t/p/w500${path}`;
};

/**
 * Grilla de películas: vacío con mensaje, o tarjetas con favorito y botón detalle.
 */
export const renderMovies = (movies: Movie[], container: HTMLElement): void => {
  if (!container) return;

  if (movies.length === 0) {
    container.innerHTML = `
    <div class="col-span-full flex flex-col items-center justify-center py-20 text-center animate-fade-in">
    <div class="bg-slate-400/50 p-6 rounded-full mb-6">
     <span class="text-6xl">🔍</span>
      </div>
      <h2 class="text-2xl font-bold text-white mb-2">No se encontraron resultados</h2>
      <p class="text-slate-400 font-bold  max-w-md mx-auto">No hay películas que coincidan con tu búsqueda. Intenta con otro título o verifica la ortografía.</p>
      <button type="button" class="empty-state-reload mt-8 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-300 transition-colors">Volver a Buscar</button>
    </div>
    `;
    return;
  }

  let htmlContent = "";

  movies.forEach((movie) => {
    const titleSafe = escapeHtml(movie.title);
    const favorite = isMovieFavorite(movie.id);
    const dateLabel = formatDate(movie.releaseDate);

    htmlContent += `
     <div class="group relative bg-slate-800 rounded-lg overflow-hidden shadow-lg transition-all hover:scale-105 hover:-translate-y-2">
       <img src="${getPosterUrl(movie.posterUrl)}" alt="${titleSafe}" class="w-full aspect-2/3 object-cover group-hover:scale-105 transition-transform">
       <button type="button" data-id="${movie.id}" class="favorite-btn absolute top-3 right-3 p-2 rounded-full bg-slate-900/60 backdrop-blur-md border border-slate-700 hover:scale-110 transition-transform">
         <span class="heart-icon ${favorite ? "text-red-500" : "text-slate-300"} text-xl">${favorite ? "❤️" : "🤍"}</span>
       </button>
       <div class="p-4">
        <h3 class="text-white text-lg font-bold truncate">${titleSafe}</h3>
         <p class="text-slate-400 text-sm">${escapeHtml(dateLabel)}</p>
         
         <button type="button" data-id="${movie.id}" class="details-btn mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-amber-500 transition-colors">Detalles</button>
         
       </div>
     </div>
     `;
  });

  container.innerHTML = htmlContent;
};

/**
 * Contenido del modal de detalle (overview, métricas, reparto, trailer).
 */
export const renderMovieDetails = (movie: Movie, container: HTMLElement) => {
  if (!container) return;

  const providers = movie.watchProviders || [];
  const titleSafe = escapeHtml(movie.title);
  const overviewSafe = escapeHtml(movie.overview ?? "");
  const directorSafe = escapeHtml(movie.director);
  const favorite = isMovieFavorite(movie.id);
  const releaseLabel = escapeHtml(formatDate(movie.releaseDate));

  const providersHtml =
    providers.length > 0
      ? `
  <div class="mt-6">
    <h4 class="font-bold text-sm text-slate-100 mb-2 tracking-widest uppercase">Disponible en:</h4>
    <div class="flex gap-3"> 
      ${providers
        .map((p) => {
          const nameSafe = escapeHtml(p.name);
          const logoSrc = p.logo || PROVIDER_LOGO_PLACEHOLDER;
          return `
        <img src="${logoSrc}" 
             title="${nameSafe}" 
             alt="${nameSafe}"
             class="w-10 h-10 rounded-lg hover:scale-110 transition-transform cursor-help object-contain border border-slate-700" />`;
        })
        .join("")}   
    </div>
  </div>`
      : "<p class='mt-6 text-slate-400 text-sm italic'>No disponible en plataformas de streaming.</p>";

  const castHtml =
    movie.cast && movie.cast.length > 0
      ? `
     <div class="mt-10">
      <h3 class="text-xl font-bold text-white mb-6 border-l-4 border-blue-600 pl-4 uppercase tracking-tight">Reparto Principal</h3>
      <div class="flex gap-6 overflow-x-auto pb-6 custom-scrollbar"> ${movie.cast
        .map((actor) => {
          const nameSafe = escapeHtml(actor.name);
          const charSafe = escapeHtml(actor.character);
          const photo =
            actor.profilePath || "https://placehold.co/185x278?text=No+Photo";
          return `
        <div class="shrink-0 w-32 group"> 
        <div class="relative overflow-hidden rounded-lg mb-3 shadow-lg aspect-2/3">
          <img src="${photo}"
              alt="${nameSafe}" class="w-full h-full object-cover transition-transform duration-300 group-hover:-scale-110"/>
              </div>
              <p class="text-white text-sm font-bold leading-tight truncate">${nameSafe}</p>
              <p class="text-slate-500 text-xs mt-1 truncate">${charSafe}</p>
              </div>`;
        })
        .join("")} 
              </div>
              </div>
     `
      : "<p class='mt-10 text-slate-500 text-sm italic'>No hay información de reparto disponible.</p>";

  const runtime = movie.runtime ?? 0;
  const runtimeLabel = runtime > 0 ? formatRunTime(runtime) : "No Disponible";

  const htmlContent = `
  <div class="sticky top-0 z-20 flex justify-baseline mb-4">
  <button type="button" data-id="${movie.id}" class="modal-favorite-btn p-3 py-3 rounded-full bg-slate-600/50 backdrop-blur-md border border-slate-400 shadow-2xl hover:scale-110 transition-all cursor-pointer">
    <span class="modal-heart-icon ${favorite ? "text-red-500" : "text-slate-300"} text-2xl">${favorite ? "❤️" : "🤍"}</span>
  </button>
  </div>


  <div class="flex flex-col md:flex-row gap-8"> 
   <img src="${getPosterUrl(movie.posterUrl)}" alt="${titleSafe}" class="w-full md:w-64 rounded-xl shadow-2xl border border-slate-700"/>
   
    <div class="flex-1">
      <h2 class="text-4xl font-black mb-4 text-white tracking-tight">${titleSafe}</h2>

      <div class="flex flex-wrap gap-2 mb-6">
        ${
          movie.genres
            ?.map(
              (genre) =>
                `<span class="px-3 py-1 bg-blue-500/50 text-blue-500 border border-blue-500/50 text-xs font-bold rounded-full hover:bg-blue-500/10 transition-colors hover:text-white  cursor-pointer">
          ${escapeHtml(genre)}</span>`,
            )
            .join("") || ""
        }
      </div>

      <p class="text-lg text-slate-300 leading-relaxed mb-8 italic">"${overviewSafe}"</p>

      <div class="flex items-center gap-2 mt-4 bg-slate-800/50 mb-6 p-3 rounded-lg border border-slate-700">
       <div class="flex flex-col">
       <span class="text-[10px] uppercase tracking-tight text-pink-500 font-bold">Director</span>
        <p class="text-slate-100 font-medium">${directorSafe}</p>
        </div>
        </div>

        <!-- LANZAMIENTO -->
      <div class="grid grid-cols-2 gap-4"> 
      <div class="bg-slate-800/40 p-4 rounded-lg border border-slate-700">
      <span class="block text-blue-500 font-bold text-[10px] uppercase mb-1">Lanzamiento</span>
      <p class="text-white font-medium">${releaseLabel}</p>
      </div> 
        
      <!-- PUNTUACIÓN -->
      <div class="bg-slate-800/40 p-4 rounded-lg border border-slate-700">
      <span class="block text-yellow-500 font-bold text-[10px] uppercase mb-1">Rating</span>
      <p class="text-white font-medium">✨ ${movie.rating.toFixed(1)} / 10</p>
      </div>

      <!-- DURACIÓN -->
      <div class="bg-slate-800/40 p-4 rounded-lg border border-slate-700">
      <span class="block text-emerald-500 font-bold text-[10px] uppercase mb-1">Duración</span>
      <p class="text-white font-medium">⏱️ ${runtimeLabel}</p>
      </div>

      <!-- PRESUPUESTO -->
      <div class="bg-slate-800/40 p-4 rounded-lg border border-slate-800">
      <span class="text-[10px] uppercase tracking-widest text-red-400 font-bold block mb-1">Presupuesto</span>
      <p class="text-emerald-100  font-mono text-sm md:text-lg font-semibold truncate" title="${escapeHtml(formatCurrency(movie.budget))}">${movie.budget > 0 ? formatCurrency(movie.budget) : "N/A"}</p>
      </div>

      <!-- BLOQUE DE Ingresos -->
      <div class="bg-slate-800/40 p-3 rounded-lg border border-slate-800 min-w-0">
      <span class="text-[10px] uppercase tracking-widest text-amber-400 font-bold block mb-1">Ingresos</span>
      <p class="text-blue-100  font-mono text-sm md:text-lg font-semibold truncate" title="${escapeHtml(formatCurrency(movie.revenue))}">${movie.revenue > 0 ? formatCurrency(movie.revenue) : "N/A"}</p>
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
        <iframe class="w-full aspect-video rounded-lg shadow-lg" src="https://www.youtube.com/embed/${encodeURIComponent(movie.trailerkey)}" title="Trailer de ${titleSafe}" allowfullscreen></iframe>
        `
          : "<p class='text-slate-500 italic'>No hay trailer disponible para esta película.</p>"
      }
      </div>
    
  
   `;

  container.innerHTML = htmlContent;
};
