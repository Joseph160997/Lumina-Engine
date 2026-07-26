import type { Movie, MovieDetail, Video } from "../types/movie.ts";
import {
  formatCurrency,
  formatDate,
  formatRunTime,
} from "../utils/formatters.ts";
import { isMovieFavorite } from "../services/favoritesServices.ts";

/** Evita que comillas o `<>` en textos de la API rompan el HTML o abran XSS al usar innerHTML. */
export const escapeHtml = (text: string): string =>
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
    // ✅ PALETA: empty-state migrado de indigo → ámbar
    container.innerHTML = `
    <div class="col-span-full flex flex-col items-center justify-center py-24 text-center">
      <div class="relative mb-8">
        <div class="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          <span class="text-4xl">🎬</span>
        </div>
        <div class="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center">
          <span class="text-xs text-amber-300">?</span>
        </div>
      </div>
      <h2 class="text-2xl font-bold text-white mb-3">Sin resultados</h2>
      <p class="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed mb-8">
        No encontramos películas para tu búsqueda. Prueba con otro título o verifica la ortografía.
      </p>
      <button type="button" class="empty-state-reload px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-sm font-bold rounded-xl shadow-lg shadow-amber-400/25 active:scale-95 transition-all duration-200 cursor-pointer">
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

      // ✅ PALETA: hover border/shadow y botón detalles migrados a ámbar.
      // El botón "Ver detalles" ahora es ámbar con texto oscuro (contraste
      // correcto sobre ámbar) en vez de indigo con texto blanco.
      return `
      <article class="movie-card group relative bg-slate-900/60 rounded-2xl overflow-hidden border border-white/5 hover:border-amber-400/40 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-amber-400/10 transition-all duration-300 hover:-translate-y-1.5">
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
            <span class="heart-icon ${favorite ? "text-red-500" : "text-slate-400"} text-lg leading-none">${favorite ? "❤️" : "🤍"}</span>
          </button>

          <!-- Botón detalles (aparece en hover) -->
          <div class="absolute bottom-3 left-3 right-3 opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            <button
              type="button"
              data-id="${movie.id}"
              class="details-btn w-full py-2.5 rounded-xl bg-amber-400/95 backdrop-blur-sm hover:bg-amber-300 text-slate-950 text-sm font-bold shadow-lg transition-colors duration-200 cursor-pointer"
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
 * Busca el mejor trailer (oficial de YouTube优先) — sin cambios.
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

