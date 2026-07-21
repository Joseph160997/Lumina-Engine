import type { Movie, MovieDetail, Video } from "../types/movie.ts";
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

const DEFAULT_POSTER = "https://via.placeholder.com/500x750?text=No+Image";
const DEFAULT_PROFILE = "https://via.placeholder.com/185x278?text=No+Photo";

/**
 * Devuelve la URL final del poster. `posterUrl` ya viene resuelta como URL
 * absoluta desde el mapper (o `null` si TMDB no tiene imagen) — acá solo
 * se decide qué mostrar cuando no hay dato.
 */
export const getPosterUrl = (posterUrl: string | null): string => {
  return posterUrl ?? DEFAULT_POSTER;
};

/**
 * Grilla de películas: vacío con mensaje, o tarjetas con favorito y botón detalle.
 */
export const renderMovies = (
  movies: ReadonlyArray<Movie>,
  container: HTMLElement,
): void => {
  if (!container) return;

  if (movies.length === 0) {
    container.innerHTML = `
    <div class="col-span-full flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <div class="bg-slate-400/50 p-6 rounded-full mb-6">
        <span class="text-6xl">🔍</span>
      </div>
      <h2 class="text-2xl font-bold text-white mb-2">No se encontraron resultados</h2>
      <p class="text-slate-400 font-bold max-w-md mx-auto">No hay películas que coincidan con tu búsqueda. Intenta con otro título o verifica la ortografía.</p>
      <button type="button" class="empty-state-reload mt-8 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-300 transition-colors">Volver a Buscar</button>
    </div>
    `;
    return;
  }

  const htmlContent = movies
    .map((movie) => {
      const titleSafe = escapeHtml(movie.title);
      const favorite = isMovieFavorite(movie.id);
      const dateLabel = formatDate(movie.releaseDate);

      return `
       <div class="group relative bg-slate-800 rounded-lg overflow-hidden shadow-lg transition-all hover:scale-105 hover:-translate-y-2">
         <img src="${getPosterUrl(movie.posterUrl)}" alt="${titleSafe}" loading="lazy" class="w-full aspect-2/3 object-cover group-hover:scale-105 transition-transform">
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
    })
    .join("");

  container.innerHTML = htmlContent;
};

/**
 * Busca, dentro de los videos de una película, el mejor candidato para
 * mostrar como trailer principal. Prioridad: Trailer oficial de YouTube >
 * cualquier Trailer de YouTube > cualquier video de YouTube > ninguno.
 * Devuelve `null` si no hay ningún video utilizable (no es de YouTube,
 * o no hay videos en absoluto).
 */
function findMainTrailer(videos: ReadonlyArray<Video>): Video | null {
  const youtubeVideos = videos.filter((video) => video.youtubeUrl !== null);

  const officialTrailer = youtubeVideos.find(
    (video) => video.type === "Trailer" && video.isOfficial,
  );
  if (officialTrailer) return officialTrailer;

  const anyTrailer = youtubeVideos.find((video) => video.type === "Trailer");
  if (anyTrailer) return anyTrailer;

  return youtubeVideos[0] ?? null;
}

/**
 * `Video.youtubeUrl` viene en formato "watch?v=..." (el link normal, para
 * abrir en una pestaña) porque es la forma más neutral del dato de dominio.
 * El formato "embed/..." que necesita un <iframe> es una necesidad puntual
 * de esta vista, así que la conversión vive acá y no en el mapper.
 */
function toEmbedUrl(youtubeUrl: string): string {
  const videoId = youtubeUrl.split("v=")[1];
  return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * Contenido del modal de detalle (overview, métricas, reparto, trailer).
 */
export const renderMovieDetails = (
  movie: MovieDetail,
  container: HTMLElement,
): void => {
  if (!container) return;

  const titleSafe = escapeHtml(movie.title);
  const overviewSafe = escapeHtml(movie.overview ?? "");
  const favorite = isMovieFavorite(movie.id);
  const releaseLabel = escapeHtml(formatDate(movie.releaseDate));
  const runtimeLabel = formatRunTime(movie.runtimeMinutes);

  const genresHtml = movie.genres
    .map(
      (genre) => `
      <span class="px-3 py-1 bg-blue-500/50 text-blue-500 border border-blue-500/50 text-xs font-bold rounded-full hover:bg-blue-500/10 transition-colors hover:text-white cursor-pointer">
        ${escapeHtml(genre.name)}
      </span>`,
    )
    .join("");

  const castHtml =
    movie.cast.length > 0
      ? `
     <div class="mt-10">
      <h3 class="text-xl font-bold text-white mb-6 border-l-4 border-blue-600 pl-4 uppercase tracking-tight">Reparto Principal</h3>
      <div class="flex gap-6 overflow-x-auto pb-6 custom-scrollbar">
      ${movie.cast
        .map((actor) => {
          const nameSafe = escapeHtml(actor.name);
          const charSafe = escapeHtml(actor.character);
          const photo = actor.profileUrl ?? DEFAULT_PROFILE;
          return `
        <div class="shrink-0 w-32 group">
        <div class="relative overflow-hidden rounded-lg mb-3 shadow-lg aspect-2/3">
          <img src="${photo}" alt="${nameSafe}" loading="lazy" class="w-full h-full object-cover transition-transform duration-300 group-hover:-scale-110"/>
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

  const mainTrailer = findMainTrailer(movie.videos);

  const trailerHtml = mainTrailer?.youtubeUrl
    ? `
    <h3 class="text-xl font-bold text-white mb-4">Trailer Oficial</h3>
    <iframe class="w-full aspect-video rounded-lg shadow-lg" src="${toEmbedUrl(mainTrailer.youtubeUrl)}" title="Trailer de ${titleSafe}" allowfullscreen></iframe>
    `
    : "<p class='text-slate-500 italic'>No hay trailer disponible para esta película.</p>";

  const htmlContent = `
  <div class="sticky top-0 z-20 flex justify-baseline mb-4">
  <button type="button" data-id="${movie.id}" class="modal-favorite-btn p-3 py-3 rounded-full bg-slate-600/50 backdrop-blur-md border border-slate-400 shadow-2xl hover:scale-110 transition-all cursor-pointer">
    <span class="modal-heart-icon ${favorite ? "text-red-500" : "text-slate-300"} text-2xl">${favorite ? "❤️" : "🤍"}</span>
  </button>
  </div>

  <div class="flex flex-col md:flex-row gap-8">
   <img src="${getPosterUrl(movie.posterUrl)}" alt="${titleSafe}" loading="lazy" class="w-full md:w-64 rounded-xl shadow-2xl border border-slate-700"/>

    <div class="flex-1">
      <h2 class="text-4xl font-black mb-4 text-white tracking-tight">${titleSafe}</h2>

      <div class="flex flex-wrap gap-2 mb-6">
        ${genresHtml}
      </div>

      <p class="text-lg text-slate-300 leading-relaxed mb-8 italic">"${overviewSafe}"</p>

        <div class="grid grid-cols-2 gap-4">
        <div class="bg-slate-800/40 p-4 rounded-lg border border-slate-700">
        <span class="block text-blue-500 font-bold text-[10px] uppercase mb-1">Lanzamiento</span>
        <p class="text-white font-medium">${releaseLabel}</p>
        </div>

        <div class="bg-slate-800/40 p-4 rounded-lg border border-slate-700">
        <span class="block text-yellow-500 font-bold text-[10px] uppercase mb-1">Rating</span>
        <p class="text-white font-medium">✨ ${movie.rating.toFixed(1)} / 10</p>
        </div>

        <div class="bg-slate-800/40 p-4 rounded-lg border border-slate-700">
        <span class="block text-emerald-500 font-bold text-[10px] uppercase mb-1">Duración</span>
        <p class="text-white font-medium">⏱️ ${runtimeLabel}</p>
        </div>

        <div class="bg-slate-800/40 p-4 rounded-lg border border-slate-800">
        <span class="text-[10px] uppercase tracking-widest text-red-400 font-bold block mb-1">Presupuesto</span>
        <p class="text-emerald-100 font-mono text-sm md:text-lg font-semibold truncate" title="${escapeHtml(formatCurrency(movie.budget))}">${movie.budget > 0 ? formatCurrency(movie.budget) : "N/A"}</p>
        </div>

        <div class="bg-slate-800/40 p-3 rounded-lg border border-slate-800 min-w-0">
        <span class="text-[10px] uppercase tracking-widest text-amber-400 font-bold block mb-1">Ingresos</span>
        <p class="text-blue-100 font-mono text-sm md:text-lg font-semibold truncate" title="${escapeHtml(formatCurrency(movie.revenue))}">${movie.revenue > 0 ? formatCurrency(movie.revenue) : "N/A"}</p>
        </div>
        </div>
      </div>
      </div>

        ${castHtml}

      <div class="mt-8">
      ${trailerHtml}
      </div>
   `;

  container.innerHTML = htmlContent;
};
