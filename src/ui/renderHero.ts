import type { Movie } from "../types/movie";
import { escapeHtml } from "./render";
// ✅ CAMBIO: syncHeroFavButton se mudó a favoritesSync.
// Ahora importamos la función genérica + la config del hero.
import { syncFavoriteButton, HERO_FAV_CONFIG } from "./favoritesSync";

/** Elementos del bloque de texto (copy) de un slide del hero. */
export interface HeroSlideElements {
  title: HTMLElement;
  meta: HTMLElement;
  overview: HTMLElement;
  cta: HTMLButtonElement;
  favButton: HTMLButtonElement;
}

/** Construye el HTML de rating/año/géneros del hero. */
function buildHeroMeta(movie: Movie): string {
  const year = movie.releaseDate ? movie.releaseDate.getFullYear() : "—";
  const genres = movie.genres
    .slice(0, 2)
    .map((g) => escapeHtml(g.name))
    .join(" · ");
  return `
    <span class="text-amber-400 font-bold">★ ${movie.rating.toFixed(1)}</span>
    <span class="text-slate-600">•</span>
    <span>${year}</span>
    ${genres ? `<span class="text-slate-600">•</span><span class="text-slate-400">${genres}</span>` : ""}
  `;
}

/** Pinta el contenido textual de un slide del hero. */
export function renderHeroSlide(
  movie: Movie,
  elements: HeroSlideElements,
): void {
  elements.title.textContent = movie.title;
  elements.meta.innerHTML = buildHeroMeta(movie);
  elements.overview.textContent = movie.overview || "Sin sinopsis disponible.";
  elements.cta.dataset.id = String(movie.id);
  elements.favButton.dataset.id = String(movie.id);
  // ✅ CAMBIO: usa la función genérica de favoritesSync
  syncFavoriteButton(elements.favButton, movie.id, HERO_FAV_CONFIG);
}

/** Construye los indicadores de cartelera. */
export function renderHeroTicks(count: number, container: HTMLElement): void {
  container.innerHTML = Array.from({ length: count })
    .map(
      (_, i) =>
        `<button type="button" class="hero-tick" data-tick="${i}" aria-label="Destacado ${i + 1}"><span class="fill"></span></button>`,
    )
    .join("");
}

/** Marca el indicador activo. */
export function updateHeroTicks(
  container: HTMLElement,
  activeIndex: number,
): void {
  container.querySelectorAll(".hero-tick").forEach((tick, idx) => {
    tick.classList.toggle("is-active", idx === activeIndex);
  });
}
