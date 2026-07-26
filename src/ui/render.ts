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
    <div class="col-span-full flex flex-col items-center justify-center py-24 text-center">
      <div class="relative mb-8">
        <div class="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          <span class="text-4xl">🎬</span>
        </div>
        <div class="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
          <span class="text-xs">?</span>
        </div>
      </div>
      <h2 class="text-2xl font-bold text-white mb-3">Sin resultados</h2>
      <p class="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed mb-8">
        No encontramos películas para tu búsqueda. Prueba con otro título o verifica la ortografía.
      </p>
      <button type="button" class="empty-state-reload px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all duration-200 cursor-pointer">
        Intentar de nuevo
      </button>
    </div>
    `;
    return;
  }

  const htmlContent = movies
    .map((movie) => {
      const titleSafe = escapeHtml(movie.title);
      const favorite = isMovieFavorite(movie.id);
      const dateLabel = formatDate(movie.releaseDate);
      const rating = movie.rating.toFixed(1);

      return `
      <article class="movie-card group relative bg-slate-900/60 rounded-2xl overflow-hidden border border-white/5 hover:border-indigo-500/30 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1.5">
        <!-- Poster -->
        <div class="relative aspect-2/3 overflow-hidden">
          <img
            src="${getPosterUrl(movie.posterUrl)}"
            alt="${titleSafe}"
            loading="lazy"
            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <!-- Overlay degradado -->
          <div class="absolute inset-0 bg-linear-to-t from-slate-950/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

          <!-- Rating badge -->
          <div class="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10">
            <span class="text-amber-400 text-xs">★</span>
            <span class="text-white text-xs font-bold">${rating}</span>
          </div>

          <!-- Botón favorito -->
          <button
            type="button"
            data-id="${movie.id}"
            class="favorite-btn absolute top-3 right-3 p-2 rounded-xl bg-black/50 backdrop-blur-sm border border-white/10 hover:scale-110 hover:bg-black/70 transition-all duration-200 cursor-pointer"
          >
            <span class="heart-icon ${favorite ? "text-red-500" : "text-slate-300"} text-lg leading-none">${favorite ? "❤️" : "🤍"}</span>
          </button>

          <!-- Botón detalles (aparece en hover) -->
          <div class="absolute bottom-3 left-3 right-3 opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            <button
              type="button"
              data-id="${movie.id}"
              class="details-btn w-full py-2.5 rounded-xl bg-indigo-600/90 backdrop-blur-sm hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg transition-colors duration-200 cursor-pointer"
            >
              Ver detalles
            </button>
          </div>
        </div>

        <!-- Info -->
        <div class="p-3.5 sm:p-4">
          <h3 class="text-white text-sm sm:text-base font-bold truncate leading-tight">${titleSafe}</h3>
          <p class="text-slate-500 text-xs sm:text-sm mt-1 font-medium">${escapeHtml(dateLabel)}</p>
        </div>
      </article>
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
      <span class="px-3 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-semibold rounded-full">
        ${escapeHtml(genre.name)}
      </span>`,
    )
    .join("");

  const castHtml =
    movie.cast.length > 0
      ? `
     <div class="mt-10">
      <h3 class="text-lg font-bold text-white mb-5 flex items-center gap-2">
        <span class="w-1 h-5 rounded-full bg-linear-to-b from-indigo-500 to-cyan-500 inline-block"></span>
        Reparto Principal
      </h3>
      <div class="flex gap-4 overflow-x-auto pb-4" style="scrollbar-width: thin;">
      ${movie.cast
        .map((actor) => {
          const nameSafe = escapeHtml(actor.name);
          const charSafe = escapeHtml(actor.character);
          const photo = actor.profileUrl ?? DEFAULT_PROFILE;
          return `
        <div class="shrink-0 w-28 sm:w-32 group">
          <div class="relative overflow-hidden rounded-xl mb-2.5 aspect-2/3 border border-white/5">
            <img src="${photo}" alt="${nameSafe}" loading="lazy" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"/>
          </div>
          <p class="text-white text-xs sm:text-sm font-semibold leading-tight truncate">${nameSafe}</p>
          <p class="text-slate-500 text-xs mt-0.5 truncate">${charSafe}</p>
        </div>`;
        })
        .join("")}
      </div>
      </div>
     `
      : "<p class='mt-10 text-slate-600 text-sm italic'>No hay información de reparto disponible.</p>";

  const mainTrailer = findMainTrailer(movie.videos);

  const trailerHtml = mainTrailer?.youtubeUrl
    ? `
    <div class="mt-10">
      <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span class="w-1 h-5 rounded-full bg-linear-to-b from-red-500 to-amber-500 inline-block"></span>
        Tráiler
      </h3>
      <div class="rounded-xl overflow-hidden border border-white/10 shadow-2xl">
        <iframe class="w-full aspect-video" src="${toEmbedUrl(mainTrailer.youtubeUrl)}" title="Tráiler de ${titleSafe}" allowfullscreen loading="lazy"></iframe>
      </div>
    </div>
    `
    : "<p class='text-slate-500 italic'>No hay trailer disponible para esta película.</p>";

  const htmlContent = `
  <!-- Layout principal -->
  <div class="flex flex-col md:flex-row gap-6 sm:gap-8">
    <!-- Poster + botón favorito -->
    <div class="shrink-0 mx-auto md:mx-0 flex flex-col items-center">
      <img
        src="${getPosterUrl(movie.posterUrl)}"
        alt="${titleSafe}"
        loading="lazy"
        class="w-48 sm:w-56 md:w-60 rounded-2xl shadow-2xl shadow-black/50 border border-white/10"
      />

      <!-- Botón Favorito del Modal -->
      <button
        type="button"
        data-id="${movie.id}"
        class="modal-favorite-btn mt-4 w-full p-3 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-all flex items-center justify-center gap-2 font-semibold text-slate-200 cursor-pointer"
      >
        <span class="modal-heart-icon text-xl ${favorite ? "text-red-500" : "text-slate-400"}">${favorite ? "❤️" : "🤍"}</span>
        <span class="modal-fav-label">${favorite ? "Quitar de Favoritos" : "Agregar a Favoritos"}</span>
      </button>
    </div>

    <!-- Info -->
    <div class="flex-1 min-w-0">
      <h2 class="text-3xl sm:text-4xl font-black tracking-tight text-white mb-3 leading-tight">${titleSafe}</h2>

      ${movie.tagline ? `<p class="text-slate-500 text-sm italic mb-4">"${escapeHtml(movie.tagline)}"</p>` : ""}

      <div class="flex flex-wrap gap-2 mb-6">
        ${genresHtml}
      </div>

      <p class="text-slate-300 text-sm sm:text-base leading-relaxed mb-8">${overviewSafe}</p>

      <!-- Métricas -->
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div class="bg-white/5 rounded-xl p-3.5 border border-white/5">
          <span class="block text-[10px] uppercase tracking-widest text-indigo-400 font-bold mb-1">Estreno</span>
          <p class="text-white text-sm font-semibold">${releaseLabel}</p>
        </div>
        <div class="bg-white/5 rounded-xl p-3.5 border border-white/5">
          <span class="block text-[10px] uppercase tracking-widest text-amber-400 font-bold mb-1">Rating</span>
          <p class="text-white text-sm font-semibold">★ ${movie.rating.toFixed(1)} <span class="text-slate-500 font-normal">/ 10</span></p>
        </div>
        <div class="bg-white/5 rounded-xl p-3.5 border border-white/5">
          <span class="block text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-1">Duración</span>
          <p class="text-white text-sm font-semibold">${runtimeLabel}</p>
        </div>
        <div class="bg-white/5 rounded-xl p-3.5 border border-white/5">
          <span class="block text-[10px] uppercase tracking-widest text-red-400 font-bold mb-1">Presupuesto</span>
          <p class="text-white text-sm font-semibold truncate" title="${escapeHtml(formatCurrency(movie.budget))}">${movie.budget > 0 ? formatCurrency(movie.budget) : "N/A"}</p>
        </div>
        <div class="bg-white/5 rounded-xl p-3.5 border border-white/5">
          <span class="block text-[10px] uppercase tracking-widest text-cyan-400 font-bold mb-1">Ingresos</span>
          <p class="text-white text-sm font-semibold truncate" title="${escapeHtml(formatCurrency(movie.revenue))}">${movie.revenue > 0 ? formatCurrency(movie.revenue) : "N/A"}</p>
        </div>
        <div class="bg-white/5 rounded-xl p-3.5 border border-white/5">
          <span class="block text-[10px] uppercase tracking-widest text-purple-400 font-bold mb-1">Estado</span>
          <p class="text-white text-sm font-semibold truncate">${escapeHtml(movie.status)}</p>
        </div>
      </div>
    </div>
  </div>

  ${castHtml}
  ${trailerHtml}
  `;

  container.innerHTML = htmlContent;
};