function toEmbedUrl(youtubeUrl: string): string {
  const videoId = youtubeUrl.split("v=")[1];
  return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * 🎬 MODAL REDISEÑADO — página de película estilo streaming.
 *
 * Cambios clave respecto a la versión anterior:
 * 1. Usa `backdropUrl` como banner cinematográfico (antes se desperdiciaba).
 * 2. El póster se superpone al borde inferior del banner (patrón Netflix/Disney+).
 * 3. El rating es un anillo de progreso SVG (antes, texto en una caja).
 * 4. Título en Bebas Neue (font-display) para jerarquía de cartelera.
 * 5. Métricas de taquilla reducidas a lo esencial (Presupuesto/Ingresos);
 *    estreno, duración y estado suben a la fila de meta junto al anillo.
 * 6. Paleta 100% ámbar (antes indigo).
 */
export const renderMovieDetails = (
  movie: MovieDetail,
  container: HTMLElement,
): void => {
  if (!container) return;

  const titleSafe = escapeHtml(movie.title);
  const overviewSafe = escapeHtml(movie.overview ?? "");
  const taglineSafe = movie.tagline ? escapeHtml(movie.tagline) : "";
  const favorite = isMovieFavorite(movie.id);
  const releaseLabel = escapeHtml(formatDate(movie.releaseDate));
  const runtimeLabel = formatRunTime(movie.runtimeMinutes);
  const rating = movie.rating.toFixed(1);

  // ── Geometría del anillo de rating (SVG) ──
  // Circunferencia = 2πr. El dashoffset "esconde" la parte proporcional
  // a (10 - rating), dejando visible solo el arco del rating.
  const RING_RADIUS = 24;
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
  const ringOffset = RING_CIRCUMFERENCE * (1 - Math.min(movie.rating, 10) / 10);

  // El banner usa el backdrop; si TMDB no tiene, cae al póster.
  const backdropSrc = movie.backdropUrl ?? getPosterUrl(movie.posterUrl);

  const genresHtml = movie.genres
    .map(
      (genre) => `
      <span class="px-3 py-1 bg-amber-400/10 text-amber-300 border border-amber-400/25 text-xs font-semibold rounded-full">
        ${escapeHtml(genre.name)}
      </span>`,
    )
    .join("");

  const castHtml =
    movie.cast.length > 0
      ? `
     <div class="mt-10">
      <h3 class="text-lg font-bold text-white mb-5 flex items-center gap-2.5">
        <span class="w-1 h-5 rounded-full bg-amber-400 inline-block"></span>
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
      <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2.5">
        <span class="w-1 h-5 rounded-full bg-linear-to-b from-red-500 to-amber-500 inline-block"></span>
        Tráiler
      </h3>
      <div class="rounded-xl overflow-hidden border border-white/10 shadow-2xl">
        <iframe class="w-full aspect-video" src="${toEmbedUrl(mainTrailer.youtubeUrl)}" title="Tráiler de ${titleSafe}" allowfullscreen loading="lazy"></iframe>
      </div>
    </div>
    `
    : "<p class='text-slate-500 italic'>No hay trailer disponible para esta filmeria.</p>";

  const htmlContent = `
  <!-- ══ Banner backdrop (rompe el padding del modal con -mx-6 -mt-6) ══ -->
  <div class="relative h-44 sm:h-60 -mx-6 -mt-6 overflow-hidden rounded-t-2xl">
    <img
      src="${backdropSrc}"
      alt=""
      aria-hidden="true"
      class="absolute inset-0 w-full h-full object-cover"
    />
    <!-- Scrim inferior: funde el banner con el fondo del modal (slate-900) -->
    <div class="absolute inset-0 bg-linear-to-t from-slate-900 via-slate-900/35 to-slate-950/30"></div>
  </div>

  <!-- ══ Cuerpo: póster superpuesto + información ══ -->
  <div class="pb-2">
    <div class="flex flex-col sm:flex-row gap-5 sm:gap-7">

      <!-- Columna póster + favorito (se superpone al banner con -mt) -->
      <div class="shrink-0 w-32 sm:w-44 -mt-14 sm:-mt-20 relative z-10 mx-auto sm:mx-0 flex flex-col gap-3">
        <img
          src="${getPosterUrl(movie.posterUrl)}"
          alt="${titleSafe}"
          loading="lazy"
          class="w-full rounded-xl ring-1 ring-white/15 shadow-2xl shadow-black/60"
        />
        <!-- Botón favorito (clases intactas para main.ts) -->
        <button
  type="button"
  data-id="${movie.id}"
  class="modal-favorite-btn mt-4 w-full p-3 rounded-xl bg-amber-400 hover:bg-amber-300 transition-all flex items-center justify-center gap-2 font-bold text-slate-950 shadow-lg shadow-amber-400/20 cursor-pointer"
>
          <span class="modal-heart-icon text-lg ${favorite ? "text-red-500" : "text-slate-400"}">${favorite ? "❤️" : "🤍"}</span>
          <span class="modal-fav-label text-xs sm:text-sm">${favorite ? "Quitar" : "Favoritos"}</span>
        </button>
      </div>

      <!-- Columna de información -->
      <div class="flex-1 min-w-0 sm:pt-3 text-center sm:text-left">
        <h2 class="font-display text-4xl sm:text-5xl leading-none text-slate-50 tracking-wide mb-4">${titleSafe}</h2>

        <!-- Meta: anillo de rating + estreno + duración + estado -->
        <div class="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2 text-sm font-semibold text-slate-200 mb-4">
          <!-- Anillo de rating -->
          <div class="relative w-12 h-12 shrink-0" title="Puntuación ${rating}/10">
            <svg class="w-12 h-12 -rotate-90" viewBox="0 0 56 56" aria-hidden="true">
              <circle cx="28" cy="28" r="${RING_RADIUS}" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="4.5"/>
              <circle cx="28" cy="28" r="${RING_RADIUS}" fill="none" stroke="#fbbf24" stroke-width="4.5"
                stroke-linecap="round"
                stroke-dasharray="${RING_CIRCUMFERENCE.toFixed(1)}"
                stroke-dashoffset="${ringOffset.toFixed(1)}"/>
            </svg>
            <span class="absolute inset-0 flex items-center justify-center text-xs font-bold text-amber-300">${rating}</span>
          </div>
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>${releaseLabel}</span>
            <span class="text-slate-500">•</span>
            <span>${runtimeLabel}</span>
            <span class="text-slate-500">•</span>
            <span class="text-slate-300">${escapeHtml(movie.status)}</span>
          </div>
        </div>

        <!-- Géneros -->
        <div class="flex flex-wrap justify-center sm:justify-start gap-2 mb-4">${genresHtml}</div>

        ${taglineSafe ? `<p class="text-amber-200/80 text-sm italic mb-3">"${taglineSafe}"</p>` : ""}

        <p class="text-slate-300 text-sm sm:text-base leading-relaxed">${overviewSafe || "Sin sinopsis disponible."}</p>

        <!-- Taquilla -->
        <div class="grid grid-cols-2 gap-3 mt-5 max-w-md mx-auto sm:mx-0">
          <div class="bg-white/5 rounded-xl p-3.5 border border-white/5">
            <span class="block text-[10px] uppercase tracking-widest text-red-400 font-bold mb-1">Presupuesto</span>
            <p class="text-white text-sm font-semibold truncate">${movie.budget > 0 ? formatCurrency(movie.budget) : "N/A"}</p>
          </div>
          <div class="bg-white/5 rounded-xl p-3.5 border border-white/5">
            <span class="block text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-1">Ingresos</span>
            <p class="text-white text-sm font-semibold truncate">${movie.revenue > 0 ? formatCurrency(movie.revenue) : "N/A"}</p>
          </div>
        </div>
      </div>
    </div>

    ${castHtml}
    ${trailerHtml}
  </div>
  `;

  container.innerHTML = htmlContent;
};
